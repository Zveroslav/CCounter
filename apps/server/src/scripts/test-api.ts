import { getJournalData } from '../services/journalService';
import dayjs from 'dayjs';

async function test() {
  const userId = 'f4024976-3f6f-42bb-bac4-d5a61419b00f';
  // Try calling journalService directly with the exact same date as earlier
  const res = await getJournalData(userId, 'week', '2026-07-22T17:47:28.000Z');
  console.log('periodSummary', res.periodSummary);
}
test().catch(console.error);
