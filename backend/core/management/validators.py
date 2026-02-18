# core/validators.py
import re
from rest_framework import serializers

# -----------------------------------------------------
# Address validators: postal code and province code
# -----------------------------------------------------

# ---------------------------
# POSTAL CODE (Canadian)
# ---------------------------
POSTAL_REGEX = re.compile(r"^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$")

def validate_postal_code(value: str) -> str:
    """
    Validate Canadian postal code (e.g., T2P 1A1).
    Accepts uppercase/lowercase, allows optional space.
    """
    if not isinstance(value, str):
        raise serializers.ValidationError("Postal code must be a string.")
    
    cleaned = value.strip().upper().replace(" ", "")
    if not POSTAL_REGEX.match(cleaned):
        raise serializers.ValidationError("Invalid Canadian postal code format (e.g., T2P 1A1).")
    return cleaned  # Save normalized version


# ---------------------------
# PROVINCE CODE
# ---------------------------
PROVINCES = {
    "AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"
}

def validate_province(value: str) -> str:
    if not isinstance(value, str):
        raise serializers.ValidationError("Province must be a string.")
    cleaned = value.strip().upper()
    if cleaned not in PROVINCES:
        raise serializers.ValidationError(f"Province must be one of: {', '.join(sorted(PROVINCES))}")
    return cleaned

# -----------------------------------------------------
# User input validators: names and phone numbers
# -----------------------------------------------------

# ---------------------------
# PHONE NUMBER (10 digits)
# ---------------------------
def validate_phone(value: str) -> str:
    """
    Strip non-digit characters and enforce 10-digit format.
    Employee.phone_number must be exactly 10 digits based on DB schema.
    """
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if len(digits) != 10:
        raise serializers.ValidationError("Phone number must contain exactly 10 digits.")
    return digits


# ---------------------------
# HUMAN NAME VALIDATION
# ---------------------------
NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ'\- ]{1,40}$")

def validate_name(value: str) -> str:
    """
    Validate human names. Allows accented letters, spaces, apostrophes, and hyphens.
    Prevents emojis and special symbols.
    """
    if not isinstance(value, str):
        raise serializers.ValidationError("Name must be a string.")
    cleaned = value.strip()
    if not NAME_REGEX.match(cleaned):
        raise serializers.ValidationError("Invalid name format.")
    return cleaned


# -------------------------------
# MONEY VALIDATION
# -------------------------------
def validate_amount(value):
    try:
        v = float(value)
    except:
        raise serializers.ValidationError("Amount must be numeric.")
    if v < 0:
        raise serializers.ValidationError("Amount cannot be negative.")
    return value


# -------------------------------
# TIMESTAMP VALIDATION
# -------------------------------
def validate_not_past(value):
    """Ensure booking or schedule times are not in the past."""
    from django.utils import timezone
    if value < timezone.now():
        raise serializers.ValidationError("Cannot schedule a date/time in the past.")
    return value

# -----------------------------------------------------
# GENERAL VALIDATORS
# -----------------------------------------------------

# ---------------------------
# STRING CLEANUP - remove invisible unicode, trim whitespace, and ensure not empty.
# ---------------------------
def strip_string(value):
    """Remove invisible unicode, trim whitespace."""
    if not isinstance(value, str):
        raise serializers.ValidationError("Expected a string.")
    cleaned = value.strip()
    if cleaned == "":
        raise serializers.ValidationError("Value cannot be empty.")
    return cleaned

# ---------------------------
# CONTROL CHARACTERS - block invisible control chars, emojis, invalid unicode.
# ---------------------------
def prevent_control_characters(value):
    """Block invisible control chars, emojis, invalid unicode."""
    bad = re.compile(r"[\u0000-\u001F\u007F]")
    if bad.search(value):
        raise serializers.ValidationError("Value contains invalid control characters.")
    return value


# ---------------------------
# GENERAL STRING LENGTH
# ---------------------------
def validate_max_length(max_len: int):
    """
    Returns a validator function that enforces a string max length.
    """
    def inner(value: str) -> str:
        if not isinstance(value, str):
            raise serializers.ValidationError("Value must be a string.")
        if len(value) > max_len:
            raise serializers.ValidationError(f"Value exceeds maximum length of {max_len}.")
        return value
    return inner