export const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

export function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}
