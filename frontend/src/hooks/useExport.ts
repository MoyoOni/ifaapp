import { useCallback } from 'react';
import ExportService, { ExportableData, ExportOptions } from '@/services/exportService';

/**
 * Hook for exporting data in multiple formats
 */
export const useExport = () => {
  const exportJSON = useCallback((data: ExportableData, options?: Partial<ExportOptions>) => {
    ExportService.exportAsJSON(data, { format: 'json', ...options });
  }, []);

  const exportCSV = useCallback((data: ExportableData, options?: Partial<ExportOptions>) => {
    ExportService.exportAsCSV(data, { format: 'csv', ...options });
  }, []);

  const exportPDF = useCallback(
    (element: HTMLElement, options?: Partial<ExportOptions>) => {
      ExportService.exportAsPDF(element, { format: 'pdf', ...options });
    },
    []
  );

  return {
    exportJSON,
    exportCSV,
    exportPDF,
  };
};

export default useExport;
