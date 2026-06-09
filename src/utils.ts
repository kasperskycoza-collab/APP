export const evaluateMath = (expression: string): number | null => {
  try {
    // Replace 'x' or 'X' with '*' for multiplication
    const sanitized = expression.replace(/[xX]/g, '*').replace(/[^0-9+\-*/.]/g, '');
    if (!sanitized) return null;
    
    // Use Function constructor to safely evaluate simple math expressions
    const result = new Function('return ' + sanitized)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Number(result.toFixed(2));
    }
    return null;
  } catch (e) {
    return null;
  }
};

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
