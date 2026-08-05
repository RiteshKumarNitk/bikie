from PIL import Image, ImageDraw, ImageFont
import os

size = (1024, 1024)
bg_color = "#ff4d1a"
text_color = "#ffffff"

img = Image.new("RGB", size, bg_color)
draw = ImageDraw.Draw(img)

# Try to use a standard bold font, fallback to default if not found
try:
    font = ImageFont.truetype("arialbd.ttf", 600)
except Exception:
    try:
        font = ImageFont.truetype("C:\\Windows\\Fonts\\arialbd.ttf", 600)
    except Exception:
        font = ImageFont.load_default()

text = "B"

# Use textbbox to get text dimensions
bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]

# Adjust for visual centering of capital letters
x = (size[0] - text_w) / 2 - bbox[0]
y = (size[1] - text_h) / 2 - bbox[1]

draw.text((x, y), text, font=font, fill=text_color)

# Save to the mobile app assets folder
output_path = os.path.join("apps", "mobile", "assets", "icon.png")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
img.save(output_path)

print("Icon saved to " + output_path)
