export function formatProgressBar(current, max, length = 10) {
  const percentage = Math.min(100, Math.max(0, Math.floor((current / max) * 100)));
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount).replace('IDR', '💰');
}
