# 🎓 AI-Based Attendance Management System (Face Recognition)

This project is a **full-stack AI-powered attendance management system** that uses **face recognition** to mark attendance automatically.  
It is designed for colleges/universities to manage attendance securely, accurately, and efficiently.

---

## 📌 Project Overview

Traditional attendance systems are:
- Time-consuming
- Prone to proxy attendance
- Manual and inefficient

This system solves those problems by using:
- **Machine Learning (Face Recognition)**
- **Real-time camera capture**
- **Session-based attendance**
- **Automated session expiry**
- **Modern web technologies**

Attendance is marked **only when a face is recognized and verified**.

---

## 🧠 How the AI / Machine Learning Works

### 1️⃣ Face Detection
When a camera frame is captured:
- The system first **detects whether a face is present**
- This ensures that only valid images are processed

**Technology used:**
- Face detection via deep learning (CNN-based model)

---

### 2️⃣ Face Embedding (Most Important Part)

A **face embedding** is a numerical representation of a human face.

- Each face is converted into a **fixed-length vector**
- Example:
- Faces of the same person produce **similar embeddings**
- Faces of different people produce **different embeddings**

**This is the backbone of face recognition.**

---

### 3️⃣ ML Model Used for Embeddings

The system uses a **pre-trained deep learning face recognition model**, such as:

- **FaceNet / ArcFace-style CNN**
- Trained on millions of human face images
- Outputs a **128D / 512D embedding vector**

**Why pre-trained model?**
- Training a face model from scratch requires millions of images
- Pre-trained models are accurate and production-ready

---

### 4️⃣ Training Process (Enrollment Phase)

When a student is registered:

1. Multiple face images are captured
2. Each image → converted into an embedding
3. Embeddings are stored in the database
4. Student identity is linked with embeddings

**Important:**
- The model itself is **NOT retrained**
- Only embeddings are generated and stored
- This makes the system **fast and scalable**

---

### 5️⃣ Recognition Process (Attendance Time)

When attendance is being marked:

1. Camera captures a live frame
2. Face is detected
3. Embedding is generated
4. Embedding is compared with stored embeddings
5. Distance is calculated (Cosine / Euclidean)
6. If distance < threshold → **Face Matched**
7. Attendance is marked

**Threshold ensures no false matches**

---

## 🧪 Why Embeddings Instead of Images?

| Images | Embeddings |
|------|-----------|
| Heavy storage | Lightweight vectors |
| Hard to compare | Easy math comparison |
| Privacy risk | More secure |
| Slow | Fast |

---
## 🔥 Face Recognition Model Used

### **InsightFace (ArcFace-based Face Recognition Model)**

---

### What this means

- **InsightFace** is a state-of-the-art face recognition framework  
- It uses **ArcFace loss** for highly discriminative feature learning  
- The backbone network is typically **ResNet** (e.g., ResNet50 / ResNet100)  
- The model generates **512-dimensional face embeddings**

---

## 🏗️ Application Architecture

### Frontend
- **React (Vite)**
- **Tailwind CSS**
- **Webcam integration**
- **Session-based UI**
- **Live camera popup**
- **Auto-refresh attendance list**

### Backend
- **FastAPI / Node.js**
- **REST APIs**
- **Face recognition APIs**
- **Session control logic**
- **CORS-enabled for frontend**

### Database
- Student details
- Face embeddings
- Attendance records
- Session metadata

---

## ⏱️ Session-Based Attendance Logic

Each attendance session includes:
- Department
- Semester
- Subject
- Course name
- **Start Time**
- **Duration**

### Session Expiry Rules
- Session becomes inactive after:
- Session is automatically removed after **12 hours**
- Expired sessions cannot accept attendance

This prevents misuse and late attendance marking.

---

## 🔁 Attendance Workflow

1. Admin/Teacher creates a session
2. Session appears in student dashboard
3. Student joins session
4. Camera opens
5. Face is detected & verified
6. Attendance is marked
7. Session expires automatically

---

## 🔐 Security Features

- No image storage (only embeddings)
- Threshold-based face matching
- Session expiry enforcement
- No manual attendance editing

---

## 🛠️ Tech Stack Used

### Frontend
- React (Vite)
- Tailwind CSS
- JavaScript
- Webcam API

### Backend
- FastAPI / Node.js
- Python
- Torch / TensorFlow
- REST APIs

### Machine Learning
- CNN-based face recognition model
- Face embeddings
- Cosine / Euclidean similarity

---

## 🚀 How to Run the Project Locally

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
cd backend
pip install -r requirements.txt
python main.py

###Backend runs on:

http://localhost:5000

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev


Frontend runs on:

http://localhost:5173


