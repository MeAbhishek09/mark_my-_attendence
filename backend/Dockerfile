FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# system deps for OpenCV/onnx etc — add as needed
RUN apt-get update && apt-get install -y build-essential git ffmpeg libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . /app
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

CMD ["/app/docker-entrypoint.sh"]
