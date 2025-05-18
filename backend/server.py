import os
import base64
import numpy as np
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Conv2D, MaxPooling2D, Flatten, Dropout
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Potato Chip Defect Detector")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to MongoDB using the environment variable
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017/")
db_name = os.environ.get("DB_NAME", "potato_chip_detector")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
collection = db["chip_images"]

# Define model architecture
def create_model():
    model = Sequential([
        # First Convolutional Layer
        Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)),
        MaxPooling2D(2, 2),
        
        # Second Convolutional Layer
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        
        # Third Convolutional Layer
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D(2, 2),
        
        # Flatten the output and feed it into dense layers
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),  # Add dropout to prevent overfitting
        
        # Output layer with sigmoid activation for binary classification
        Dense(1, activation='sigmoid')
    ])
    
    # Compile the model
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# Initialize model
model = create_model()

# Pydantic models for request and response
class PredictionResult(BaseModel):
    id: str
    image_b64: str
    is_defective: bool
    confidence: float
    timestamp: str

class PredictionHistory(BaseModel):
    results: List[PredictionResult]

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/predict", response_model=PredictionResult)
async def predict_image(file: UploadFile = File(...)):
    # Check if the file is an image
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a JPEG or PNG image.")
    
    try:
        # Read and process the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Resize and preprocess for the model
        image = image.resize((150, 150))
        img_array = np.array(image) / 255.0  # Normalize pixel values
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        
        # Make prediction
        prediction = model.predict(img_array)[0][0]
        is_defective = bool(prediction > 0.5)
        confidence = float(prediction if is_defective else 1 - prediction)
        
        # Convert image to base64 for storage and display
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Generate unique ID
        unique_id = str(uuid.uuid4())
        
        # Store result in MongoDB
        result = {
            "id": unique_id,
            "image_b64": img_str,
            "is_defective": is_defective,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
        await collection.insert_one(result)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/api/history", response_model=PredictionHistory)
async def get_history():
    # Fetch the most recent results from MongoDB
    cursor = collection.find().sort("timestamp", -1).limit(50)
    results = await cursor.to_list(length=50)
    
    # Convert MongoDB _id to string and ensure consistent id field
    for result in results:
        # Use existing id field if available, otherwise use _id
        if 'id' not in result:
            result["id"] = str(result.get("_id"))
        
        # Remove MongoDB _id to avoid serialization issues
        if '_id' in result:
            del result["_id"]
    
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
