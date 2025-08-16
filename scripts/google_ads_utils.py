import os
from typing import Optional

from google.ads.googleads.client import GoogleAdsClient


def load_google_ads_client(config_path: Optional[str] = None) -> GoogleAdsClient:
    if config_path is None:
        config_path = os.getenv("GOOGLE_ADS_CONFIG_PATH") or os.getenv("GOOGLE_ADS_YAML")
    if config_path and os.path.exists(config_path):
        return GoogleAdsClient.load_from_storage(path=config_path)
    return GoogleAdsClient.load_from_storage()  # Defaults to ~/.google-ads.yaml