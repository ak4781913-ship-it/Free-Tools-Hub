import {
  GratuityCalculationResult,
  GratuityInputs,
  GratuityTestCase,
  ContractScenarioComparison,
} from '../types/gratuity';

export function calculateUAEGratuity(inputs: GratuityInputs): GratuityCalculationResult {
  const {
    startDate,
    endDate,
    basicSalary,
    sector,
    contractType,
    separationReason,
    unpaidLeaveDays = 0,
    lawRegime = 'new_law_2022',
  } = inputs;

  const notes: string[] = [];

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start || basicSalary <= 0) {
    return {
      isEligible: false,
      ineligibilityReason: 'Invalid dates or basic salary. Please enter valid dates with end date after start date and positive salary.',
      totalDays: 0,
      unpaidDaysDeducted: 0,
      netWorkingDays: 0,
      yearsOfService: 0,
      serviceBreakdown: { years: 0, months: 0, days: 0 },
      dailyWage: 0,
      firstFiveYearsDays: 0,
      afterFiveYearsDays: 0,
      firstFiveYearsAmount: 0,
      afterFiveYearsAmount: 0,
      reductionPercentage: 0,
      grossGratuity: 0,
      maxCapAmount: 0,
      isCapped: false,
      netGratuityAED: 0,
      applicableLawNote: 'Invalid inputs provided.',
      notes: [],
    };
  }

  // Calculate day difference
  const diffTime = end.getTime() - start.getTime();
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const netWorkingDays = Math.max(0, totalDays - unpaidLeaveDays);

  // Exact calendar service breakdown
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Fractional years based on statutory 365 calendar days
  const yearsOfService = netWorkingDays / 365;

  // Daily wage: Annual basic wage divided by 365 days (MOHRE statutory standard: Basic * 12 / 365)
  const dailyWage = (basicSalary * 12) / 365;
  const maxCapAmount = basicSalary * 24; // 2 years' basic salary statutory cap

  // Eligibility check: Under standard UAE law, continuous service of at least 1 year (365 days) is required
  if (netWorkingDays < 365) {
    let reason = 'Ineligible for Gratuity: Less than 1 full year of continuous service.';
    if (unpaidLeaveDays > 0 && totalDays >= 365) {
      reason += ` (Total period was ${totalDays} days, but ${unpaidLeaveDays} unpaid leave days reduced qualifying service below 365 days).`;
    }
    return {
      isEligible: false,
      ineligibilityReason: reason,
      totalDays,
      unpaidDaysDeducted: unpaidLeaveDays,
      netWorkingDays,
      yearsOfService,
      serviceBreakdown: { years, months, days },
      dailyWage,
      firstFiveYearsDays: 0,
      afterFiveYearsDays: 0,
      firstFiveYearsAmount: 0,
      afterFiveYearsAmount: 0,
      reductionPercentage: 0,
      grossGratuity: 0,
      maxCapAmount,
      isCapped: false,
      netGratuityAED: 0,
      applicableLawNote: 'Article 51(2) of UAE Labour Law: An employee who has completed at least one year of continuous service is entitled to end-of-service gratuity.',
      notes: [
        'Employees with less than 1 continuous year of service are not entitled to end-of-service gratuity.',
      ],
    };
  }

  // Sector specific handling
  if (sector === 'difc') {
    notes.push(
      'DIFC Note: As of February 2020, DIFC replaced end-of-service gratuity with the DEWS (DIFC Employee Workplace Savings) defined-contribution scheme. Employers contribute 5.83% of basic wage for the first 5 years and 8.33% thereafter monthly into an investment plan.'
    );
  } else if (sector === 'adgm') {
    notes.push(
      'ADGM Note: Abu Dhabi Global Market follows ADGM Employment Regulations. End-of-service gratuity applies similarly unless the employer has adopted an approved savings plan.'
    );
  }

  // Calculation for eligible employees
  let firstFiveYearsAmount = 0;
  let afterFiveYearsAmount = 0;
  let firstFiveYearsDays = 0;
  let afterFiveYearsDays = 0;

  if (yearsOfService <= 5) {
    firstFiveYearsDays = yearsOfService * 21;
    firstFiveYearsAmount = firstFiveYearsDays * dailyWage;
  } else {
    firstFiveYearsDays = 5 * 21; // 105 days
    firstFiveYearsAmount = firstFiveYearsDays * dailyWage;

    const excessYears = yearsOfService - 5;
    afterFiveYearsDays = excessYears * 30;
    afterFiveYearsAmount = afterFiveYearsDays * dailyWage;
  }

  const grossGratuity = firstFiveYearsAmount + afterFiveYearsAmount;

  // Reduction logic:
  // Under Federal Decree-Law No. 33 of 2021 (in force from Feb 2, 2022), all contracts are fixed-term (limited),
  // and employees who resign after 1 year are entitled to 100% of their gratuity without the old law's reductions.
  // If the user selected 'old_law_1980', we apply the historical Law 8 of 1980 rules:
  let reductionPercentage = 0;
  if (lawRegime === 'old_law_1980' && separationReason === 'resignation') {
    if (contractType === 'unlimited') {
      if (yearsOfService >= 1 && yearsOfService < 3) {
        reductionPercentage = 66.67; // entitled to 1/3rd (reduction is 2/3)
        notes.push('Historical Law 8/1980 (Article 137): Under unlimited contracts, resignation between 1 and 3 years entitled the employee to only 1/3 (33.33%) of the gratuity.');
      } else if (yearsOfService >= 3 && yearsOfService < 5) {
        reductionPercentage = 33.33; // entitled to 2/3rd (reduction is 1/3)
        notes.push('Historical Law 8/1980 (Article 137): Under unlimited contracts, resignation between 3 and 5 years entitled the employee to 2/3 (66.67%) of the gratuity.');
      } else {
        reductionPercentage = 0; // 5+ years: full entitlement
      }
    } else if (contractType === 'limited') {
      if (yearsOfService < 5) {
        reductionPercentage = 100; // 0 entitlement
        notes.push('Historical Law 8/1980 (Article 138): Under limited contracts, employee resignation before completing 5 continuous years resulted in total forfeiture of gratuity (0% payout).');
      } else {
        reductionPercentage = 0; // 5+ years: full entitlement
        notes.push('Historical Law 8/1980 (Article 138): Under limited contracts with 5+ years of continuous service, 100% gratuity entitlement applied.');
      }
    }
  } else if (lawRegime === 'new_law_2022') {
    notes.push(
      'Federal Decree-Law No. 33 of 2021: Standardizes gratuity to 100% entitlement after 1 continuous year, regardless of whether separation is via resignation, non-renewal, or termination.'
    );
  }

  const gratuityAfterReduction = grossGratuity * (1 - reductionPercentage / 100);

  // Apply maximum statutory cap:
  // "The total amount of gratuity shall not exceed two years' basic salary"
  const isCapped = gratuityAfterReduction > maxCapAmount;
  const netGratuityAED = Math.min(gratuityAfterReduction, maxCapAmount);

  if (isCapped) {
    notes.push(
      `Statutory Cap Applied: Article 51(6) caps the maximum end-of-service gratuity at 2 years' basic salary (24 × AED ${basicSalary.toLocaleString()} = AED ${maxCapAmount.toLocaleString()}).`
    );
  }

  const applicableLawNote =
    lawRegime === 'new_law_2022'
      ? 'Governed by UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations.'
      : 'Calculated using historical Federal Law No. 8 of 1980 rules for reference.';

  return {
    isEligible: true,
    totalDays,
    unpaidDaysDeducted: unpaidLeaveDays,
    netWorkingDays,
    yearsOfService,
    serviceBreakdown: { years, months, days },
    dailyWage,
    firstFiveYearsDays,
    afterFiveYearsDays,
    firstFiveYearsAmount,
    afterFiveYearsAmount,
    reductionPercentage,
    grossGratuity,
    maxCapAmount,
    isCapped,
    netGratuityAED,
    applicableLawNote,
    notes,
  };
}

export const GRATUITY_TEST_CASES: GratuityTestCase[] = [
  {
    id: 'case-less-than-1-year',
    name: 'Scenario 1: Less than 1 Year (Ineligible)',
    description: 'Employee joined 8 months ago, basic salary AED 10,000. Under 365 days of service, result is 0 AED.',
    inputs: {
      startDate: '2025-01-01',
      endDate: '2025-09-01',
      basicSalary: 10000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'resignation',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: AED 0 (Under 1 year threshold)',
  },
  {
    id: 'case-exact-1-year',
    name: 'Scenario 2: Exactly 1 Year of Service',
    description: '365 days of service. 21 days basic salary at AED 12,000 basic wage = AED 8,400.',
    inputs: {
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      basicSalary: 12000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'contract_expiry',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: Exactly 21 days basic salary',
  },
  {
    id: 'case-exact-5-years',
    name: 'Scenario 3: Exactly 5 Years of Service',
    description: '5 continuous years at AED 15,000 basic salary. 5 × 21 = 105 days basic wage = AED 52,500.',
    inputs: {
      startDate: '2020-01-01',
      endDate: '2025-01-01',
      basicSalary: 15000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'resignation',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: 105 days basic wage (AED 52,500)',
  },
  {
    id: 'case-7-point-5-years',
    name: 'Scenario 4: 7.5 Years (Tiered 21 + 30 Days)',
    description: 'First 5 years at 21 days/year (105 days) + remaining 2.5 years at 30 days/year (75 days) = 180 days.',
    inputs: {
      startDate: '2017-06-01',
      endDate: '2024-12-01',
      basicSalary: 16000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'resignation',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: 105 + 75 = 180 days basic salary',
  },
  {
    id: 'case-max-cap-scenario',
    name: 'Scenario 5: 30+ Years Maximum Statutory Cap (2 Years)',
    description: 'Long-term employee with 28 years service, basic AED 25,000. Gratuity reaches statutory cap of 24 months basic salary (AED 600,000).',
    inputs: {
      startDate: '1995-01-01',
      endDate: '2024-01-01',
      basicSalary: 25000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'mutual_consent',
      unpaidLeaveDays: 0,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: Capped at AED 600,000 (24 months salary)',
  },
  {
    id: 'case-unpaid-leave-deduction',
    name: 'Scenario 6: Service with 45 Days Unpaid Leave',
    description: '3 years total tenure minus 45 days of unpaid leave, pro-rata calculated on net 1,050 working days.',
    inputs: {
      startDate: '2021-01-01',
      endDate: '2024-01-01',
      basicSalary: 10000,
      sector: 'private',
      contractType: 'limited',
      separationReason: 'resignation',
      unpaidLeaveDays: 45,
      lawRegime: 'new_law_2022',
    },
    expectedExpectedNote: 'Result: Unpaid leave excluded from qualifying calculation',
  },
  {
    id: 'case-limited-vs-unlimited',
    name: 'Scenario 7: Limited vs Unlimited Resignation (Historical Variance)',
    description: 'Resignation after 2.5 years of continuous service under historical rules. Unlimited grants 1/3 payout (AED 3,835), whereas Limited forfeited 100% (AED 0).',
    inputs: {
      startDate: '2019-01-01',
      endDate: '2021-07-01',
      basicSalary: 10000,
      sector: 'private',
      contractType: 'unlimited',
      separationReason: 'resignation',
      unpaidLeaveDays: 0,
      lawRegime: 'old_law_1980',
    },
    expectedExpectedNote: 'Result: Unlimited grants 33.3% payout vs 0% for Limited contract',
  },
];

/**
 * Escapes a CSV cell according to RFC 4180 standards.
 */
function escapeCSVCell(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC 4180-compliant formatted CSV string of the UAE Gratuity Calculation.
 * Prepend with UTF-8 BOM so spreadsheet applications (Excel, Numbers, Sheets) parse Arabic/UTF-8 cleanly.
 */
export function generateGratuityCSV(inputs: GratuityInputs, result: GratuityCalculationResult): string {
  const rows: (string | number)[][] = [
    // Header & Meta
    ['UAE END-OF-SERVICE GRATUITY CALCULATION REPORT', ''],
    ['Generated Date', new Date().toISOString().slice(0, 10) + ' ' + new Date().toLocaleTimeString()],
    ['Legal Regulation', 'UAE Federal Decree-Law No. 33 of 2021 (Regulation of Labour Relations)'],
    ['Platform', 'FreeTools Hub'],
    ['Report Type', 'Statutory End-of-Service Benefits Estimate'],
    ['', ''],

    // Executive Summary
    ['EXECUTIVE SUMMARY', ''],
    ['Net Gratuity Payable (AED)', result.netGratuityAED.toFixed(2)],
    ['Eligibility Status', result.isEligible ? 'Eligible for End-of-Service Gratuity' : `Ineligible (${result.ineligibilityReason || 'Less than 1 year continuous service'})`],
    ['Statutory Ceiling Reached', result.isCapped ? 'YES (Capped at 24 Months Basic Salary)' : 'NO (Within statutory ceiling)'],
    ['Maximum Statutory Cap (AED)', result.maxCapAmount.toFixed(2)],
    ['Applicable Framework', result.applicableLawNote],
    ['', ''],

    // Employment Tenure Details
    ['EMPLOYMENT DETAILS', 'VALUE'],
    ['Employment Start Date', inputs.startDate],
    ['Last Working Day (End Date)', inputs.endDate],
    ['Gross Calendar Period (Days)', result.totalDays],
    ['Unpaid Leave Deductions (Days)', result.unpaidDaysDeducted],
    ['Net Continuous Working Days', result.netWorkingDays],
    ['Service Breakdown (Completed Years)', result.serviceBreakdown.years],
    ['Service Breakdown (Completed Months)', result.serviceBreakdown.months],
    ['Service Breakdown (Remaining Days)', result.serviceBreakdown.days],
    ['Total Service Duration (Fractional Years)', result.yearsOfService.toFixed(4)],
    ['Monthly Basic Salary (AED)', inputs.basicSalary.toFixed(2)],
    ['Employment Sector', inputs.sector.toUpperCase()],
    ['Contract Type', inputs.contractType === 'limited' ? 'Limited / Fixed-Term Contract' : 'Unlimited Contract'],
    ['Separation Reason', inputs.separationReason.replace(/_/g, ' ').toUpperCase()],
    ['Labour Law Regime', inputs.lawRegime === 'new_law_2022' ? 'Federal Decree-Law 33/2021 (Current Law)' : 'Federal Law 8/1980 (Pre-2022 Old Law)'],
    ['', ''],

    // Calculation Breakdown & Wage Analysis
    ['CALCULATION FORMULA & WAGE BREAKDOWN', 'STANDARD / FORMULA', 'RATE / DURATION', 'SUBTOTAL (AED)'],
    ['Daily Basic Wage', 'Monthly Basic × 12 ÷ 365', `AED ${inputs.basicSalary.toFixed(2)} / month`, result.dailyWage.toFixed(2)],
    [
      'Tier 1 (First 5 Years of Service)',
      '21 days basic wage per qualifying year (pro-rata)',
      `${result.firstFiveYearsDays.toFixed(2)} qualifying days`,
      result.firstFiveYearsAmount.toFixed(2),
    ],
    [
      'Tier 2 (Service Exceeding 5 Years)',
      '30 days basic wage per qualifying year (pro-rata)',
      `${result.afterFiveYearsDays.toFixed(2)} qualifying days`,
      result.afterFiveYearsAmount.toFixed(2),
    ],
    ['Gross Accrued Gratuity', 'Sum of Tier 1 + Tier 2', '', result.grossGratuity.toFixed(2)],
    [
      'Old Law Resignation Reduction',
      inputs.lawRegime === 'old_law_1980' && result.reductionPercentage > 0
        ? `${result.reductionPercentage.toFixed(2)}% deduction applied`
        : 'None / Not Applicable',
      '',
      result.reductionPercentage > 0
        ? `-${(result.grossGratuity * (result.reductionPercentage / 100)).toFixed(2)}`
        : '0.00',
    ],
    ['Statutory Cap Ceiling (2 Years Basic)', 'Monthly Basic × 24', 'Maximum legal cap', result.maxCapAmount.toFixed(2)],
    ['FINAL NET GRATUITY PAYABLE (AED)', 'Statutory settlement', '', result.netGratuityAED.toFixed(2)],
    ['', '', '', ''],

    // Statutory Rules
    ['STATUTORY RULES & PROVISIONS APPLIED', ''],
    ...(result.notes.map((note, index) => [`Rule ${index + 1}`, note])),
    ['', ''],

    // Disclaimer
    ['LEGAL DISCLAIMER', ''],
    ['Notice', 'This calculation report is provided for informational and planning purposes based on UAE Federal Decree-Law No. 33 of 2021. Final payout may vary based on company payroll adjustments, authorized leave balances, employee debt deductions, or approved workplace savings schemes like DEWS. Basic salary strictly excludes housing, transport, utilities, and performance bonuses.']
  ];

  // Return formatted CSV with UTF-8 BOM (\uFEFF)
  return '\uFEFF' + rows.map(row => row.map(escapeCSVCell).join(',')).join('\r\n');
}

/**
 * Triggers a browser download of the formatted CSV report.
 */
export function downloadGratuityCSV(inputs: GratuityInputs, result: GratuityCalculationResult): void {
  const csvContent = generateGratuityCSV(inputs, result);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanStart = inputs.startDate.replace(/[^0-9]/g, '');
  const cleanEnd = inputs.endDate.replace(/[^0-9]/g, '');
  link.setAttribute('href', url);
  link.setAttribute('download', `UAE_Gratuity_Report_${cleanStart}_to_${cleanEnd}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Compares gratuity outcomes between 'Limited' and 'Unlimited' contract types
 * for the current employment parameters.
 */
export function compareContractScenarios(
  inputs: GratuityInputs,
  overrideLawRegime?: 'new_law_2022' | 'old_law_1980'
): ContractScenarioComparison {
  const regime = overrideLawRegime ?? inputs.lawRegime;
  const limitedInputs: GratuityInputs = {
    ...inputs,
    contractType: 'limited',
    lawRegime: regime,
  };
  const unlimitedInputs: GratuityInputs = {
    ...inputs,
    contractType: 'unlimited',
    lawRegime: regime,
  };

  const limitedResult = calculateUAEGratuity(limitedInputs);
  const unlimitedResult = calculateUAEGratuity(unlimitedInputs);

  const diff = limitedResult.netGratuityAED - unlimitedResult.netGratuityAED;
  const absDiff = Math.abs(diff);
  const hasDiff = Math.round(absDiff * 100) > 0;

  let higherOption: 'limited' | 'unlimited' | 'equal' = 'equal';
  if (diff > 0.05) higherOption = 'limited';
  else if (diff < -0.05) higherOption = 'unlimited';

  const baseForPct = Math.min(limitedResult.netGratuityAED, unlimitedResult.netGratuityAED) || Math.max(limitedResult.netGratuityAED, unlimitedResult.netGratuityAED) || 1;
  const percentageDifference = hasDiff ? (absDiff / baseForPct) * 100 : 0;

  let summary = '';
  let legalNote = '';

  if (!limitedResult.isEligible && !unlimitedResult.isEligible) {
    summary = 'Both scenarios yield AED 0.00 because continuous service is less than the statutory 1-year (365 days) qualifying threshold.';
    legalNote = 'Article 51(2) of UAE Labour Law: Completion of at least one year of continuous service is mandatory for gratuity eligibility.';
  } else if (!hasDiff) {
    if (regime === 'new_law_2022') {
      summary = `Both contract types yield an identical payout of AED ${limitedResult.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Under UAE Federal Decree-Law No. 33 of 2021, all employment relationships are standardized to fixed-term, and resignation reductions have been eliminated.`;
      legalNote = 'Federal Decree-Law No. 33 of 2021 unified private sector employment: employees with at least 1 year of service receive 100% statutory gratuity regardless of resignation or contract label.';
    } else {
      summary = `Both contract types provide identical payout of AED ${limitedResult.netGratuityAED.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} under historical rules for this separation reason and tenure.`;
      legalNote = 'Historical Law 8/1980 provisions result in full entitlement for both contracts at this duration or separation type.';
    }
  } else {
    if (regime === 'old_law_1980' && inputs.separationReason === 'resignation') {
      if (higherOption === 'unlimited') {
        summary = `Unlimited contract pays AED ${absDiff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MORE than Limited contract (+${percentageDifference.toFixed(1)}%). Under historical Law 8/1980 Article 138, resignation before 5 years on a limited contract forfeited 100% of gratuity (AED 0), whereas Article 137 allowed partial gratuity (33.3% or 66.7%) on unlimited contracts.`;
        legalNote = 'UAE Law 8/1980 (Historical): Art. 138 (Limited) required forfeiture on resignation under 5 years, while Art. 137 (Unlimited) granted 1/3 (1-3 yrs) or 2/3 (3-5 yrs) of gratuity.';
      } else {
        summary = `Limited contract pays AED ${absDiff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more than Unlimited contract.`;
        legalNote = 'Historical Law 8/1980 contractual provisions.';
      }
    } else {
      summary = `Contract scenario variance of AED ${absDiff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} detected based on selected parameters.`;
      legalNote = 'Comparative assessment under UAE labour statutes.';
    }
  }

  return {
    limitedResult,
    unlimitedResult,
    differenceAED: diff,
    absoluteDifferenceAED: absDiff,
    percentageDifference,
    hasDifference: hasDiff,
    higherOption,
    summary,
    legalNote,
  };
}

export { generateGratuityPDF, downloadGratuityPDF } from './gratuityPdfGenerator';

