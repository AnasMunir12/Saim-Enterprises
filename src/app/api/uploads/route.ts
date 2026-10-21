import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { cloudinaryPublicIdFromUrl, CloudinaryConfigurationError, getCloudinaryClient, uploadImage } from "@/lib/cloudinary";
import { isCloudinaryImageReferenced } from "@/lib/cloudinary-references";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { hasValidImageSignature, MAX_IMAGE_FILE_SIZE, SUPPORTED_IMAGE_TYPES } from "@/lib/image-file";
import { CloudinaryAsset } from "@/models/CloudinaryAsset";

const MAX_REQUEST_SIZE = MAX_IMAGE_FILE_SIZE + 64 * 1024;
const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    if (!rateLimit(`image-upload:${user.id}:${clientIp(request)}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
      return NextResponse.json({ message: "Too many image uploads. Please wait before trying again." }, { status: 429 });
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json({ message: "Images must be 4MB or smaller." }, { status: 413 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ message: "Upload request must contain a valid image file." }, { status: 400 });
    }
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ message: "Image file is required." }, { status: 400 });
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ message: "Use a JPG, PNG, WEBP, or GIF image." }, { status: 400 });
    }
    if (file.size === 0) return NextResponse.json({ message: "The selected image is empty." }, { status: 400 });
    if (file.size > MAX_IMAGE_FILE_SIZE) return NextResponse.json({ message: "Images must be 4MB or smaller." }, { status: 413 });

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(file.type, bytes)) {
      return NextResponse.json({ message: "The file contents do not match a supported image format." }, { status: 400 });
    }

    const image = await uploadImage(bytes);
    try {
      await CloudinaryAsset.create({ _id: image.public_id, ...image });
    } catch (error) {
      const cleanup = await getCloudinaryClient().uploader.destroy(image.public_id, { resource_type: "image", invalidate: true }).catch((cleanupError: unknown) => {
        console.error("Unregistered Cloudinary upload cleanup failed:", cleanupError);
        return null;
      });
      if (cleanup && cleanup.result !== "ok" && cleanup.result !== "not found") {
        console.error("Unregistered Cloudinary upload cleanup returned an unexpected result:", cleanup.result);
      }
      throw error;
    }

    return NextResponse.json({
      url: image.secure_url,
      secure_url: image.secure_url,
      public_id: image.public_id,
      width: image.width,
      height: image.height,
      format: image.format,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return NextResponse.json({ message: "Image uploads are not configured. Ask an administrator to configure Cloudinary." }, { status: 503 });
    }
    console.error("Image upload failed:", error);
    return NextResponse.json({ message: "Unable to upload image." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    if (!rateLimit(`image-delete:${user.id}:${clientIp(request)}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
      return NextResponse.json({ message: "Too many image deletion requests. Please wait before trying again." }, { status: 429 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }
    const url = payload && typeof payload === "object" && "url" in payload ? payload.url : null;
    const client = getCloudinaryClient();
    const cloudName = client.config().cloud_name;
    const publicId = cloudName ? cloudinaryPublicIdFromUrl(url, cloudName) : null;
    if (!publicId) {
      return NextResponse.json({ message: "Only valid Cloudinary image URLs can be deleted." }, { status: 400 });
    }
    if (await isCloudinaryImageReferenced(publicId)) {
      return NextResponse.json({ message: "This image is still referenced by saved content and was not deleted." }, { status: 409 });
    }

    const result = await client.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
    if (result.result === "not found") {
      return NextResponse.json({ message: "The Cloudinary image was not found." }, { status: 404 });
    }
    if (result.result !== "ok") {
      console.error("Cloudinary image deletion returned an unexpected result:", result.result);
      return NextResponse.json({ message: "Cloudinary could not confirm image deletion." }, { status: 502 });
    }
    await CloudinaryAsset.deleteOne({ _id: publicId });

    return NextResponse.json({ message: "Image removed." });
  } catch (error) {
    if (error instanceof CloudinaryConfigurationError) {
      return NextResponse.json({ message: "Image uploads are not configured. Ask an administrator to configure Cloudinary." }, { status: 503 });
    }
    console.error("Image removal failed:", error);
    return NextResponse.json({ message: "Unable to remove image." }, { status: 500 });
  }
}
