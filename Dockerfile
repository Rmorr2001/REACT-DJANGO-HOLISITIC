# Build stage for React frontend
FROM node:20-slim as frontend-build
WORKDIR /app/frontend
# Copy package files
COPY simulation/frontend/package.json simulation/frontend/package-lock.json* ./
# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps
# Copy frontend source
COPY simulation/frontend/ ./
# Debug - list directories and files
RUN echo "Checking components directory:" && ls -la /app/frontend/src/components
RUN echo "Checking Gemini directory:" && ls -la /app/frontend/src/components/Gemini
RUN cat /app/frontend/src/components/app.js | head -20
# Build frontend
RUN npm run build

# Main application stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY simulation/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY simulation/ .

# Create staticfiles directory
RUN mkdir -p staticfiles

# Copy built frontend files from frontend-build stage
COPY --from=frontend-build /app/frontend/static/frontend ./frontend/static/frontend

# Collect static files
RUN python manage.py collectstatic --noinput

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=simulation_core.settings

# Create start script that uses PORT environment variable
RUN echo '#!/bin/bash\n\
python manage.py migrate\n\
python manage.py runserver 0.0.0.0:${PORT:-8080}\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start command
CMD ["/app/start.sh"]