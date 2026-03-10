# core/management/validators.py
import re
from rest_framework import serializers
from django.utils import timezone
from datetime import date, datetime


# ---------------------------
# POSTAL CODE (Canadian)
# ---------------------------
POSTAL_REGEX = re.compile(r"^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$")

def validate_postal_code(value: str) -> str:
    if not isinstance(value, str):
        raise serializers.ValidationError("Postal code must be a string.")
    cleaned = value.strip().upper().replace(" ", "")
    if not POSTAL_REGEX.match(cleaned):
        raise serializers.ValidationError("Invalid Canadian postal code format (e.g., T2P 1A1).")
    return cleaned

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

# ---------------------------
# PHONE NUMBER (10 digits)
# ---------------------------
def validate_phone(value: str) -> str:
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if len(digits) != 10:
        raise serializers.ValidationError("Phone number must contain exactly 10 digits.")
    return digits

# ---------------------------
# HUMAN NAME
# ---------------------------
NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ'\- ]{1,40}$")

def validate_name(value: str) -> str:
    if not isinstance(value, str):
        raise serializers.ValidationError("Name must be a string.")
    cleaned = value.strip()
    if not NAME_REGEX.match(cleaned):
        raise serializers.ValidationError("Invalid name format.")
    return cleaned

# ---------------------------
# MONEY
# ---------------------------
def validate_amount(value):
    try:
        v = float(value)
    except Exception:
        raise serializers.ValidationError("Amount must be numeric.")
    if v < 0:
        raise serializers.ValidationError("Amount cannot be negative.")
    return value

# ---------------------------
# TIME NOT IN PAST (generic)
# NOTE: you likely want *date* and *time* versions (see section below).
# ---------------------------
def validate_not_past(value):
    if value < timezone.now():
        raise serializers.ValidationError("Cannot schedule a date/time in the past.")
    return value

# ---------------------------
# STRING CLEANUP
# ---------------------------
def strip_string(value):
    if not isinstance(value, str):
        raise serializers.ValidationError("Expected a string.")
    cleaned = value.strip()
    if cleaned == "":
        raise serializers.ValidationError("Value cannot be empty.")
    return cleaned

# ---------------------------
# STRING MAX LENGTH
# ---------------------------
def validate_max_length(max_len: int):
    def inner(value: str) -> str:
        if not isinstance(value, str):
            raise serializers.ValidationError("Value must be a string.")
        if len(value) > max_len:
            raise serializers.ValidationError(f"Value exceeds maximum length of {max_len}.")
        return value
    return inner

# ---------------------------
# CONTROL CHARACTERS (SAFE)
# ---------------------------
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

def _walk_values(value, fn):
    if isinstance(value, str):
        fn(value)
    elif isinstance(value, dict):
        for v in value.values():
            _walk_values(v, fn)
    elif isinstance(value, (list, tuple, set)):
        for v in value:
            _walk_values(v, fn)
    else:
        return

def prevent_control_characters(value):
    def check(v: str):
        if _CONTROL_CHARS_RE.search(v):
            raise serializers.ValidationError("Contains disallowed control characters.")
    _walk_values(value, check)
    return value

# ---------------------------
# BASIC SQL TOKEN CHECK (optional; conservative)
# ---------------------------
_SQL_TOKEN_RE = re.compile(
    r"(--|/\*|\*/|;|\b(ALTER|DROP|INSERT|DELETE|UPDATE|EXEC|UNION|SELECT)\b)",
    re.IGNORECASE
)

def prevent_basic_sql_injection(value):
    def check(v: str):
        if _SQL_TOKEN_RE.search(v):
            raise serializers.ValidationError("Suspicious input detected.")
    _walk_values(value, check)
    return value

# ---------------------------
# Check that a date/time/year is not in the past (relative to current date/time).
# ---------------------------

def validate_not_past_date(value):
    if not isinstance(value, (date,)):
        raise serializers.ValidationError("Expected a date.")
    if value < timezone.localdate():
        raise serializers.ValidationError("Date cannot be in the past.")
    return value

def validate_not_past_time(value):
    # Only meaningful if combined with a date; otherwise allow
    if not isinstance(value, (datetime.time,)):
        return value
    return value

def validate_not_past_year(value):
    try:
        year = int(value)
    except Exception:
        raise serializers.ValidationError("Year must be an integer.")
    if year < timezone.now().year:
        raise serializers.ValidationError("Year cannot be in the past.")
    return value
