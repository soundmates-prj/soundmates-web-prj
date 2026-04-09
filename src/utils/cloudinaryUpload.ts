/**
 * Cloudinary upload utility
 * Dùng chung cho audio, video, image
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

type ResourceType = "image" | "video" | "auto";

export interface CloudinaryUploadResult {
  url: string;
  duration?: number; // seconds — only for audio/video
}

export async function uploadToCloudinary(
  file: File,
  resourceType: ResourceType = "auto",
): Promise<CloudinaryUploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);

  // Cloudinary: audio files use "video" resource type
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: fd },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Upload Cloudinary thất bại");
  }

  const data = await res.json();
  return {
    url: data.secure_url as string,
    duration: data.duration ? Math.round(data.duration as number) : undefined,
  };
}

export async function uploadAudio(file: File): Promise<CloudinaryUploadResult> {
  // Try "auto" first (works with most presets), fallback to "video"
  try {
    return await uploadToCloudinary(file, "auto");
  } catch {
    return await uploadToCloudinary(file, "video");
  }
}

export async function uploadImage(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, "image");
  return result.url;
}
