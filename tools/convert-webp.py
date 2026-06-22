"""Convert large PNG assets to WebP for web delivery. Keeps PNG originals."""
import os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(BASE, "source", "assets")
QUALITY = 82  # good balance of size vs quality

targets = [
    "images/backgrounds/hero-bg.png",
    "images/covers/default-cover.png",
    "images/covers/research-cover.png",
    "images/covers/medicine-cover.png",
    "images/covers/ai-tools-cover.png",
    "images/covers/personal-logs-cover.png",
    "brand/telescopium-logo-banner.png",
]

print("PNG → WebP conversion")
print(f"{'File':<45} {'PNG':>8}  {'WebP':>8}  {'Saving':>6}")
print("-" * 75)

for rel in targets:
    png_path = os.path.join(ASSETS, rel)
    webp_path = png_path.replace(".png", ".webp")

    img = Image.open(png_path).convert("RGB")  # drop alpha for smaller webp
    img.save(webp_path, "WEBP", quality=QUALITY)

    png_size = os.path.getsize(png_path)
    webp_size = os.path.getsize(webp_path)
    saved_pct = round((1 - webp_size / png_size) * 100)
    name = os.path.basename(rel)
    print(f"{name:<45} {png_size:>7,}  {webp_size:>7,}  {saved_pct:>4}%")

print("-" * 75)
print("Done. PNG originals preserved.")
