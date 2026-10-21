export const MAX_IMAGE_FILE_SIZE = 4 * 1024 * 1024;

const MIME_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).join(",") === "137,80,78,71,13,10,26,10",
  "image/webp": (bytes) =>
    bytes.length >= 12
    && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP",
  "image/gif": (bytes) => {
    const signature = String.fromCharCode(...bytes.subarray(0, 6));
    return signature === "GIF87a" || signature === "GIF89a";
  },
};

export const SUPPORTED_IMAGE_TYPES = Object.keys(MIME_SIGNATURES);

export function hasValidImageSignature(mimeType: string, bytes: Uint8Array) {
  return MIME_SIGNATURES[mimeType]?.(bytes) ?? false;
}
