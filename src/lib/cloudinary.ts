import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfigurationError extends Error {
  constructor() {
    super("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    this.name = "CloudinaryConfigurationError";
  }
}

export type CloudinaryImageUpload = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
};

export function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryConfigurationError();
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export async function uploadImage(buffer: Buffer): Promise<CloudinaryImageUpload> {
  const client = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    client.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "saim-enterprises",
        public_id: randomUUID(),
        unique_filename: false,
        overwrite: false,
        secure: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result?.secure_url || !result.public_id || !result.width || !result.height || !result.format) {
          reject(new Error("Cloudinary returned incomplete image metadata."));
          return;
        }

        const secureUrl = result.secure_url.replace(
          "/image/upload/",
          "/image/upload/c_limit,w_2000,f_auto,q_auto/",
        );
        if (secureUrl === result.secure_url) {
          reject(new Error("Cloudinary returned an unexpected image URL."));
          return;
        }

        resolve({
          secure_url: secureUrl,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      },
    ).end(buffer);
  });
}

export function cloudinaryPublicIdFromUrl(value: unknown, cloudName: string): string | null {
  if (typeof value !== "string") return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] !== cloudName || segments[1] !== "image" || segments[2] !== "upload") return null;

  const folderIndex = segments.indexOf("saim-enterprises", 3);
  if (folderIndex < 3 || folderIndex !== segments.length - 2) return null;

  const filename = segments[folderIndex + 1];
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.[a-z0-9]+$/i.exec(filename);
  return match ? `saim-enterprises/${match[1]}` : null;
}
