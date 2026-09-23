// Draws the app icon (a filled collection tube) and writes the PWA PNGs.
// No dependencies: shapes are rasterized with 4x4 supersampling and encoded with zlib.
// Run: npm run icons
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const ground = [0xf7, 0xf6, 0xf2];
const ink = [0x15, 0x17, 0x1a];
const glass = [0xff, 0xff, 0xff];
const blood = [0x8b, 0x2b, 0x24];
const cap = [0xd8, 0xa3, 0x1a]; // gold

// Unit-square geometry, kept inside the central 80% so maskable crops stay safe.
const bodyL = 0.4, bodyR = 0.6, bodyTop = 0.34, bodyBottom = 0.7, radius = 0.1, stroke = 0.022;
const capL = 0.35, capR = 0.65, capTop = 0.17, capBottom = 0.35, capRound = 0.03;
const fillTop = 0.46;

function inBody(x, y, inset) {
  const l = bodyL + inset, r = bodyR - inset, rad = radius - inset;
  if (y < bodyTop + inset) return false;
  if (y <= bodyBottom) return x >= l && x <= r;
  const dx = x - 0.5, dy = y - bodyBottom;
  return dx * dx + dy * dy <= rad * rad;
}

function inRoundRect(x, y, l, t, r, b, rad) {
  if (x < l || x > r || y < t || y > b) return false;
  const cx = Math.min(Math.max(x, l + rad), r - rad);
  const cy = Math.min(Math.max(y, t + rad), b - rad);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= rad * rad;
}

function colorAt(x, y) {
  if (inRoundRect(x, y, capL - stroke, capTop - stroke, capR + stroke, capBottom + stroke, capRound + stroke)) {
    return inRoundRect(x, y, capL, capTop, capR, capBottom, capRound) ? cap : ink;
  }
  if (inBody(x, y, -stroke)) {
    if (!inBody(x, y, 0)) return ink;
    return y >= fillTop && inBody(x, y, 0.012) ? blood : glass;
  }
  return ground;
}

function render(size) {
  const ss = 4;
  const px = Buffer.alloc(size * size * 4);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let r = 0, g = 0, b = 0;
      for (let sj = 0; sj < ss; sj++) {
        for (let si = 0; si < ss; si++) {
          const c = colorAt((i + (si + 0.5) / ss) / size, (j + (sj + 0.5) / ss) / size);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = ss * ss, o = (j * size + i) * 4;
      px[o] = Math.round(r / n); px[o + 1] = Math.round(g / n); px[o + 2] = Math.round(b / n); px[o + 3] = 255;
    }
  }
  return encodePng(size, size, px);
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

for (const [file, size] of [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
]) {
  writeFileSync(file, render(size));
  console.log(`wrote ${file} (${size}x${size})`);
}
