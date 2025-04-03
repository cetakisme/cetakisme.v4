import { Absensi } from "@prisma/client";
import { DateTime } from "luxon";

const isToday = (date: Date, now: Date): boolean => {
  const today = now;
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

function splitAtMidnight(
  enter: Date,
  exit: Date,
): { yesterday: Date; today: Date } {
  const midnight = new Date(enter);

  midnight.setHours(0, 0, 0, 0); // Set to the start of the day
  midnight.setDate(midnight.getDate() + 1);

  const nextMidnight = new Date(midnight);
  nextMidnight.setDate(midnight.getDate() + 1); // Next day at 00:00

  if (exit <= midnight) {
    // Entire duration is before midnight
    return {
      yesterday: new Date(exit.getTime() - enter.getTime()),
      today: new Date(0),
    };
  } else if (enter >= midnight) {
    // Entire duration is after midnight
    return {
      yesterday: new Date(0),
      today: new Date(exit.getTime() - enter.getTime()),
    };
  } else {
    // Split occurs at midnight
    return {
      yesterday: new Date(midnight.getTime() - enter.getTime()), // Time before midnight
      today: new Date(exit.getTime() - midnight.getTime()), // Time after midnight
    };
  }
}

export function dateToHMS(date: Date): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const dt = DateTime.fromJSDate(date);
  return {
    hours: dt.hour,
    minutes: dt.minute,
    seconds: dt.second,
  };
}

export function dateDiff(start: Date, end: Date) {
  const dt = DateTime.fromJSDate(end).diff(DateTime.fromJSDate(start), [
    "hours",
    "minutes",
    "seconds",
  ]);

  return {
    hours: dt.hours,
    minutes: dt.minutes,
    seconds: dt.seconds,
  };
}

function addDates(date1: Date, date2: Date): Date {
  const totalMilliseconds = date1.getTime() + date2.getTime();
  return new Date(totalMilliseconds);
}

export function absen(
  pastAbsensi: Absensi,
  now: Date,
): {
  isChangingDay: boolean;
  old: Absensi;
  new: Absensi;
} {
  if (!pastAbsensi.isActive) {
    return {
      isChangingDay: false,
      old: pastAbsensi,
      new: { ...pastAbsensi, exit: null, isActive: true, enter: now },
    };
  }

  if (isToday(pastAbsensi.enter, now)) {
    const totalHour = DateTime.fromJSDate(now).diff(
      DateTime.fromJSDate(pastAbsensi.enter),
      ["hours", "minutes", "seconds"],
    );

    const todayTotalHour = new Date(totalHour.toMillis());

    return {
      isChangingDay: false,
      old: pastAbsensi,
      new: {
        ...pastAbsensi,
        isActive: false,
        totalHour: addDates(pastAbsensi.totalHour, todayTotalHour),
        exit: now,
      },
    };
  } else {
    const { yesterday, today } = splitAtMidnight(pastAbsensi.enter, now);

    return {
      isChangingDay: true,
      old: {
        ...pastAbsensi,
        isActive: false,
        totalHour: addDates(pastAbsensi.totalHour, yesterday),
        exit: now,
      },
      new: {
        ...pastAbsensi,
        isActive: false,
        totalHour: addDates(pastAbsensi.totalHour, today),
        exit: now,
      },
    };
  }
}
