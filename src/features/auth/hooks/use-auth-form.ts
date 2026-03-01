"use client";

import { useState, useCallback } from "react";
import type { AuthError } from "../types";

interface UseAuthFormOptions<T> {
  validate: (data: T) => AuthError[] | null;
  onSubmit: (data: T) => Promise<{ error: { message: string } | null }>;
  onSuccess: () => void;
}

export function useAuthForm<T>({
  validate,
  onSubmit,
  onSuccess,
}: UseAuthFormOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<AuthError[]>([]);

  const handleSubmit = useCallback(
    async (data: T) => {
      setErrors([]);
      const validationErrors = validate(data);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await onSubmit(data);
        if (error) {
          setErrors([{ message: error.message, field: "root" }]);
          return;
        }
        onSuccess();
      } finally {
        setIsLoading(false);
      }
    },
    [validate, onSubmit, onSuccess]
  );

  return { isLoading, errors, handleSubmit, setErrors };
}
