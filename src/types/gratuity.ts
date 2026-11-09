export type UAESector = 'private' | 'difc' | 'adgm' | 'government';
export type ContractType = 'limited' | 'unlimited';
export type SeparationReason = 'resignation' | 'termination' | 'contract_expiry' | 'mutual_consent';

export interface GratuityInputs {
  startDate: string;
  endDate: string;
  basicSalary: number;
  sector: UAESector;
  contractType: ContractType;
  separationReason: SeparationReason;
  unpaidLeaveDays: number;
  lawRegime: 'new_law_2022' | 'old_law_1980'; // Federal Decree Law 33/2021 vs Federal Law 8/1980
}

export interface GratuityCalculationResult {
  isEligible: boolean;
  ineligibilityReason?: string;
  totalDays: number;
  unpaidDaysDeducted: number;
  netWorkingDays: number;
  yearsOfService: number;
  serviceBreakdown: {
    years: number;
    months: number;
    days: number;
  };
  dailyWage: number;
  firstFiveYearsDays: number;
  afterFiveYearsDays: number;
  firstFiveYearsAmount: number;
  afterFiveYearsAmount: number;
  reductionPercentage: number; // For old law resignation scenarios
  grossGratuity: number;
  maxCapAmount: number; // 2 years basic salary cap
  isCapped: boolean;
  netGratuityAED: number;
  applicableLawNote: string;
  notes: string[];
}

export interface GratuityTestCase {
  id: string;
  name: string;
  description: string;
  inputs: GratuityInputs;
  expectedExpectedNote?: string;
}

export interface ContractScenarioComparison {
  limitedResult: GratuityCalculationResult;
  unlimitedResult: GratuityCalculationResult;
  differenceAED: number;
  absoluteDifferenceAED: number;
  percentageDifference: number;
  hasDifference: boolean;
  higherOption: 'limited' | 'unlimited' | 'equal';
  summary: string;
  legalNote: string;
}
