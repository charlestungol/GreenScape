import os
from supabase import create_client, Client

_SUPABASE: Client | None = None

def supabase() -> Client:
    global _SUPABASE
    if _SUPABASE is None:
        _SUPABASE = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    return _SUPABASE

def signed_url(bucket: str, path: str, ttl: int | None = None, *,
               download: bool | str | None = None,
               transform: dict | None = None) -> str:
    """
    Create a short-lived signed URL for a private object.
    Omit 'download' so browsers render inline (no download dialog).
    Optionally pass 'transform' for resized thumbnails.
    """
    ttl = ttl or int(os.getenv("SUPABASE_SIGNED_URL_TTL", "60"))
    options = {}
    if download is not None:
        options["download"] = download  # True or 'filename.ext' forces download
    if transform is not None:
        options["transform"] = transform
    resp = supabase().storage.from_(bucket).create_signed_url(path, ttl, options)
    data = resp.get("data") or {}
    return data.get("signed_url") or data.get("signedUrl") or ""