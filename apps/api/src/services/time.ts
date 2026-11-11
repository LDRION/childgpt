/** Ключ дня 'YYYY-MM-DD' в часовом поясе сервиса — по нему группируются разговоры. */
export function dayKey(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
