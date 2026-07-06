import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def get_static_map_url(location: str, zoom: int = 12, size: str = "600x400") -> str:
    """
    Generates a Google Maps Static API URL for the given location.
    Requires billing enabled on the Google Cloud project.
    """
    if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "your_google_maps_api_key":
        # Return a placeholder map image if no API key
        encoded_loc = urllib.parse.quote(location)
        return f"https://placehold.co/{size}?text=Map+of+{encoded_loc}"
        
    encoded_loc = urllib.parse.quote(location)
    return f"https://maps.googleapis.com/maps/api/staticmap?center={encoded_loc}&zoom={zoom}&size={size}&key={GOOGLE_MAPS_API_KEY}"

def get_directions_url(origin: str, destination: str) -> str:
    """
    Generates a Google Maps Directions link.
    This doesn't require an API key to generate the link, as it just opens Google Maps.
    """
    enc_origin = urllib.parse.quote(origin)
    enc_dest = urllib.parse.quote(destination)
    return f"https://www.google.com/maps/dir/?api=1&origin={enc_origin}&destination={enc_dest}"
