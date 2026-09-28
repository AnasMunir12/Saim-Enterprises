import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ message: "Image file is required." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ message: "Use a JPG, PNG, WEBP, or GIF image." }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "Images must be 5MB or smaller." }, { status: 400 });

    const extension = allowedTypes.get(file.type) as string;
    const filename = `${crypto.randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json({ message: "Unable to upload image." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    const { url } = (await request.json()) as { url?: string };
    if (!url?.startsWith("/uploads/")) return NextResponse.json({ message: "Invalid image reference." }, { status: 400 });

    const filename = path.basename(url);
    await unlink(path.join(process.cwd(), "public", "uploads", filename)).catch(() => undefined);
    return NextResponse.json({ message: "Image removed." });
  } catch (error) {
    console.error("Image removal failed:", error);
    return NextResponse.json({ message: "Unable to remove image." }, { status: 500 });
  }
}
