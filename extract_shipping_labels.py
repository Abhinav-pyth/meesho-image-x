#!/usr/bin/env python3
"""
extract_shipping_labels.py — Extract buyer/shipping info from Meesho, Flipkart
or Amazon shipping-label PDFs and export it as a CSV.

Handles multi-page / multi-label PDFs (each label = one CSV row) and auto-detects
the marketplace per label.

Usage:
    python extract_shipping_labels.py <labels.pdf> [-o output.csv]

Requires: pypdf  (pip install pypdf)
"""

import argparse
import csv
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf is required. Install it with: pip install pypdf")


CSV_COLUMNS = [
    "marketplace", "order_id", "buyer_name", "phone", "address",
    "city", "state", "pincode", "product", "payment_mode",
    "ship_date", "weight",
]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


# ---------------------------------------------------------------------------
# Marketplace detection
# ---------------------------------------------------------------------------
def detect_marketplace(text: str) -> str:
    low = text.lower()
    if "meesho" in low:
        return "Meesho"
    if "flipkart" in low or "fssai" in low and "fkpc" in low:
        return "Flipkart"
    if "amazon" in low or re.search(r"\b[A-Z0-9]{3}-[A-Z0-9]{7}-[A-Z0-9]{7}\b", text):
        return "Amazon"
    # secondary hints
    if "supplier sku" in low or "mfg" in low and "sup_" in low:
        return "Meesho"
    if "fkpc" in low:
        return "Flipkart"
    return "Unknown"


# ---------------------------------------------------------------------------
# Field extraction helpers
# ---------------------------------------------------------------------------
def find_order_id(text: str, marketplace: str) -> str:
    """Order ID patterns differ per marketplace."""
    patterns = [
        r"(?:order\s*(?:id|#|no\.?)|orderid)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-_]{5,24})",
        r"\b(\d{10,20})\b",                     # plain long numeric id
        r"\b([A-Z0-9]{3}-[A-Z0-9]{7}-[A-Z0-9]{7})\b",  # Amazon format
    ]
    if marketplace == "Flipkart":
        patterns.insert(0, r"\b(FKPC\d{8,20})\b")
    if marketplace == "Meesho":
        patterns.insert(0, r"\b(OM\d{10,20}|\d{13,20})\b")
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            cand = m.group(1).strip("-")
            # reject pincodes / phone digits masquerading as order ids
            if re.fullmatch(r"\d+", cand) and not 10 <= len(cand) <= 20:
                continue
            return cand
    return ""


DEFAULT_STOP = (
    r"City|State|Pin\s*-?\s*Code|PIN|Postal|Product|Item\(s?\)|Description|"
    r"Payment|Weight|Order|Phone|Mobile|Contact|Customer|Buyer|Receiver|Consignee|"
    r"Name|Address|Ship(?:ping)?\s*To|Bill|Total|SKU|Date|Placed|Dispatched|"
    r"Supplier|Mfg|HSN|MRP|Qty|Quantity|Email"
)


def find_labeled(text: str, labels: str, until_terms: str = "") -> str:
    """Find value following one of several labels, stopping before next known label.
    Works both for inline 'Label: value' and 'Label:\\nvalue' layouts."""
    stop = until_terms or DEFAULT_STOP
    m = re.search(
        rf"(?:{labels})\s*[:\-]?\s*\n?(.+?)(?=\s+(?:{stop})\s*[:\-]"
        rf"|\n(?=(?:{stop})(?:\s*[:\-]|\s*\n))|$)",
        text, re.IGNORECASE | re.DOTALL,
    )
    if not m:
        return ""
    val = m.group(1).strip()
    # safety: cut the blob at any embedded 'Xxx:' label that slipped past the
    # stop-list (e.g. a bare 'Payment Type:' inside a product capture)
    val = re.split(r"\n(?=[A-Z][A-Za-z ()/.-]{2,28}\s*[:\-])", val)[0].strip()
    # drop a dangling label word left over from a mid-label line break
    # (e.g. '...Size M\nSupplier' before 'SKU:' on the next line)
    val = re.sub(r"\n?[A-Z][a-z]+(?: [A-Z][a-z]+)?$",
                 lambda mo: "" if mo.group(0).lstrip("\n ").lower().rstrip("s")
                 in ("supplier", "payment", "order", "product", "item", "ship",
                     "delivery", "buyer", "customer", "weight", "total") else mo.group(0),
                 val).strip()
    return val


def find_phone(text: str) -> str:
    # masked formats like +91 98XXX XX123 are common on labels
    m = re.search(r"(?:phone|mobile(?:\s*number)?|contact)\s*[:\-]?\s*"
                  r"((?:\+?91[\s\-]?)?[6-9X][\dXx\s\-\*]{6,14}[0-9Xx])",
                  text, re.IGNORECASE)
    if m:
        return re.sub(r"\s+", " ", m.group(1).strip())
    # any bare 10-digit Indian mobile (optionally +91 prefixed)
    m = re.search(r"(?<!\d)((?:\+?91[\s\-]?)?[6-9]\d[\d\s\-]{8,11})(?!\d)", text)
    if m:
        cand = m.group(1).strip()
        digits = re.sub(r"\D", "", cand)[-10:]
        if len(digits) == 10 and digits[0] in "6789":
            return cand
    return ""


def find_pincode(text: str) -> str:
    # pincode usually appears near city/state or labeled PIN/PINCODE
    m = re.search(r"(?:pin\s*-?\s*code|pin|postal\s*code)\s*[:\-]?\s*(\d{6})", text, re.IGNORECASE)
    if m:
        return m.group(1)
    phone_digits = re.sub(r"\D", "", find_phone(text))
    for cand in re.findall(r"\b(\d{6})\b", text):
        if cand != phone_digits[-6:]:
            return cand
    # labels often render 'City, State - 560038' with a space before the dash:
    # '... 560038' may extract as '560 038'
    m = re.search(r"[-–]\s*(\d{3})[\s](\d{3})(?!\d)", text)
    if m:
        return m.group(1) + m.group(2)
    return ""


INDIAN_STATES = {
    "andhra pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", "haryana",
    "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh",
    "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "osisa",
    "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura",
    "uttar pradesh", "uttarakhand", "west bengal", "delhi", "jammu and kashmir",
    "ladakh", "chandigarh", "pondicherry", "darjeeling",
}


def split_city_state(address_block: str):
    """Pull city/state out of an address blob like '... Bengaluru, Karnataka - 560038'.
    Uses a known-state list so we don't mistake a locality for the state. Handles
    both comma/newline-separated addresses and single-line 'City, State - PIN' form."""
    city = state = ""
    # strip trailing '- pincode' / 'pincode' from the last part
    parts = [p.strip(" .,-") for p in re.split(r",|\n", address_block) if p.strip(" .,-")]
    parts = [re.sub(r"\s*[-–]\s*\d{6}\s*$", "", p).strip() for p in parts]
    parts = [p for p in parts if not re.fullmatch(r"\d{6}", p)]
    for i, p in enumerate(parts):
        norm = re.sub(r"\s+", " ", p.lower())
        if norm in INDIAN_STATES:
            state = p
            if i >= 1:
                city = parts[i - 1]
            break
        # multi-word tail may be 'City, State' compressed into one comma-part?
        # also handle 'Karnataka 560038'-style already stripped above
    return city, state


def clean_address(text_before_next_label: str) -> str:
    a = re.sub(r"\s+", " ", text_before_next_label).strip(" :,-")
    return a


def extract_label_fields(page_text: str) -> dict:
    marketplace = detect_marketplace(page_text)
    row = {c: "" for c in CSV_COLUMNS}
    row["marketplace"] = marketplace
    row["order_id"] = find_order_id(page_text, marketplace)

    # Buyer name — prefer explicit labels
    name = find_labeled(page_text, r"buyer\s*name|customer\s*name|ship(?:ping)?\s*to\s*name|"
                                   r"consignee|receiver\s*name")
    if not name:
        # "Ship To: <name>" / "Deliver To: <name>" (value must NOT contain digits,
        # which would indicate it ran into the address)
        m = re.search(r"(?:ship\s*to|deliver\s*to|buyer|recipient)\s*[:\-]?\s*"
                      r"([A-Za-z][A-Za-z.\-']+(?:\s+[A-Za-z.\-']+){1,4})(?=\n|$)",
                      page_text, re.IGNORECASE)
        name = m.group(1).strip() if m else ""
    if not name:
        name = find_labeled(page_text, r"(?<![\w ])name(?![\w ])")
    # strip trailing junk: line breaks, next-label words, or the start of an address
    name = re.split(r"\n|(?<=\s)\d{1,5}\s", name)[0].strip().rstrip(",:- ")
    name = re.sub(r"\s+(Phone|Mobile|Contact|Address|City|State|Pin|Email)\s*$",
                  "", name, flags=re.IGNORECASE).strip()
    row["buyer_name"] = name

    addr = find_labeled(page_text, r"ship(?:ping)?\s*(?:to)?\s*address|delivery\s*address|"
                                   r"bill\s*to|address")
    row["address"] = clean_address(addr)
    # if no labeled address, use unlabeled lines between the name and product blocks
    if not row["address"]:
        m = re.search(r"(?:ship\s*to|deliver\s*to)\s*[:\-]?\s*\n?"
                      r"[A-Za-z][A-Za-z.\-']+(?:\s+[A-Za-z.\-']+){1,4}\s*\n(.{5,200})",
                      page_text, re.IGNORECASE | re.DOTALL)
        if m:
            blob = re.split(r"(?=(?:Item\(s?\)|Product|Payment|Weight))", m.group(1))[0]
            # drop a phone number that sits on its own line inside the blob
            ph = find_phone(blob)
            if ph:
                blob = blob.replace(ph, "")
            row["address"] = clean_address(blob)
    # drop any email that got swept into the address blob
    em_in_addr = EMAIL_RE.findall(row["address"])
    if em_in_addr:
        row["address"] = row["address"].replace(em_in_addr[0], "").strip()
    row["phone"] = find_phone(page_text)

    city, state = split_city_state(row["address"])
    lbl_city = find_labeled(page_text, r"city")
    lbl_state = find_labeled(page_text, r"state")
    row["city"] = (lbl_city or city).split("\n")[0].strip()
    row["state"] = (lbl_state or state).split("\n")[0].strip()
    row["pincode"] = find_pincode(page_text)

    row["product"] = find_labeled(
        page_text,
        r"product\s*(?:name|description|details)?|item\s*\(s?\)|item\s*(?:name|desc.*)?|"
        r"description of goods|contents",
        until_terms=r"Qty|Quantity|Price|Amount|Weight|Payment|Order|SKU|Total|HSN|MRP",
    )
    pay = find_labeled(page_text, r"payment\s*(?:mode|type|method)?",
                       until_terms=r"Weight|Order|Ship|Delivery|Total|Invoice")
    row["payment_mode"] = re.split(r"\n", pay)[0].strip()
    date = find_labeled(page_text, r"order\s*date|ship(?:ped)?\s*date|dispatch\s*date|"
                                  r"invoice\s*date|placed\s*on|date",
                        until_terms=r"Delivery|Expected|Payment|Time")
    row["ship_date"] = re.split(r"\n", date)[0].strip()
    wt = re.search(r"(?:weight|wt)\s*[:\-]?\s*([\d.]+\s*(?:g|gm|grams?|kg|kgs?)?)",
                   page_text, re.IGNORECASE)
    row["weight"] = wt.group(1).strip() if wt else ""

    return row


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def iter_label_chunks(text: str):
    """Yield one text chunk per label on a page.

    A page may contain multiple labels; split before marketplace headings and
    skip chunks that repeat an already-seen (marketplace, order id) pair.
    """
    chunks = re.split(r"(?=(?:MEESHO|FLIPKART|AMAZON)\b)", text, flags=re.IGNORECASE)
    seen_keys = set()
    for chunk in chunks:
        mp = detect_marketplace(chunk)
        if mp == "Unknown" and len(chunks) > 1:
            continue
        key = (mp, find_order_id(chunk, mp))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        yield chunk


def extract_rows(reader) -> list:
    """Build one CSV-ready row per shipping label found in the PDF."""
    rows = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception as e:
            print(f"warning: page {i+1} unreadable ({e})", file=sys.stderr)
            continue
        if not text.strip():
            print(f"warning: page {i+1} has no text layer (image-only scan? needs OCR)",
                  file=sys.stderr)
            continue
        for chunk in iter_label_chunks(text):
            row = extract_label_fields(chunk)
            row["email"] = ";".join(sorted(set(EMAIL_RE.findall(chunk))))
            rows.append(row)
    return rows


def main():
    ap = argparse.ArgumentParser(description="Extract shipping-label info to CSV")
    ap.add_argument("pdf", help="Path to the labels PDF")
    ap.add_argument("-o", "--output", default=None, help="Output CSV path")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        sys.exit(f"File not found: {pdf_path}")

    reader = PdfReader(str(pdf_path))
    rows = extract_rows(reader)

    if not rows:
        sys.exit("No label data extracted — is this a text-based PDF?")

    out_csv = Path(args.output) if args.output else pdf_path.with_suffix(".csv")
    any_emails = any(r.get("email") for r in rows)
    cols = CSV_COLUMNS + (["email"] if any_emails else [])
    with out_csv.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)

    print(f"Wrote {len(rows)} label(s) -> {out_csv}")
    for r in rows:
        print(f"  [{r['marketplace']}] order={r['order_id']} buyer={r['buyer_name']!r} "
              f"phone={r['phone']} pin={r['pincode']}")


if __name__ == "__main__":
    main()
