import cv2
import os
import time
import requests

RTSP_URL = os.getenv("RTSP_URL", "0") # Default to webcam 0 for local testing if not provided
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

def main():
    print(f"Starting Camera Worker with RTSP_URL={RTSP_URL}")
    
    # We will use the lightweight Haar Cascade for initial face detection
    # This prevents us from spamming the backend API with empty frames
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Try converting RTSP_URL to int if it's a local webcam index
    try:
        video_source = int(RTSP_URL)
    except ValueError:
        video_source = RTSP_URL
        
    cap = cv2.VideoCapture(video_source)
    
    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    # Cooldown settings to prevent spamming
    last_api_call = 0
    COOLDOWN_SECONDS = 5
    
    # Skip frames to reduce CPU load (process 1 in every 5 frames)
    frame_skip = 5
    frame_count = 0

    print("Camera initialized. Waiting for faces...")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame, retrying in 5 seconds...")
            time.sleep(5)
            # Try to reconnect
            cap.release()
            cap = cv2.VideoCapture(video_source)
            continue
            
        frame_count += 1
        if frame_count % frame_skip != 0:
            continue
            
        current_time = time.time()
        
        # Only process if we are past the cooldown
        if current_time - last_api_call >= COOLDOWN_SECONDS:
            # Resize for faster face detection
            small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) > 0:
                print(f"Detected {len(faces)} face(s). Sending to backend...")
                
                # Convert the full-res frame to JPEG
                _, buffer = cv2.imencode('.jpg', frame)
                
                try:
                    # Post to backend
                    files = {'file': ('capture.jpg', buffer.tobytes(), 'image/jpeg')}
                    response = requests.post(f"{BACKEND_URL}/recognize", files=files)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "recognized":
                            print(f"SUCCESS: Recognized {data['customer']['name']}")
                        else:
                            print("SUCCESS: Face not recognized (Unknown visitor)")
                    else:
                        print(f"Backend returned error: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Failed to reach backend: {e}")
                    
                # Reset cooldown regardless of success/fail to avoid spamming errors
                last_api_call = current_time

    cap.release()

if __name__ == "__main__":
    # Wait a few seconds for backend to start up
    time.sleep(5)
    main()
