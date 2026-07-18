import cv2
import numpy as np
from insightface.app import FaceAnalysis

# Initialize InsightFace
# Using buffalo_l model which is very accurate
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))

def extract_face_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Extracts a 512-dimensional face embedding from an image.
    """
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Could not decode image")
    
    # Detect faces
    faces = app.get(img)
    
    if not faces:
        raise ValueError("No face detected in the image")
    
    # Assuming one person per photo, get the most prominent face
    # You could add logic to find the largest bounding box if multiple faces exist
    face = faces[0]
    
    return face.embedding
