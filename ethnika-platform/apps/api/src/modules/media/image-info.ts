/*
 * Reconnaissance d'une image par ses premiers octets (jamais par le nom ni le type annoncé) et lecture de ses
 * dimensions. Seuls JPEG, PNG et WebP sont acceptés : pas de SVG (script possible), pas de GIF.
 */

export type ImageInfo = { mimeType: "image/jpeg" | "image/png" | "image/webp"; width: number | null; height: number | null };

function jpegSize(b: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1] ?? 0;
    const length = b.readUInt16BE(i + 2);
    // Marqueurs SOF (début d'image) : 0xC0–0xCF sauf DHT (C4), JPG (C8) et DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

function webpSize(b: Buffer): { width: number; height: number } | null {
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8X" && b.length >= 30) return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  if (chunk === "VP8 " && b.length >= 30) return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L" && b.length >= 25) {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function imageInfo(b: Buffer): ImageInfo | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    const s = jpegSize(b);
    return { mimeType: "image/jpeg", width: s?.width ?? null, height: s?.height ?? null };
  }
  if (b.length > 24 && b.toString("hex", 0, 8) === "89504e470d0a1a0a") return { mimeType: "image/png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 16 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const s = webpSize(b);
    return { mimeType: "image/webp", width: s?.width ?? null, height: s?.height ?? null };
  }
  return null;
}
