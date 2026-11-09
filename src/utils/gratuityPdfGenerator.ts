import jsPDF from 'jspdf';
import { GratuityInputs, GratuityCalculationResult } from '../types/gratuity';
import { getSiteBaseUrl } from './seoManager';

/**
 * Generates and downloads a high-resolution, vector-rendered PDF document
 * summarizing the UAE End-of-Service Gratuity calculation in compliance with
 * UAE Federal Decree-Law No. 33 of 2021.
 */
export function generateGratuityPDF(inputs: GratuityInputs, result: GratuityCalculationResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Colors
  const primaryDark = [15, 23, 42]; // #0F172A Slate 900
  const emeraldDark = [6, 78, 59]; // #064E3B Emerald 900
  const emeraldBrand = [5, 150, 105]; // #059669 Emerald 600
  const emeraldLight = [240, 253, 244]; // #F0FDF4 Emerald 50
  const emeraldBorder = [167, 243, 208]; // #A7F3D0 Emerald 200
  const slateText = [51, 65, 85]; // #334155
  const slateMuted = [100, 116, 139]; // #64748B
  const slateBorder = [226, 232, 240]; // #E2E8F0
  const tableHeaderBg = [30, 41, 59]; // #1E293B

  // Helper formatting
  const formatAED = (num: number) =>
    num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Generate Reference ID & Timestamp
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const refCode = `EOSG-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ==========================================
  // 1. TOP HEADER BANNER
  // ==========================================
  const headerY = 12;
  const headerHeight = 23;

  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.roundedRect(marginX, headerY, contentWidth, headerHeight, 2, 2, 'F');

  // Decorative Emerald Accent Strip
  doc.setFillColor(emeraldBrand[0], emeraldBrand[1], emeraldBrand[2]);
  doc.rect(marginX, headerY + headerHeight - 1.8, contentWidth, 1.8, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('UAE END-OF-SERVICE GRATUITY STATEMENT', marginX + 6, headerY + 8);

  // Header Subtitle
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Statutory Calculation under UAE Labour Law (Federal Decree-Law No. 33 of 2021)', marginX + 6, headerY + 14);

  // Right-aligned Metadata in Header
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`REF: ${refCode}`, marginX + contentWidth - 6, headerY + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`ISSUED: ${dateStr} ${timeStr}`, marginX + contentWidth - 6, headerY + 12, { align: 'right' });

  // Status Badge in Header
  const badgeText = result.isEligible ? 'STATUTORY ESTIMATE' : 'TENURE UNDER 1 YEAR';
  const badgeWidth = doc.getTextWidth(badgeText) + 6;
  doc.setFillColor(result.isEligible ? 5 : 217, result.isEligible ? 150 : 119, result.isEligible ? 105 : 6);
  doc.roundedRect(marginX + contentWidth - badgeWidth - 6, headerY + 14.5, badgeWidth, 4.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text(badgeText, marginX + contentWidth - 6 - badgeWidth / 2, headerY + 17.6, { align: 'center' });

  // ==========================================
  // 2. EXECUTIVE SUMMARY BOX (NET GRATUITY)
  // ==========================================
  const summaryY = headerY + headerHeight + 3.5; // 38.5
  const summaryHeight = 24;

  // Box background & border
  doc.setFillColor(emeraldLight[0], emeraldLight[1], emeraldLight[2]);
  doc.setDrawColor(emeraldBorder[0], emeraldBorder[1], emeraldBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, summaryY, contentWidth, summaryHeight, 2, 2, 'FD');

  // Left Side: Net Gratuity Amount
  doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('NET GRATUITY PAYABLE (STATUTORY SETTLEMENT)', marginX + 6, summaryY + 6.5);

  doc.setFontSize(17);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`AED ${formatAED(result.netGratuityAED)}`, marginX + 6, summaryY + 14.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Daily Basic Wage: AED ${result.dailyWage.toFixed(2)}  |  Monthly Basic Salary: AED ${formatAED(inputs.basicSalary)}`,
    marginX + 6,
    summaryY + 20
  );

  // Right Side: Eligibility & Ceiling Status
  const rightColX = marginX + contentWidth - 6;

  // Status indicator
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  if (result.isEligible) {
    doc.setTextColor(5, 150, 105);
    doc.text('ELIGIBLE FOR GRATUITY', rightColX, summaryY + 6.5, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38);
    doc.text('NOT ELIGIBLE (SERVICE < 1 YEAR)', rightColX, summaryY + 6.5, { align: 'right' });
  }

  // Statutory Cap status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  if (result.isCapped) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text(`CAPPED AT 2-YEAR STATUTORY CEILING (AED ${formatAED(result.maxCapAmount)})`, rightColX, summaryY + 12, { align: 'right' });
  } else {
    doc.text(`Statutory Max Cap (24 Months Basic): AED ${formatAED(result.maxCapAmount)}`, rightColX, summaryY + 12, { align: 'right' });
  }

  // Service Tenure Summary
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Continuous Service: ${result.serviceBreakdown.years}Y ${result.serviceBreakdown.months}M ${result.serviceBreakdown.days}D (${result.netWorkingDays} Net Days)`,
    rightColX,
    summaryY + 18,
    { align: 'right' }
  );

  // ==========================================
  // 3. SECTION 1: EMPLOYMENT TENURE & PARAMETERS
  // ==========================================
  let currentY = summaryY + summaryHeight + 5; // ~67.5

  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(marginX, yPos, contentWidth, 6, 1, 1, 'F');
    doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.rect(marginX, yPos, 2.5, 6, 'F');

    doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(title, marginX + 6, yPos + 4.2);
    return yPos + 7.5;
  };

  currentY = drawSectionHeader('1. EMPLOYEE TENURE & CONTRACT PARAMETERS', currentY);

  // Parameters Grid (2 columns x 4 rows)
  const paramCol1W = 90;
  const paramCol2W = contentWidth - paramCol1W;
  const paramRowH = 5.6;

  interface ParamItem {
    label: string;
    value: string;
  }

  const leftParams: ParamItem[] = [
    { label: 'Employment Start Date', value: inputs.startDate },
    { label: 'Last Working Day (End Date)', value: inputs.endDate },
    { label: 'Gross Calendar Duration', value: `${result.totalDays} Days` },
    { label: 'Unpaid Leave Deductions', value: `${result.unpaidDaysDeducted} Days (Excluded)` },
    { label: 'Net Continuous Service', value: `${result.netWorkingDays} Days (${result.yearsOfService.toFixed(3)} Years)` },
  ];

  const rightParams: ParamItem[] = [
    { label: 'Monthly Basic Salary', value: `AED ${formatAED(inputs.basicSalary)}` },
    { label: 'Daily Basic Wage (Basic×12÷365)', value: `AED ${result.dailyWage.toFixed(2)}` },
    { label: 'Contract Classification', value: inputs.contractType === 'limited' ? 'Limited / Fixed-Term Contract' : 'Unlimited Contract' },
    { label: 'Reason for Separation', value: inputs.separationReason.replace(/_/g, ' ').toUpperCase() },
    { label: 'Labour Law Regime', value: inputs.lawRegime === 'new_law_2022' ? 'Federal Decree-Law 33/2021 (Current)' : 'Federal Law 8/1980 (Pre-2022)' },
  ];

  const paramGridStartY = currentY;
  for (let i = 0; i < leftParams.length; i++) {
    const rowY = paramGridStartY + i * paramRowH;
    const isEven = i % 2 === 0;

    if (isEven) {
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.rect(marginX, rowY, contentWidth, paramRowH, 'F');
    }

    // Left Column
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(leftParams[i].label, marginX + 4, rowY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(leftParams[i].value, marginX + paramCol1W - 4, rowY + 3.8, { align: 'right' });

    // Right Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(rightParams[i].label, marginX + paramCol1W + 6, rowY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(rightParams[i].value, marginX + contentWidth - 4, rowY + 3.8, { align: 'right' });
  }

  // Border around params grid
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);
  doc.rect(marginX, paramGridStartY, contentWidth, leftParams.length * paramRowH, 'D');
  // Divider between col 1 and 2
  doc.line(marginX + paramCol1W, paramGridStartY, marginX + paramCol1W, paramGridStartY + leftParams.length * paramRowH);

  currentY = paramGridStartY + leftParams.length * paramRowH + 4.5;

  // ==========================================
  // 4. SECTION 2: STATUTORY GRATUITY COMPUTATION TABLE
  // ==========================================
  currentY = drawSectionHeader('2. STATUTORY TIERED GRATUITY COMPUTATION', currentY);

  // Table Column Definitions
  const colW = {
    desc: 68,
    formula: 48,
    duration: 34,
    amount: 32,
  };

  const tableHeaderY = currentY;
  const tableHeaderH = 6;

  // Table Header Background
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.rect(marginX, tableHeaderY, contentWidth, tableHeaderH, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('ENTITLEMENT TIER', marginX + 3, tableHeaderY + 4.2);
  doc.text('STATUTORY BASIS', marginX + colW.desc + 3, tableHeaderY + 4.2);
  doc.text('QUALIFYING TIME', marginX + colW.desc + colW.formula + 3, tableHeaderY + 4.2);
  doc.text('SUBTOTAL (AED)', marginX + contentWidth - 3, tableHeaderY + 4.2, { align: 'right' });

  // Rows
  interface TableRow {
    desc: string;
    basis: string;
    duration: string;
    amount: string;
    highlight?: boolean;
    isDeduction?: boolean;
    isTotal?: boolean;
  }

  const calculationRows: TableRow[] = [
    {
      desc: 'Tier 1: First 5 Years of Service',
      basis: '21 days basic wage / year',
      duration: `${result.firstFiveYearsDays.toFixed(2)} qualifying days`,
      amount: `AED ${formatAED(result.firstFiveYearsAmount)}`,
    },
    {
      desc: 'Tier 2: Service Exceeding 5 Years',
      basis: '30 days basic wage / year',
      duration: `${result.afterFiveYearsDays.toFixed(2)} qualifying days`,
      amount: `AED ${formatAED(result.afterFiveYearsAmount)}`,
    },
    {
      desc: 'Gross Accrued Gratuity',
      basis: 'Sum of Tier 1 + Tier 2',
      duration: `${(result.firstFiveYearsDays + result.afterFiveYearsDays).toFixed(2)} total days`,
      amount: `AED ${formatAED(result.grossGratuity)}`,
      highlight: true,
    },
    {
      desc: 'Old Law Resignation Adjustment',
      basis:
        inputs.lawRegime === 'old_law_1980' && result.reductionPercentage > 0
          ? `${(result.reductionPercentage * 100).toFixed(0)}% deduction applied`
          : 'None / 100% entitled (New Law)',
      duration: inputs.lawRegime === 'new_law_2022' ? 'No reduction' : 'Federal Law 8/1980',
      amount:
        result.reductionPercentage > 0
          ? `-AED ${formatAED(result.grossGratuity * result.reductionPercentage)}`
          : 'AED 0.00',
      isDeduction: result.reductionPercentage > 0,
    },
    {
      desc: 'Statutory 2-Year Cap Limit',
      basis: 'Maximum 24 months basic salary',
      duration: result.isCapped ? 'Capped at maximum' : 'Within legal ceiling',
      amount: `Limit: AED ${formatAED(result.maxCapAmount)}`,
    },
    {
      desc: 'FINAL NET GRATUITY PAYABLE',
      basis: 'UAE Labour Law Settlement Amount',
      duration: `${result.serviceBreakdown.years}Y ${result.serviceBreakdown.months}M ${result.serviceBreakdown.days}D`,
      amount: `AED ${formatAED(result.netGratuityAED)}`,
      isTotal: true,
    },
  ];

  let rowY = tableHeaderY + tableHeaderH;
  const rowHeight = 5.8;

  calculationRows.forEach((row, idx) => {
    if (row.isTotal) {
      doc.setFillColor(236, 253, 245); // Emerald 50
      doc.rect(marginX, rowY, contentWidth, rowHeight + 1.5, 'F');
      doc.setDrawColor(5, 150, 105);
      doc.setLineWidth(0.4);
      doc.line(marginX, rowY, marginX + contentWidth, rowY);
      doc.line(marginX, rowY + rowHeight + 1.5, marginX + contentWidth, rowY + rowHeight + 1.5);

      doc.setTextColor(6, 78, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(row.desc, marginX + 3, rowY + 4.8);
      doc.setFontSize(6.8);
      doc.text(row.basis, marginX + colW.desc + 3, rowY + 4.8);
      doc.text(row.duration, marginX + colW.desc + colW.formula + 3, rowY + 4.8);

      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text(row.amount, marginX + contentWidth - 3, rowY + 5.2, { align: 'right' });
      rowY += rowHeight + 1.5;
    } else {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, rowY, contentWidth, rowHeight, 'F');
      }

      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.setFont('helvetica', row.highlight ? 'bold' : 'normal');
      doc.setFontSize(6.8);
      doc.text(row.desc, marginX + 3, rowY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(row.basis, marginX + colW.desc + 3, rowY + 4);
      doc.text(row.duration, marginX + colW.desc + colW.formula + 3, rowY + 4);

      doc.setFont('helvetica', row.highlight ? 'bold' : 'normal');
      if (row.isDeduction) {
        doc.setTextColor(220, 38, 38);
      } else if (row.highlight) {
        doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
      } else {
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      }
      doc.text(row.amount, marginX + contentWidth - 3, rowY + 4, { align: 'right' });

      rowY += rowHeight;
    }
  });

  // Table outer border & vertical column dividers
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);
  doc.rect(marginX, tableHeaderY, contentWidth, rowY - tableHeaderY, 'D');

  currentY = rowY + 4.5;

  // ==========================================
  // 5. SECTION 3: STATUTORY LEGAL RULES & CITATIONS
  // ==========================================
  currentY = drawSectionHeader('3. STATUTORY PROVISIONS APPLIED (UAE LABOUR LAW)', currentY);

  const notesBoxY = currentY;
  const notes = [
    'Article 51 (Federal Decree-Law No. 33 of 2021): Full-time national and expatriate workers completing one or more continuous years of service are entitled to end-of-service gratuity upon contract separation.',
    'Separation Entitlement: Under the 2022 Labour Law, resignation does NOT trigger reduction or forfeiture of gratuity. Full statutory entitlement is accrued regardless of resignation or contract expiry.',
    'Basic Salary Exclusive: End-of-service gratuity is calculated strictly on the final monthly basic salary. All allowances (housing, transportation, utilities, education, bonuses) are excluded by statute.',
    'Service Tier Calculation: 21 days basic wage per qualifying year for the first 5 years; 30 days basic wage per qualifying year for each year thereafter. Pro-rata fractions apply for partial years.',
    'Statutory Ceiling: The total aggregate gratuity payable may not exceed two (2) years basic salary (Article 51, Clause 5). Unpaid leave days are deducted from qualifying continuous service.',
  ];

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);

  const noteLineH = 4.2;
  const totalNotesH = notes.length * noteLineH + 4;
  doc.roundedRect(marginX, notesBoxY, contentWidth, totalNotesH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);

  notes.forEach((note, idx) => {
    const textY = notesBoxY + 3.2 + idx * noteLineH;
    // Bullet dot
    doc.setFillColor(emeraldBrand[0], emeraldBrand[1], emeraldBrand[2]);
    doc.circle(marginX + 3.5, textY - 1, 0.7, 'F');
    // Note text
    doc.text(note, marginX + 6.5, textY, { maxWidth: contentWidth - 10 });
  });

  currentY = notesBoxY + totalNotesH + 4;

  // ==========================================
  // 6. SECTION 4: SIGN-OFF & ACKNOWLEDGEMENT
  // ==========================================
  currentY = drawSectionHeader('4. VERIFICATION & SETTLEMENT SIGN-OFF', currentY);

  const signBoxY = currentY;
  const signBoxH = 20;
  const signColW = (contentWidth - 6) / 2;

  // Employee Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(marginX, signBoxY, signColW, signBoxH, 1.5, 1.5, 'FD');

  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('EMPLOYEE ACKNOWLEDGEMENT', marginX + 4, signBoxY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Signature: ____________________________________', marginX + 4, signBoxY + 10.5);
  doc.text('Full Name: ____________________________________', marginX + 4, signBoxY + 14.5);
  doc.text('Date: ____ / ____ / ________', marginX + 4, signBoxY + 18.5);

  // Employer / HR Box
  const signCol2X = marginX + signColW + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(signCol2X, signBoxY, signColW, signBoxH, 1.5, 1.5, 'FD');

  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('EMPLOYER / HR AUTHORIZED SIGNATORY', signCol2X + 4, signBoxY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Authorized Signature: __________________________', signCol2X + 4, signBoxY + 10.5);
  doc.text('Company Stamp / Seal: _________________________', signCol2X + 4, signBoxY + 14.5);
  doc.text('Date: ____ / ____ / ________', signCol2X + 4, signBoxY + 18.5);

  currentY = signBoxY + signBoxH + 3.5;

  // ==========================================
  // 7. SECTION 5: LEGAL DISCLAIMER & FOOTER
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('STATUTORY NOTICE & LEGAL DISCLAIMER:', marginX, currentY);

  currentY += 2.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  const disclaimerText =
    'This end-of-service gratuity calculation summary is generated for advisory, planning, and estimation purposes in accordance with UAE Federal Decree-Law No. 33 of 2021. Final payout may vary based on company payroll reconciliation, accrued authorized leave compensations, notice period adjustments, outstanding loans/advances, or approved alternative workplace savings schemes (such as DEWS in DIFC or voluntary pension programs). Basic salary strictly excludes allowances. For official legal disputes, please contact the Ministry of Human Resources and Emiratisation (MOHRE).';

  doc.text(disclaimerText, marginX, currentY, { maxWidth: contentWidth });

  // Bottom Footer Bar
  const footerY = pageHeight - 9;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 2, marginX + contentWidth, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const baseSiteUrl = getSiteBaseUrl();
  doc.text(
    baseSiteUrl
      ? `FreeTools Hub  •  UAE Labour Law Suite  •  ${baseSiteUrl}`
      : 'FreeTools Hub  •  UAE Labour Law Suite',
    marginX,
    footerY + 1.5
  );
  doc.text(`Document Reference: ${refCode}  •  Page 1 of 1`, marginX + contentWidth, footerY + 1.5, { align: 'right' });

  return doc;
}

/**
 * Triggers an immediate browser download of the generated PDF document.
 */
export function downloadGratuityPDF(inputs: GratuityInputs, result: GratuityCalculationResult): void {
  const doc = generateGratuityPDF(inputs, result);
  const cleanStart = inputs.startDate.replace(/[^0-9]/g, '');
  const cleanEnd = inputs.endDate.replace(/[^0-9]/g, '');
  const fileName = `UAE_Gratuity_Report_${cleanStart}_to_${cleanEnd}.pdf`;

  doc.save(fileName);
}
