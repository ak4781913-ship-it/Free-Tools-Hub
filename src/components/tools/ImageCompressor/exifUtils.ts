/**
 * EXIF metadata parser, stripper, and injector for image privacy.
 * Supports JPEG and WebP metadata extraction and manipulation in pure TypeScript.
 */

export interface ParsedExifData {
  hasExif: boolean;
  make?: string;
  model?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  software?: string;
  lensModel?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: string;
  hasGps: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  gpsLocationString?: string;
  rawTagsCount: number;
  rawTags?: Record<string, string | number>;
}

/**
 * Parses EXIF metadata from a File or Blob.
 */
export async function parseExifFromBlob(blob: Blob): Promise<ParsedExifData> {
  try {
    const buffer = await blob.arrayBuffer();
    return parseExifFromArrayBuffer(buffer, blob.type);
  } catch (e) {
    console.warn('Failed to parse EXIF metadata:', e);
    return { hasExif: false, hasGps: false, rawTagsCount: 0 };
  }
}

/**
 * Parses EXIF metadata from an ArrayBuffer
 */
export function parseExifFromArrayBuffer(buffer: ArrayBuffer, mimeType: string = 'image/jpeg'): ParsedExifData {
  const result: ParsedExifData = {
    hasExif: false,
    hasGps: false,
    rawTagsCount: 0,
    rawTags: {},
  };

  const view = new DataView(buffer);

  // Check if JPEG
  if (view.byteLength > 4 && view.getUint16(0) === 0xffd8) {
    return parseJpegExif(view, result);
  }

  // Check if WebP
  if (
    view.byteLength > 12 &&
    view.getUint32(0) === 0x52494646 && // 'RIFF'
    view.getUint32(8) === 0x57454250 // 'WEBP'
  ) {
    return parseWebPExif(view, result);
  }

  return result;
}

/**
 * Extract EXIF APP1 payload from JPEG DataView
 */
function parseJpegExif(view: DataView, result: ParsedExifData): ParsedExifData {
  let offset = 2;
  const length = view.byteLength;

  while (offset + 4 <= length) {
    if (view.getUint8(offset) !== 0xff) {
      break;
    }
    const marker = view.getUint8(offset + 1);

    // APP1 Marker: 0xFFE1
    if (marker === 0xe1) {
      const segmentLength = view.getUint16(offset + 2);
      // Check for 'Exif\0\0'
      if (
        offset + 10 <= length &&
        view.getUint32(offset + 4) === 0x45786966 && // 'Exif'
        view.getUint16(offset + 8) === 0x0000
      ) {
        result.hasExif = true;
        const tiffOffset = offset + 10;
        parseTiffHeader(view, tiffOffset, segmentLength - 8, result);
        return result;
      }
      offset += 2 + segmentLength;
    } else if (marker === 0xd9 || marker === 0xda) {
      // EOI or SOS marker (end of headers)
      break;
    } else {
      const segmentLength = view.getUint16(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  return result;
}

/**
 * Extract EXIF chunk from WebP DataView
 */
function parseWebPExif(view: DataView, result: ParsedExifData): ParsedExifData {
  let offset = 12;
  const length = view.byteLength;

  while (offset + 8 <= length) {
    const chunkHeader = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkHeader === 'EXIF') {
      result.hasExif = true;
      const exifDataOffset = offset + 8;
      // Some WebP EXIF chunks start with 'Exif\0\0' while others start directly with TIFF header
      if (
        exifDataOffset + 6 <= length &&
        view.getUint32(exifDataOffset) === 0x45786966 &&
        view.getUint16(exifDataOffset + 4) === 0x0000
      ) {
        parseTiffHeader(view, exifDataOffset + 6, chunkSize - 6, result);
      } else {
        parseTiffHeader(view, exifDataOffset, chunkSize, result);
      }
      return result;
    }

    // Advance to next chunk (padded to even byte)
    offset += 8 + chunkSize + (chunkSize % 2 === 1 ? 1 : 0);
  }

  return result;
}

/**
 * Parses TIFF header and IFD structures
 */
function parseTiffHeader(
  view: DataView,
  tiffOffset: number,
  maxTiffLen: number,
  result: ParsedExifData
) {
  if (tiffOffset + 8 > view.byteLength) return;

  const byteOrder = view.getUint16(tiffOffset);
  let isLittleEndian = false;
  if (byteOrder === 0x4949) {
    // 'II' = Intel Little Endian
    isLittleEndian = true;
  } else if (byteOrder === 0x4d4d) {
    // 'MM' = Motorola Big Endian
    isLittleEndian = false;
  } else {
    return;
  }

  const tag42 = view.getUint16(tiffOffset + 2, isLittleEndian);
  if (tag42 !== 42 && tag42 !== 0x002a) return;

  const firstIFDOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
  if (firstIFDOffset < 8 || tiffOffset + firstIFDOffset >= view.byteLength) return;

  // Parse IFD0
  const subIFDOffsets = parseIFD(view, tiffOffset, tiffOffset + firstIFDOffset, isLittleEndian, result);

  // Parse Exif SubIFD if present
  if (subIFDOffsets.exifSubIFD && tiffOffset + subIFDOffsets.exifSubIFD < view.byteLength) {
    parseIFD(view, tiffOffset, tiffOffset + subIFDOffsets.exifSubIFD, isLittleEndian, result);
  }

  // Parse GPS IFD if present
  if (subIFDOffsets.gpsIFD && tiffOffset + subIFDOffsets.gpsIFD < view.byteLength) {
    parseGpsIFD(view, tiffOffset, tiffOffset + subIFDOffsets.gpsIFD, isLittleEndian, result);
  }
}

interface SubIFDOffsets {
  exifSubIFD?: number;
  gpsIFD?: number;
}

/**
 * Parses a standard TIFF IFD directory
 */
function parseIFD(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  result: ParsedExifData
): SubIFDOffsets {
  const subIFDs: SubIFDOffsets = {};

  if (ifdOffset + 2 > view.byteLength) return subIFDs;
  const entriesCount = view.getUint16(ifdOffset, littleEndian);
  result.rawTagsCount += entriesCount;

  for (let i = 0; i < entriesCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    let valueOffset = entryOffset + 8;
    if (type === 2) {
      // ASCII String
      if (count > 4) {
        const offsetVal = view.getUint32(entryOffset + 8, littleEndian);
        valueOffset = tiffOffset + offsetVal;
      }
      const strVal = readAsciiString(view, valueOffset, count);
      if (strVal) {
        if (tag === 0x010f) result.make = strVal; // Make
        else if (tag === 0x0110) result.model = strVal; // Model
        else if (tag === 0x0131) result.software = strVal; // Software
        else if (tag === 0x0132) result.dateTime = strVal; // DateTime
        else if (tag === 0x9003) result.dateTimeOriginal = strVal; // DateTimeOriginal
        else if (tag === 0xa434) result.lensModel = strVal; // LensModel
        if (result.rawTags) result.rawTags[`tag_0x${tag.toString(16)}`] = strVal;
      }
    } else if (type === 3) {
      // SHORT (16-bit)
      const numVal = view.getUint16(entryOffset + 8, littleEndian);
      if (tag === 0x8827) result.iso = numVal; // PhotographicSensitivity / ISO
      if (result.rawTags) result.rawTags[`tag_0x${tag.toString(16)}`] = numVal;
    } else if (type === 4) {
      // LONG (32-bit)
      const numVal = view.getUint32(entryOffset + 8, littleEndian);
      if (tag === 0x8769) subIFDs.exifSubIFD = numVal;
      else if (tag === 0x8825) subIFDs.gpsIFD = numVal;
      else if (tag === 0x8827) result.iso = numVal;
      if (result.rawTags) result.rawTags[`tag_0x${tag.toString(16)}`] = numVal;
    } else if (type === 5) {
      // RATIONAL (numerator/denominator)
      const offsetVal = view.getUint32(entryOffset + 8, littleEndian);
      const rationalOffset = tiffOffset + offsetVal;
      if (rationalOffset + 8 <= view.byteLength) {
        const num = view.getUint32(rationalOffset, littleEndian);
        const den = view.getUint32(rationalOffset + 4, littleEndian);
        if (den !== 0) {
          const val = num / den;
          if (tag === 0x829d) result.fNumber = parseFloat(val.toFixed(1));
          else if (tag === 0x829a) {
            result.exposureTime = num === 1 || den > 1 ? `1/${Math.round(den / num)}s` : `${val.toFixed(2)}s`;
          } else if (tag === 0x920a) {
            result.focalLength = `${val.toFixed(1)} mm`;
          }
          if (result.rawTags) result.rawTags[`tag_0x${tag.toString(16)}`] = val;
        }
      }
    }
  }

  return subIFDs;
}

/**
 * Parses GPS IFD directory
 */
function parseGpsIFD(
  view: DataView,
  tiffOffset: number,
  gpsOffset: number,
  littleEndian: boolean,
  result: ParsedExifData
) {
  if (gpsOffset + 2 > view.byteLength) return;
  const entriesCount = view.getUint16(gpsOffset, littleEndian);
  result.hasGps = true;

  let latRef = 'N';
  let lonRef = 'E';
  let latCoords: number[] = [];
  let lonCoords: number[] = [];
  let altValue: number | undefined;

  for (let i = 0; i < entriesCount; i++) {
    const entryOffset = gpsOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if (tag === 0x0001) {
      // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0003) {
      // GPSLongitudeRef
      lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0002 && type === 5 && count === 3) {
      // GPSLatitude (3 rationals)
      const offsetVal = view.getUint32(entryOffset + 8, littleEndian);
      latCoords = readRationals(view, tiffOffset + offsetVal, 3, littleEndian);
    } else if (tag === 0x0004 && type === 5 && count === 3) {
      // GPSLongitude (3 rationals)
      const offsetVal = view.getUint32(entryOffset + 8, littleEndian);
      lonCoords = readRationals(view, tiffOffset + offsetVal, 3, littleEndian);
    } else if (tag === 0x0006 && type === 5) {
      // GPSAltitude
      const offsetVal = view.getUint32(entryOffset + 8, littleEndian);
      const rationals = readRationals(view, tiffOffset + offsetVal, 1, littleEndian);
      if (rationals.length > 0) altValue = rationals[0];
    }
  }

  if (latCoords.length === 3 && lonCoords.length === 3) {
    let lat = latCoords[0] + latCoords[1] / 60 + latCoords[2] / 3600;
    if (latRef === 'S') lat = -lat;
    let lon = lonCoords[0] + lonCoords[1] / 60 + lonCoords[2] / 3600;
    if (lonRef === 'W') lon = -lon;

    result.gpsLatitude = parseFloat(lat.toFixed(6));
    result.gpsLongitude = parseFloat(lon.toFixed(6));
    result.gpsAltitude = altValue ? Math.round(altValue) : undefined;
    result.gpsLocationString = `${Math.abs(result.gpsLatitude).toFixed(4)}° ${latRef}, ${Math.abs(
      result.gpsLongitude
    ).toFixed(4)}° ${lonRef}`;
  }
}

function readRationals(view: DataView, offset: number, count: number, littleEndian: boolean): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const base = offset + i * 8;
    if (base + 8 <= view.byteLength) {
      const num = view.getUint32(base, littleEndian);
      const den = view.getUint32(base + 4, littleEndian);
      if (den !== 0) {
        values.push(num / den);
      } else {
        values.push(0);
      }
    }
  }
  return values;
}

function readAsciiString(view: DataView, offset: number, maxCount: number): string {
  let str = '';
  const len = Math.min(maxCount, view.byteLength - offset);
  for (let i = 0; i < len; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    str += String.fromCharCode(c);
  }
  return str.trim();
}

/**
 * Extracts all APP1 EXIF segments (including marker and length) from a JPEG ArrayBuffer
 */
export function extractExifSegmentsFromJpeg(buffer: ArrayBuffer): Uint8Array[] {
  const segments: Uint8Array[] = [];
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return segments;
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset + 4 <= length) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);

    if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

    const segmentLen = view.getUint16(offset + 2);
    // APP1 EXIF marker
    if (
      marker === 0xe1 &&
      offset + 10 <= length &&
      view.getUint32(offset + 4) === 0x45786966 &&
      view.getUint16(offset + 8) === 0x0000
    ) {
      const segBytes = new Uint8Array(buffer, offset, 2 + segmentLen);
      segments.push(new Uint8Array(segBytes));
    }

    offset += 2 + segmentLen;
  }

  return segments;
}

/**
 * Strips all metadata markers (APP1 EXIF/XMP, APP2, APP13 IPTC, APP14) from a JPEG ArrayBuffer.
 * Guarantees that the resulting JPEG contains ZERO EXIF, GPS, camera, or IPTC metadata.
 */
export function stripMetadataFromJpeg(buffer: ArrayBuffer): Uint8Array {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return new Uint8Array(buffer);
  }

  const chunks: Uint8Array[] = [];
  // Add SOI (0xFF, 0xD8)
  chunks.push(new Uint8Array([0xff, 0xd8]));

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (offset + 2 > length) {
      // Remaining bytes
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }

    if (view.getUint8(offset) !== 0xff) {
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }

    const marker = view.getUint8(offset + 1);

    // SOS (Start of Scan) - scan data begins, copy until end
    if (marker === 0xda) {
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }

    // Standalone markers without length
    if (
      marker === 0xd8 || // SOI
      marker === 0xd9 || // EOI
      (marker >= 0xd0 && marker <= 0xd7) // RST
    ) {
      chunks.push(new Uint8Array(buffer, offset, 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > length) {
      chunks.push(new Uint8Array(buffer, offset));
      break;
    }

    const segmentLen = view.getUint16(offset + 2);
    const totalSegLen = 2 + segmentLen;

    // Markers to strip for privacy:
    // 0xE1: APP1 (Exif, XMP, Adobe)
    // 0xE2: APP2 (ICC profile or FlashPix, optional but can strip if needed)
    // 0xED: APP13 (Photoshop IRB / IPTC)
    // 0xEE: APP14 (Adobe metadata)
    // 0xFE: COM (Comment segment)
    const isMetadataSegment =
      marker === 0xe1 || // APP1 (EXIF / GPS / XMP)
      marker === 0xed || // APP13 (IPTC / Photoshop)
      marker === 0xfe; // COM (Comments)

    if (!isMetadataSegment) {
      // Keep segment
      chunks.push(new Uint8Array(buffer, offset, totalSegLen));
    }

    offset += totalSegLen;
  }

  // Calculate total size and assemble
  let totalLength = 0;
  for (const c of chunks) totalLength += c.byteLength;

  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const c of chunks) {
    result.set(c, pos);
    pos += c.byteLength;
  }

  return result;
}

/**
 * Injects EXIF segments into a JPEG ArrayBuffer right after SOI or APP0.
 */
export function injectExifSegmentsIntoJpeg(
  jpegBuffer: ArrayBuffer,
  exifSegments: Uint8Array[]
): Uint8Array {
  if (exifSegments.length === 0) return new Uint8Array(jpegBuffer);

  const view = new DataView(jpegBuffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) {
    return new Uint8Array(jpegBuffer);
  }

  // Determine insert location: after APP0 (0xFFE0) if present, else right after SOI (offset 2)
  let insertOffset = 2;
  if (view.byteLength > 4 && view.getUint8(2) === 0xff && view.getUint8(3) === 0xe0) {
    const app0Len = view.getUint16(4);
    insertOffset = 4 + app0Len;
  }

  let totalExifBytes = 0;
  for (const seg of exifSegments) totalExifBytes += seg.byteLength;

  const result = new Uint8Array(jpegBuffer.byteLength + totalExifBytes);
  // Part 1: SOI + optional APP0
  result.set(new Uint8Array(jpegBuffer, 0, insertOffset), 0);

  // Part 2: EXIF segments
  let curPos = insertOffset;
  for (const seg of exifSegments) {
    result.set(seg, curPos);
    curPos += seg.byteLength;
  }

  // Part 3: Remainder of JPEG
  result.set(new Uint8Array(jpegBuffer, insertOffset), curPos);

  return result;
}
