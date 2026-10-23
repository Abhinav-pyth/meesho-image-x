#!/usr/bin/env python3
"""Generate sample Meesho / Flipkart / Amazon shipping-label PDFs for testing."""
from reportlab.lib.pagesizes import A6
from reportlab.pdfgen import canvas

def make_page(c, lines):
    w, h = A6
    y = h - 20
    for ln in lines:
        c.drawString(15, y, ln)
        y -= 13
    c.showPage()

# ---- Page 1: Meesho label ----
make_page(canvas.Canvas("sample_labels.pdf") if False else None, []) if False else None

c = canvas.Canvas("/workspace/sample_labels.pdf", pagesize=A6)

make_page(c, [
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
])

make_page(c, [
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
])

make_page(c, [
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
])

c.save()
print("Created /workspace/sample_labels.pdf (3 labels: Meesho, Flipkart, Amazon)")
