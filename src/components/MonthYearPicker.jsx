import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MonthCalendar } from '@mui/x-date-pickers/MonthCalendar';
import { YearCalendar } from '@mui/x-date-pickers/YearCalendar';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';
import 'dayjs/locale/de';

const MonthYearPicker = ({ selectedMonth, onMonthChange }) => {
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

  const formatDisplayDate = () => {
    return currentDate.locale('de').format('MMMM YYYY');
  };

  return (
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
  );
};

export default MonthYearPicker;
