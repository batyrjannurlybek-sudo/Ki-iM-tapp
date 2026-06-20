"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="text-xl font-bold">Что-то пошло не так / Бірдеңе дұрыс болмады</h1>
      <p className="text-sm text-muted-foreground">
        Не удалось загрузить данные. Попробуйте обновить страницу.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">Код: {error.digest}</p>
      )}
      <Button onClick={reset}>Обновить / Жаңарту</Button>
    </div>
  );
}
