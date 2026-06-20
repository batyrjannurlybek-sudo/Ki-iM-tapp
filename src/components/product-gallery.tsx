"use client";

import Image from "next/image";
import { useState } from "react";
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
  const showVideo = videoUrl && active === images.length;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        {showVideo ? (
          <video src={videoUrl!} controls playsInline className="h-full w-full object-cover" />
        ) : images[active] ? (
          <Image
            src={images[active]}
            alt={title}
            fill
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {(images.length > 1 || videoUrl) && (
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
                showVideo ? "border-primary" : "border-transparent"
              )}
            >
              ▶ Video
            </button>
          )}
        </div>
      )}
    </div>
  );
}
