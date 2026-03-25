import os, requests

_GOOGLE_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

_SECRET = os.getenv("RECAPTCHA_PRIVATE_KEY")

def verify_recaptcha(token: str, remote_ip: str | None = None) -> tuple[bool, dict]:
    # Check if there is a token
    if not token:
        return False, {"error": "missing-token"}
    
    try:
        resp = requests.post(_GOOGLE_VERIFY_URL, data={"secret": _SECRET, "response": token, "remoteip": remote_ip or ""},
            timeout=5,
        )

        data = resp.json()

        return bool(data.get("success")), data
    except requests.RequestException as e:
        return False, {"error" : "verify-failed", "detail": str(e)}