"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export function SearchBar({
  defaultValue = "",
  size = "lg",
  className,
}: {
  defaultValue?: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState(defaultValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={submit} className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.searchPlaceholder}
        className={cn("pl-12", size === "lg" && "h-14 rounded-2xl text-base")}
        autoComplete="off"
      />
    </form>
  );
}
