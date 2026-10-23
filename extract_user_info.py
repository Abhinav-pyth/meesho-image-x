#!/usr/bin/env python3
"""
extract_user_info.py — Extract user information from an uploaded PDF.

Pulls common personal / account fields out of a PDF's text layer:
name, email, phone, date of birth, address, PAN, Aadhaar (masked),
passport / driver-license numbers, and any other key:value pairs it finds.

Usage:
    python extract_user_info.py <file.pdf> [--json out.json] [--raw-text out.txt]

Requires: pypdf  (pip install pypdf)
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf is required. Install it with: pip install pypdf")


# ---------------------------------------------------------------------------
# Field patterns (checked in order; first match per field wins)
# ---------------------------------------------------------------------------
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_LABEL_RE = re.compile(
    r"(?:phone|mobile|contact(?:\s+number)?|tel(?:ephone)?)\s*[:\-]?\s*"
    r"(\+?[\d ()\-.]{7,20}\d)",
    re.IGNORECASE,
)
PHONE_RE = re.compile(r"\+?\d{1,2}[\s.-]?\d{5}[\s.-]?\d{5}")  # Indian +91 style
DOB_LABEL_RE = re.compile(
    r"(?:date\s+of\s+birth|dob|birthdate|born(?:on)?)\s*[:\-]?\s*"
    r"(\d{1,2}(?:[/.\-]\d{1,2})?(?:[/.\-]\d{2,4})?"
    r"|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})",
    re.IGNORECASE,
)
NAME_LABEL_RE = re.compile(
    r"(?:full\s+name|applicant\s+name|customer\s+name|user\s+name|^\s*name)\s*[:\-]\s*"
    r"([A-Z][A-Za-z.'\- ]{2,60})",
    re.IGNORECASE | re.MULTILINE,
)
ADDRESS_LABEL_RE = re.compile(
    r"(?:residential\s+address|mailing\s+address|current\s+address|address)"
    r"\s*[:\-]\s*(.{5,200})",
    re.IGNORECASE,
)
PAN_RE = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")
AADHAAR_RE = re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b")
PASSPORT_RE = re.compile(r"\b[TPRABCDLFXG]\d{7}\b")          # Indian passport style
DL_RE = re.compile(r"\b(?:\d{2}-?\d{2}-?\d{11}|\b[A-Z]{2}\d{11})\b")
GENDER_RE = re.compile(r"\bgender\s*[:\-]\s*(male|female|other)\b", re.IGNORECASE)
KEYVAL_RE = re.compile(r"^([A-Za-z][A-Za-z /()'.\-]{2,40}?)\s*[:\-]\s*(\S.{0,80})$")


def strip_masked_aadhaar(value: str) -> str:
    """Keep Aadhaar masked: only show last 4 digits."""
    digits = re.sub(r"\D", "", value)
    return f"XXXX-XXXX-{digits[-4:]}" if len(digits) == 12 else value


def extract_fields(text: str) -> dict:
    fields = {}

    m = EMAIL_RE.search(text)
    if m:
        fields["email"] = m.group(0)

    m = NAME_LABEL_RE.search(text)
    if m:
        fields["name"] = m.group(1).strip().rstrip(".,")

    m = DOB_LABEL_RE.search(text)
    if m:
        fields["date_of_birth"] = m.group(1).strip()

    cleaned = re.sub(EMAIL_RE.pattern, "", text)
    m = PHONE_LABEL_RE.search(cleaned) or PHONE_RE.search(cleaned)
    if m:
        digits = re.sub(r"\D", "", m.group(1))
        if 10 <= len(digits) <= 13:
            fields["phone"] = m.group(1).strip()

    m = ADDRESS_LABEL_RE.search(text)
    if m:
        fields["address"] = m.group(1).strip()

    m = GENDER_RE.search(text)
    if m:
        fields["gender"] = m.group(1).capitalize()

    m = PAN_RE.search(text)
    if m:
        fields["pan"] = m.group(0)

    m = AADHAAR_RE.search(text)
    if m:
        fields["aadhaar_masked"] = strip_masked_aadhaar(m.group(0))

    m = PASSPORT_RE.search(text)
    if m:
        fields["passport_number"] = m.group(0)

    m = DL_RE.search(text)
    if m:
        fields["driver_license"] = m.group(0)

    return fields


def extract_key_values(text: str) -> dict:
    """Fallback: grab any 'Label: value' lines the named fields missed."""
    kvs = {}
    for line in text.splitlines():
        m = KEYVAL_RE.match(line.strip())
        if m:
            k, v = m.group(1).strip(), m.group(2).strip()
            if k.lower() not in ("https", "http") and len(v) > 1:
                kvs.setdefault(k.lower(), v)
    return kvs


def pdf_to_text(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception as e:  # tolerate broken pages
            print(f"warning: failed to extract a page: {e}", file=sys.stderr)
    meta = reader.metadata or {}
    meta_lines = "\n".join(f"{k}: {v}" for k, v in meta.items())
    return "\n".join(pages) + "\n" + meta_lines


def main():
    ap = argparse.ArgumentParser(description="Extract user info from a PDF.")
    ap.add_argument("pdf", help="Path to the uploaded PDF")
    ap.add_argument("--json", metavar="OUT", help="Write extracted data as JSON")
    ap.add_argument("--raw-text", metavar="OUT", help="Dump raw PDF text to file")
    args = ap.parse_args()

    path = Path(args.pdf)
    if not path.is_file():
        sys.exit(f"error: file not found: {path}")

    text = pdf_to_text(path)
    if args.raw_text:
        Path(args.raw_text).write_text(text, encoding="utf-8")

    if not text.strip():
        sys.exit("error: no extractable text found (scanned/image-only PDF? try OCR)")

    result = {
        "source_file": str(path),
        "fields": extract_fields(text),
        "additional_key_values": extract_key_values(text),
    }

    if args.json:
        Path(args.json).write_text(json.dumps(result, indent=2, ensure_ascii=False),
                                   encoding="utf-8")
        print(f"JSON written to {args.json}")

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
