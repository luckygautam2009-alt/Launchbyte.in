"use client";

import React, { useEffect, useState } from "react";
import { clsx } from "clsx";
import { resolveMediaUrl } from "@/lib/media";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: AvatarSize;
  shape?: "circle" | "rounded" | "square";
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
}

const SIZE_CLASSES: Record<Exclude<AvatarSize, "fill">, string> = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-24 h-24 text-2xl",
};

const SHAPE_CLASSES = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
};

function getInitials(name?: string | null): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return "U";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned[0].toUpperCase();
}

export function Avatar({
  src,
  name,
  alt,
  size = "md",
  shape = "circle",
  className,
  imgClassName,
  fallback,
  onError,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const resolved = resolveMediaUrl(src);
  const showImage = Boolean(resolved && !failed);
  const containerSize = size === "fill" ? "w-full h-full" : SIZE_CLASSES[size];

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-semibold text-[#17172B] dark:text-slate-200 shrink-0 select-none",
        containerSize,
        SHAPE_CLASSES[shape],
        className
      )}
    >
      {showImage ? (
        <img
          src={resolved}
          alt={alt ?? name ?? "Avatar"}
          className={clsx("w-full h-full object-cover", imgClassName)}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      ) : (
        fallback ?? <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
export default Avatar;
