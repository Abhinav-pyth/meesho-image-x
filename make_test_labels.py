#!/usr/bin/env python3
"""Generate a sample multi-marketplace shipping-label PDF for testing.

Usage:
    pip install reportlab
    python make_test_labels.py [output.pdf]
"""
import sys

from reportlab.lib.pagesizes import A6
from reportlab.pdfgen import canvas

DEFAULT_OUTPUT = "sample_labels.pdf"

MEESHO_LABEL = [
    "MEESHO B2B ORDER",
    "Order ID: OM2410151234567",
    "Order Date: 15/10/2026",
    "----------------------------------------",
    "SHIP TO:",
    "Buyer Name: Rahul Verma",
    "Phone: +91 98123 45678",
    "Address: 12 Rose Villa, Sector 18,",
    "Noida, Uttar Pradesh - 201301",
    "----------------------------------------",
    "Product: Cotton Kurti - Blue, Size M",
    "Supplier SKU: SUP_kurti_blue_M",
    "Payment Mode: COD",
    "Weight: 250 g",
    "Total: Rs. 599.00",
]

FLIPKART_LABEL = [
    "Flipkart Order Summary",
    "Order ID: FKPCOD9012345678",
    "Placed on: 18/10/2026",
    "Ship To: Sneha Iyer",
    "+91 90000 11111",
    "Flat 4B, Palm Grove Apartments",
    "Chennai, Tamil Nadu - 600042",
    "Item(s): Wireless Earbuds Pro X",
    "Payment Type: Prepaid",
    "Shipment Weight: 120 gm",
]

AMAZON_LABEL = [
    "amazon.in Shipping Label",
    "Order # 112-3344556-7788990",
    "Ship to: Arjun Patel",
    "Contact: 98765 43210",
    "Address: 5 Lake View Road, Andheri East",
    "Mumbai, Maharashtra - 400069",
    "arjun.patel@example.com",
    "Product: Stainless Steel Water Bottle 1L",
    "Payment Method: COD",
    "Ship Date: 20/10/2026",
    "Weight: 0.5 kg",
]

LABELS = [MEESHO_LABEL, FLIPKART_LABEL, AMAZON_LABEL]


def draw_label(c, lines, margin=15, first_baseline=20, line_height=13):
    """Draw one label (text lines) onto the canvas as its own page."""
    _, h = A6
    y = h - first_baseline
    for ln in lines:
        c.drawString(margin, y, ln)
        y -= line_height
    c.showPage()


def main():
    output = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUTPUT
    c = canvas.Canvas(output, pagesize=A6)
    for lines in LABELS:
        draw_label(c, lines)
    c.save()
    print(f"Created {output} ({len(LABELS)} labels: Meesho, Flipkart, Amazon)")


if __name__ == "__main__":
    main()
