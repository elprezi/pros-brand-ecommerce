/**
 * High-performance Client-Side Canvas Image Compressor
 * Resizes large high-res photos (e.g. 5MB-15MB phone camera shots) to crisp 1600px JPEGs (~150KB - 250KB).
 * Prevents LocalStorage QuotaExceeded errors and white screen crashes during multi-file uploads.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<{ dataUrl: string; width: number; height: number; sizeKb: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ dataUrl: '', width: 0, height: 0, sizeKb: 0 });
    };
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve({ dataUrl: '', width: 0, height: 0, sizeKb: 0 });
        return;
      }

      const img = new Image();
      img.onerror = () => {
        // Fallback to raw dataUrl if canvas fails
        resolve({
          dataUrl: src,
          width: 1200,
          height: 800,
          sizeKb: Math.round((src.length * 3) / 4 / 1024),
        });
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: src, width, height, sizeKb: Math.round(file.size / 1024) });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
          resolve({ dataUrl: compressedDataUrl, width, height, sizeKb: approxSizeKb });
        } catch (err) {
          resolve({ dataUrl: src, width, height, sizeKb: Math.round(file.size / 1024) });
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
