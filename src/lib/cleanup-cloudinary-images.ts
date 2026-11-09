import "server-only";

import { cloudinaryPublicIdFromUrl, getCloudinaryClient } from "@/lib/cloudinary";
import { isCloudinaryImageReferenced } from "@/lib/cloudinary-references";
import { CloudinaryAsset } from "@/models/CloudinaryAsset";

export async function cleanupUnreferencedCloudinaryImages(values: unknown[]) {
  const imageUrls = values.filter((value): value is string => typeof value === "string" && value.includes("res.cloudinary.com/"));
  if (imageUrls.length === 0) return;

  let cloudinary: ReturnType<typeof getCloudinaryClient>;
  try {
    cloudinary = getCloudinaryClient();
  } catch (error) {
    console.error("Cloudinary image cleanup could not start:", error);
    return;
  }
  const cloudName = cloudinary.config().cloud_name;
  if (!cloudName) return;

  const publicIds = new Set(
    imageUrls
      .map((url) => cloudinaryPublicIdFromUrl(url, cloudName))
      .filter((publicId): publicId is string => publicId !== null),
  );

  for (const publicId of publicIds) {
    try {
      if (await isCloudinaryImageReferenced(publicId)) continue;

      const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") {
        console.error("Cloudinary image cleanup returned an unexpected result:", { publicId, result: result.result });
        continue;
      }

      await CloudinaryAsset.deleteOne({ _id: publicId });
    } catch (error) {
      console.error("Cloudinary image cleanup failed:", { publicId, error });
    }
  }
}
