from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.safety_engine import compute_safety_score
from datetime import datetime

router = APIRouter()

# In-memory storage for last known locations
# Format: { phone_number: { lat: float, lon: float, timestamp: str } }
last_location_store = {}

class LocationPayload(BaseModel):
    phone_number: str
    lat: float
    lon: float

@router.get("/score")
def safety_score(lat: float, lon: float, hour: int):
    score, level, explanation = compute_safety_score(lat, lon, hour)

    return {
        "location": {"lat": lat, "lon": lon},
        "safety_score": score,
        "risk_level": level,
        "factors": explanation
    }

@router.post("/last-location")
def update_last_location(payload: LocationPayload):
    phone = payload.phone_number.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")
        
    last_location_store[phone] = {
        "lat": payload.lat,
        "lon": payload.lon,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    return {
        "status": "success",
        "message": "Last location stored securely",
        "data": last_location_store[phone]
    }

@router.get("/last-location")
def get_last_location(phone_number: str):
    phone = phone_number.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")
        
    if phone not in last_location_store:
        raise HTTPException(status_code=404, detail="No location history found for this phone number.")
        
    return {
        "status": "success",
        "phone_number": phone,
        "last_location": last_location_store[phone]
    }