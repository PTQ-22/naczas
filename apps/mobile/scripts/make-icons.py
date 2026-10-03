# Rasterises the NaCzas mark (clock ring + check) with signed distance fields — no deps.
import math, struct, sys, zlib

PRIMARY = (0x1C, 0x6B, 0x66)
WHITE = (255, 255, 255)

def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

def mark_sdf(x, y):
    # Unit space 0..1, mark centred. Ring + check mark (rounded caps).
    cx = cy = 0.5
    ring = abs(math.hypot(x - cx, y - cy) - 0.30) - 0.035
    p = [(0.375, 0.515), (0.465, 0.605), (0.640, 0.420)]
    check = min(seg_dist(x, y, *p[0], *p[1]), seg_dist(x, y, *p[1], *p[2])) - 0.042
    # Hour marks at 12 / 3 / 9 o'clock make the ring read as a clock face ("na czas").
    ticks = min(
        seg_dist(x, y, 0.5, 0.215, 0.5, 0.275),
        seg_dist(x, y, 0.725, 0.5, 0.785, 0.5),
        seg_dist(x, y, 0.215, 0.5, 0.275, 0.5),
    ) - 0.022
    return min(ring, check, ticks)

def render(size, bg, fg, scale=1.0):
    """bg: RGB tuple or None (transparent). scale shrinks the mark (adaptive icon safe zone)."""
    rows = []
    for j in range(size):
        row = bytearray([0])
        for i in range(size):
            u = ((i + 0.5) / size - 0.5) / scale + 0.5
            v = ((j + 0.5) / size - 0.5) / scale + 0.5
            d = mark_sdf(u, v) * size * scale  # distance in pixels
            a = max(0.0, min(1.0, 0.5 - d))
            if bg is None:
                row += bytes((*fg, int(round(a * 255))))
            else:
                c = tuple(int(round(bg[k] * (1 - a) + fg[k] * a)) for k in range(3))
                row += bytes((*c, 255))
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

# Usage: python3 scripts/make-icons.py assets/images
out = sys.argv[1]
jobs = {
    'icon.png': (1024, PRIMARY, WHITE, 1.0),
    'android-icon-foreground.png': (512, None, WHITE, 0.62),
    'android-icon-background.png': (512, PRIMARY, PRIMARY, 1.0),
    'android-icon-monochrome.png': (432, None, WHITE, 0.62),
    'favicon.png': (48, PRIMARY, WHITE, 1.0),
    'splash-icon.png': (512, None, WHITE, 1.0),
}
for name, (size, bg, fg, scale) in jobs.items():
    with open(f'{out}/{name}', 'wb') as f:
        f.write(render(size, bg, fg, scale))
    print(name, size)
