import React, { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import ExportService, { ExportableData, ExportOptions } from '@/services/exportService';
import { useToast } from '@/shared/components/toast';
import './ExportButton.css';

interface ExportButtonProps {
  data: ExportableData;
  formats?: ('json' | 'csv' | 'pdf')[];
  buttonLabel?: string;
  className?: string;
  pdfElementRef?: React.RefObject<HTMLElement>;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  formats = ['json', 'csv'],
  buttonLabel = 'Export',
  className = '',
  pdfElementRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { success, error: showError } = useToast();

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    const options: ExportOptions = {
      format,
      includeTimestamp: true,
      onSuccess: success,
      onError: showError,
    };

    if (format === 'pdf' && pdfElementRef?.current) {
      ExportService.exportAsPDF(pdfElementRef.current, options);
    } else if (format === 'csv') {
      ExportService.exportAsCSV(data, options);
    } else {
      ExportService.exportAsJSON(data, options);
    }

    setIsOpen(false);
  };

  const formatLabels: Record<string, string> = {
    json: 'Export as JSON',
    csv: 'Export as CSV',
    pdf: 'Export as PDF',
  };

  return (
    <div className={`export-button-container ${className}`} ref={menuRef}>
      <button
        className="export-button"
        onClick={() => setIsOpen(!isOpen)}
        title={buttonLabel}
        aria-label={buttonLabel}
      >
        <Download size={18} />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="export-menu">
          {formats.map(format => (
            <button
              key={format}
              className="export-menu-item"
              onClick={() => handleExport(format)}
            >
              {formatLabels[format]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
