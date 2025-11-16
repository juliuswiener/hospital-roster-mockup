import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MonthCalendar } from '@mui/x-date-pickers/MonthCalendar';
import { YearCalendar } from '@mui/x-date-pickers/YearCalendar';
import dayjs from 'dayjs';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import 'dayjs/locale/de';

const MonthYearPicker = ({ selectedMonth, onMonthChange, errorCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('month'); // 'month' or 'year'
  const currentDate = dayjs(selectedMonth);

  const handleMonthChange = (newDate) => {
    onMonthChange(newDate.format('YYYY-MM'));
    setIsOpen(false);
  };

  const handleYearChange = (newDate) => {
    onMonthChange(newDate.format('YYYY-MM'));
    setView('month');
  };

  const handlePrevMonth = () => {
    const prevMonth = currentDate.subtract(1, 'month');
    onMonthChange(prevMonth.format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    const nextMonth = currentDate.add(1, 'month');
    onMonthChange(nextMonth.format('YYYY-MM'));
  };

  const formatDisplayDate = () => {
    return currentDate.locale('de').format('MMMM YYYY');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Previous Month Button */}
      <button
        onClick={handlePrevMonth}
        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Vorheriger Monat"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Month/Year Picker */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Calendar size={18} />
          <span className="font-medium">{formatDisplayDate()}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setView('month')}
                  className={`flex-1 px-3 py-2 rounded ${
                    view === 'month'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monat
                </button>
                <button
                  onClick={() => setView('year')}
                  className={`flex-1 px-3 py-2 rounded ${
                    view === 'year'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Jahr
                </button>
              </div>

              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
                {view === 'month' ? (
                  <MonthCalendar
                    value={currentDate}
                    onChange={handleMonthChange}
                  />
                ) : (
                  <YearCalendar
                    value={currentDate}
                    onChange={handleYearChange}
                  />
                )}
              </LocalizationProvider>
            </div>
          </>
        )}
      </div>

      {/* Next Month Button */}
      <button
        onClick={handleNextMonth}
        className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="Nächster Monat"
      >
        <ChevronRight size={18} />
      </button>

      {/* Error Indicator */}
      {errorCount > 0 && (
        <div
          className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700"
          title={`${errorCount} Fehler im aktuellen Plan`}
        >
          <AlertCircle size={18} className="text-red-600" />
          <span className="font-semibold text-sm">{errorCount}</span>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker;
