# Gold Shop Customer Identification System

This document outlines the architecture, tech stack, and step-by-step plan for building a highly accurate facial recognition system for tracking customer visits, designed specifically for a gold shop environment.

## Goal Description

The shop owner wants to capture customer photos upon entry, register new customers, and automatically identify revisiting customers. Upon identification, the system should notify the owner via WhatsApp with the customer's details and visit history. The system must be highly accurate, utilizing Gen AI / Computer Vision, built with a Python backend and ReactJS frontend, and deployed via Docker Compose.

> [!IMPORTANT]
> **User Review Required**
> Please review the proposed AI models, database choices, and WhatsApp API integration. Specifically, confirm if you prefer a fully local AI model for privacy, or a cloud-based API for maximum accuracy out-of-the-box.

## Open Questions

1. **AI / Facial Recognition Model**: Do you prefer to use a local, open-source model (like `DeepFace` or `InsightFace`) to keep all customer data strictly on-premise, or a cloud service (like AWS Rekognition) for potentially higher accuracy and less local compute requirement? (I propose a local open-source approach first using `InsightFace` which is highly accurate and free).
2. **WhatsApp Integration**: Do you already have a Meta WhatsApp Business account, or would you prefer using a service like Twilio for easier integration?
3. **Camera Integration**: Will the photos be uploaded manually via the React Web App, or is there an IP Camera (RTSP stream) that the backend should connect to automatically? (The plan assumes manual/webcam capture via the React app for now).

## Tech Stack & Architecture

### Frontend (User Interface)
* **Framework**: ReactJS (bootstrapped with Vite for speed).
* **Styling**: Modern Vanilla CSS (following rich aesthetics, glassmorphism, dynamic animations) to give a premium feel suitable for a gold shop.
* **Features**: Webcam integration for capturing photos, dashboard to view customer details, visit logs, and recent notifications.

### Backend (API & Processing)
* **Framework**: Python with FastAPI (high performance, great for async operations and AI workloads).
* **AI/CV Models**: 
  * `InsightFace` or `face_recognition` library for highly accurate face detection and embedding generation.
  * LLM Integration (Gen AI): Optional integration with a lightweight LLM (like Llama 3 via Ollama or an API) to generate personalized welcome messages or insights based on customer purchase history.
* **Database**: 
  * PostgreSQL with `pgvector` extension. `pgvector` allows us to store the facial embeddings directly in Postgres and perform extremely fast similarity searches to see if a face matches an existing customer.
* **Notifications**: Meta WhatsApp Business API or Twilio API.

### Deployment & Infrastructure
* **Containerization**: Docker and Docker Compose.
* **Services in Docker Compose**:
  1. `frontend`: Nginx serving the React app.
  2. `backend`: FastAPI Python server.
  3. `db`: PostgreSQL database with pgvector.

## Proposed Implementation Steps

### Phase 1: Foundation & Setup
- Initialize the ReactJS frontend using Vite.
- Initialize the Python FastAPI backend.
- Create `docker-compose.yml` defining the `frontend`, `backend`, and `db` (Postgres + pgvector) services.

### Phase 2: Database & AI Integration
- Set up SQLAlchemy models in Python for `Customer` and `Visit` records.
- Implement face detection and embedding extraction using `InsightFace`.
- Implement vector search functionality to compare a new photo's embedding against stored embeddings in the database to detect returning customers.

### Phase 3: API & Web App Development
- **Backend APIs**:
  - `POST /recognize`: Receives an image, extracts the face, searches the DB. If found, logs a visit and returns customer info. If not, prompts for registration.
  - `POST /register`: Saves a new customer's details and face embedding.
  - `GET /customers`: Lists customer history.
- **Frontend UI**:
  - Dashboard with live webcam feed or image upload.
  - Premium UI components for displaying customer profiles when recognized.
  - Forms for registering new customers.

### Phase 4: WhatsApp Integration
- Integrate Twilio or Meta API in the backend.
- Trigger an async task to send a WhatsApp message to the shop owner whenever a customer is recognized or registered.

### Phase 5: Polish & Deployment
- Apply premium CSS styling and micro-animations to the React app.
- Finalize Dockerfiles and ensure `docker-compose up` brings up the entire system seamlessly.

## Verification Plan

### Automated Tests
- Python unit tests for the embedding generation and vector search logic to ensure accuracy thresholds are met.
- API tests to verify the `/recognize` and `/register` endpoints.

### Manual Verification
- Run `docker-compose up`.
- Capture a face through the web app (simulate first visit). Verify the user is prompted to register.
- Register the user.
- Capture the same face again. Verify the system identifies the user accurately and logs a repeat visit.
- Check WhatsApp to confirm the notification was received.
