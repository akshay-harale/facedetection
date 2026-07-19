from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    details = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    embedding = Column(Vector(512)) # InsightFace buffalo_l produces 512-dim vectors
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    visit_count = Column(Integer, default=1)
    last_visit = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    visits = relationship("Visit", back_populates="customer")

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    purchase_details = Column(String, nullable=True)
    image_path = Column(String, nullable=True)

    customer = relationship("Customer", back_populates="visits")
