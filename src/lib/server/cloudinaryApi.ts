/**
 * PROS Official Cloudinary Media Asset Library & CDN Helper
 * Unlimited 25 GB Free Cloud Image Storage, Auto-WebP/AVIF Compression & CDN
 */

export interface CloudinaryUploadResult {
  success: boolean;
  publicId?: string;
  secureUrl?: string;
  optimizedUrl?: string;
  width?: number;
  height?: number;
  format?: string;
  error?: string;
}

export function getCloudinaryCloudName(): string {
  const envName = ((import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME as string);
  if (envName && envName.trim().length > 2) return envName.trim();
  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pros_cloudinary_cloud_name');
    if (local && local.trim().length > 2) return local.trim();
  }
  return 'dnmh3znaz';
}

export function getCloudinaryUploadPreset(): string {
  const envPreset = ((import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET as string);
  if (envPreset && envPreset.trim().length > 2) return envPreset.trim();
  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('pros_cloudinary_upload_preset');
    if (local && local.trim().length > 2) return local.trim();
  }
  return 'qw6zadpf';
}

export function saveCloudinaryConfig(cloudName: string, uploadPreset: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('pros_cloudinary_cloud_name', cloudName.trim());
    localStorage.setItem('pros_cloudinary_upload_preset', uploadPreset.trim());
  }
}

export function isCloudinaryConfigured(): boolean {
  const cloudName = getCloudinaryCloudName();
  return Boolean(cloudName && cloudName.length > 2);
}

/**
 * Generate Auto-Compressed & Resized CDN Image URL
 */
export function buildCloudinaryUrl(publicIdOrUrl: string, width: number = 800): string {
  if (!publicIdOrUrl) return '';
  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      return publicIdOrUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
    return publicIdOrUrl;
  }
  const cloudName = getCloudinaryCloudName();
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/${publicIdOrUrl}`;
}

/**
 * Upload Image File or Blob Unsigned to Cloudinary
 */
export async function uploadToCloudinary(
  fileOrBase64: File | Blob | string,
  customPreset?: string,
  customCloudName?: string
): Promise<CloudinaryUploadResult> {
  const cloudName = customCloudName || getCloudinaryCloudName();
  const uploadPreset = customPreset || getCloudinaryUploadPreset();

  const formData = new FormData();
  formData.append('file', fileOrBase64);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'pros_brand_media');

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        success: false,
        error: errData?.error?.message || `Erreur Cloudinary HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      publicId: data.public_id,
      secureUrl: data.secure_url,
      optimizedUrl: buildCloudinaryUrl(data.secure_url, 1200),
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Impossible de contacter le service Cloudinary.',
    };
  }
}
