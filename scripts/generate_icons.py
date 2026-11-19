import sys
try:
    from PIL import Image
    print("Pillow available")
    src = Image.open("public/IgaraDrama.png")
    
    for size in [192, 512]:
        # Create dark background
        bg = Image.new("RGBA", (size, size), (14, 11, 20, 255))
        # Compute scaled size maintaining aspect ratio
        ratio = min(size / src.width, size / src.height) * 0.85
        new_w = int(src.width * ratio)
        new_h = int(src.height * ratio)
        resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        bg.paste(resized, (offset_x, offset_y), resized if resized.mode == "RGBA" else None)
        out_path = f"public/icon-{size}.png"
        bg.save(out_path)
        print(f"Generated {out_path}")
        
    # Also save maskable
    bg.save("public/icon-maskable-512.png")
    print("Generated public/icon-maskable-512.png")
except Exception as e:
    print(f"Error: {e}")
