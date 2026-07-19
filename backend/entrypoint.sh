#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
sleep 2

echo "Running Alembic migrations..."
alembic upgrade head

echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
