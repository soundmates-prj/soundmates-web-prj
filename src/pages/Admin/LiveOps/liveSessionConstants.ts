export const LIVE_SESSION_LIST_PAGE_SIZE = 50;
export const HOST_LIST_PAGE = 1;
export const HOST_LIST_PAGE_SIZE = 100;

export const LOCALE_VIETNAMESE = "vi-VN";

export const REQUEST_STATUS_PENDING = "Pending";
export const REQUEST_REJECT_REASON_BY_ADMIN = "Rejected by admin";

export const ALLOWED_AUDIO_EXTENSIONS = ["mp3", "flac", "wav", "ogg"] as const;
export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/flac",
  "audio/wav",
  "audio/ogg",
  "audio/x-wav",
] as const;
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
/** Cloudinary Free/Pro plan audio file size limit (10 MB). */
export const MAX_CLOUDINARY_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
