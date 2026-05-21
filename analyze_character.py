import os
from PIL import Image

def analyze_png(filepath):
    print(f"--- Analyzing PNG: {filepath} ---")
    if not os.path.exists(filepath):
        print("File does not exist.")
        return
    
    img = Image.open(filepath)
    width, height = img.size
    print(f"Dimensions: {width}x{height}")
    
    # Get bounding box of non-transparent/non-black pixels
    # Since it's a PNG, we look at the alpha channel or non-black colors.
    img_rgba = img.convert("RGBA")
    data = img_rgba.getdata()
    
    min_x = width
    max_x = 0
    min_y = height
    max_y = 0
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = data[y * width + x]
            # Consider pixel as part of character if alpha > 10 and not completely black
            if a > 10 and (r > 10 or g > 10 or b > 10):
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if max_x >= min_x:
        char_width = max_x - min_x + 1
        char_height = max_y - min_y + 1
        center_x = min_x + char_width / 2
        feet_y = max_y
        
        print(f"Character bounding box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
        print(f"Character size: {char_width}x{char_height}")
        print(f"Character horizontal center: {center_x} (Video center: {width / 2})")
        print(f"Horizontal offset from center: {center_x - (width / 2):.1f} pixels")
        print(f"Feet Y position: {feet_y} (Video bottom: {height})")
    else:
        print("No character pixels found.")

def analyze_mp4(filepath, threshold=31):
    print(f"\n--- Analyzing MP4: {filepath} ---")
    if not os.path.exists(filepath):
        print("File does not exist.")
        return
        
    try:
        import cv2
    except ImportError:
        print("OpenCV (cv2) is not installed yet.")
        return
        
    cap = cv2.VideoCapture(filepath)
    ret, frame = cap.read()
    if not ret:
        print("Failed to read video frame.")
        cap.release()
        return
        
    height, width, _ = frame.shape
    print(f"Dimensions: {width}x{height}")
    
    min_x = width
    max_x = 0
    min_y = height
    max_y = 0
    
    # Analyze first 30 frames to get a robust bounding box
    frame_count = 0
    while ret and frame_count < 30:
        # threshold is 31
        # find pixels where R, G, B > threshold
        for y in range(0, height, 2): # step by 2 for speed
            for x in range(0, width, 2):
                b, g, r = frame[y, x]
                if r > threshold or g > threshold or b > threshold:
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
        ret, frame = cap.read()
        frame_count += 1
        
    cap.release()
    
    if max_x >= min_x:
        char_width = max_x - min_x + 1
        char_height = max_y - min_y + 1
        center_x = min_x + char_width / 2
        feet_y = max_y
        
        print(f"Character bounding box across {frame_count} frames: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
        print(f"Character size: {char_width}x{char_height}")
        print(f"Character horizontal center: {center_x} (Video center: {width / 2})")
        print(f"Horizontal offset from center: {center_x - (width / 2):.1f} pixels")
        print(f"Feet Y position: {feet_y} (Video bottom: {height})")
    else:
        print("No character pixels found.")

if __name__ == "__main__":
    png_path = "public/assets/images/subway/Personaje/niña blanca/Niña blanca saltando.png"
    run_mp4_path = "public/assets/images/subway/Personaje/niña blanca/niña blanca corriendo.mp4"
    slide_mp4_path = "public/assets/images/subway/Personaje/niña blanca/nIña delizando verdadero.mp4"
    
    analyze_png(png_path)
    analyze_mp4(run_mp4_path, threshold=31)
    analyze_mp4(slide_mp4_path, threshold=45)
