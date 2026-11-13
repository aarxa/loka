# Pack assets/sky/stars.json (from extract_stars.py) into assets/sky/stars.bin, the compact file the page loads.
# 8 bytes a star, little-endian: RA (uint16, 0-360 deg), Dec (int16, +-90 deg), brightness, red, green, blue (uint8 each).
# Usage: python3 pack_stars.py <stars.json> <stars.bin>
import sys, json, struct

src, dst = sys.argv[1], sys.argv[2]
stars = json.load(open(src))['stars']
q = lambda v, top: max(0, min(top, round(v * top)))
with open(dst, 'wb') as f:
    for ra, dec, b, r, g, bl in stars:
        f.write(struct.pack('<HhBBBB', round((ra % 360) / 360 * 65535) % 65536, round(dec / 90 * 32767),
                            q(b, 255), q(r, 255), q(g, 255), q(bl, 255)))
print(len(stars), 'stars ->', dst, len(stars) * 8, 'bytes')
