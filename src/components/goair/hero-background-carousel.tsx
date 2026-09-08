import { useEffect, useState } from "react";

/**
 * Crossfades between a handful of hero images instead of one static photo.
 * Every image is always mounted (stacked, absolutely positioned) so there's
 * no flash/reflow when switching — only opacity animates.
 */
export function HeroBackgroundCarousel({
  images,
  intervalMs = 6000,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [images.length, intervalMs]);

  return (
    <div className="absolute inset-0 -z-10 size-full overflow-hidden">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          width={1920}
          height={1088}
          fetchPriority={index === 0 ? "high" : "low"}
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: index === activeIndex ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
