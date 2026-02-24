import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface AddToCalendarProps {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  timezone?: string;
}

/**
 * Add to Calendar Component
 * Generates calendar links for Google Calendar, Apple/Outlook (.ics), and Yahoo Calendar
 */
const AddToCalendar: React.FC<AddToCalendarProps> = ({
  title,
  description = '',
  location = '',
  startDate,
  endDate,
  timezone = 'Africa/Lagos',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Format date for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  // Format date for ICS (YYYYMMDDTHHmmss)
  const formatICSDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1);
  };

  // Calculate end date if not provided (default 1 hour)
  const effectiveEndDate = endDate || new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString();

  // Google Calendar URL
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(effectiveEndDate)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&ctz=${timezone}`;

  // Yahoo Calendar URL
  const yahooUrl = `https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(title)}&st=${formatGoogleDate(startDate)}&et=${formatGoogleDate(effectiveEndDate)}&desc=${encodeURIComponent(description)}&in_loc=${encodeURIComponent(location)}`;

  // Generate ICS file content
  const generateICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ìlú Àṣẹ//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(effectiveEndDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  };

  // Download ICS file
  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-stone-700 font-bold text-sm hover:bg-stone-50 transition-colors"
      >
        <Calendar size={16} />
        Add to Calendar
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 z-20 overflow-hidden">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-sm text-stone-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.568 8.16c-.18-.672-.72-1.152-1.392-1.332-.672-.18-3.384-.18-3.384-.18s-2.712 0-3.384.18c-.672.18-1.212.66-1.392 1.332C7.836 8.832 7.836 12 7.836 12s0 3.168.18 3.84c.18.672.72 1.152 1.392 1.332.672.18 3.384.18 3.384.18s2.712 0 3.384-.18c.672-.18 1.212-.66 1.392-1.332.18-.672.18-3.84.18-3.84s0-3.168-.18-3.84z"/>
              </svg>
              Google Calendar
            </a>
            <button
              onClick={downloadICS}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-sm text-stone-700 w-full text-left"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Apple Calendar
            </button>
            <button
              onClick={downloadICS}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-sm text-stone-700 w-full text-left"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V12h2.25v4.5q0 .23.15.38.16.16.38.16h.62q.22 0 .38-.16.15-.15.15-.38V12h2.25v4.5q0 .23.15.38.16.16.38.16h.62q.22 0 .38-.16.15-.15.15-.38V12h2.25v4.5q0 .23.16.38.15.16.37.16h.63q.22 0 .38-.16.16-.15.16-.38V12H15v4.5q0 .23.15.38.16.16.38.16h.62q.22 0 .38-.16.15-.15.15-.38V12h2.25v4.5q0 .23.16.38.15.16.37.16h.63q.23 0 .38-.16.16-.15.16-.38V12H24zm-7.13 6h-1.5v-1.5h1.5V18zm3 0h-1.5v-1.5h1.5V18zm0-3h-1.5v-1.5h1.5V15zm0 6h-1.5v-1.5h1.5V21zM1 12q0-.46.33-.8.33-.32.8-.32h14.27l-4.65-4.65q-.32-.32-.32-.77 0-.46.32-.78l.72-.72q.32-.32.78-.32.45 0 .77.32l7.24 7.24q.16.16.24.36.07.21.07.42t-.07.42q-.08.2-.24.36l-7.24 7.24q-.32.32-.77.32-.46 0-.78-.32l-.72-.72q-.32-.32-.32-.78 0-.45.32-.77l4.65-4.65H2.13q-.47 0-.8-.33Q1 12.47 1 12z"/>
              </svg>
              Outlook
            </button>
            <a
              href={yahooUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-sm text-stone-700 border-t border-stone-100"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.3 8.9l-3 5.5v3.8c0 .3-.2.5-.5.5h-3.6c-.3 0-.5-.2-.5-.5v-3.8l-3-5.5c-.2-.3 0-.6.3-.6h3.1c.2 0 .4.1.4.3l1.4 3.4c.1.1.2.2.3.2s.2-.1.3-.2l1.4-3.4c.1-.2.2-.3.4-.3h3.1c.4 0 .6.3.3.6z"/>
              </svg>
              Yahoo Calendar
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCalendar;
