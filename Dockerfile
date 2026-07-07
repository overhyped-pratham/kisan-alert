# =============================================
# Dockerfile — ArogyaKrishi (KrishiSaar AI)
# Two-stage build: React SPA + Flask backend
# =============================================

# --- Stage 1: Build React SPA ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python backend ---
FROM python:3.11-slim
WORKDIR /app

# System deps (psycopg2 needs libpq, torch needs libgomp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

# Copy compiled React SPA from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create runtime directories
RUN mkdir -p uploads instance

# Environment defaults (override via Cloud Run env vars)
ENV FLASK_ENV=production \
    KERAS_BACKEND=jax \
    PORT=8080

EXPOSE 8080

# Use gunicorn in production
CMD exec gunicorn "app:create_app()" \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --threads 4 \
    --timeout 180 \
    --preload
