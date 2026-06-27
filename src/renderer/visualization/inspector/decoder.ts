export enum FileType {
  Text = 'text',
  Image = 'image',
  Binary = 'binary'
}

export type DecodeResult = {
  type: FileType;
  mimeType?: string;
  text: string;
  dataUrl?: string;
};

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif']);

export class Decoder {
  static decode(source: string, filePath?: string): DecodeResult {
    const bytes = base64ToBytes(source);
    const extension = getExtension(filePath);
    const text = decodeUtf8(bytes);
    const imageMime = detectImageMime(bytes, text, extension);

    if (imageMime) {
      return {
        type: FileType.Image,
        mimeType: imageMime,
        text: `/* ${imageMime} image (${bytes.length} bytes) */`,
        dataUrl: `data:${imageMime};base64,${source}`
      };
    }

    if (IMAGE_EXTENSIONS.has(extension)) {
      const mimeType = mimeFromExtension(extension);
      return {
        type: FileType.Image,
        mimeType,
        text: `/* ${mimeType ?? extension} image (${bytes.length} bytes) */`,
        dataUrl: `data:${mimeType ?? 'application/octet-stream'};base64,${source}`
      };
    }

    if (text !== null && !hasNullByte(bytes)) {
      return { type: FileType.Text, text };
    }

    const mimeType = mimeFromExtension(extension);
    return {
      type: FileType.Binary,
      mimeType,
      text: `/* Binary file${mimeType ? ` (${mimeType})` : ''}, ${bytes.length} bytes */`
    };
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getExtension(filePath?: string): string {
  if (!filePath) return '';
  const name = filePath.split(/[/\\]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function isSvg(text: string): boolean {
  const trimmed = text.trimStart();
  return /^(\<\?xml[^\>]+\>\s*)?\<svg[\s>]/i.test(trimmed);
}

function detectImageMime(bytes: Uint8Array, text: string | null, extension: string): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
    return 'image/x-icon';
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }
  if (text && isSvg(text)) {
    return 'image/svg+xml';
  }
  if (extension === 'svg' && text) {
    return 'image/svg+xml';
  }
  return null;
}

function hasNullByte(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 8192);
  for (let i = 0; i < limit; i++) {
    if (bytes[i] === 0) return true;
  }
  return false;
}

function mimeFromExtension(extension: string): string | undefined {
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    case 'bmp':
      return 'image/bmp';
    case 'avif':
      return 'image/avif';
    default:
      return undefined;
  }
}
