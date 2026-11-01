"use client";

import { useEffect, useState } from "react";
import { useSiteConfigContext } from "../context/SiteConfigProvider";

const ROTATE_MS = 10_000;

export default function BackgroundSlider({ images: provided }: { images?: string[] }) {
  const { background } = useSiteConfigContext();
  const images = provided?.length ? provided : background?.bgImages || [];
  const imageKey = images.join("|");
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
    if (images.length < 2) return;

    let timer: number | null = null;
    let paused = false;
    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => {
        setActive((current) => (current + 1) % images.length);
      }, ROTATE_MS);
    };
    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };
    const onScrollActivity = (event: Event) => {
      const scrolling = (event as CustomEvent<{ scrolling?: boolean }>).detail?.scrolling === true;
      if (scrolling) {
        paused = true;
        stop();
        return;
      }
      if (paused) {
        paused = false;
        start();
      }
    };

    start();
    window.addEventListener("scroll-activity", onScrollActivity);
    return () => {
      stop();
      window.removeEventListener("scroll-activity", onScrollActivity);
    };
    // imageKey intentionally represents the image list; the array may be recreated by context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);

  if (images.length === 0) return null;

  return (
    <div className="background-slider absolute inset-0 z-[-10] overflow-hidden" aria-hidden="true">
      {images.map((source, index) => (
        <div
          key={`${source}-${index}`}
          className="absolute inset-0 transform-gpu bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out"
          style={{
            backgroundImage: `url(${source})`,
            opacity: index === active ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}
