const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create raw uncompressed PNG with pure Node.js (zlib)
function createSolidPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC calculation
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeInt32BE(crc, 8 + len);
    return buf;
  }

  // Simple CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ -1;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Generate image data (scanlines with filter byte 0)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // Filter byte: None

    // Calculate nice gradient
    const t = y / height;
    const curR = Math.round(r * (1 - t) + (r * 0.7) * t);
    const curG = Math.round(g * (1 - t) + (g * 0.8) * t);
    const curB = Math.round(b * (1 - t) + 245 * t);

    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 4;

      // Draw stylized "FT" letters in the center
      const nx = x / width;
      const ny = y / height;

      let isFg = false;
      // F letter
      if (nx >= 0.25 && nx <= 0.35 && ny >= 0.28 && ny <= 0.72) isFg = true; // F stem
      if (nx >= 0.25 && nx <= 0.50 && ny >= 0.28 && ny <= 0.38) isFg = true; // F top
      if (nx >= 0.25 && nx <= 0.45 && ny >= 0.46 && ny <= 0.54) isFg = true; // F mid

      // T letter
      if (nx >= 0.65 && nx <= 0.75 && ny >= 0.28 && ny <= 0.72) isFg = true; // T stem
      if (nx >= 0.53 && nx <= 0.87 && ny >= 0.28 && ny <= 0.38) isFg = true; // T top

      if (isFg) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = curR;
        rawData[pxOffset + 1] = curG;
        rawData[pxOffset + 2] = curB;
        rawData[pxOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write 192x192, 512x512, maskable 512x512, and apple-touch-icon 180x180
const pwa192 = createSolidPNG(192, 192, 79, 70, 229);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createSolidPNG(512, 512, 79, 70, 229);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable = createSolidPNG(512, 512, 67, 56, 202);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

const appleTouch = createSolidPNG(180, 180, 79, 70, 229);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

console.log('PNG icons created successfully in public directory!');
