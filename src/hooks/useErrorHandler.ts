import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorInfo {
  message: string;
  code?: string;
  details?: unknown;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((err: unknown) => {
    let message = 'Ocurrió un error inesperado';
    let code: string | undefined;
    let details: unknown;

    if (err instanceof Error) {
      message = err.message;
      details = err;
    } else if (typeof err === 'object' && err !== null) {
      const errorObj = err as Record<string, unknown>;
      if (typeof errorObj.message === 'string') {
        message = errorObj.message;
      }
      if (typeof errorObj.code === 'string') {
        code = errorObj.code;
      }
      details = err;
    } else if (typeof err === 'string') {
      message = err;
      details = err;
    } else {
      details = err;
    }

    const errorInfo: ErrorInfo = { message, code, details };

    setError(errorInfo);
    
    // Mostrar toast de error
    toast.error(errorInfo.message);
    
    // Log del error
    console.error('Error handled:', errorInfo);
    
    return errorInfo;
  }, []);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await asyncFn();
      return result;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    handleError,
    executeAsync,
    clearError
  };
} 