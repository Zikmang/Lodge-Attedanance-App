import subprocess, zlib, struct, base64, os
from collections import deque

def generate():
    img_path = 'src/assets/images/nasoc_icon_1790586823935.jpg'
    if not os.path.exists(img_path):
        print(f'Source image {img_path} not found.')
        return

    print('Step 1: Reading original image...')
    out = subprocess.check_output(['convert', img_path, 'ppm:-'])
    lines = out.split(b'\n', 3)
    dims = lines[1].split()
    w, h = int(dims[0]), int(dims[1])
    pixels = lines[3]

    print('Step 2: Flood filling background...')
    def is_bg(x, y):
        idx = (y*w + x)*3
        r, g, b = pixels[idx], pixels[idx+1], pixels[idx+2]
        diff = max(abs(r-g), abs(g-b), abs(r-b))
        if diff <= 18 and r >= 140:
            return True
        if y >= 846 and diff <= 16 and r >= 90:
            return True
        return False

    visited = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in [0, h-1]:
            if is_bg(x, y):
                visited[y*w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in [0, w-1]:
            if not visited[y*w + x] and is_bg(x, y):
                visited[y*w + x] = 1
                queue.append((x, y))

    while queue:
        cx, cy = queue.popleft()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx] and is_bg(nx, ny):
                    visited[nidx] = 1
                    queue.append((nx, ny))

    is_boundary = bytearray(w * h)
    for y in range(1, h-1):
        for x in range(1, w-1):
            if not visited[y*w + x]:
                if (visited[y*w + x - 1] or visited[y*w + x + 1] or
                    visited[(y-1)*w + x] or visited[(y+1)*w + x]):
                    is_boundary[y*w + x] = 1

    rgba_1024 = bytearray(w * h * 4)
    for y in range(h):
        for x in range(w):
            src_idx = (y*w + x)*3
            dst_idx = (y*w + x)*4
            r, g, b = pixels[src_idx], pixels[src_idx+1], pixels[src_idx+2]
            if visited[y*w + x]:
                rgba_1024[dst_idx : dst_idx+4] = b'\x00\x00\x00\x00'
            elif is_boundary[y*w + x]:
                lum = 0.299*r + 0.587*g + 0.114*b
                if lum <= 60:
                    alpha = 255
                elif lum >= 200:
                    alpha = 0
                else:
                    alpha = int(255 * (200 - lum) / 140)
                rgba_1024[dst_idx] = r
                rgba_1024[dst_idx+1] = g
                rgba_1024[dst_idx+2] = b
                rgba_1024[dst_idx+3] = alpha
            else:
                rgba_1024[dst_idx] = r
                rgba_1024[dst_idx+1] = g
                rgba_1024[dst_idx+2] = b
                rgba_1024[dst_idx+3] = 255

    print('Step 3: Cropping 680x680 centered on logo...')
    crop_x0, crop_y0 = 172, 180
    crop_w, crop_h = 680, 680
    cropped = bytearray(crop_w * crop_h * 4)
    for cy in range(crop_h):
        sy = crop_y0 + cy
        s_row = rgba_1024[sy*w*4 : (sy+1)*w*4]
        d_offset = cy * crop_w * 4
        s_offset = crop_x0 * 4
        cropped[d_offset : d_offset + crop_w * 4] = s_row[s_offset : s_offset + crop_w * 4]

    def resize_rgba(src_data, sw, sh, dw, dh):
        dst = bytearray(dw * dh * 4)
        x_ratio = float(sw - 1) / (dw - 1) if dw > 1 else 0
        y_ratio = float(sh - 1) / (dh - 1) if dh > 1 else 0
        for i in range(dh):
            src_y = y_ratio * i
            y0 = int(src_y)
            y1 = min(y0 + 1, sh - 1)
            y_diff = src_y - y0
            row0_off = y0 * sw * 4
            row1_off = y1 * sw * 4
            dst_row_off = i * dw * 4
            for j in range(dw):
                src_x = x_ratio * j
                x0 = int(src_x)
                x1 = min(x0 + 1, sw - 1)
                x_diff = src_x - x0
                p00 = x0 * 4
                p10 = x1 * 4
                w00 = (1.0 - x_diff) * (1.0 - y_diff)
                w10 = x_diff * (1.0 - y_diff)
                w01 = (1.0 - x_diff) * y_diff
                w11 = x_diff * y_diff
                d_idx = dst_row_off + j * 4
                for c in range(4):
                    val = (src_data[row0_off + p00 + c] * w00 +
                           src_data[row0_off + p10 + c] * w10 +
                           src_data[row1_off + p00 + c] * w01 +
                           src_data[row1_off + p10 + c] * w11)
                    dst[d_idx + c] = round(val)
        return dst

    def write_png(filename, width, height, rgba_data):
        raw_rows = bytearray()
        for y in range(height):
            raw_rows.append(0)
            start = y * width * 4
            raw_rows.extend(rgba_data[start : start + width * 4])
        compressed = zlib.compress(bytes(raw_rows), 9)
        def chunk(chunk_type, data):
            return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        png_data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')
        with open(filename, 'wb') as f:
            f.write(png_data)
        print(f'Wrote {filename}: {width}x{height} ({len(png_data)} bytes)')
        return png_data

    print('Step 4: Writing pwa-512x512.png...')
    png_512 = resize_rgba(cropped, crop_w, crop_h, 512, 512)
    png_512_bytes = write_png('public/pwa-512x512.png', 512, 512, png_512)

    print('Step 5: Writing pwa-192x192.png...')
    png_192 = resize_rgba(cropped, crop_w, crop_h, 192, 192)
    write_png('public/pwa-192x192.png', 192, 192, png_192)

    print('Step 6: Writing pwa-maskable-512x512.png and pwa-maskable-192x192.png...')
    maskable_512 = bytearray(512 * 512 * 4)
    for i in range(512 * 512):
        maskable_512[i*4] = 14
        maskable_512[i*4 + 1] = 31
        maskable_512[i*4 + 2] = 58
        maskable_512[i*4 + 3] = 255

    logo_400 = resize_rgba(cropped, crop_w, crop_h, 400, 400)
    offset_x, offset_y = 56, 56
    for y in range(400):
        for x in range(400):
            src_i = (y * 400 + x) * 4
            sa = logo_400[src_i + 3] / 255.0
            dst_i = ((y + offset_y) * 512 + (x + offset_x)) * 4
            if sa > 0:
                dr = maskable_512[dst_i]
                dg = maskable_512[dst_i + 1]
                db = maskable_512[dst_i + 2]
                sr = logo_400[src_i]
                sg = logo_400[src_i + 1]
                sb = logo_400[src_i + 2]
                maskable_512[dst_i] = round(sr * sa + dr * (1.0 - sa))
                maskable_512[dst_i + 1] = round(sg * sa + dg * (1.0 - sa))
                maskable_512[dst_i + 2] = round(sb * sa + db * (1.0 - sa))
    write_png('public/pwa-maskable-512x512.png', 512, 512, maskable_512)
    maskable_192 = resize_rgba(maskable_512, 512, 512, 192, 192)
    write_png('public/pwa-maskable-192x192.png', 192, 192, maskable_192)

    print('Step 7: Writing apple-touch-icon.png (180x180)...')
    apple_180 = bytearray(180 * 180 * 4)
    for i in range(180 * 180):
        apple_180[i*4] = 14
        apple_180[i*4 + 1] = 31
        apple_180[i*4 + 2] = 58
        apple_180[i*4 + 3] = 255
    logo_160 = resize_rgba(cropped, crop_w, crop_h, 160, 160)
    offset_x, offset_y = 10, 10
    for y in range(160):
        for x in range(160):
            src_i = (y * 160 + x) * 4
            sa = logo_160[src_i + 3] / 255.0
            dst_i = ((y + offset_y) * 180 + (x + offset_x)) * 4
            if sa > 0:
                dr = apple_180[dst_i]
                dg = apple_180[dst_i + 1]
                db = apple_180[dst_i + 2]
                sr = logo_160[src_i]
                sg = logo_160[src_i + 1]
                sb = logo_160[src_i + 2]
                apple_180[dst_i] = round(sr * sa + dr * (1.0 - sa))
                apple_180[dst_i + 1] = round(sg * sa + dg * (1.0 - sa))
                apple_180[dst_i + 2] = round(sb * sa + db * (1.0 - sa))
    write_png('public/apple-touch-icon.png', 180, 180, apple_180)

    print('Step 8: Writing icon.svg...')
    b64_png = base64.b64encode(png_512_bytes).decode('ascii')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,{b64_png}" x="0" y="0" width="512" height="512" />
</svg>
'''
    with open('public/icon.svg', 'w') as f:
        f.write(svg_content)
    print(f'Wrote public/icon.svg: {len(svg_content)} bytes')

if __name__ == '__main__':
    generate()
