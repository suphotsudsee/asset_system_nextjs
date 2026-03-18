/**
 * Depreciation calculation service
 * Implements straight-line and declining balance methods
 */

export interface DepreciationSchedule {
  year: number;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

export interface DepreciationParams {
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  purchaseDate: Date;
  method: 'straight_line' | 'declining_balance';
}

/**
 * Calculate straight-line depreciation
 * Annual depreciation = (Cost - Salvage Value) / Useful Life
 */
export function calculateStraightLine(
  params: DepreciationParams
): DepreciationSchedule[] {
  const { purchasePrice, salvageValue, usefulLifeYears, purchaseDate } = params;
  
  const depreciableAmount = purchasePrice - salvageValue;
  const annualDepreciation = depreciableAmount / usefulLifeYears;
  
  const schedule: DepreciationSchedule[] = [];
  let accumulatedDepreciation = 0;
  let bookValue = purchasePrice;
  
  const purchaseYear = purchaseDate.getFullYear();
  
  for (let year = 0; year < usefulLifeYears; year++) {
    const fiscalYear = purchaseYear + year;
    const beginningBookValue = bookValue;
    
    // First year might be partial
    let depreciationExpense = annualDepreciation;
    if (year === 0) {
      // Calculate partial year based on purchase month
      const monthsInYear = 12 - purchaseDate.getMonth();
      depreciationExpense = annualDepreciation * (monthsInYear / 12);
    }
    
    accumulatedDepreciation += depreciationExpense;
    bookValue = purchasePrice - accumulatedDepreciation;
    
    // Ensure we don't go below salvage value
    if (bookValue < salvageValue) {
      depreciationExpense -= (salvageValue - bookValue);
      bookValue = salvageValue;
    }
    
    schedule.push({
      year: fiscalYear,
      beginningBookValue,
      depreciationExpense,
      accumulatedDepreciation,
      endingBookValue: bookValue,
    });
  }
  
  return schedule;
}

/**
 * Calculate declining balance depreciation (double declining)
 * Rate = 2 / Useful Life
 */
export function calculateDecliningBalance(
  params: DepreciationParams
): DepreciationSchedule[] {
  const { purchasePrice, salvageValue, usefulLifeYears, purchaseDate } = params;
  
  const rate = 2 / usefulLifeYears; // Double declining rate
  
  const schedule: DepreciationSchedule[] = [];
  let accumulatedDepreciation = 0;
  let bookValue = purchasePrice;
  
  const purchaseYear = purchaseDate.getFullYear();
  
  for (let year = 0; year < usefulLifeYears; year++) {
    const fiscalYear = purchaseYear + year;
    const beginningBookValue = bookValue;
    
    let depreciationExpense = beginningBookValue * rate;
    
    // First year might be partial
    if (year === 0) {
      const monthsInYear = 12 - purchaseDate.getMonth();
      depreciationExpense = depreciationExpense * (monthsInYear / 12);
    }
    
    // Ensure we don't go below salvage value
    if (bookValue - depreciationExpense < salvageValue) {
      depreciationExpense = bookValue - salvageValue;
    }
    
    accumulatedDepreciation += depreciationExpense;
    bookValue = beginningBookValue - depreciationExpense;
    
    schedule.push({
      year: fiscalYear,
      beginningBookValue,
      depreciationExpense,
      accumulatedDepreciation,
      endingBookValue: bookValue,
    });
    
    // Stop if we've reached salvage value
    if (bookValue <= salvageValue) {
      break;
    }
  }
  
  return schedule;
}

/**
 * Calculate current book value
 */
export function getCurrentBookValue(
  params: DepreciationParams,
  currentDate: Date = new Date()
): number {
  const schedule = calculateStraightLine(params);
  
  const currentYear = currentDate.getFullYear();
  const purchaseYear = params.purchaseDate.getFullYear();
  const yearsElapsed = currentYear - purchaseYear;
  
  if (yearsElapsed < 0) return params.purchasePrice;
  if (yearsElapsed >= params.usefulLifeYears) return params.salvageValue;
  
  return schedule[yearsElapsed]?.endingBookValue || params.salvageValue;
}

/**
 * Calculate total depreciation to date
 */
export function getAccumulatedDepreciation(
  params: DepreciationParams,
  currentDate: Date = new Date()
): number {
  const currentBookValue = getCurrentBookValue(params, currentDate);
  return params.purchasePrice - currentBookValue;
}
