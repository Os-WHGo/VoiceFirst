export interface ReviewItem { id: string; intervalDays: number; ease: number; repetitions: number; dueAt: string; }
/** Simplified SM-2-like local review schedule. Not an FSRS implementation. */
export function scheduleReview(item: ReviewItem, quality: 0 | 1 | 2 | 3 | 4 | 5, now: Date): ReviewItem {
  if (Number.isNaN(now.getTime())) throw new Error('Invalid date');
  const repetitions = quality < 3 ? 0 : item.repetitions + 1;
  const ease = Math.max(1.3, item.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const intervalDays = quality < 3 ? 1 : repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(item.intervalDays * ease));
  return { ...item, ease, repetitions, intervalDays, dueAt: new Date(now.getTime() + intervalDays * 86400000).toISOString() };
}
export function dueReviews(items: readonly ReviewItem[], now: Date): ReviewItem[] {
  return items.filter(item => new Date(item.dueAt).getTime() <= now.getTime());
}
