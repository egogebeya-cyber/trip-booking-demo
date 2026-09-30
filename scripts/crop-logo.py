from PIL import Image

src = r"C:\Users\kalid\.cursor\projects\c-Users-kalid-OneDrive-Desktop-OBS-apps-trip-booking\assets\c__Users_kalid_AppData_Roaming_Cursor_User_workspaceStorage_66d2284522e4e8e94ed3174df4755274_images_image-0c998f71-3dea-4864-b37a-6199e567799e.png"
out = r"C:\Users\kalid\OneDrive\Desktop\OBS\apps\bookings\trip booking\public\logo.png"

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()
minx, miny, maxx, maxy = w, h, 0, 0
count = 0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if r > 150 and g > 110 and b < 130 and r > b + 40 and g > b + 20:
            count += 1
            if x < minx:
                minx = x
            if y < miny:
                miny = y
            if x > maxx:
                maxx = x
            if y > maxy:
                maxy = y

print("size", w, h, "gold", count, "box", minx, miny, maxx, maxy)
cx = (minx + maxx) / 2
cy = (miny + maxy) / 2
# circle is wider than the gold mark; pad so the dark disc is included
half = max(maxx - minx, maxy - miny) / 2
pad = half * 0.42
radius = half + pad
left = int(cx - radius)
top = int(cy - radius)
side = int(radius * 2)
crop = im.crop((left, top, left + side, top + side))
# circular alpha so the phone background outside the badge is gone
cw, ch = crop.size
cp = crop.load()
ccx, ccy = cw / 2, ch / 2
rr = min(cw, ch) / 2 - 1
for y in range(ch):
    for x in range(cw):
        dx, dy = x - ccx, y - ccy
        if dx * dx + dy * dy > rr * rr:
            r, g, b, a = cp[x, y]
            cp[x, y] = (r, g, b, 0)
crop.save(out)
print("saved", out, crop.size)
