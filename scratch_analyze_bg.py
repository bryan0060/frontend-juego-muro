import os
import cv2
import numpy as np

def analyze_video_bg_distribution(filepath):
    print(f"\nAnalyzing: {filepath}")
    if not os.path.exists(filepath):
        print("File does not exist.")
        return
        
    cap = cv2.VideoCapture(filepath)
    frame_idx = 0
    bg_pixels = []
    
    while frame_idx < 30:
        ret, frame = cap.read()
        if not ret:
            break
            
        h, w, _ = frame.shape
        # Sample background from 100x100 patches in the 4 corners
        patch_size = 50
        corners = [
            frame[0:patch_size, 0:patch_size],
            frame[0:patch_size, w-patch_size:w],
            frame[h-patch_size:h, 0:patch_size],
            frame[h-patch_size:h, w-patch_size:w]
        ]
        
        for patch in corners:
            # Flatten patch and append to list
            bg_pixels.append(patch.reshape(-1, 3))
            
        frame_idx += 1
        
    cap.release()
    
    if bg_pixels:
        all_bg = np.vstack(bg_pixels)
        # OpenCV reads in BGR
        b_vals = all_bg[:, 0]
        g_vals = all_bg[:, 1]
        r_vals = all_bg[:, 2]
        
        print("BGR channels statistics in corners (first 30 frames):")
        print(f"  Blue:  Min={b_vals.min()}, Max={b_vals.max()}, Mean={b_vals.mean():.1f}, Median={np.median(b_vals)}")
        print(f"  Green: Min={g_vals.min()}, Max={g_vals.max()}, Mean={g_vals.mean():.1f}, Median={np.median(g_vals)}")
        print(f"  Red:   Min={r_vals.min()}, Max={r_vals.max()}, Mean={r_vals.mean():.1f}, Median={np.median(r_vals)}")
        
        # Count pixels that would NOT be matched as white with threshold=28 (minVal = 227)
        threshold_28_min = 227
        not_matched_28 = np.sum((r_vals <= threshold_28_min) | (g_vals <= threshold_28_min) | (b_vals <= threshold_28_min))
        pct_not_matched_28 = (not_matched_28 / len(all_bg)) * 100
        print(f"  With threshold=28 (minVal=227): {not_matched_28} / {len(all_bg)} pixels ({pct_not_matched_28:.2f}%) are NOT matched as white and will remain OPAQUE!")
        
        # Test other thresholds to find a perfect value
        for t in [40, 50, 60, 70, 80]:
            min_val = 255 - t
            not_matched = np.sum((r_vals <= min_val) | (g_vals <= min_val) | (b_vals <= min_val))
            pct = (not_matched / len(all_bg)) * 100
            print(f"  With threshold={t} (minVal={min_val}): {not_matched} / {len(all_bg)} pixels ({pct:.2f}%) NOT matched.")

if __name__ == "__main__":
    dir_path = "public/assets/images/subway/Personaje/niña blanca"
    analyze_video_bg_distribution(os.path.join(dir_path, "nIña delizando verdadero.mp4"))
