/**
 * Image URL Helper & Google Drive Converter
 * Handles Google Drive sharing links, direct image URLs, and base64 images
 */

export interface DriveConversionResult {
  convertedUrl: string;
  originalUrl: string;
  wasConverted: boolean;
  fileId?: string;
  isFolder?: boolean;
  isDocsOrSheets?: boolean;
  notes?: string;
}

/**
 * Extracts a Google Drive File ID and produces high-compatibility direct image streams.
 * Handles:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://docs.google.com/uc?id=FILE_ID
 * - https://lh3.googleusercontent.com/d/FILE_ID
 * - https://drive.google.com/thumbnail?id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string): DriveConversionResult {
  if (!url || !url.trim()) {
    return { convertedUrl: '', originalUrl: '', wasConverted: false };
  }

  const trimmed = url.trim();

  // Check if user accidentally pasted a Google Drive Folder URL
  if (trimmed.includes('drive.google.com/drive/folders/') || trimmed.includes('/folders/')) {
    return {
      convertedUrl: trimmed,
      originalUrl: trimmed,
      wasConverted: false,
      isFolder: true,
      notes: 'Has ingresado el enlace de una CARPETA de Drive, no de un archivo de imagen. Abre la imagen específica y copia su enlace.',
    };
  }

  // Check if user accidentally pasted a Google Doc or Sheet URL
  if (trimmed.includes('docs.google.com/document/') || trimmed.includes('docs.google.com/spreadsheets/')) {
    return {
      convertedUrl: trimmed,
      originalUrl: trimmed,
      wasConverted: false,
      isDocsOrSheets: true,
      notes: 'Has ingresado un documento o planilla de Google, no una imagen.',
    };
  }

  let fileId: string | null = null;

  // Pattern 1: drive.google.com/file/d/FILE_ID/...
  const matchFileD = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  }

  // Pattern 2: drive.google.com/(?:open|uc)?id=FILE_ID
  if (!fileId) {
    const matchOpenOrUc = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
    if (matchOpenOrUc && matchOpenOrUc[1]) {
      fileId = matchOpenOrUc[1];
    }
  }

  // Pattern 3: docs.google.com/uc?id=FILE_ID
  if (!fileId) {
    const matchDocsUc = trimmed.match(/docs\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
    if (matchDocsUc && matchDocsUc[1]) {
      fileId = matchDocsUc[1];
    }
  }

  // Pattern 4: lh3.googleusercontent.com/d/FILE_ID
  if (!fileId) {
    const matchLh3 = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (matchLh3 && matchLh3[1]) {
      fileId = matchLh3[1];
    }
  }

  // Pattern 5: drive.google.com/thumbnail?id=FILE_ID
  if (!fileId) {
    const matchThumbnail = trimmed.match(/drive\.google\.com\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
    if (matchThumbnail && matchThumbnail[1]) {
      fileId = matchThumbnail[1];
    }
  }

  if (fileId) {
    // drive.google.com/thumbnail endpoint with sz=w1000 is the most reliable endpoint for public Drive images
    // because it avoids virus-scan redirects and download headers
    const directThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    return {
      convertedUrl: directThumbnailUrl,
      originalUrl: trimmed,
      wasConverted: true,
      fileId,
      notes: 'Enlace de Google Drive transformado automáticamente a visor de imagen.',
    };
  }

  return {
    convertedUrl: trimmed,
    originalUrl: trimmed,
    wasConverted: false,
  };
}

/**
 * Validates whether a string is a base64 Data URL (image/*)
 */
export function isDataUrl(url: string): boolean {
  return typeof url === 'string' && url.startsWith('data:image/');
}

/**
 * Checks if a URL looks like a direct image or known host
 */
export function isLikelyImageUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  if (lower.startsWith('data:image/')) return true;
  if (lower.includes('drive.google.com') || lower.includes('googleusercontent.com')) return true;
  if (lower.includes('images.unsplash.com') || lower.includes('imgur.com') || lower.includes('postimg.cc') || lower.includes('ibb.co')) return true;
  if (/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i.test(lower)) return true;
  return lower.startsWith('http://') || lower.startsWith('https://');
}
