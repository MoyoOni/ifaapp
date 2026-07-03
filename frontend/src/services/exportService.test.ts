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

  it('should export data as JSON', async () => {
    const service = new ExportService();
    const data: ExportableData = { data: [{ id: 1, name: 'Test' }] };
    const options: ExportOptions = { format: 'json', filename: 'test' };

    await service.export(data, options);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should export data as CSV', async () => {
    const service = new ExportService();
    const data: ExportableData = { data: [{ id: 1, name: 'Test' }] };
    const options: ExportOptions = { format: 'csv', filename: 'test' };

    await service.export(data, options);

    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should throw an error for unsupported formats', async () => {
    const service = new ExportService();
    const data: ExportableData = { data: [{ id: 1, name: 'Test' }] };
    const options: ExportOptions = { format: 'xml' as any, filename: 'test' };

    await expect(service.export(data, options)).rejects.toThrow('Unsupported format: xml');
  });
});