/**
 * Format number as currency with Indonesian locale
 * Examples: 100000 → 100.000, 1000000 → 1.000.000
 */
export const formatCurrency = (value: number | string): string => {
  if (!value) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(Math.floor(num));
};

/**
 * Remove formatting from currency string
 * Examples: "100.000" → 100000, "1.000.000" → 1000000
 */
export const unformatCurrency = (value: string): number => {
  if (!value) return 0;
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
};

/**
 * Format input value on change event
 * Used for input fields with onChange handlers
 */
export const handleCurrencyInput = (value: string): string => {
  const unformatted = unformatCurrency(value);
  return formatCurrency(unformatted);
};

/**
 * Display formatted currency with prefix
 * Examples: 100000 → "Rp 100.000"
 */
export const displayCurrency = (value: number | string): string => {
  return `Rp ${formatCurrency(value)}`;
};
