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

  const handleError = useCallback((error: unknown) => {
    const isErrorWithMessage = (error: unknown): error is { message: string; code?: string; details?: unknown } => {
      return typeof error === 'object' && error !== null && 'message' in error;
    };

    const errorInfo: ErrorInfo = {
      message: isErrorWithMessage(error) ? error.message : 'Ocurrió un error inesperado',
      code: isErrorWithMessage(error) ? error.code : undefined,
      details: isErrorWithMessage(error) ? error.details : error
    };

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