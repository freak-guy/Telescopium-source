"""Generate rounded-rect favicon and derivative icon sizes from source PNG."""
import os
from PIL import Image, ImageDraw

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(BASE, "source", "assets", "icons")
SRC = os.path.join(ICONS_DIR, "favicon-source.png")

# ---------- helpers ----------

def rounded_rect_mask(size, radius):
    """Create a rounded-rectangle mask (L mode, white=keep, black=cut)."""
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)],
                           radius=radius, fill=255)
    return mask

def make_icon(size, radius, out_path, bg_color=(8, 11, 20), scale=0.88):
    """
    size   : (w, h) output canvas
    radius : corner radius in px
    scale  : how much of the canvas the source image occupies (0.0–1.0)
    """
    canvas = Image.new("RGBA", size, bg_color + (255,))
    mask = rounded_rect_mask(size, radius)

    # Resize source to fit inside the canvas at given scale
    src = Image.open(SRC).convert("RGBA")
    fit_w = int(size[0] * scale)
    fit_h = int(size[1] * scale)
    src_w, src_h = src.size
    ratio = min(fit_w / src_w, fit_h / src_h)
    new_w, new_h = int(src_w * ratio), int(src_h * ratio)
    src_resized = src.resize((new_w, new_h), Image.LANCZOS)

    # Center the resized source
    offset_x = (size[0] - new_w) // 2
    offset_y = (size[1] - new_h) // 2
    canvas.paste(src_resized, (offset_x, offset_y), src_resized)

    # Apply rounded-rect mask to the whole canvas
    canvas.putalpha(mask)

    # Save
    canvas.save(out_path, "PNG")
    print(f"  {os.path.basename(out_path)}  {size[0]}×{size[1]}  radius={radius}  scale={scale}")

# ---------- generate ----------

def main():
    print("Generating icons from favicon-source.png ...")

    RADIUS = 104          # rounded corner radius for 512px canvas
    BG = (8, 11, 20)      # deep-space background #080B14

    # 512×512 main icons
    make_icon((512, 512), RADIUS, os.path.join(ICONS_DIR, "favicon.png"),         bg_color=BG, scale=0.88)
    make_icon((512, 512), RADIUS, os.path.join(ICONS_DIR, "site-icon-512.png"),   bg_color=BG, scale=0.88)

    # 180×180 Apple touch icon (proportional radius)
    make_icon((180, 180), 36,  os.path.join(ICONS_DIR, "apple-touch-icon.png"),   bg_color=BG, scale=0.86)

    # 32×32 and 16×16 — resize from the 512 master for crispness
    master = Image.open(os.path.join(ICONS_DIR, "favicon.png"))
    for s, name in [(32, "favicon-32.png"), (16, "favicon-16.png")]:
        resized = master.resize((s, s), Image.LANCZOS)
        resized.save(os.path.join(ICONS_DIR, name), "PNG")
        print(f"  {name}  {s}×{s}  (downscaled from 512)")

    print("Done.")

if __name__ == "__main__":
    main()
