import { addDays, format, isAfter, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const APP_TIMEZONE = "Europe/London";

export function zonedNow() {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

export function formatMeetingDate(date: Date) {
  return format(toZonedTime(date, APP_TIMEZONE), "EEEE d MMMM yyyy");
}

export function startOfLondonDay(date: Date) {
  return startOfDay(toZonedTime(date, APP_TIMEZONE));
}

export function londonDateAtTime(date: Date, hours: number, minutes: number) {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  zoned.setHours(hours, minutes, 0, 0);
  return fromZonedTime(zoned, APP_TIMEZONE);
}

export function getNextFridays(count: number, fromDate = new Date()) {
  const base = toZonedTime(fromDate, APP_TIMEZONE);
  const start = new Date(base);
  while (start.getDay() !== 5) {
    start.setDate(start.getDate() + 1);
  }

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index * 7);
    date.setHours(9, 0, 0, 0);
    return fromZonedTime(date, APP_TIMEZONE);
  });
}

export function nonAttendanceCutoff(meetingDate: Date) {
  const meeting = toZonedTime(meetingDate, APP_TIMEZONE);
  const cutoff = addDays(meeting, -2);
  cutoff.setHours(18, 0, 0, 0);
  return fromZonedTime(cutoff, APP_TIMEZONE);
}

export function speakerConfirmCutoff(meetingDate: Date) {
  const meeting = toZonedTime(meetingDate, APP_TIMEZONE);
  const cutoff = addDays(meeting, -7);
  cutoff.setHours(18, 0, 0, 0);
  return fromZonedTime(cutoff, APP_TIMEZONE);
}

export function hasCutoffPassed(cutoff: Date, now = new Date()) {
  return isAfter(now, cutoff);
}
