'use client';

import { useCallback, useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function LogoUploader({
  currentUrl,
  uploading,
  setUploading,
  onUploaded,
}: {
  currentUrl: string | null;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  onUploaded: (url: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const upload = useCallback(
    async (file: File) => {
      setError('');
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG/JPG/SVG).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5 MB.');
        return;
      }
      setUploading(true);
      try {
        const result = await uploadToCloudinary(file);
        onUploaded(result.secure_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, setUploading],
  );

  return (
    <div>
      <span className="field-label">Logo</span>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className={`block border-2 border-dashed ${
          dragOver ? 'border-gold' : 'border-border'
        } p-6 cursor-pointer hover:border-gold transition-colors text-center`}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        {currentUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={currentUrl}
              alt="Your logo"
              className="max-h-20 max-w-[200px] object-contain bg-black px-2 py-1"
            />
            <p className="text-[11px] text-silver uppercase tracking-widest">Click or drop to replace</p>
          </div>
        ) : (
          <div>
            <p className="font-condensed uppercase tracking-widest text-sm text-white">
              {uploading ? 'Uploading…' : 'Drop your logo here'}
            </p>
            <p className="text-[11px] text-silver mt-2">PNG / JPG / SVG · up to 5 MB · transparent background preferred</p>
          </div>
        )}
      </label>
      {error && <p className="text-red-400 text-xs mt-2 uppercase tracking-widest font-condensed">{error}</p>}
    </div>
  );
}
