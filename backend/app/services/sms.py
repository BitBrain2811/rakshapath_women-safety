import os
import urllib.request
import urllib.parse
import json
import base64

# Manual zero-dependency .env file loader
for parent in ["..", "../.."]:
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), parent, ".env"))
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")

# Load environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY")

MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")


def send_sms_otp(phone_number: str, otp: str) -> bool:
    """
    Sends an OTP to the given Indian phone number (format +91XXXXXXXXXX) using one of the SMS gateways.
    If no credentials are configured, logs the OTP to the console and returns True (dev fallback).
    """
    message = f"Your RakshaPath verification code is: {otp}. Valid for 5 minutes. Do not share this OTP."
    print(f"\n--- SMS GATEWAY ATTEMPT ---")
    print(f"To: {phone_number}")
    print(f"Message: {message}")

    # 1. Try Twilio
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        print("Using Twilio Gateway...")
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            data = urllib.parse.urlencode({
                "To": phone_number,
                "From": TWILIO_PHONE_NUMBER,
                "Body": message
            }).encode("utf-8")
            
            req = urllib.request.Request(url, data=data, method="POST")
            auth_str = f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}"
            auth_b64 = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
            req.add_header("Authorization", f"Basic {auth_b64}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                if "sid" in res_json:
                    print(f"Twilio SMS sent successfully. SID: {res_json['sid']}")
                    return True
                else:
                    print(f"Twilio error response: {res_json}")
        except Exception as e:
            print(f"Twilio gateway error: {e}")

    # 2. Try Fast2SMS
    elif FAST2SMS_API_KEY:
        print("Using Fast2SMS Gateway...")
        try:
            # Fast2SMS requires 10 digit number (without +91)
            raw_phone = phone_number.replace("+91", "").strip()
            
            # Formulate query params for GET request matching user's spec
            params = urllib.parse.urlencode({
                "authorization": FAST2SMS_API_KEY,
                "route": "otp",
                "variables_values": otp,
                "numbers": raw_phone
            })
            url = f"https://www.fast2sms.com/dev/bulkV2?{params}"
            
            req = urllib.request.Request(url, method="GET")
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                if res_json.get("return") is True:
                    print("Fast2SMS message sent successfully via GET.")
                    return True
                else:
                    print(f"Fast2SMS error response: {res_json}")
        except Exception as e:
            print(f"Fast2SMS gateway error: {e}")

    # 3. Try MSG91
    elif MSG91_AUTH_KEY:
        print("Using MSG91 Gateway...")
        try:
            url = "https://api.msg91.com/api/v5/otp"
            # MSG91 expects phone with country code (e.g. 91XXXXXXXXXX) without +
            clean_phone = phone_number.replace("+", "").strip()
            
            payload = {
                "template_id": MSG91_TEMPLATE_ID or "default_template",
                "mobile": clean_phone,
                "otp": otp
            }
            
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                method="POST"
            )
            req.add_header("authkey", MSG91_AUTH_KEY)
            req.add_header("Content-Type", "application/json")
            
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                res_json = json.loads(res_body)
                if res_json.get("type") == "success":
                    print("MSG91 OTP sent successfully.")
                    return True
                else:
                    print(f"MSG91 error response: {res_json}")
        except Exception as e:
            print(f"MSG91 gateway error: {e}")

    else:
        print("[WARNING] No SMS gateway credentials configured (missing Twilio, Fast2SMS, or MSG91 keys).")
        print(f"[DEV FALLBACK] OTP Code: {otp} (Use this code on the UI to test)")
    
    print("-----------------------------\n")
    return False
