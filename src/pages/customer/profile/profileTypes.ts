export type ProfileFormValues = { name: string; about: string; location: string };

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const ABOUT_MAX_LENGTH = 500;
export const NAME_MAX_LENGTH = 80;
export const LOCATION_MAX_LENGTH = 120;

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) return `${megabytes.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image is too large. Maximum size is 5MB.";
  }
  return null;
}

export function getInitials(name?: string | null): string {
  const value = (name || "").trim();
  if (!value) return "P";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
