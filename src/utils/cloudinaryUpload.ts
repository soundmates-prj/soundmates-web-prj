/**
 * Cloudinary upload utility
 * Dùng chung cho audio, video, image
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

type ResourceType = "image" | "video" | "auto";

export async function uploadToCloudinary(
  file: File,
  resourceType: ResourceType = "auto",
): Promise<string> {
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
    throw new Error(err?.error?.message || "Upload thất bại");
  }

  const data = await res.json();
  return data.secure_url as string;
}

export async function uploadAudio(file: File): Promise<string> {
  return uploadToCloudinary(file, "video"); // Cloudinary treats audio as video
}

export async function uploadImage(file: File): Promise<string> {
  return uploadToCloudinary(file, "image");
}
