import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import useApiError from './use-api-error';

describe('useApiError', () => {
  it('should initialize with no error and not loading', () => {
    const { result } = renderHook(() => useApiError());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful API call', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('success');

    const { result } = renderHook(() => useApiError());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.handleApiCall(mockApiFunction);
    });

    expect(returnValue).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle API error with status', async () => {
    const mockError = {
      status: 404,
      statusText: 'Not Found',
      message: 'Resource not found',
    };

    const mockApiFunction = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.handleApiCall(mockApiFunction);
    });

    expect(result.current.error).toEqual({
      message: 'Not Found',
      status: 404,
      details: 'Resource not found',
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle generic error', async () => {
    const mockError = new Error('Generic error');

    const mockApiFunction = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.handleApiCall(mockApiFunction);
    });

    expect(result.current.error).toEqual({
      message: 'Generic error',
      details: 'Generic error',
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should call onSuccess callback when API call succeeds', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('success');
    const mockOnSuccess = vi.fn();

    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.handleApiCall(mockApiFunction, {
        onSuccess: mockOnSuccess,
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith('success');
  });

  it('should call onError callback when API call fails', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);
    const mockOnError = vi.fn();

    const { result } = renderHook(() => useApiError());

    await act(async () => {
      await result.current.handleApiCall(mockApiFunction, {
        onError: mockOnError,
      });
    });

    expect(mockOnError).toHaveBeenCalledWith({
      message: 'API Error',
      details: 'API Error',
    });
  });

  it('should clear error', async () => {
    const { result } = renderHook(() => useApiError());

    // First trigger an error
    const mockError = new Error('Test error');
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);

    await act(async () => {
      await result.current.handleApiCall(mockApiFunction);
    });

    // Verify error is present
    expect(result.current.error).not.toBeNull();

    // Clear the error
    await act(async () => {
      result.current.clearError();
    });

    // Verify error is cleared
    expect(result.current.error).toBeNull();
  });
});