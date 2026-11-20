const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function formatEventDate(iso: string) {
  const value = new Date(iso);
  if (!Number.isFinite(value.getTime())) return '';
  const parts = Object.fromEntries(formatter.formatToParts(value).map(({ type, value }) => [type, value]));
  return parts.year + '-' + parts.month + '-' + parts.day + ' ' + parts.hour + ':' + parts.minute;
}

export function parseEventDate(input: string) {
  const value = input.trim();
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value.replace(' ', 'T') + ':00+07:00');
  return formatEventDate(date.toString()) === value ? date : null;
}
