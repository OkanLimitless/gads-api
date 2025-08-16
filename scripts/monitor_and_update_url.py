import argparse
import json
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Set
from urllib.parse import urlparse

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

from scripts.google_ads_utils import load_google_ads_client


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Monitor ad approval and update Final URL when approved.")
    parser.add_argument("--customer_id", required=True, help="Google Ads customer ID (no dashes)")
    parser.add_argument("--new_url", required=True, help="New Final URL to set for approved ads (same domain only)")
    parser.add_argument(
        "--records_json",
        default=os.path.join("/workspace", "data", "created_ads.json"),
        help="JSON file produced by the creation script.",
    )
    parser.add_argument("--config_path", default=os.getenv("GOOGLE_ADS_CONFIG_PATH") or os.getenv("GOOGLE_ADS_YAML"))
    parser.add_argument("--poll_interval_secs", type=int, default=30)
    parser.add_argument("--timeout_secs", type=int, default=1800)
    return parser.parse_args()


def read_target_resources(records_json_path: str) -> List[str]:
    if not os.path.exists(records_json_path):
        return []
    with open(records_json_path, "r", encoding="utf-8") as f:
        payload = json.load(f) or {}
    entries = payload.get("entries", [])
    resource_names = []
    for entry in entries:
        rn = entry.get("ad_group_ad_resource_name")
        if rn:
            resource_names.append(rn)
    return resource_names


def same_domain(url_a: str, url_b: str) -> bool:
    a = urlparse(url_a)
    b = urlparse(url_b)
    return a.hostname == b.hostname


def build_query(resource_names: List[str]) -> str:
    quoted = ", ".join([f"'{rn}'" for rn in resource_names])
    return (
        "SELECT ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status, "
        "ad_group_ad.ad.final_urls FROM ad_group_ad WHERE ad_group_ad.resource_name IN (" + quoted + ")"
    )


def fetch_statuses(client: GoogleAdsClient, customer_id: str, resource_names: List[str]) -> Dict[str, dict]:
    if not resource_names:
        return {}
    ga_service = client.get_service("GoogleAdsService")
    query = build_query(resource_names)
    results: Dict[str, dict] = {}
    for row in ga_service.search(customer_id=customer_id, query=query):
        aga = row.ad_group_ad
        results[aga.resource_name] = {
            "policy_approval_status": aga.policy_summary.approval_status,
            "final_urls": list(aga.ad.final_urls),
        }
    return results


def update_final_urls(
    client: GoogleAdsClient,
    customer_id: str,
    ad_group_ad_resource_name: str,
    new_url: str,
) -> str:
    service = client.get_service("AdGroupAdService")
    operation = client.get_type("AdGroupAdOperation")
    update = operation.update
    update.resource_name = ad_group_ad_resource_name
    update.ad.final_urls.clear()
    update.ad.final_urls.append(new_url)
    mask = client.get_type("FieldMask")
    mask.paths.append("ad.final_urls")
    operation.update_mask.CopyFrom(mask)
    response = service.mutate_ad_group_ads(customer_id=customer_id, operations=[operation])
    return response.results[0].resource_name


def main() -> None:
    args = parse_args()
    client = load_google_ads_client(args.config_path)
    targets = read_target_resources(args.records_json)
    if not targets:
        print(json.dumps({"ok": False, "error": "No ad group ad resources to monitor."}))
        return
    start = time.time()
    approved: Set[str] = set()
    try:
        while True:
            statuses = fetch_statuses(client, args.customer_id, targets)
            for rn, info in statuses.items():
                if rn in approved:
                    continue
                approval_status = info["policy_approval_status"]
                approved_enum = client.enums.PolicyApprovalStatusEnum.PolicyApprovalStatus.APPROVED
                if approval_status == approved_enum:
                    current_urls = info.get("final_urls") or []
                    if current_urls and not same_domain(current_urls[0], args.new_url):
                        print(json.dumps({
                            "ok": False,
                            "resource": rn,
                            "skipped": True,
                            "reason": "Cross-domain change not allowed",
                            "current_url": current_urls[0],
                            "requested_url": args.new_url,
                        }))
                        approved.add(rn)
                        continue
                    updated_rn = update_final_urls(client, args.customer_id, rn, args.new_url)
                    print(json.dumps({"ok": True, "updated": updated_rn, "new_url": args.new_url, "at": datetime.now(timezone.utc).isoformat()}))
                    approved.add(rn)
            if len(approved) == len(targets):
                break
            if time.time() - start > args.timeout_secs:
                print(json.dumps({"ok": False, "error": "Timeout waiting for approval."}))
                break
            time.sleep(args.poll_interval_secs)
    except GoogleAdsException as ex:
        print(json.dumps({"ok": False, "error": ex.failure.message}))
        raise


if __name__ == "__main__":
    main()