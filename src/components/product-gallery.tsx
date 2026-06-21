"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  videoUrl,
  title,
}: {
  images: string[];
  videoUrl: string | null;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const total = images.length + (videoUrl ? 1 : 0);
  const isVideo = (i: number) => videoUrl != null && i === images.length;

  const go = useCallback(
    (dir: 1 | -1) => setActive((a) => (a + dir + total) % total),
    [total]
  );

  // Keyboard navigation while fullscreen.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen, go]);

  function renderMedia(i: number, full: boolean) {
    if (isVideo(i)) {
      return (
        <video
          src={videoUrl!}
          controls
          playsInline
          className={cn("h-full w-full", full ? "object-contain" : "object-cover")}
        />
      );
    }
    if (!images[i]) {
      return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">—</div>;
    }
    return (
      <Image
        src={images[i]}
        alt={title}
        fill
        priority={!full}
        quality={90}
        sizes={full ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
        className={cn(full ? "object-contain" : "object-cover")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Main media — click to open fullscreen */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        {renderMedia(active, false)}
        {!isVideo(active) && (
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Fullscreen"
            className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}
        {/* Tap-zones to open fullscreen on the image area */}
        {!isVideo(active) && (
          <button
            onClick={() => setFullscreen(true)}
            aria-label="Open image"
            className="absolute inset-0 cursor-zoom-in"
          />
        )}
      </div>

      {/* Thumbnails */}
      {total > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                active === i ? "border-primary" : "border-transparent"
              )}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
          {videoUrl && (
            <button
              onClick={() => setActive(images.length)}
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 bg-muted text-xs",
                isVideo(active) ? "border-primary" : "border-transparent"
              )}
            >
              ▶ Video
            </button>
          )}
        </div>
      )}

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <button
            onClick={() => setFullscreen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-full w-full">{renderMedia(active, true)}</div>

          {total > 1 && (
            <>
              <button
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {active + 1} / {total}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
