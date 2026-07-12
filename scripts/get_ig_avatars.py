import urllib.request
import re
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

usernames = [
    "lvcxs_itl",
    "vuckro",
    "maelledeltour",
    "jimboaww",
    "nodaysoffffffff"
]

avatars = {}

for username in usernames:
    url = f"https://www.instagram.com/{username}/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode('utf-8')
            # Extract og:image
            match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html)
            if not match:
                match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html)
            
            if match:
                avatars[username] = match.group(1)
                print(f"✅ Found avatar for @{username}")
            else:
                # Fallback to extracting from json or regular expression
                print(f"⚠️ No og:image for @{username}")
    except Exception as e:
        print(f"❌ Error for @{username}: {str(e)}")

print("Results:", json.dumps(avatars, indent=2))
