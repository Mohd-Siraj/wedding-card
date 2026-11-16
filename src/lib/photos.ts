export const PHOTO_BUCKET = "wedding-photos";
/** Gallery cap per wedding (the database allows up to 10). */
export const MAX_GALLERY_PHOTOS = 6;

export function photoUrl(path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Storage paths must sit in the wedding's own folder. */
export function isWeddingPhotoPath(path: string, weddingId: string) {
  return (
    path.startsWith(`${weddingId}/`) &&
    !path.includes("..") &&
    /^[0-9a-f-]{36}\/(goals\/)?[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(path)
  );
}
