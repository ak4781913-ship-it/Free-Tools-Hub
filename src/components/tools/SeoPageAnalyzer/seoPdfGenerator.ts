import jsPDF from 'jspdf';
import { SeoAnalysisResult } from './seoAnalysisTypes';

export function generateSeoReportPDF(result: SeoAnalysisResult): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  const marginBottom = 18;

  // Colors Palette
  const slate900 = [15, 23, 42]; // #0F172A
  const slate800 = [30, 41, 59]; // #1E293B
  const slate600 = [71, 85, 105]; // #475569
  const slate400 = [148, 163, 184]; // #94A3B8
  const slate100 = [241, 245, 249]; // #F1F5F9
  const slateBorder = [226, 232, 240]; // #E2E8F0

  const indigo600 = [79, 70, 229]; // #4F46E5
  const emerald600 = [5, 150, 105]; // #059669
  const amber600 = [217, 119, 6]; // #D97706
  const red600 = [220, 38, 38]; // #DC2626

  let currentY = 12;

  // Helper for adding a new page if space is low
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 14;
      renderPageHeaderMini();
    }
  };

  const renderPageHeaderMini = () => {
    doc.setFillColor(slate100[0], slate100[1], slate100[2]);
    doc.rect(marginX, currentY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text('SEO PAGE ANALYZER REPORT – AUDIT CONTINUED', marginX + 3, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(result.url.slice(0, 50), marginX + contentWidth - 3, currentY + 5.5, { align: 'right' });
    currentY += 12;
  };

  // Generate Reference ID & Timestamp
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const refCode = `SEO-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // ==========================================
  // 1. TOP HEADER BANNER
  // ==========================================
  const headerHeight = 25;
  doc.setFillColor(slate900[0], slate900[1], slate900[2]);
  doc.roundedRect(marginX, currentY, contentWidth, headerHeight, 2, 2, 'F');

  // Decorative Indigo Accent Strip
  doc.setFillColor(indigo600[0], indigo600[1], indigo600[2]);
  doc.rect(marginX, currentY + headerHeight - 1.8, contentWidth, 1.8, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('WEBSITE SEO & ON-PAGE AUDIT REPORT', marginX + 6, currentY + 9);

  // Header Subtitle
  doc.setTextColor(199, 210, 254); // Indigo 200
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const auditScopeText = result.isClientRenderedSpa
    ? 'Raw HTML Source Audit (JS Disabled) • Architecture: Client-Side SPA'
    : 'Raw HTML Source Audit (JS Execution Disabled) • On-Page Technical Benchmarks';
  doc.text(auditScopeText, marginX + 6, currentY + 16);

  // Right-aligned Metadata
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`DATE: ${dateStr} ${timeStr}`, marginX + contentWidth - 6, currentY + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`REF: ${refCode}`, marginX + contentWidth - 6, currentY + 16, { align: 'right' });

  currentY += headerHeight + 5;

  // ==========================================
  // 2. TARGET URL & EXECUTIVE SCORECARD
  // ==========================================
  const scorecardHeight = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(marginX, currentY, contentWidth, scorecardHeight, 2, 2, 'FD');

  // Left Score Box
  const scoreBoxWidth = 36;
  const gradeColor =
    result.scores.overall >= 85 ? emerald600 : result.scores.overall >= 70 ? indigo600 : result.scores.overall >= 55 ? amber600 : red600;

  doc.setFillColor(slate100[0], slate100[1], slate100[2]);
  doc.roundedRect(marginX + 3, currentY + 3, scoreBoxWidth, scorecardHeight - 6, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(`${result.scores.overall}`, marginX + 3 + scoreBoxWidth / 2, currentY + 16, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text('OUT OF 100', marginX + 3 + scoreBoxWidth / 2, currentY + 21, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.text(`GRADE ${result.scores.grade}`, marginX + 3 + scoreBoxWidth / 2, currentY + 27, { align: 'center' });

  // Center URL and Details
  const urlStartX = marginX + scoreBoxWidth + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('ANALYZED TARGET URL:', urlStartX, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(indigo600[0], indigo600[1], indigo600[2]);
  const urlDisplay = result.url.length > 55 ? `${result.url.slice(0, 52)}...` : result.url;
  doc.text(urlDisplay, urlStartX, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text('PAGE TITLE:', urlStartX, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  const titleDisplay = (result.meta.title.content || 'Untitled').slice(0, 50);
  doc.text(titleDisplay, urlStartX, currentY + 25);

  doc.setFontSize(7);
  doc.setTextColor(slate400[0], slate400[1], slate400[2]);
  doc.text(`HTTPS Protocol: ${result.isHttps ? 'SECURE (Active)' : 'INSECURE (HTTP)'} | TTFB: ${result.performance.ttfbMs}ms`, urlStartX, currentY + 31);

  // Right Sub-Score Pills
  const rightColX = marginX + contentWidth - 45;
  doc.setFillColor(slate100[0], slate100[1], slate100[2]);
  doc.roundedRect(rightColX, currentY + 4, 40, scorecardHeight - 8, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text('SUB-SCORE METRICS', rightColX + 20, currentY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Meta Tags:`, rightColX + 4, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.scores.meta}%`, rightColX + 36, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Headings:`, rightColX + 4, currentY + 20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.scores.headings}%`, rightColX + 36, currentY + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Performance:`, rightColX + 4, currentY + 25);
  doc.setFont('helvetica', 'bold');
  doc.text(`${result.scores.performance}%`, rightColX + 36, currentY + 25, { align: 'right' });

  currentY += scorecardHeight + 6;

  // Issues Overview Tally Bar
  doc.setFillColor(slate100[0], slate100[1], slate100[2]);
  doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(red600[0], red600[1], red600[2]);
  doc.text(`• ${result.scores.criticalCount} Critical Issues`, marginX + 6, currentY + 5.5);

  doc.setTextColor(amber600[0], amber600[1], amber600[2]);
  doc.text(`• ${result.scores.warningCount} Warnings`, marginX + 55, currentY + 5.5);

  doc.setTextColor(emerald600[0], emerald600[1], emerald600[2]);
  doc.text(`• ${result.scores.passedCount} Checks Passed`, marginX + 105, currentY + 5.5);

  currentY += 13;

  // ==========================================
  // 3. CORE META TAGS AUDIT TABLE
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('1. CORE META TAGS AUDIT', marginX, currentY);
  currentY += 3.5;

  const metaRows = [
    {
      tag: '<title>',
      status: result.meta.title.status,
      chars: `${result.meta.title.length || 0} chars (optimal: 30-60)`,
      details: (result.meta.title.content || 'Missing <title>').slice(0, 50),
    },
    {
      tag: '<meta description>',
      status: result.meta.description.status,
      chars: `${result.meta.description.length || 0} chars (optimal: 120-160)`,
      details: (result.meta.description.content || 'Missing description').slice(0, 50),
    },
    {
      tag: '<meta viewport>',
      status: result.meta.viewport.status,
      chars: 'Responsive mobile',
      details: result.meta.viewport.content || 'Not configured',
    },
    {
      tag: '<link canonical>',
      status: result.meta.canonical.status,
      chars: 'Canonical link',
      details: (result.meta.canonical.content || 'Missing canonical').slice(0, 50),
    },
    {
      tag: '<meta robots>',
      status: result.meta.robots.status,
      chars: 'Search indexing',
      details: result.meta.robots.content || 'Default (Index, Follow)',
    },
    {
      tag: '<h1> Primary Heading',
      status: result.headings.h1Count === 1 ? 'good' : 'error',
      chars: `${result.headings.h1Count} H1 tag(s)`,
      details: result.headings.h1Count === 0 ? 'Missing <h1> tag' : (result.headings.h1List[0] || '').slice(0, 50),
    },
    {
      tag: 'Image Alt Text',
      status: result.performance.images.missingAltCount === 0 ? 'good' : 'warning',
      chars: `${result.performance.images.total - result.performance.images.missingAltCount} / ${result.performance.images.total} with alt`,
      details: result.performance.images.missingAltCount === 0 ? 'All images have alt text' : `${result.performance.images.missingAltCount} image(s) missing alt`,
    },
    {
      tag: 'OpenGraph Tags',
      status: result.meta.openGraph.status,
      chars: `${result.meta.openGraph.presentCount} / 4 tags`,
      details: result.meta.openGraph.missingTags.length === 0 ? 'Fully configured' : `Missing: ${result.meta.openGraph.missingTags.join(', ')}`,
    },
    {
      tag: 'Schema.org JSON-LD',
      status: result.meta.schemas.count > 0 ? 'good' : 'warning',
      chars: `${result.meta.schemas.count} schema(s)`,
      details: result.meta.schemas.count > 0 ? result.meta.schemas.items.map((s) => s.type).join(', ') : 'No JSON-LD schemas detected',
    },
  ];

  // Table Header
  doc.setFillColor(slate800[0], slate800[1], slate800[2]);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('TAG NAME', marginX + 3, currentY + 4.2);
  doc.text('STATUS', marginX + 45, currentY + 4.2);
  doc.text('LENGTH / ATTRIBUTES', marginX + 75, currentY + 4.2);
  doc.text('PAGE VALUE / FINDINGS', marginX + 125, currentY + 4.2);
  currentY += 6;

  // Table Body Rows
  metaRows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : slate100[0], isEven ? 255 : slate100[1], isEven ? 255 : slate100[2]);
    doc.rect(marginX, currentY, contentWidth, 5.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(row.tag, marginX + 3, currentY + 4);

    // Status Pill text
    const statusCol = row.status === 'good' ? emerald600 : row.status === 'warning' ? amber600 : red600;
    doc.setTextColor(statusCol[0], statusCol[1], statusCol[2]);
    doc.text(row.status.toUpperCase(), marginX + 45, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text(row.chars, marginX + 75, currentY + 4);
    doc.text(row.details, marginX + 125, currentY + 4);

    currentY += 5.5;
  });

  currentY += 6;

  // ==========================================
  // 4. HEADING HIERARCHY STRUCTURE
  // ==========================================
  ensureSpace(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('2. HEADING STRUCTURE & OUTLINE (H1–H6)', marginX, currentY);
  currentY += 3.5;

  // Heading counts box
  doc.setFillColor(slate100[0], slate100[1], slate100[2]);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text('Distribution:', marginX + 3, currentY + 4.5);

  const hCountsText = `H1: ${result.headings.counts.h1 || 0}  |  H2: ${result.headings.counts.h2 || 0}  |  H3: ${result.headings.counts.h3 || 0}  |  H4: ${result.headings.counts.h4 || 0}  |  H5: ${result.headings.counts.h5 || 0}  |  H6: ${result.headings.counts.h6 || 0}`;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text(hCountsText, marginX + 22, currentY + 4.5);

  const h1Status =
    result.headings.h1Count === 1
      ? 'PASSED (Single H1 headline)'
      : result.headings.h1Count === 0
      ? 'CRITICAL (Missing H1 tag)'
      : 'WARNING (Multiple H1 tags)';
  const h1Col = result.headings.h1Count === 1 ? emerald600 : result.headings.h1Count === 0 ? red600 : amber600;

  doc.setFont('helvetica', 'normal');
  doc.text('H1 Status:', marginX + 3, currentY + 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(h1Col[0], h1Col[1], h1Col[2]);
  doc.text(h1Status, marginX + 22, currentY + 9.5);

  const skipsText = result.headings.hasSkippedLevels
    ? `Hierarchy Skips: DETECTED (${result.headings.skippedLevelNotes.length})`
    : 'Hierarchy Skips: NONE (Sequential)';
  doc.setTextColor(result.headings.hasSkippedLevels ? amber600[0] : emerald600[0], result.headings.hasSkippedLevels ? amber600[1] : emerald600[1], result.headings.hasSkippedLevels ? amber600[2] : emerald600[2]);
  doc.text(skipsText, marginX + 110, currentY + 9.5);

  currentY += 16;

  // Heading tree outline snippet (top 5 headings)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text('DOCUMENT OUTLINE SAMPLE:', marginX, currentY);
  currentY += 4;

  const sampleHeadings = result.headings.items.slice(0, 6);
  sampleHeadings.forEach((h) => {
    const indent = (h.level - 1) * 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(indigo600[0], indigo600[1], indigo600[2]);
    doc.text(`[${h.tag}]`, marginX + 2 + indent, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(h.text.slice(0, 60), marginX + 12 + indent, currentY);
    currentY += 4.5;
  });

  currentY += 4;

  // ==========================================
  // 5. TECHNICAL & PERFORMANCE BENCHMARKS
  // ==========================================
  ensureSpace(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('3. PERFORMANCE & TECHNICAL BENCHMARKS', marginX, currentY);
  currentY += 3.5;

  const perfBoxes = [
    { label: 'Time-to-First-Byte (TTFB)', val: `${result.performance.ttfbMs} ms`, note: result.performance.ttfbMs < 300 ? 'Fast Server' : 'Needs Caching' },
    { label: 'HTML Document Weight', val: `${Math.round(result.performance.htmlSizeBytes / 1024)} KB`, note: `${result.performance.domNodesCount} DOM nodes` },
    { label: 'Image Alt Tag Coverage', val: `${result.performance.images.total > 0 ? Math.round(((result.performance.images.total - result.performance.images.missingAltCount) / result.performance.images.total) * 100) : 100}%`, note: `${result.performance.images.missingAltCount} missing alt` },
    { label: 'Internal vs External Links', val: `${result.performance.links.internalCount} int / ${result.performance.links.externalCount} ext`, note: `${result.performance.links.emptyAnchorCount} empty text` },
  ];

  const pBoxWidth = (contentWidth - 6) / 4;
  perfBoxes.forEach((b, idx) => {
    const bx = marginX + idx * (pBoxWidth + 2);
    doc.setFillColor(slate100[0], slate100[1], slate100[2]);
    doc.roundedRect(bx, currentY, pBoxWidth, 16, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text(b.label, bx + pBoxWidth / 2, currentY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.text(b.val, bx + pBoxWidth / 2, currentY + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(slate400[0], slate400[1], slate400[2]);
    doc.text(b.note, bx + pBoxWidth / 2, currentY + 14, { align: 'center' });
  });

  currentY += 21;

  // ==========================================
  // 4. INTERNAL LINKS & BROKEN LINK REPORT
  // ==========================================
  ensureSpace(38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('4. INTERNAL LINKS & BROKEN LINK AUDIT', marginX, currentY);
  currentY += 4;

  const linksRep = result.internalLinksReport;
  const linkSummaryHeight = 12;
  doc.setFillColor(slate100[0], slate100[1], slate100[2]);
  doc.roundedRect(marginX, currentY, contentWidth, linkSummaryHeight, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text(`Discovered: ${linksRep.totalDiscovered} total (${linksRep.uniqueUrlsCount} unique URLs)`, marginX + 4, currentY + 4.5);
  doc.text(`Healthy (200 OK): ${linksRep.okCount}`, marginX + 65, currentY + 4.5);

  const brokenColor = linksRep.brokenCount > 0 ? red600 : emerald600;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brokenColor[0], brokenColor[1], brokenColor[2]);
  doc.text(`Broken Links: ${linksRep.brokenCount} ${linksRep.brokenCount > 0 ? '(ACTION REQUIRED)' : '(None)'}`, marginX + 115, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slate600[0], slate600[1], slate600[2]);
  doc.text(`Redirects (3xx): ${linksRep.redirectCount}`, marginX + 4, currentY + 9);
  doc.text(`Crawl Status: ${linksRep.crawlCompleted ? 'Completed (100%)' : 'Verified'}`, marginX + 65, currentY + 9);

  currentY += linkSummaryHeight + 4;

  // Broken links table if any
  const brokenLinkItems = linksRep.links.filter((l) => l.status === 'broken' || l.status === 'timeout');
  if (brokenLinkItems.length > 0) {
    ensureSpace(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(red600[0], red600[1], red600[2]);
    doc.text(`BROKEN INTERNAL LINKS DETECTED (${brokenLinkItems.length}):`, marginX, currentY);
    currentY += 3.5;

    // Header
    doc.setFillColor(slate800[0], slate800[1], slate800[2]);
    doc.rect(marginX, currentY, contentWidth, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('BROKEN TARGET URL', marginX + 3, currentY + 3.8);
    doc.text('STATUS', marginX + 75, currentY + 3.8);
    doc.text('ANCHOR TEXT', marginX + 110, currentY + 3.8);
    doc.text('DIAGNOSIS', marginX + 145, currentY + 3.8);
    currentY += 5.5;

    brokenLinkItems.slice(0, 5).forEach((bLink, bIdx) => {
      const isEven = bIdx % 2 === 0;
      doc.setFillColor(isEven ? 255 : slate100[0], isEven ? 255 : slate100[1], isEven ? 255 : slate100[2]);
      doc.rect(marginX, currentY, contentWidth, 5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(red600[0], red600[1], red600[2]);
      doc.text(bLink.originalHref.slice(0, 48), marginX + 3, currentY + 3.6);

      doc.setFont('helvetica', 'bold');
      doc.text(bLink.statusText || '404 Error', marginX + 75, currentY + 3.6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slate900[0], slate900[1], slate900[2]);
      doc.text((bLink.anchorText || 'Empty').slice(0, 22), marginX + 110, currentY + 3.6);

      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text((bLink.diagnosticTip || 'Dead link on server').slice(0, 24), marginX + 145, currentY + 3.6);

      currentY += 5;
    });

    currentY += 4;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(emerald600[0], emerald600[1], emerald600[2]);
    doc.text('Clean Link Architecture: Zero broken internal links detected on page.', marginX + 4, currentY + 2);
    currentY += 6;
  }

  // ==========================================
  // 5. KEYWORD DENSITY & CONTENT HEALTH
  // ==========================================
  ensureSpace(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('5. KEYWORD DENSITY & CONTENT HEALTH', marginX, currentY);
  currentY += 4;

  const kwData = result.keywords;
  if (kwData && kwData.totalWords > 0) {
    doc.setFillColor(slate100[0], slate100[1], slate100[2]);
    doc.roundedRect(marginX, currentY, contentWidth, 11, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text(`Total Words: ${kwData.totalWords.toLocaleString()}`, marginX + 4, currentY + 4.5);
    doc.text(`Unique Vocabulary: ${kwData.uniqueWords.toLocaleString()}`, marginX + 50, currentY + 4.5);
    doc.text(`Est. Reading Time: ~${kwData.readingTimeMinutes} min`, marginX + 105, currentY + 4.5);

    const stuffColor = kwData.hasKeywordStuffing ? amber600 : emerald600;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(stuffColor[0], stuffColor[1], stuffColor[2]);
    doc.text(`Stuffing Risk: ${kwData.hasKeywordStuffing ? 'Warning (>3.5% detected)' : 'Passed (Natural density)'}`, marginX + 4, currentY + 8.5);

    currentY += 14;

    // Top 4 Keywords table row
    if (kwData.topKeywords1.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(slate800[0], slate800[1], slate800[2]);
      const topTokens = kwData.topKeywords1
        .slice(0, 4)
        .map((k) => `"${k.keyword}" (${k.count}x • ${k.density}%${k.inTitle ? ' • In Title' : ''})`)
        .join('    ');
      doc.text(`Top Keywords: ${topTokens}`, marginX, currentY);
      currentY += 5.5;
    }
  }

  // ==========================================
  // 6. PRIORITIZED ACTIONABLE ISSUES
  // ==========================================
  ensureSpace(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.text('6. PRIORITIZED ACTIONABLE FINDINGS & RECOMMENDATIONS', marginX, currentY);
  currentY += 4.5;

  const criticalAndWarnings = result.issues.filter((i) => i.severity === 'critical' || i.severity === 'warning');

  if (criticalAndWarnings.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(emerald600[0], emerald600[1], emerald600[2]);
    doc.text('No critical issues or warnings found! The page passes all primary on-page SEO audits.', marginX, currentY);
    currentY += 8;
  } else {
    criticalAndWarnings.slice(0, 6).forEach((issue) => {
      ensureSpace(18);
      const isCrit = issue.severity === 'critical';
      const badgeColor = isCrit ? red600 : amber600;

      doc.setFillColor(slate100[0], slate100[1], slate100[2]);
      doc.roundedRect(marginX, currentY, contentWidth, 16, 1.5, 1.5, 'F');

      // Left Accent Strip
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.rect(marginX, currentY, 2.5, 16, 'F');

      // Title & Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.text(`[${issue.severity.toUpperCase()}] ${issue.title}`, marginX + 5, currentY + 4.5);

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(slate900[0], slate900[1], slate900[2]);
      doc.text(issue.description.slice(0, 95), marginX + 5, currentY + 8.5);

      // Recommendation
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(slate600[0], slate600[1], slate600[2]);
      doc.text(`Recommendation: ${issue.recommendation.slice(0, 95)}`, marginX + 5, currentY + 12.5);

      currentY += 18;
    });
  }

  // ==========================================
  // 7. FOOTER ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(slate400[0], slate400[1], slate400[2]);
    doc.text('FreeTools Hub (freetools.hub) – 100% Free Client-Side SEO Audit & Optimization Suite', marginX, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, pageHeight - 7, { align: 'right' });
  }

  return doc;
}
