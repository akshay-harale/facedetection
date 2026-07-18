from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, Base, get_db
from models import Customer
from face_service import extract_face_embedding
import numpy as np
from datetime import datetime

# Create tables and vector extension if they don't exist
def init_db():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

init_db()

app = FastAPI(title="Gold Shop Face ID System")

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
            
            # TODO: Send WhatsApp notification (placeholder)
            print(f"NOTIFICATION: Returning Customer '{query.name}' detected! Visit #{query.visit_count}")
            
            return {
                "status": "recognized",
                "customer": {
                    "id": query.id,
                    "name": query.name,
                    "details": query.details,
                    "visit_count": query.visit_count,
                    "last_visit": query.last_visit
                }
            }
            
    # Not found or distance too high
    return {"status": "unrecognized", "message": "Customer not found. Please register."}

@app.post("/register")
async def register_customer(
    name: str = Form(...),
    details: str = Form(None),
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
        embedding=embedding
    )
    
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    # TODO: Send WhatsApp notification (placeholder)
    print(f"NOTIFICATION: New Customer '{name}' registered!")
    
    return {
        "status": "success",
        "customer": {
            "id": new_customer.id,
            "name": new_customer.name,
            "details": new_customer.details,
            "visit_count": new_customer.visit_count,
            "last_visit": new_customer.last_visit
        }
    }

@app.get("/customers")
def get_customers(db: Session = Depends(get_db), limit: int = 50):
    customers = db.query(Customer).order_by(Customer.last_visit.desc()).limit(limit).all()
    return [{"id": c.id, "name": c.name, "visit_count": c.visit_count, "last_visit": c.last_visit} for c in customers]
