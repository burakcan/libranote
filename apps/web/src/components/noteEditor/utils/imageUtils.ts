import Compressor from "compressorjs";

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertSize?: number;
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  convertSize: 5000000, // 5MB - convert to JPEG if larger
};

export function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const compressorOptions = { ...DEFAULT_OPTIONS, ...options };

    new Compressor(file, {
      ...compressorOptions,
      success: (compressedFile: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read compressed file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(compressedFile);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check if file is an image
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "Please select an image file" };
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: "Image file is too large (max 50MB)" };
  }

  return { valid: true };
}
