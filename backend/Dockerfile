FROM python:3.10-slim

WORKDIR /app

# Install system dependencies required for OpenCV, InsightFace, and PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download insightface models during build to avoid runtime delays
RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis(name='buffalo_l')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
