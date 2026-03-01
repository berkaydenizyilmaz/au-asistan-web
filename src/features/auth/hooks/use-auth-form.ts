"use client";

import { useState, useCallback } from "react";
import type { ZodSchema, ZodIssue } from "zod";

interface UseAuthFormOptions<T> {
  schema: ZodSchema<T>;
  onSubmit: (data: T) => Promise<{ error: { message: string } | null }>;
  onSuccess: () => void;
}

export function useAuthForm<T>({
  schema,
  onSubmit,
  onSuccess,
}: UseAuthFormOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ZodIssue[]>([]);
  const [rootError, setRootError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (raw: unknown) => {
      setErrors([]);
      setRootError(null);

      const result = schema.safeParse(raw);
      if (!result.success) {
        setErrors(result.error.issues);
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await onSubmit(result.data);
        if (error) {
          setRootError(error.message);
          return;
        }
        onSuccess();
      } finally {
        setIsLoading(false);
      }
    },
    [schema, onSubmit, onSuccess]
  );

  function getFieldError(field: string): string | undefined {
    return errors.find((e) => e.path[0] === field)?.message;
  }

  return { isLoading, errors, rootError, handleSubmit, getFieldError };
}
