from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, Base, get_db
from models import Customer, Visit
from face_service import extract_face_embedding
import numpy as np
from datetime import datetime
import os
import uuid

# Ensure images directory exists
os.makedirs("images", exist_ok=True)


app = FastAPI(title="Gold Shop Face ID System")

# WebSocket Manager for Real-Time Updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from client right now, just keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Serve static images
app.mount("/images", StaticFiles(directory="images"), name="images")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SIMILARITY_THRESHOLD = 0.6 # Adjust based on testing (lower means stricter match for cosine distance)

@app.post("/recognize")
async def recognize_customer(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        embedding = extract_face_embedding(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Search for nearest neighbor using pgvector cosine distance (<=>)
    # The `<=>` operator computes cosine distance, which is 1 - cosine_similarity.
    # We want a distance smaller than SIMILARITY_THRESHOLD.
    query = db.query(Customer).order_by(Customer.embedding.cosine_distance(embedding)).first()
    
    # We need to explicitly calculate the distance to check threshold
    if query:
        distance_query = db.query(Customer.embedding.cosine_distance(embedding).label("distance")).filter(Customer.id == query.id).first()
        distance = distance_query.distance
        
        if distance < SIMILARITY_THRESHOLD:
            # Customer found! Update visit count and last visit
            query.visit_count += 1
            query.last_visit = datetime.utcnow()
            db.commit()
            
            # Save image
            filename = f"{uuid.uuid4()}.jpg"
            file_path = os.path.join("images", filename)
            with open(file_path, "wb") as f:
                f.write(contents)
                
            # Log the visit
            new_visit = Visit(customer_id=query.id, image_path=f"/images/{filename}")
            db.add(new_visit)
            db.commit()
            
            # TODO: Send WhatsApp notification (placeholder)
            print(f"NOTIFICATION: Returning Customer '{query.name}' detected! Visit #{query.visit_count}")
            
            response_data = {
                "status": "recognized",
                "customer": {
                    "id": query.id,
                    "name": query.name,
                    "details": query.details,
                    "phone": query.phone,
                    "address": query.address,
                    "visit_count": query.visit_count,
                    "last_visit": query.last_visit.isoformat() if query.last_visit else None
                },
                "image_url": f"/images/{filename}"
            }
            
            # Broadcast to UI
            await manager.broadcast(response_data)
            
            return response_data
            
    # Not found or distance too high
    # Save the unrecognized image so the UI can use it for registration
    unrecognized_filename = f"unrecognized_{uuid.uuid4()}.jpg"
    unrecognized_path = os.path.join("images", unrecognized_filename)
    with open(unrecognized_path, "wb") as f:
        f.write(contents)
        
    response_data = {
        "status": "unrecognized", 
        "message": "Customer not found. Please register.",
        "image_url": f"/images/{unrecognized_filename}"
    }
    await manager.broadcast(response_data)
    return response_data

@app.post("/register")
async def register_customer(
    name: str = Form(...),
    details: str = Form(None),
    phone: str = Form(None),
    address: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        embedding = extract_face_embedding(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    new_customer = Customer(
        name=name,
        details=details,
        phone=phone,
        address=address,
        embedding=embedding
    )
    
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    # Save image
    filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join("images", filename)
    with open(file_path, "wb") as f:
        f.write(contents)
        
    # Log initial visit
    new_visit = Visit(customer_id=new_customer.id, image_path=f"/images/{filename}")
    db.add(new_visit)
    db.commit()
    
    # TODO: Send WhatsApp notification (placeholder)
    print(f"NOTIFICATION: New Customer '{name}' registered!")
    
    return {
        "status": "success",
        "customer": {
            "id": new_customer.id,
            "name": new_customer.name,
            "details": new_customer.details,
            "phone": new_customer.phone,
            "address": new_customer.address,
            "visit_count": new_customer.visit_count,
            "last_visit": new_customer.last_visit
        }
    }

@app.get("/customers")
def get_customers(db: Session = Depends(get_db), limit: int = 50):
    customers = db.query(Customer).order_by(Customer.last_visit.desc()).limit(limit).all()
    return [{"id": c.id, "name": c.name, "phone": c.phone, "address": c.address, "visit_count": c.visit_count, "last_visit": c.last_visit} for c in customers]

@app.get("/customers/{customer_id}/history")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    visits = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.timestamp.desc()).all()
    return [{"id": v.id, "timestamp": v.timestamp, "purchase_details": v.purchase_details, "image_path": v.image_path} for v in visits]

@app.get("/visits")
def get_all_visits(db: Session = Depends(get_db), skip: int = 0, limit: int = 10):
    total = db.query(Visit).count()
    visits = db.query(Visit).order_by(Visit.timestamp.desc()).offset(skip).limit(limit).all()
    
    result = []
    for v in visits:
        result.append({
            "id": v.id,
            "timestamp": v.timestamp,
            "purchase_details": v.purchase_details,
            "image_path": v.image_path,
            "customer": {
                "id": v.customer.id,
                "name": v.customer.name,
                "visit_count": v.customer.visit_count
            } if v.customer else None
        })
    
    return {
        "total": total,
        "items": result
    }

from pydantic import BaseModel
class PurchaseRequest(BaseModel):
    purchase_details: str

@app.post("/customers/{customer_id}/purchase")
def add_purchase(customer_id: int, req: PurchaseRequest, db: Session = Depends(get_db)):
    # Find the most recent visit
    latest_visit = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.timestamp.desc()).first()
    
    if latest_visit:
        # Append or set purchase details
        if latest_visit.purchase_details:
            latest_visit.purchase_details += f" | {req.purchase_details}"
        else:
            latest_visit.purchase_details = req.purchase_details
        db.commit()
        return {"status": "success", "message": "Purchase added to current visit"}
    else:
        # Create a new visit if none exist
        new_visit = Visit(customer_id=customer_id, purchase_details=req.purchase_details)
        db.add(new_visit)
        db.commit()
        return {"status": "success", "message": "Purchase logged with new visit"}

@app.post("/visits/{visit_id}/purchase")
def update_visit_purchase(visit_id: int, req: PurchaseRequest, db: Session = Depends(get_db)):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    visit.purchase_details = req.purchase_details
    db.commit()
    return {"status": "success", "message": "Purchase details updated"}
