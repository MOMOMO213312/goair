import { useEffect, useState } from "react";

type Slide = {
  src: string;
  alt: string;
};

/**
 * Crossfading background-image carousel for the homepage hero. Renders every
 * slide stacked (absolute, inset-0) and fades between them on a timer — no
 * layout shift, no JS-driven width/height changes, just opacity.
 */
export function HeroImageCarousel({
  slides,
  intervalMs = 5000,
}: {
  slides: Slide[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className="absolute inset-0 -z-10">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          width={1920}
          height={1280}
          fetchPriority={index === 0 ? "high" : "low"}
          decoding="async"
          loading={index === 0 ? "eager" : "lazy"}
          className="absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === active ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
