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

export const formatCurrency = (amount: number, currency: string, maxFractionDigits: number = 0) => {
  const safeAmount = Number(amount) || 0;
  let safeCurrency = currency;
  if (!currency || currency.length !== 3) {
    safeCurrency = 'USD';
  }
  try {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: safeCurrency, 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(safeAmount);
  } catch (e) {
    return `${safeCurrency} ${Math.round(safeAmount)}`;
  }
};

export const getBoxValueClass = (valStr: string) => {
  const len = valStr.length;
  if (len > 16) return "text-[10px] sm:text-xs md:text-sm font-black tracking-tight leading-tight whitespace-nowrap";
  if (len > 13) return "text-xs sm:text-xs md:text-base font-black tracking-tight leading-tight whitespace-nowrap";
  if (len > 10) return "text-xs sm:text-sm md:text-lg font-black tracking-tight leading-tight whitespace-nowrap";
  if (len > 7) return "text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight whitespace-nowrap";
  return "text-base sm:text-lg lg:text-xl font-black tracking-tight leading-tight whitespace-nowrap";
};

export const getMainValueClass = (valStr: string) => {
  const len = valStr.length;
  if (len > 18) return "text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-tight whitespace-nowrap";
  if (len > 14) return "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight whitespace-nowrap";
  if (len > 10) return "text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black tracking-tight leading-tight whitespace-nowrap";
  return "text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight whitespace-nowrap";
};
