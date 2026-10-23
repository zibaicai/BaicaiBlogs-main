import { useEffect, useState } from "react";
import { getToken } from "../lib/api";

/**
 * 管理端图片必须带 Bearer 加载：<img> 本身不会带 Authorization。
 * 同时管理端登录会写 HttpOnly Cookie，但旧会话可能只有 localStorage token，
 * 因此这里用 fetch + blob 作为兜底。
 */
export default function AuthImage({
  src,
  alt = "",
  className,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState(src || "");

  useEffect(() => {
    if (!src) {
      setUrl("");
      return;
    }
    let objectUrl = "";
    let cancelled = false;
    fetch(src, { headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {} })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(src);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
