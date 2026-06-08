export const formatCurrency = (amount: number, currency: string, maxFractionDigits: number = 2) => {
  const safeAmount = Number(amount) || 0;
  let safeCurrency = currency;
  if (!currency || currency.length !== 3) {
    safeCurrency = 'USD';
  }
  try {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: safeCurrency, 
      minimumFractionDigits: maxFractionDigits,
      maximumFractionDigits: maxFractionDigits 
    }).format(safeAmount);
  } catch (e) {
    return `${safeCurrency} ${safeAmount.toFixed(maxFractionDigits)}`;
  }
};
