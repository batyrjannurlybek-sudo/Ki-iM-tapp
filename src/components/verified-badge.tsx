import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Blue verification check for "founding" / verified stores. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck
      className={cn("inline-block shrink-0 fill-blue-500 text-white", className)}
      aria-label="Verified"
    />
  );
}
