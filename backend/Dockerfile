FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# System dependencies for OpenCV / InsightFace / onnx
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Render-required port
EXPOSE 10000

# Start FastAPI directly (NO shell script)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
