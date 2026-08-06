import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const userTimezone = 'Asia/Tbilisi';
const dateQuery = '2026-07-22T17:47:28.000Z'; // Jul 22

const refDate = dayjs(dateQuery).tz(userTimezone);

console.log('refDate', refDate.format());

const dayOfWeek = refDate.day();
console.log('dayOfWeek', dayOfWeek);
const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const startDate = refDate.add(diffToMonday, 'day').startOf('day').toDate();
console.log('startDate', startDate.toISOString());
