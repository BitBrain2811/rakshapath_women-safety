from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.sms import send_sms

router = APIRouter()

class SOSAlertPayload(BaseModel):
    phone_number: str
    latitude: float
    longitude: float
    contacts: List[str]

@router.post("/sos")
def trigger_sos_alert(payload: SOSAlertPayload):
    phone = payload.phone_number.strip()
    lat = payload.latitude
    lon = payload.longitude
    contacts = payload.contacts

    if not contacts:
         raise HTTPException(status_code=400, detail="No emergency contacts provided to alert.")

    # Format the safety alert message
    maps_url = f"https://maps.google.com/?q={lat},{lon}"
    sender_info = f" from {phone}" if phone else ""
    message = f"🚨 [RAKSHAPATH SOS] EMERGENCY! I feel unsafe{sender_info}. Track/help me at: {maps_url}"

    sent_count = 0
    failed_contacts = []

    for contact in contacts:
        contact_clean = contact.strip()
        if not contact_clean:
            continue
        
        # Normalize and clean phone numbers (especially Indian standard numbers)
        clean_digits = "".join(filter(str.isdigit, contact_clean))
        if not contact_clean.startswith("+"):
            if len(clean_digits) == 10:
                contact_clean = f"+91{clean_digits}"
            elif len(clean_digits) == 12 and clean_digits.startswith("91"):
                contact_clean = f"+{clean_digits}"
        
        # Send SMS using the refactored send_sms helper
        success = send_sms(contact_clean, message)
        if success:
            sent_count += 1
        else:
            failed_contacts.append(contact_clean)

    return {
        "status": "success" if sent_count > 0 else "failed",
        "message": f"SOS alerts dispatched to {sent_count} of {len(contacts)} contacts.",
        "sent_count": sent_count,
        "failed_contacts": failed_contacts
    }
