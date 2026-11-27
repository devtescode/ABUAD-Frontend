/**
 * Avatar selection state for the customer profile page.
 *
 * Keeps a pending File (with a local blob preview) separate from the avatar
 * URL already stored on the account so a save can be cancelled cleanly.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { validateAvatarFile } from './profileTypes';

export type AvatarUploadApi = {
  file: File | null;
  previewUrl: string | null;
  error: string;
  selectFile: (file?: File | null) => void;
  clear: () => void;
  syncExternalUrl: (url?: string | null) => void;
};

export function useAvatarUpload(initialUrl?: string | null): AvatarUploadApi {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState('');

  const externalUrlRef = useRef<string | null>(initialUrl ?? null);
  const fileRef = useRef<File | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const releaseBlobUrl = useCallback(() => {
    // Only object URLs created here may be revoked; external URLs are owned
    // by the backend and must never be passed to revokeObjectURL.
    if (blobUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    blobUrlRef.current = null;
  }, []);

  const syncExternalUrl = useCallback(
    (url?: string | null) => {
      const nextUrl = url ?? null;
      externalUrlRef.current = nextUrl;

      if (!fileRef.current) {
        releaseBlobUrl();
        setPreviewUrl(nextUrl);
      }
    },
    [releaseBlobUrl]
  );

  const selectFile = useCallback(
    (selected?: File | null) => {
      if (!selected) return;

      const validationError = validateAvatarFile(selected);
      if (validationError) {
        setError(validationError);
        return;
      }

      releaseBlobUrl();
      const objectUrl = URL.createObjectURL(selected);
      blobUrlRef.current = objectUrl;
      fileRef.current = selected;
      setFile(selected);
      setPreviewUrl(objectUrl);
      setError('');
    },
    [releaseBlobUrl]
  );

  const clear = useCallback(() => {
    releaseBlobUrl();
    fileRef.current = null;
    setFile(null);
    setError('');
    setPreviewUrl(externalUrlRef.current);
  }, [releaseBlobUrl]);

  // Reflect account avatar changes coming from the context/query cache without
  // clobbering a pending local selection.
  useEffect(() => {
    syncExternalUrl(initialUrl ?? null);
  }, [initialUrl, syncExternalUrl]);

  // Release the object URL if the page unmounts while a file is pending.
  useEffect(
    () => () => {
      releaseBlobUrl();
    },
    [releaseBlobUrl]
  );

  return { file, previewUrl, error, selectFile, clear, syncExternalUrl };
}
