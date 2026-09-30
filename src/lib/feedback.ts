import type { KeyValueStore } from './storage';
import type { TourResult } from './tour';

/**
 * Tour results go to a Google Apps Script web app, which appends a row to a
 * Google Sheet. Results wait in a queue on the device until a send succeeds,
 * so a tour finished with no signal still arrives later.
 */

export const QUEUE_KEY = 'tube-planner:feedback-queue';
const MAX_QUEUED = 20;

export function readQueue(store: KeyValueStore | undefined): TourResult[] {
  try {
    const raw = store?.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(store: KeyValueStore | undefined, queue: TourResult[]) {
  try {
    if (queue.length) store?.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUED)));
    else store?.removeItem(QUEUE_KEY);
  } catch {
    // Storage full or blocked: the result is lost, the app carries on.
  }
}

export function enqueue(store: KeyValueStore | undefined, result: TourResult) {
  writeQueue(store, [...readQueue(store), result]);
}

export type Send = (url: string, result: TourResult) => Promise<void>;

/**
 * Apps Script doesn't send CORS headers, so the request is "no-cors" with a
 * text/plain body: the browser allows it, and the response can't be read.
 * A network failure still throws, which keeps the result queued.
 */
export const sendResult: Send = async (url, result) => {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(result),
    keepalive: true,
  });
};

/** Send everything queued. Returns how many were sent. Stops at the first failure. */
export async function flush(url: string | undefined, store: KeyValueStore | undefined, send: Send = sendResult): Promise<number> {
  if (!url) return 0;
  const queue = readQueue(store);
  let sent = 0;
  for (const result of queue) {
    try {
      await send(url, result);
      sent++;
    } catch {
      break;
    }
  }
  if (sent) writeQueue(store, readQueue(store).slice(sent));
  return sent;
}
