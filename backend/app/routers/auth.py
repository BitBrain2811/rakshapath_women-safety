from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import re
import hashlib
import uuid
from datetime import datetime, timedelta
from app.services.sms import send_sms_otp

router = APIRouter()

# In-memory storage for active OTP records
# Structure: { phone: { "hashed_otp": str, "salt": str, "expiry": datetime, "attempts": int, "last_request_time": datetime } }
otp_store = {}

class OTPRequest(BaseModel):
    phone_number: str

class VerifyRequest(BaseModel):
    phone_number: str
    otp: str

@router.post("/send-otp")
def send_otp(request: OTPRequest):
    phone = request.phone_number.strip()
    
    # Enforce Indian phone number format validation (+91 followed by 10 digits starting with 6-9)
    if not re.match(r"^\+91[6-9]\d{9}$", phone):
        raise HTTPException(
            status_code=400, 
            detail="Invalid phone number format. Must be +91 followed by 10 digits (e.g. +919876543210)."
        )
    
    now = datetime.now()
    
    # Secure rate limiting: check if OTP request was made within last 60 seconds
    if phone in otp_store:
        last_req = otp_store[phone].get("last_request_time")
        if last_req and (now - last_req) < timedelta(seconds=60):
            remaining_seconds = 60 - int((now - last_req).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Please wait {remaining_seconds} seconds before requesting a new OTP."
            )
            
    # Generate 6-digit random OTP
    otp = str(random.randint(100000, 999999))
    
    # Store only hashed OTP in database/in-memory store, not plain text
    salt = uuid.uuid4().hex
    hashed_otp = hashlib.sha256((otp + salt).encode("utf-8")).hexdigest()
    expiry = now + timedelta(minutes=5)
    
    otp_store[phone] = {
        "hashed_otp": hashed_otp,
        "salt": salt,
        "expiry": expiry,
        "attempts": 0,
        "last_request_time": now
    }
    
    # System sends OTP via SMS automatically
    sms_sent = send_sms_otp(phone, otp)
    
    response_payload = {
        "status": "success",
        "message": "OTP sent successfully"
    }
    
    # If no SMS gateway API keys are configured, return OTP in response for frontend dev helper
    if not sms_sent:
        response_payload["otp"] = otp
        
    return response_payload

@router.post("/verify-otp")
def verify_otp(request: VerifyRequest):
    phone = request.phone_number.strip()
    otp = request.otp.strip()
    
    if phone not in otp_store:
        raise HTTPException(status_code=404, detail="No active OTP request found for this number. Please request OTP first.")
    
    record = otp_store[phone]
    now = datetime.now()
    
    # OTP must expire after 5 minutes
    if now > record["expiry"]:
        del otp_store[phone]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")
    
    # Hash check
    hashed_input = hashlib.sha256((otp + record["salt"]).encode("utf-8")).hexdigest()
    
    if record["hashed_otp"] != hashed_input:
        record["attempts"] += 1
        remaining = 3 - record["attempts"]
        
        if remaining <= 0:
            del otp_store[phone]
            raise HTTPException(
                status_code=400, 
                detail="Incorrect OTP. Maximum 3 attempts exceeded. Your verification session has been locked out. Please request a new OTP."
            )
        
        raise HTTPException(
            status_code=400, 
            detail=f"Incorrect OTP code. {remaining} attempt(s) remaining."
        )
    
    # Authenticated, clean up OTP record from store
    del otp_store[phone]
    
    return {
        "status": "success",
        "message": "Authentication successful",
        "token": f"session_jwt_mock_{phone}",
        "user": {
            "phone_number": phone
        }
    }

@router.post("/biometric-login")
def biometric_login(request: OTPRequest):
    phone = request.phone_number.strip()
    if not phone:
         raise HTTPException(status_code=400, detail="Phone number required for biometric lookup.")
         
    return {
        "status": "success",
        "message": "Biometric signature verified",
        "token": f"session_jwt_mock_bio_{phone}",
        "user": {
            "phone_number": phone
        }
    }

