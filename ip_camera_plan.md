# IP Camera Automation Integration Plan

## Goal Description
The goal is to fully automate the Customer Identification System so that when a person walks through the door, an IP camera automatically captures their face and triggers the recognition pipeline without manual user interaction.

## Can the same application work?
**Yes, absolutely!** Your current backend API (`/recognize` and `/register`) is perfectly designed to handle this. We do not need to rebuild the core application; instead, we just need to add a **"Camera Worker"** that acts like an automated user. 

## How IP Cameras Work in this Context
Most IP Cameras provide a live **RTSP (Real-Time Streaming Protocol)** feed over the network. To automate this, we need a system that continuously watches this feed, detects when a person is in the frame, and sends the best snapshot to our existing backend.

## Proposed Setup & Architecture

There are two primary ways to achieve this, but I highly recommend **Approach 1** for maximum control and accuracy.

### Approach 1: The "Camera Worker" Service (Recommended)
We will create a new, lightweight Python script running as a background service in your `docker-compose` setup.
1. **RTSP Stream Reading**: The script uses OpenCV to continuously read the live RTSP stream from your IP camera over the local network (e.g., `rtsp://admin:password@192.168.1.100:554/stream`).
2. **Motion & Face Detection**: The script analyzes frames in real-time. When it detects motion (someone opening the door) and subsequently detects a face, it extracts a high-quality frame.
3. **API Submission**: It takes that single frame and automatically sends a `POST` request to our existing `http://backend:8000/recognize` API, exactly as the React frontend does today.
4. **WebSocket/SSE updates (Optional)**: If you want the React Dashboard to update automatically when a customer walks in, we can add a WebSocket connection so the backend pushes the recognized customer's profile directly to the screen!

### Approach 2: Camera-Native Webhooks (Hardware Dependent)
High-end security cameras (like modern Hikvision or Dahua models) have built-in AI for face detection. 
1. When the camera detects a face at the door, it can automatically trigger an HTTP Webhook or save an image to an FTP server.
2. We would simply add a new endpoint to our FastAPI backend (e.g., `/api/webhook/camera`) that receives the image directly from the camera and processes it.

---

## Detailed Plan for Approach 1 (Camera Worker)

> [!IMPORTANT]
> **User Review Required**
> Do you already have an IP Camera installed? If so, does it support RTSP streaming? (You can usually find an RTSP URL in the camera's documentation). If you don't have one yet, any standard IP Camera (like a Reolink, Hikvision, or Amcrest) will work perfectly for this plan.

### Step 1: Create the Camera Worker
- Create a new directory `camera_worker/` with a Python script.
- The script will use `cv2.VideoCapture("rtsp://...")` to read frames.
- It will use a lightweight face detector (like Haar Cascades or a small YOLO model) to ensure a face is present before hitting the API (to save processing power).

### Step 2: Update Docker Compose
- Add a new `camera-worker` service to `docker-compose.yml`.
- It will depend on the `backend` and pass the RTSP URL via environment variables.

### Step 3: Implement Real-time UI Updates (Optional but recommended)
- Update the FastAPI backend to support WebSockets.
- Update the React `CustomerDashboard` to listen to the WebSocket. When the camera worker recognizes someone, the dashboard will instantly pop up their profile with a *DING!* sound, without you needing to refresh the page.

## Open Questions
1. Do you want to proceed with the **Camera Worker (RTSP)** approach?
2. Do you want the React UI to update in real-time (WebSockets) when a customer walks in, or just receive the WhatsApp notification in the background?
