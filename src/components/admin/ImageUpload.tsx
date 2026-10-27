"use client";

import { LoaderCircle, Replace, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_IMAGE_FILE_SIZE } from "@/lib/image-file";

const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type ImageUploadProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  browseLabel?: string;
  replaceLabel?: string;
};

export function ImageUpload({ value, onChange, label = "Image", className = "", browseLabel = "Drop image here or browse files", replaceLabel = "Replace" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (!SUPPORTED_IMAGE_MIME_TYPES.has(file.type)) {
      setError("Use a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      setError("Images must be 4MB or smaller.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = (await response.json()) as { url?: string; secure_url?: string; public_id?: string; message?: string };
      const url = data.secure_url ?? data.url;
      if (!response.ok || !url || !data.public_id) {
        setError(data.message ?? "Unable to upload image.");
        return;
      }
      onChange(url);
    } catch {
      setError("Unable to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file?: File) {
    if (file) void upload(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Only detaches the picture from the form; cancelling an edit must not delete a still-referenced image.
  function remove() {
    onChange("");
  }

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-stone-700">{label}</span>
        <span className="text-[11px] text-stone-400">JPG, PNG, WEBP, GIF up to 4MB</span>
      </div>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview supports legacy paths and Cloudinary URLs */}
          <img src={value} alt={`${label} preview`} className="h-36 w-full rounded-lg object-contain" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"><Replace size={14} /> {replaceLabel}</button>
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"><Trash2 size={14} /> Remove</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }}
          className={`flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm transition ${dragging ? "border-stone-900 bg-stone-100" : "border-stone-300 bg-stone-50 hover:border-stone-500"}`}
        >
          {uploading ? <LoaderCircle className="animate-spin text-stone-500" size={24} /> : <UploadCloud size={24} className="text-stone-500" />}
          <span className="font-medium text-stone-700">{uploading ? "Uploading..." : browseLabel}</span>
          <span className="text-xs text-stone-400">Preserves the original aspect ratio</span>
        </button>
      )}
      {uploading && value ? <p className="mt-2 text-xs text-stone-500" role="status">Uploading image...</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600" role="alert">{error}</p> : null}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
    </div>
  );
}
