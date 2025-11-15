import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setEmployees } from '../store/slices/employeesSlice';
import { setShifts } from '../store/slices/shiftsSlice';
import { setAssignments } from '../store/slices/assignmentsSlice';
import { setRules } from '../store/slices/rulesSlice';
import {
  employees as mockEmployees,
  shifts as mockShifts,
  initialRules,
  scheduleData,
} from '../data';

/**
 * Hook to initialize Redux store with mock data
 * This converts the existing mock data format to the Redux store format
 */
export function useInitializeStore() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Convert employees to store format
    const employeesWithIds = mockEmployees.map((emp, index) => ({
      id: `emp-${index}-${emp.initials}`,
      name: emp.name,
      initials: emp.initials,
      contractType: emp.contract,
      weeklyHours: emp.hours,
      qualifications: emp.qualifications,
    }));

    // Convert shifts to store format
    const shiftsWithIds = mockShifts.map((shift, index) => {
      let durationMinutes = 480;

      if (typeof shift.time === 'string' && shift.time.includes('-')) {
        const [start, end] = shift.time.split('-');

        // Calculate duration
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        let mins = (endH * 60 + endM) - (startH * 60 + startM);
        if (mins < 0) mins += 24 * 60; // Overnight
        durationMinutes = mins;
      }

      return {
        id: `shift-${index}-${shift.name}`,
        name: shift.name,
        category: shift.category,
        description: shift.description,
        station: shift.station,
        time: shift.time,
        durationMinutes,
        requirements: shift.requirements,
        rules: shift.rules,
      };
    });

    // Convert schedule data to assignments
    const assignments: Array<{
      id: string;
      employeeId: string;
      shiftId: string;
      date: string;
      station: string;
      isLocked: boolean;
      hasViolation: boolean;
      violations: string[];
      notes: string;
    }> = [];

    Object.entries(scheduleData).forEach(([empInitials, days]) => {
      const employee = employeesWithIds.find((e) => e.initials === empInitials);
      if (!employee) return;

      Object.entries(days as unknown as Record<string, { shift: string; station: string; locked?: boolean; violation?: boolean } | null>).forEach(
        ([day, data]) => {
          if (!data) return; // Skip null entries
          const shift = shiftsWithIds.find((s) => s.name === data.shift);
          if (!shift) return;

          const dayNum = parseInt(day, 10);
          const dateStr = `2025-10-${String(dayNum).padStart(2, '0')}`;

          assignments.push({
            id: `assign-${employee.id}-${dateStr}`,
            employeeId: employee.id,
            shiftId: shift.id,
            date: dateStr,
            station: data.station,
            isLocked: data.locked || false,
            hasViolation: data.violation || false,
            violations: [],
            notes: '',
          });
        }
      );
    });

    // Convert rules to store format
    const rulesWithFormat = initialRules.map((rule) => ({
      id: `rule-${rule.id}`,
      type: rule.type as 'hard' | 'soft',
      text: rule.text,
      category: rule.category,
      appliesTo: rule.appliesTo,
      source: rule.source,
      weight: 5,
      isActive: true,
    }));

    // Dispatch to store
    dispatch(setEmployees(employeesWithIds));
    dispatch(setShifts(shiftsWithIds));
    dispatch(setAssignments(assignments));
    dispatch(setRules(rulesWithFormat));
  }, [dispatch]);
}

export default useInitializeStore;
