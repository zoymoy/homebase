import { Recurrence } from '@/types';
import { addDays, addWeeks, getDay, setDay } from 'date-fns';

export function getNextDeadline(
  currentDeadline: Date,
  recurrence: Recurrence
): Date {
  switch (recurrence.type) {
    case 'daily':
      return addDays(currentDeadline, 1);

    case 'weekly': {
      if (!recurrence.daysOfWeek?.length) {
        return addWeeks(currentDeadline, 1);
      }
      const currentDay = getDay(currentDeadline);
      const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
      const nextDay = sortedDays.find((d) => d > currentDay);

      if (nextDay !== undefined) {
        return setDay(currentDeadline, nextDay);
      }
      // Wrap to next week's first day
      return setDay(addWeeks(currentDeadline, 1), sortedDays[0]);
    }

    case 'custom':
      return addDays(currentDeadline, recurrence.intervalDays ?? 1);

    default:
      return addDays(currentDeadline, 1);
  }
}
