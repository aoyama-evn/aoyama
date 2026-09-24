import { registerAs } from '@nestjs/config';

/** Nguong thoi gian cua quy tac nghiep vu BR-04..BR-08 — cau hinh duoc tai SA-43. */
export default registerAs('booking', () => ({
  cancelCutoffHours: parseInt(process.env.BOOKING_CANCEL_CUTOFF_HOURS ?? '2', 10),
  rescheduleCutoffHours: parseInt(process.env.BOOKING_RESCHEDULE_CUTOFF_HOURS ?? '2', 10),
  maxAdvanceDays: parseInt(process.env.BOOKING_MAX_ADVANCE_DAYS ?? '60', 10),
  reminderHoursBefore: parseInt(process.env.BOOKING_REMINDER_HOURS_BEFORE ?? '12', 10),
  noShowAfterHours: parseInt(process.env.BOOKING_NO_SHOW_AFTER_HOURS ?? '24', 10),
}));
