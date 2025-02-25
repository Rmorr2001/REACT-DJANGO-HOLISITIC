# Build stage for React frontend
FROM node:20-slim as frontend-build
WORKDIR /app/frontend

# Copy package files
COPY simulation/frontend/package.json simulation/frontend/package-lock.json* ./

# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# IMPORTANT: First verify the source directory structure before copying
RUN mkdir -p ./src/components/Gemini

# Copy the entire frontend with explicit handling of important directories
COPY simulation/frontend/ ./

# Verify the Gemini directory and files exist after copying
RUN ls -la ./src/components/Gemini/ || echo "⚠️ Gemini directory or files are missing after copy!"

# If needed, explicitly copy Gemini files to ensure they exist
# This is a fallback in case the main copy operation doesn't work properly
COPY simulation/frontend/src/components/Gemini/ ./src/components/Gemini/

# Verify again after explicit copy
RUN echo "Contents of Gemini directory after explicit copy:" && \
    ls -la ./src/components/Gemini/

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