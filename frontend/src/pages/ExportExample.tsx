import React, { useRef } from 'react';
import ExportButton from '@/components/ExportButton';
import { useExport } from '@/hooks/useExport';
import { ExportableData } from '@/services/exportService';

/**
 * Example page showing export functionality
 */
const ExportExample: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const { exportJSON, exportCSV, exportPDF } = useExport();

  // Example data for demonstration
  const exampleData: ExportableData = {
    title: 'Assessment Results',
    data: [
      {
        id: 1,
        name: 'Assessment 1',
        score: 85,
        date: '2024-01-15',
        category: 'Spiritual',
      },
      {
        id: 2,
        name: 'Assessment 2',
        score: 92,
        date: '2024-01-16',
        category: 'Physical',
      },
      {
        id: 3,
        name: 'Assessment 3',
        score: 78,
        date: '2024-01-17',
        category: 'Mental',
      },
    ],
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    if (format === 'pdf' && pdfRef.current) {
      exportPDF(pdfRef.current, { filename: 'assessment_report' });
    } else if (format === 'csv') {
      exportCSV(exampleData, { filename: 'assessment_data' });
    } else {
      exportJSON(exampleData, { filename: 'assessment_data' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Export Functionality Demo</h1>

      {/* Export Controls */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Export Options</h2>
        <ExportButton
          data={exampleData}
          formats={['json', 'csv', 'pdf']}
          buttonLabel="Download Data"
        />
      </div>

      {/* Example Content for PDF Export */}
      <div
        ref={pdfRef}
        className="mb-8 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Assessment Report</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Generated on: {new Date().toLocaleDateString()}
        </p>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-3 font-semibold">Assessment Name</th>
              <th className="text-left p-3 font-semibold">Score</th>
              <th className="text-left p-3 font-semibold">Date</th>
              <th className="text-left p-3 font-semibold">Category</th>
            </tr>
          </thead>
          <tbody>
            {exampleData.data &&
              Array.isArray(exampleData.data) &&
              exampleData.data.map(item => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.score}%</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3">{item.category}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className="text-sm text-gray-500">
            This is an example report. Your actual data will be used when exporting.
          </p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Usage Instructions</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          <li>Click "Download Data" to see available export formats</li>
          <li>JSON export includes full data structure</li>
          <li>CSV export creates a spreadsheet-compatible format</li>
          <li>PDF export renders the report section above</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportExample;
