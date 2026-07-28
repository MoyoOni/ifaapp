import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExportService, { ExportableData, ExportOptions } from './exportService';

// Mock global URL object
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  configurable: false,
  writable: false
});

describe('ExportService', () => {
  // Mock document.createElement for anchor tags
  const originalCreateElement = document.createElement;
  const mockCreateElement = vi.fn((tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLElement;
    }
    return originalCreateElement.call(document, tag);
  });

  beforeEach(() => {
    // Reset mocks
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    
    // Mock document.createElement
    document.createElement = mockCreateElement;
  });

  it('should create an instance', () => {
    expect(new ExportService()).toBeInstanceOf(ExportService);
  });

  it('should export data as JSON', () => {
    const data: ExportableData = { title: 'test', data: [{ id: 1, name: 'Test' }] };
    const options: ExportOptions = { format: 'json', filename: 'test' };

    ExportService.exportAsJSON(data, options);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should export data as CSV', () => {
    const data: ExportableData = { title: 'test', data: [{ id: 1, name: 'Test' }] };
    const options: ExportOptions = { format: 'csv', filename: 'test' };

    ExportService.exportAsCSV(data, options);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('reports failure via onError instead of throwing when export fails', () => {
    const data = { title: 'test', data: null } as unknown as ExportableData;
    const onError = vi.fn();
    const options: ExportOptions = { format: 'csv', filename: 'test', onError };

    // array[0] is undefined when data.data is null, so Object.keys(array[0] || {})
    // succeeds but the resulting single-row CSV would come from bad input --
    // force a real failure by making the mocked URL API throw.
    mockCreateObjectURL.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    ExportService.exportAsCSV(data, options);

    expect(onError).toHaveBeenCalledWith('Failed to export as CSV');
  });
});