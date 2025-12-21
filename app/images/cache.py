from app.core.redis import redis_client
from app.utils.blob_service import generate_signed_url

SIGNED_URL_TTL = 55 * 60  # 55 minutes

def get_signed_url_cached(image):
    cache_key = f"signed_url:image:{image.id}"

    cached_url = redis_client.get(cache_key)
    if cached_url:
        return cached_url

    signed_url = generate_signed_url(image.filepath, hours=1)

    redis_client.setex(
        cache_key,
        SIGNED_URL_TTL,
        signed_url
    )

    return signed_url
