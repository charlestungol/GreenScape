import os, requests
import logging

logger = logging.getLogger(__name__)

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

        logger.error("RECAPTCHA SECRET PRESENT: %s", bool(_SECRET))
        logger.error("RECAPTCHA TOKEN PRESENT: %s", bool(token))
        logger.error("RECAPTCHA GOOGLE RESPONSE: %s", data)

        return bool(data.get("success")), data
    except requests.RequestException as e:
        return False, {"error" : "verify-failed", "detail": str(e)}