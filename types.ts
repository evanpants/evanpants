export interface PropertyData {
  address: string;
  listPrice: number;
  numUnits: number;
  estimatedRentPerUnit: number;
  unitRents: number[]; // Array of monthly rents for each unit
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenanceRate: number; // as a percentage of gross income (e.g., 0.05 for 5%)
  vacancyRate: number; // as a percentage (e.g., 0.03 for 3%)
  description?: string;
  imageUrl?: string;
  comps: CompListing[];
}

export interface CompListing {
  address: string;
  price: number;
  type: 'RENT' | 'SALE';
  bedrooms: number;
  bathrooms: number;
  source?: string;
  url?: string;
}

export interface FinancialParams {
  downPaymentPercent: number; // 0-100
  interestRate: number; // 0-100
  loanTermYears: number;
  closingCostsPercent: number; // 0-100
}

export interface CalculationResult {
  grossAnnualIncome: number;
  effectiveGrossIncome: number;
  totalOperatingExpenses: number;
  noi: number; // Net Operating Income
  capRate: number; // Percentage
  monthlyMortgagePayment: number;
  annualDebtService: number;
  annualCashFlow: number;
  cashOnCashReturn: number; // Percentage
  totalInitialInvestment: number;
}
