import os
import cv2
import numpy as np

def simulate_chroma_key(filepath, threshold):
    print(f"\nSimulating White Chroma on: {filepath} with threshold={threshold}")
    if not os.path.exists(filepath):
        print("File does not exist.")
        return
        
    cap = cv2.VideoCapture(filepath)
    ret, frame = cap.read()
    if not ret:
        print("Failed to read frame.")
        cap.release()
        return
        
    h, w, _ = frame.shape
    # BGR format in OpenCV
    # In Javascript, R is data[i], G is data[i+1], B is data[i+2]
    # The condition is: r > minColorVal && g > minColorVal && b > minColorVal
    minColorVal = 255 - threshold
    
    # We want to identify character pixels vs background pixels.
    # Let's count how many pixels in total are made transparent.
    transparent_mask = (frame[:, :, 2] > minColorVal) & (frame[:, :, 1] > minColorVal) & (frame[:, :, 0] > minColorVal)
    transparent_count = np.sum(transparent_mask)
    opaque_count = (w * h) - transparent_count
    
    print(f"Total pixels: {w}x{h} = {w*h}")
    print(f"Transparent (background) pixels: {transparent_count} ({transparent_count/(w*h)*100:.2f}%)")
    print(f"Opaque (character/foreground) pixels: {opaque_count} ({opaque_count/(w*h)*100:.2f}%)")
    
    # Let's see the bounding box of the opaque pixels
    opaque_indices = np.argwhere(~transparent_mask)
    if len(opaque_indices) > 0:
        min_y, min_x = opaque_indices.min(axis=0)
        max_y, max_x = opaque_indices.max(axis=0)
        print(f"Opaque bounding box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
        print(f"Opaque size: {max_x - min_x + 1}x{max_y - min_y + 1}")
    else:
        print("Everything became transparent!")
        
    cap.release()

if __name__ == "__main__":
    dir_path = "public/assets/images/subway/Personaje/niña blanca"
    video_path = os.path.join(dir_path, "nIña delizando verdadero.mp4")
    simulate_chroma_key(video_path, threshold=28)
    simulate_chroma_key(video_path, threshold=40)
    simulate_chroma_key(video_path, threshold=60)
    simulate_chroma_key(video_path, threshold=80)
