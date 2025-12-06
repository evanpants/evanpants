import { PropertyData, FinancialParams, CalculationResult } from '../types';

export const calculateMetrics = (
  property: PropertyData,
  params: FinancialParams
): CalculationResult => {
  const {
    listPrice,
    numUnits,
    estimatedRentPerUnit,
    unitRents,
    propertyTaxAnnual,
    insuranceAnnual,
    hoaMonthly,
    maintenanceRate,
    vacancyRate,
  } = property;

  const {
    downPaymentPercent,
    interestRate,
    loanTermYears,
    closingCostsPercent,
  } = params;

  // 1. Income
  // Calculate potential gross income by summing individual unit rents if available
  // Fallback to average * units if array is missing (safety check)
  const monthlyGrossIncome = (unitRents && unitRents.length > 0)
    ? unitRents.reduce((sum, rent) => sum + rent, 0)
    : estimatedRentPerUnit * numUnits;

  const potentialGrossIncome = monthlyGrossIncome * 12;
  const vacancyLoss = potentialGrossIncome * (vacancyRate / 100);
  const effectiveGrossIncome = potentialGrossIncome - vacancyLoss;

  // 2. Operating Expenses
  const maintenanceAnnual = effectiveGrossIncome * (maintenanceRate / 100);
  const hoaAnnual = hoaMonthly * 12;
  // Management fees could be added here, currently simplified into maintenance/ops
  const totalOperatingExpenses =
    propertyTaxAnnual + insuranceAnnual + hoaAnnual + maintenanceAnnual;

  // 3. NOI
  const noi = effectiveGrossIncome - totalOperatingExpenses;

  // 4. Cap Rate
  // Cap Rate = NOI / Purchase Price
  const capRate = listPrice > 0 ? (noi / listPrice) * 100 : 0;

  // 5. Debt Service (Mortgage)
  const downPaymentAmount = listPrice * (downPaymentPercent / 100);
  const loanAmount = listPrice - downPaymentAmount;
  
  let monthlyMortgagePayment = 0;
  if (loanAmount > 0 && interestRate > 0) {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    // Standard amortization formula
    monthlyMortgagePayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  } else if (loanAmount > 0 && interestRate === 0) {
    monthlyMortgagePayment = loanAmount / (loanTermYears * 12);
  }

  const annualDebtService = monthlyMortgagePayment * 12;

  // 6. Cash Flow & Returns
  const annualCashFlow = noi - annualDebtService;
  const closingCosts = listPrice * (closingCostsPercent / 100);
  const totalInitialInvestment = downPaymentAmount + closingCosts;

  const cashOnCashReturn =
    totalInitialInvestment > 0
      ? (annualCashFlow / totalInitialInvestment) * 100
      : 0;

  return {
    grossAnnualIncome: potentialGrossIncome,
    effectiveGrossIncome,
    totalOperatingExpenses,
    noi,
    capRate,
    monthlyMortgagePayment,
    annualDebtService,
    annualCashFlow,
    cashOnCashReturn,
    totalInitialInvestment,
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};
