/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// Mock sonner
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    error: (msg: string) => mockToastError(msg),
  },
}));

// Mock console.error
const mockConsoleError = jest.fn();
const originalConsoleError = console.error;

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Initial State', () => {
    it('should initialize with null error and false loading', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(typeof result.current.handleError).toBe('function');
      expect(typeof result.current.executeAsync).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('handleError - Error Type Handling', () => {
    it('should handle Error instances', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error message');

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error).toEqual({
        message: 'Test error message',
        code: undefined,
        details: testError,
      });
    });

    it('should handle objects with message property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { message: 'Object error message' };

      act(() => {
        result.current.handleError(errorObj);
      });

      expect(result.current.error?.message).toBe('Object error message');
    });

    it('should handle objects with message and code properties', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { message: 'Coded error', code: 'ERR_001' };

      act(() => {
        result.current.handleError(errorObj);
      });

      expect(result.current.error).toEqual({
        message: 'Coded error',
        code: 'ERR_001',
        details: errorObj,
      });
    });

    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('String error message');
      });

      expect(result.current.error).toEqual({
        message: 'String error message',
        code: undefined,
        details: 'String error message',
      });
    });

    it('should handle unknown error types with default message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(null);
      });

      expect(result.current.error?.message).toBe('Ocurrió un error inesperado');
    });

    it('should handle undefined errors with default message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(undefined);
      });

      expect(result.current.error?.message).toBe('Ocurrió un error inesperado');
    });

    it('should handle numeric errors with default message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(404);
      });

      expect(result.current.error?.message).toBe('Ocurrió un error inesperado');
      expect(result.current.error?.details).toBe(404);
    });

    it('should handle objects without message property', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { status: 500, data: 'Something went wrong' };

      act(() => {
        result.current.handleError(errorObj);
      });

      // Should use default message when no message property exists
      expect(result.current.error?.message).toBe('Ocurrió un error inesperado');
      expect(result.current.error?.details).toEqual(errorObj);
    });
  });

  describe('handleError - Toast Notifications', () => {
    it('should call toast.error with error message', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('Test error'));
      });

      expect(mockToastError).toHaveBeenCalledWith('Test error');
    });

    it('should show default Spanish message for unknown errors', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(null);
      });

      expect(mockToastError).toHaveBeenCalledWith('Ocurrió un error inesperado');
    });

    it('should call toast.error for each handleError call', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Error 1');
      });
      act(() => {
        result.current.handleError('Error 2');
      });

      expect(mockToastError).toHaveBeenCalledTimes(2);
      expect(mockToastError).toHaveBeenNthCalledWith(1, 'Error 1');
      expect(mockToastError).toHaveBeenNthCalledWith(2, 'Error 2');
    });
  });

  describe('handleError - Console Logging', () => {
    it('should log error to console', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error');
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Error handled:', expect.objectContaining({
        message: 'Test error',
      }));
    });

    it('should include error details in console log', () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorObj = { message: 'Detailed error', code: 'ERR_123' };

      act(() => {
        result.current.handleError(errorObj);
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Error handled:', expect.objectContaining({
        message: 'Detailed error',
        code: 'ERR_123',
        details: errorObj,
      }));
    });
  });

  describe('handleError - Return Value', () => {
    it('should return error info object', () => {
      const { result } = renderHook(() => useErrorHandler());
      let returnValue;

      act(() => {
        returnValue = result.current.handleError(new Error('Test'));
      });

      expect(returnValue).toEqual({
        message: 'Test',
        code: undefined,
        details: expect.any(Error),
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError('Test error');
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should be safe to call when no error exists', () => {
      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('executeAsync - Success Cases', () => {
    it('should return result on success', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockResolvedValue('success result');

      let returnValue: string | null = null;
      await act(async () => {
        returnValue = await result.current.executeAsync(mockAsyncFn);
      });

      expect(returnValue).toBe('success result');
      expect(result.current.error).toBeNull();
    });

    it('should clear previous error on new execution', async () => {
      const { result } = renderHook(() => useErrorHandler());

      // First, set an error
      act(() => {
        result.current.handleError('Previous error');
      });
      expect(result.current.error).not.toBeNull();

      // Then execute a successful async function
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle async functions returning various types', async () => {
      const { result } = renderHook(() => useErrorHandler());

      // Object result
      const objectFn = jest.fn().mockResolvedValue({ data: 'test' });
      let objectResult;
      await act(async () => {
        objectResult = await result.current.executeAsync(objectFn);
      });
      expect(objectResult).toEqual({ data: 'test' });

      // Array result
      const arrayFn = jest.fn().mockResolvedValue([1, 2, 3]);
      let arrayResult;
      await act(async () => {
        arrayResult = await result.current.executeAsync(arrayFn);
      });
      expect(arrayResult).toEqual([1, 2, 3]);

      // Null result (valid)
      const nullFn = jest.fn().mockResolvedValue(null);
      let nullResult;
      await act(async () => {
        nullResult = await result.current.executeAsync(nullFn);
      });
      expect(nullResult).toBeNull();
    });
  });

  describe('executeAsync - Error Cases', () => {
    it('should return null on error', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Async error'));

      let returnValue: string | null = 'initial';
      await act(async () => {
        returnValue = await result.current.executeAsync(mockAsyncFn);
      });

      expect(returnValue).toBeNull();
    });

    it('should set error state on failure', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Failed operation'));

      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });

      expect(result.current.error?.message).toBe('Failed operation');
    });

    it('should call toast.error on failure', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Toast error'));

      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });

      expect(mockToastError).toHaveBeenCalledWith('Toast error');
    });
  });

  describe('executeAsync - Loading State', () => {
    it('should set loading true during execution', async () => {
      const { result } = renderHook(() => useErrorHandler());

      // Create a promise we can control
      let resolvePromise: (value: string) => void;
      const controlledPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      const mockAsyncFn = jest.fn().mockImplementation(() => controlledPromise);

      // Start execution but don't await
      let executePromise: Promise<string | null>;
      act(() => {
        executePromise = result.current.executeAsync(mockAsyncFn);
      });

      // Check loading state while promise is pending
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!('done');
        await executePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading false after successful completion', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockResolvedValue('success');

      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading false after error', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error('Error'));

      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle multiple sequential executions', async () => {
      const { result } = renderHook(() => useErrorHandler());

      const fn1 = jest.fn().mockResolvedValue('first');
      const fn2 = jest.fn().mockResolvedValue('second');

      await act(async () => {
        await result.current.executeAsync(fn1);
      });
      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        await result.current.executeAsync(fn2);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('should maintain stable function references across renders', () => {
      const { result, rerender } = renderHook(() => useErrorHandler());

      const initialHandleError = result.current.handleError;
      const initialExecuteAsync = result.current.executeAsync;
      const initialClearError = result.current.clearError;

      rerender();

      expect(result.current.handleError).toBe(initialHandleError);
      expect(result.current.executeAsync).toBe(initialExecuteAsync);
      expect(result.current.clearError).toBe(initialClearError);
    });
  });
});
