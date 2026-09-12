export function formatMoney(value: number | string): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return `${amount.toLocaleString('en-ET', { maximumFractionDigits: 2 })} ETB`;
}

export function normalizePhoneNumber(phone: string): string {
  const sanitized = phone.replace(/\s+/g, '');
  return sanitized.startsWith('+') ? sanitized : `+${sanitized}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
