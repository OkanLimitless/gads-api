import argparse
import json
import os
from datetime import datetime, timezone
from typing import List, Tuple

from google.ads.googleads.errors import GoogleAdsException

from google.ads.googleads.client import GoogleAdsClient

from scripts.google_ads_utils import load_google_ads_client


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create ad group and initial ad, then link via AdGroupAd.")
    parser.add_argument("--customer_id", required=True, help="Google Ads customer ID (no dashes)")
    parser.add_argument("--campaign_id", required=True, help="Campaign ID to attach the new ad group to")
    parser.add_argument("--ad_group_name", required=True, help="Name for the new ad group")
    parser.add_argument("--final_url", required=True, help="Initial Final URL for the ad (must be policy-compliant)")
    parser.add_argument(
        "--headline",
        action="append",
        dest="headlines",
        required=True,
        help="Headline text. Provide 3-5 times by repeating this flag.",
    )
    parser.add_argument(
        "--description",
        action="append",
        dest="descriptions",
        required=True,
        help="Description text. Provide at least 2 times by repeating this flag.",
    )
    parser.add_argument(
        "--config_path",
        default=os.getenv("GOOGLE_ADS_CONFIG_PATH") or os.getenv("GOOGLE_ADS_YAML"),
        help="Path to google-ads.yaml configuration file.",
    )
    parser.add_argument(
        "--output_json",
        default=os.path.join("/workspace", "data", "created_ads.json"),
        help="File to append created resources for monitoring.",
    )
    return parser.parse_args()


def ensure_min_assets(headlines: List[str], descriptions: List[str]) -> None:
    if len(headlines) < 3:
        raise ValueError("Provide at least 3 headlines.")
    if len(descriptions) < 2:
        raise ValueError("Provide at least 2 descriptions.")


def create_ad_group(client: GoogleAdsClient, customer_id: str, campaign_id: str, ad_group_name: str) -> str:
    ad_group_service = client.get_service("AdGroupService")
    ad_group_operation = client.get_type("AdGroupOperation")
    ad_group = ad_group_operation.create
    ad_group.name = ad_group_name
    ad_group.campaign = f"customers/{customer_id}/campaigns/{campaign_id}"
    ad_group.status = client.enums.AdGroupStatusEnum.AdGroupStatus.ENABLED
    ad_group.type_ = client.enums.AdGroupTypeEnum.AdGroupType.SEARCH_STANDARD
    response = ad_group_service.mutate_ad_groups(customer_id=customer_id, operations=[ad_group_operation])
    return response.results[0].resource_name


def create_ad_via_adservice(
    client: GoogleAdsClient,
    customer_id: str,
    final_url: str,
    headlines: List[str],
    descriptions: List[str],
) -> str:
    ad_service = client.get_service("AdService")
    ad_operation = client.get_type("AdOperation")
    ad = ad_operation.create
    ad.final_urls.append(final_url)
    rsa = ad.responsive_search_ad
    for h in headlines:
        asset = client.get_type("AdTextAsset")
        asset.text = h
        rsa.headlines.append(asset)
    for d in descriptions:
        asset = client.get_type("AdTextAsset")
        asset.text = d
        rsa.descriptions.append(asset)
    response = ad_service.mutate_ads(customer_id=customer_id, operations=[ad_operation])
    return response.results[0].resource_name


def link_ad_to_ad_group(
    client: GoogleAdsClient,
    customer_id: str,
    ad_group_resource_name: str,
    ad_resource_name: str,
) -> str:
    ad_group_ad_service = client.get_service("AdGroupAdService")
    operation = client.get_type("AdGroupAdOperation")
    ad_group_ad = operation.create
    ad_group_ad.ad_group = ad_group_resource_name
    ad_ref = client.get_type("Ad")
    ad_ref.resource_name = ad_resource_name
    ad_group_ad.ad.CopyFrom(ad_ref)
    ad_group_ad.status = client.enums.AdGroupAdStatusEnum.AdGroupAdStatus.PAUSED
    response = ad_group_ad_service.mutate_ad_group_ads(customer_id=customer_id, operations=[operation])
    return response.results[0].resource_name


def append_created_record(output_json_path: str, record: dict) -> None:
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    data = {"entries": []}
    if os.path.exists(output_json_path):
        with open(output_json_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f) or {"entries": []}
            except json.JSONDecodeError:
                data = {"entries": []}
    data.setdefault("entries", []).append(record)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def main() -> None:
    args = parse_args()
    ensure_min_assets(args.headlines, args.descriptions)
    client = load_google_ads_client(args.config_path)
    try:
        ad_group_rn = create_ad_group(client, args.customer_id, args.campaign_id, args.ad_group_name)
        ad_rn = create_ad_via_adservice(client, args.customer_id, args.final_url, args.headlines, args.descriptions)
        ad_group_ad_rn = link_ad_to_ad_group(client, args.customer_id, ad_group_rn, ad_rn)
        record = {
            "customer_id": args.customer_id,
            "campaign_id": args.campaign_id,
            "ad_group_resource_name": ad_group_rn,
            "ad_resource_name": ad_rn,
            "ad_group_ad_resource_name": ad_group_ad_rn,
            "initial_final_url": args.final_url,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        append_created_record(args.output_json, record)
        print(json.dumps({"ok": True, "ad_group": ad_group_rn, "ad": ad_rn, "ad_group_ad": ad_group_ad_rn}))
    except GoogleAdsException as ex:
        print(json.dumps({"ok": False, "error": ex.failure.message}))
        raise


if __name__ == "__main__":
    main()