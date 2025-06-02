import { Slice, Fragment, Node as PMNode } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import Compressor from "compressorjs";

// Helper function to convert base64 to Blob
const base64ToBlob = (base64: string): Blob => {
  const [header, data] = base64.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
};

// Helper function to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to compress image
const compressImage = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blob = base64ToBlob(base64);
    const originalSize = base64.length;

    new Compressor(blob, {
      quality: 0.6, // Lower quality for better compression
      maxWidth: 1920, // Max width of 1920px
      maxHeight: 1080, // Max height of 1080px
      convertTypes: [], // Don't automatically convert PNG to JPEG for screenshots
      convertSize: 1000000, // Only convert to JPEG if original is larger than 1MB
      success: async (compressedBlob) => {
        try {
          const compressedBase64 = await blobToBase64(compressedBlob);
          const compressedSize = compressedBase64.length;

          // Only use compressed version if it's actually smaller
          if (compressedSize < originalSize) {
            console.log(
              "Compression successful - Original:",
              lengthToHumanReadable(originalSize),
              "Compressed:",
              lengthToHumanReadable(compressedSize),
              "Saved:",
              lengthToHumanReadable(originalSize - compressedSize)
            );
            resolve(compressedBase64);
          } else {
            console.log(
              "Compression resulted in larger file - Original:",
              lengthToHumanReadable(originalSize),
              "Compressed:",
              lengthToHumanReadable(compressedSize),
              "Using original"
            );
            resolve(base64);
          }
        } catch (error) {
          reject(error);
        }
      },
      error: reject,
    });
  });
};

const lengthToHumanReadable = (length: number) => {
  if (length < 1024) {
    return `${length} B`;
  }
  if (length < 1024 * 1024) {
    return `${(length / 1024).toFixed(2)} KB`;
  }
  return `${(length / 1024 / 1024).toFixed(2)} MB`;
};

export const createImagePasteHandler = () => {
  return (view: EditorView, _: ClipboardEvent, slice: Slice): boolean => {
    // Check if the slice contains any image nodes
    let hasImages = false;
    const fragment = slice.content;

    fragment.descendants((node: PMNode) => {
      if (node.type.name === "image") {
        hasImages = true;
        return false; // Stop traversing
      }
    });

    // If no images, let default paste behavior handle it
    if (!hasImages) {
      return false;
    }

    // Process images asynchronously for compression
    const processImages = async () => {
      const processNode = async (node: PMNode): Promise<PMNode> => {
        if (node.type.name === "image" && node.attrs.src) {
          const src = node.attrs.src;

          // Check if it's a base64 image
          if (src.startsWith("data:image")) {
            console.log("Found base64 image, compressing...");

            try {
              const compressedBase64 = await compressImage(src);
              console.log(
                "Original size:",
                lengthToHumanReadable(src.length),
                "Compressed size:",
                lengthToHumanReadable(compressedBase64.length)
              );

              // Create a new image node with the compressed base64
              return node.type.create({
                ...node.attrs,
                src: compressedBase64,
              });
            } catch (error) {
              console.error("Failed to compress image:", error);
              // Return original node if compression fails
              return node;
            }
          }
        }

        // For non-image nodes or images that aren't base64, check children recursively
        if (node.content.size > 0) {
          const processedChildren = await Promise.all(
            node.content.content.map(processNode)
          );
          const mappedContent = Fragment.from(processedChildren);
          if (mappedContent !== node.content) {
            return node.copy(mappedContent);
          }
        }

        return node;
      };

      try {
        // Process all nodes in the fragment
        const processedNodes = await Promise.all(
          fragment.content.map(processNode)
        );
        const modifiedFragment = Fragment.from(processedNodes);

        // Create a new slice with the modified content
        const modifiedSlice = new Slice(
          modifiedFragment,
          slice.openStart,
          slice.openEnd
        );

        // Insert the processed slice (only once)
        const tr = view.state.tr;
        tr.replaceSelection(modifiedSlice);
        view.dispatch(tr);
      } catch (error) {
        console.error("Failed to process images:", error);
        // If processing fails, insert the original slice as fallback
        const tr = view.state.tr;
        tr.replaceSelection(slice);
        view.dispatch(tr);
      }
    };

    // Process images and insert content
    processImages();

    // Return true to indicate we handled the paste
    return true;
  };
};
