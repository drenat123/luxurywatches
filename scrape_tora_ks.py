#!/usr/bin/env python3
"""Build a reviewable watch catalog snapshot from tora-ks.com.

This script only reads the supplier site and writes JSON locally. It does not
delete or write to Supabase. Use the snapshot with a separate reviewed import.
"""

from __future__ import annotations

import argparse
import json
import re
import time
from collections import defaultdict
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.tora-ks.com"
DEFAULT_OUTPUT = Path("data/tora-ks-watches.json")
USER_AGENT = "LuxuryWatchesKS-catalog-import/1.0 (supplier catalog review)"

BRANDS = {
    "BIGOTTI": ("/category/ora-bigotti", "/category/SHFAQTEGJITHA_BIGOTTI"),
    "DANIEL KLEIN": ("/category/ora-daniel-klein",),
    "SERGIO TACCHINI": ("/category/ORASERGIOTACCHINI",),
    "FREELOOK": ("/category/ORAFREELOOK",),
    "CASIO": ("/category/ORACASIO", "/category/G-SHOCK", "/category/EDIFICE"),
    "Q&Q": ("/category/Q&Q",),
    "POLO EXCHANGE": ("/category/POLOEXCHANGE",),
    "PIERRE RICAUD": ("/category/PIERRE_RICAUD",),
    "ADRIATICA": ("/category/TE_GJITHA_ADRIATICA",),
}

PRODUCT_PATH = "/product/"
VALID_IMAGE_EXTENSIONS = re.compile(r"\.(?:avif|gif|jpe?g|png|webp)(?:\?|$)", re.I)


def clean_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def parse_price(value: str | None) -> float | None:
    match = re.search(r"(\d+(?:[.,]\d{1,2})?)\s*(?:€|EUR)", value or "", re.I)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def absolute_url(value: str | None) -> str | None:
    if not value:
        return None
    return urljoin(BASE_URL, value.strip())


def canonical_url(value: str) -> str:
    parsed = urlparse(value)
    path = parsed.path.rstrip("/") or "/"
    query = urlencode(sorted(parse_qsl(parsed.query, keep_blank_values=True)))
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", query, ""))


def canonical_product_url(value: str) -> str:
    parsed = urlparse(canonical_url(value))
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def gender_from_text(value: str) -> str:
    normalized = value.lower()
    if "meshkuj" in normalized or "men" in normalized:
        return "men"
    if "femra" in normalized or "women" in normalized:
        return "women"
    return "unisex"


def product_links(soup: BeautifulSoup) -> set[str]:
    links = set()
    for anchor in soup.select(f'a[href*="{PRODUCT_PATH}"]'):
        href = absolute_url(anchor.get("href"))
        if href and urlparse(href).netloc == urlparse(BASE_URL).netloc:
            links.add(canonical_product_url(href))
    return links


def pagination_links(soup: BeautifulSoup, current_url: str) -> set[str]:
    links = set()
    for anchor in soup.select('a[rel="next"], a[href*="page="], a[href*="/page/"]'):
        href = absolute_url(anchor.get("href"))
        if href and urlparse(href).netloc == urlparse(BASE_URL).netloc:
            normalized = canonical_url(href)
            if normalized != canonical_url(current_url):
                links.add(normalized)
    return links


def extract_product(session: requests.Session, url: str, brand: str) -> dict:
    response = session.get(url, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    text = clean_text(soup.get_text(" ", strip=True))

    heading = soup.select_one("h1") or soup.select_one("title")
    title = clean_text(heading.get_text(" ", strip=True) if heading else url.rsplit("/", 1)[-1])
    prices = [parse_price(node.get_text(" ", strip=True)) for node in soup.select("[class*='price'], [class*='Price']")]
    prices = [price for price in prices if price is not None]
    price = prices[-1] if prices else parse_price(text)
    original_price = max(prices) if len(prices) > 1 else None
    if original_price == price:
        original_price = None

    images = []
    for image in soup.select("img"):
        source = image.get("data-src") or image.get("src") or image.get("data-original")
        source = absolute_url(source)
        is_supplier_media = source and "contabostorage.com" in source
        looks_like_image = source and VALID_IMAGE_EXTENSIONS.search(source)
        is_brand_asset = source and any(asset in source.lower() for asset in ("logo", "icon", "facebook", "instagram"))
        if source and (is_supplier_media or looks_like_image) and not is_brand_asset and source not in images:
            images.append(source)

    code_match = re.search(r"\b(?:[A-Z]{1,5}[.\-])?[A-Z0-9]+(?:[.\-][A-Z0-9]+)+\b", title)
    sku = code_match.group(0) if code_match else url.rstrip("/").rsplit("/", 1)[-1]
    preferred_image = next(
        (image for image in images if sku.lower().replace(".", "") in image.lower().replace(".", "")),
        images[0] if images else None,
    )
    description = None
    meta_description = soup.select_one('meta[name="description"]')
    if meta_description:
        description = clean_text(meta_description.get("content"))
    for selector in ("[class*='description']", "[id*='description']", "main", "article"):
        node = soup.select_one(selector)
        if node:
            candidate = clean_text(node.get_text(" ", strip=True))
            if len(candidate) >= 30:
                description = candidate if not description or len(candidate) > len(description) else description
                break

    return {
        "supplier": "tora-ks",
        "supplier_sku": sku,
        "source_url": canonical_product_url(url),
        "title": title,
        "brand": brand,
        "category": "watches",
        "gender": gender_from_text(f"{title} {text}"),
        "price": price,
        "original_price": original_price,
        "description": description,
        "image_url": preferred_image,
        "gallery": images,
        "in_stock": not any(term in text.lower() for term in ("jashtë stokut", "s'ka stok", "out of stock")),
    }


def discover(session: requests.Session, brand: str, category_paths: tuple[str, ...], delay: float, max_pages: int) -> set[str]:
    found = set()
    pending = [canonical_url(absolute_url(path)) for path in category_paths]
    visited = set()
    while pending:
        url = pending.pop(0)
        if not url or url in visited:
            continue
        visited.add(url)
        response = session.get(url, timeout=20)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        found.update(product_links(soup))
        for following in pagination_links(soup, url):
            if following not in visited:
                pending.append(following)
        if len(visited) >= max_pages:
            print(f"{brand}: reached pagination limit ({max_pages} pages)")
            break
        time.sleep(delay)
    print(f"{brand}: discovered {len(found)} product URLs")
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=0, help="Limit product pages for a dry run")
    parser.add_argument("--delay", type=float, default=1.0)
    parser.add_argument("--max-pages", type=int, default=100, help="Maximum category pages per brand")
    parser.add_argument("--brand", action="append", choices=sorted(BRANDS), help="Only crawl selected brands")
    args = parser.parse_args()

    selected = args.brand or list(BRANDS)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "sq,en;q=0.8"})
    urls_by_brand = defaultdict(set)
    for brand in selected:
        urls_by_brand[brand] = discover(session, brand, BRANDS[brand], args.delay, args.max_pages)

    rows = []
    seen_urls = set()
    seen_skus = set()
    for brand in selected:
        for url in sorted(urls_by_brand[brand]):
            if url in seen_urls:
                continue
            seen_urls.add(url)
            if args.limit and len(rows) >= args.limit:
                break
            try:
                row = extract_product(session, url, brand)
                sku = str(row.get("supplier_sku") or "").strip().casefold()
                valid_price = isinstance(row.get("price"), (int, float)) and row["price"] > 0
                valid_brand = row.get("brand") in selected
                valid_gender = row.get("gender") in {"men", "women", "unisex"}
                valid_image = bool(row.get("image_url")) and bool(VALID_IMAGE_EXTENSIONS.search(row["image_url"]))
                if sku in seen_skus:
                    print(f"Skipped duplicate product: {url}")
                elif row["title"] and valid_price and valid_brand and valid_gender and valid_image and sku and isinstance(row.get("in_stock"), bool):
                    rows.append(row)
                    seen_skus.add(sku)
                else:
                    print(f"Skipped invalid product: {url}")
            except requests.RequestException as error:
                print(f"Failed product {url}: {error}")
            time.sleep(args.delay)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(rows)} products to {args.output}")


if __name__ == "__main__":
    main()
