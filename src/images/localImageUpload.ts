export class LocalImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalImageUploadError';
  }
}

type PrepareLocalImageOptions = {
  maxDimension?: number;
  maxBytes?: number;
  outputType?: 'image/jpeg' | 'image/webp';
};

const DEFAULT_MAX_DIMENSION = 900;
const DEFAULT_MAX_BYTES = 650 * 1024;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') resolve(reader.result);
    else reject(new LocalImageUploadError('The selected image could not be read.'));
  };
  reader.onerror = () => reject(new LocalImageUploadError('The selected image could not be read.'));
  reader.readAsDataURL(file);
});

const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new LocalImageUploadError('The selected image could not be processed.'));
  image.src = url;
});

const estimateDataUrlBytes = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(',');
  const payloadLength = commaIndex === -1 ? dataUrl.length : dataUrl.length - commaIndex - 1;
  return Math.ceil(payloadLength * 0.75);
};

export const prepareLocalImageDataUrl = async (
  file: File,
  options: PrepareLocalImageOptions = {}
): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new LocalImageUploadError('Please choose an image file.');
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new LocalImageUploadError('That image is too large. Choose a photo under 12 MB.');
  }

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const outputType = options.outputType ?? 'image/jpeg';

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    if (file.size > maxBytes) {
      throw new LocalImageUploadError('That image is too large to store in this local workspace.');
    }
    return readFileAsDataUrl(file);
  }

  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    const directDataUrl = await readFileAsDataUrl(file);
    if (estimateDataUrlBytes(directDataUrl) > maxBytes) {
      throw new LocalImageUploadError('That image is too large to store in this local workspace.');
    }
    return directDataUrl;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) {
      throw new LocalImageUploadError('The selected image could not be processed.');
    }

    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new LocalImageUploadError('This browser could not prepare the selected image.');
    }

    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
      const dataUrl = canvas.toDataURL(outputType, quality);
      if (estimateDataUrlBytes(dataUrl) <= maxBytes) return dataUrl;
    }

    throw new LocalImageUploadError('That image is too detailed to store locally. Try a smaller or cropped photo.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
