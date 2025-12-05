import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type ImageType = 'logo' | 'hero' | 'pet-profile' | 'gallery';

interface UploadOptions {
  tenantId: string;
  imageType: ImageType;
  entityId?: string; // petId or customerId
}

interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Generate folder path based on image type for multi-tenant isolation
 */
export function getFolderPath(options: UploadOptions): string {
  const { tenantId, imageType, entityId } = options;
  const basePath = `vetify/${tenantId}`;

  switch (imageType) {
    case 'logo':
      return `${basePath}/logo`;
    case 'hero':
      return `${basePath}/hero`;
    case 'pet-profile':
      return `${basePath}/pets/${entityId}`;
    case 'gallery':
      return `${basePath}/gallery`;
    default:
      return basePath;
  }
}

/**
 * Get transformation options based on image type
 * - Logo: 400x400 limit (preserves aspect ratio)
 * - Hero: 1920x1080 limit
 * - Profiles: 400x400 crop with face detection
 */
export function getTransformations(imageType: ImageType): Record<string, unknown> {
  switch (imageType) {
    case 'logo':
      return {
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      };
    case 'hero':
      return {
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      };
    case 'pet-profile':
      return {
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      };
    case 'gallery':
      return {
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      };
    default:
      return { quality: 'auto', fetch_format: 'auto' };
  }
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
  file: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  const folder = getFolderPath(options);
  const transformations = getTransformations(options.imageType);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...transformations,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(file);
  });
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Extract public ID from Cloudinary URL
 * Example URL: https://res.cloudinary.com/xxx/image/upload/v123/vetify/tenant-id/logo/image.jpg
 * Returns: vetify/tenant-id/logo/image
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Match the path after /upload/v{version}/ and before the file extension
    const regex = /\/upload\/v\d+\/(.+)\.[a-zA-Z]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export { cloudinary };
