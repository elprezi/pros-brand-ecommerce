/**
 * Cloudinary Cloud CDN Direct Upload Utility
 * Cloud Name: dnmh3znaz
 * Upload Preset: qw6zadpf (unsigned)
 * 
 * Uploads images directly to Cloudinary CDN and returns a permanent HTTPS URL.
 */

const CLOUDINARY_CLOUD_NAME = 'dnmh3znaz';
const CLOUDINARY_UPLOAD_PRESET = 'qw6zadpf';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function uploadToCloudinary(fileInput: File | Blob | string): Promise<{ url: string; publicId: string; width?: number; height?: number; sizeKb?: number } | null> {
  try {
    const formData = new FormData();
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('file', fileInput);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Cloudinary upload failed HTTP status:', response.status, errText);
      return null;
    }

    const result = await response.json();
    const secureUrl = result.secure_url || result.url;
    
    return {
      url: secureUrl,
      publicId: result.public_id || '',
      width: result.width,
      height: result.height,
      sizeKb: result.bytes ? Math.round(result.bytes / 1024) : undefined,
    };
  } catch (error) {
    console.warn('Cloudinary upload error:', error);
    return null;
  }
}
