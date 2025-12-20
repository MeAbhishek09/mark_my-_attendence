FROM python:3.10-slim

# System dependencies for OpenCV / InsightFace / onnx
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# System dependencies (REQUIRED)
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Render-required port
EXPOSE 10000

# Start FastAPI directly (NO shell script)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000", "--workers", "1"]
