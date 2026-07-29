/**
 * Export Service
 * Handles exporting data in multiple formats (JSON, CSV, PDF)
 */

import html2pdf from 'html2pdf.js';
import { logger } from '@/shared/utils/logger';

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  filename?: string;
  includeTimestamp?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export interface ExportableData {
  title: string;
  data: Record<string, any>[] | Record<string, any>;
  columns?: string[];
}

// Fallback notification handlers used only when a caller doesn't supply its
// own onSuccess/onError (e.g. ExportButton.tsx wires real toasts via
// useToast() -- this is a static service class outside the React tree, so it
// can only log, not render UI).
const defaultNotify = {
  success: (message: string) => {
    logger.log('✓', message);
  },
  error: (message: string) => {
    logger.error('✗', message);
  },
};

class ExportService {
  /**
   * Export data as JSON
   */
  static exportAsJSON(data: ExportableData, options: ExportOptions): void {
    try {
      const content = {
        exportedAt: new Date().toISOString(),
        title: data.title,
        data: data.data,
      };

      const filename = this.generateFilename(options.filename || data.title, 'json');
      const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json',
      });

      this.downloadBlob(blob, filename);
      const message = 'Data exported as JSON';
      options.onSuccess?.(message) || defaultNotify.success(message);
    } catch (error) {
      const message = 'Failed to export as JSON';
      options.onError?.(message) || defaultNotify.error(message);
      logger.error('Export JSON error:', error);
    }
  }

  /**
   * Export data as CSV
   */
  static exportAsCSV(data: ExportableData, options: ExportOptions): void {
    try {
      const array = Array.isArray(data.data) ? data.data : [data.data];
      const columns = options.includeTimestamp
        ? ['exported_at', ...Object.keys(array[0] || {})]
        : Object.keys(array[0] || {});

      const header = columns.join(',');
      const rows = array.map(item =>
        columns
          .map(col => {
            const value = col === 'exported_at' ? new Date().toISOString() : item[col];
            return this.escapeCSV(value);
          })
          .join(',')
      );

      const csv = [header, ...rows].join('\n');
      const filename = this.generateFilename(options.filename || data.title, 'csv');
      const blob = new Blob([csv], { type: 'text/csv' });

      this.downloadBlob(blob, filename);
      const message = 'Data exported as CSV';
      options.onSuccess?.(message) || defaultNotify.success(message);
    } catch (error) {
      const message = 'Failed to export as CSV';
      options.onError?.(message) || defaultNotify.error(message);
      logger.error('Export CSV error:', error);
    }
  }

  /**
   * Export data as PDF
   */
  static exportAsPDF(htmlElement: HTMLElement, options: ExportOptions): void {
    try {
      const filename = this.generateFilename(options.filename || 'export', 'pdf');
      const pdfOptions = {
        margin: 10,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' },
      };

      html2pdf().set(pdfOptions).from(htmlElement).save();
      const message = 'PDF exported successfully';
      options.onSuccess?.(message) || defaultNotify.success(message);
    } catch (error) {
      const message = 'Failed to export as PDF';
      options.onError?.(message) || defaultNotify.error(message);
      logger.error('Export PDF error:', error);
    }
  }

  /**
   * Generate filename with optional timestamp
   */
  private static generateFilename(base: string, extension: string): string {
    const sanitized = base.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitized}_${timestamp}.${extension}`;
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Escape CSV special characters
   */
  private static escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }
}

export default ExportService;
