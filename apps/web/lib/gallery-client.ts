export interface GalleryPhoto {
  id: number;
  albumId: number;
  thumbUrl: string;
  standardUrl: string;
  originalUrl: string;
  caption: string;
  weight: number;
  width: number;
  height: number;
  bytes: number;
  status: string;
}

export interface GalleryAlbum {
  albumId: string;
  title: string;
  description: string;
  visibility: string;
  hasPassword: boolean;
  status: string;
  photoCount: number;
  coverThumbUrl: string | null;
  photos?: GalleryPhoto[];
}

export async function galleryRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    ...init,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.message || `请求失败 (${res.status})`);
  return json.data as T;
}

export function uploadToOss(url: string, file: File, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`OSS HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("OSS 上传网络错误"));
    xhr.send(file);
  });
}

export function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
