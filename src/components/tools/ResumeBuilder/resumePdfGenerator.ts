import jsPDF from 'jspdf';
import { ResumeData } from '../../../types/resume';
import { sanitizePhotoForPdf } from './photoUploadHelper';

/**
 * Parses a CSS hex color (e.g. #4F46E5 or #059669) into [r, g, b] numbers
 */
function hexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [79, 70, 229]; // Default indigo
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [isNaN(r) ? 79 : r, isNaN(g) ? 70 : g, isNaN(b) ? 229 : b];
  }
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    return [isNaN(r) ? 79 : r, isNaN(g) ? 70 : g, isNaN(b) ? 229 : b];
  }
  return [79, 70, 229];
}

/**
 * Formats date string from 'YYYY-MM' or 'YYYY-MM-DD' to 'Mon YYYY'
 */
function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${monthNames[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export interface PDFExportOptions {
  filename?: string;
  watermark?: boolean;
  preparedPhoto?: { dataUrl: string; format: 'JPEG' | 'PNG' | 'WEBP' } | null;
}

/**
 * Synchronous core generator for vector-rendered, ATS-compliant PDF resume
 */
export function generateResumePDFSync(data: ResumeData, options?: PDFExportOptions): jsPDF {
  const { personalInfo, experience, education, skills, languages, certifications, projects, sectionVisibility, designSettings } = data;
  const { template, accentColor, fontFamily, fontSize } = designSettings;

  // Initialize jsPDF document (Standard A4 portrait: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const marginTop = 14;
  const marginBottom = 15;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Map font family
  const pdfFont =
    fontFamily === 'serif' ? 'times' : fontFamily === 'mono' ? 'courier' : 'helvetica';

  // Base font size scaling
  const sizeMultiplier = fontSize === 'compact' ? 0.92 : fontSize === 'relaxed' ? 1.08 : 1.0;

  const fontSizes = {
    name: 20 * sizeMultiplier,
    title: 11 * sizeMultiplier,
    contact: 8.5 * sizeMultiplier,
    sectionHeading: 11 * sizeMultiplier,
    itemHeading: 10 * sizeMultiplier,
    itemSubheading: 9 * sizeMultiplier,
    body: 9 * sizeMultiplier,
    small: 8 * sizeMultiplier,
  };

  const lineHeights = {
    name: 7.5 * sizeMultiplier,
    title: 5 * sizeMultiplier,
    contact: 4 * sizeMultiplier,
    sectionHeading: 6 * sizeMultiplier,
    itemHeading: 4.5 * sizeMultiplier,
    body: 4 * sizeMultiplier,
  };

  // Color Palette
  const accentRGB = hexToRgb(accentColor);
  const darkSlate: [number, number, number] = [15, 23, 42]; // #0F172A
  const slateText: [number, number, number] = [51, 65, 85]; // #334155
  const slateMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const lightBorder: [number, number, number] = [226, 232, 240]; // #E2E8F0

  let curY = marginTop;

  // Helper to ensure page bounds
  const checkPageBreak = (neededHeight: number) => {
    if (curY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      curY = marginTop;
      return true;
    }
    return false;
  };

  // Helper: Section Header Renderer
  const renderSectionHeader = (title: string) => {
    checkPageBreak(12);

    curY += 3;
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(fontSizes.sectionHeading);

    if (template === 'modern') {
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.text(title.toUpperCase(), marginX, curY);

      // Accent underline rule
      const textWidth = doc.getTextWidth(title.toUpperCase());
      doc.setDrawColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.setLineWidth(0.6);
      doc.line(marginX, curY + 1.8, marginX + textWidth + 4, curY + 1.8);

      // Remaining subtle line
      doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
      doc.setLineWidth(0.2);
      doc.line(marginX + textWidth + 5, curY + 1.8, marginX + contentWidth, curY + 1.8);
      curY += 6;
    } else if (template === 'classic') {
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(title.toUpperCase(), marginX + contentWidth / 2, curY, { align: 'center' });

      doc.setDrawColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.setLineWidth(0.4);
      doc.line(marginX + 20, curY + 1.8, marginX + contentWidth - 20, curY + 1.8);
      curY += 6;
    } else if (template === 'ats') {
      // ATS: Strict left aligned uppercase with full width rule
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(title.toUpperCase(), marginX, curY);

      doc.setDrawColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setLineWidth(0.4);
      doc.line(marginX, curY + 1.5, marginX + contentWidth, curY + 1.5);
      curY += 5.5;
    } else {
      // Minimal template
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.text(title.toUpperCase(), marginX, curY);
      doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
      doc.setLineWidth(0.2);
      doc.line(marginX, curY + 1.8, marginX + contentWidth, curY + 1.8);
      curY += 5.5;
    }
  };

  // ==========================================
  // 1. HEADER / PERSONAL INFO
  // ==========================================
  const renderHeader = () => {
    const fullName = personalInfo.fullName || 'Candidate Name';
    const jobTitle = personalInfo.jobTitle || 'Professional Title';

    // Profile photo parameters
    const photoToEmbed = options?.preparedPhoto?.dataUrl || personalInfo.photo;
    const hasPhoto = Boolean(
      photoToEmbed &&
      (template !== 'ats' || personalInfo.showPhotoInAts)
    );
    const photoPosition = personalInfo.photoPosition || 'right';
    const photoShape = personalInfo.photoShape || 'circle';
    const photoDim = 24; // mm
    const photoGap = 4; // mm

    let textX = marginX;
    let textAvailableWidth = contentWidth;
    let photoX = marginX;
    const headerContentStartY = curY + (template === 'modern' ? 5 : 0);
    const photoY = headerContentStartY + 1;

    if (hasPhoto) {
      if (photoPosition === 'left') {
        photoX = marginX;
        textX = marginX + photoDim + photoGap;
        textAvailableWidth = contentWidth - (photoDim + photoGap);
      } else {
        photoX = marginX + contentWidth - photoDim;
        textX = marginX;
        textAvailableWidth = contentWidth - (photoDim + photoGap);
      }
    }

    if (template === 'classic') {
      if (!hasPhoto) {
        // Centered Classic Header without photo
        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(fontSizes.name);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(fullName, marginX + contentWidth / 2, curY + 6, { align: 'center' });
        curY += 8;

        if (jobTitle) {
          doc.setFont(pdfFont, 'normal');
          doc.setFontSize(fontSizes.title);
          doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
          doc.text(jobTitle, marginX + contentWidth / 2, curY + 3, { align: 'center' });
          curY += 5;
        }
      } else {
        // Classic Header with Photo
        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(fontSizes.name);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        doc.text(fullName, textX, curY + 6);
        curY += 8;

        if (jobTitle) {
          doc.setFont(pdfFont, 'normal');
          doc.setFontSize(fontSizes.title);
          doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
          doc.text(jobTitle, textX, curY + 3);
          curY += 5;
        }
      }
    } else if (template === 'modern') {
      // Modern Header with Top Accent Strip
      doc.setFillColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.rect(marginX, curY, contentWidth, 1.8, 'F');
      curY += 5;

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.name);
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.text(fullName, textX, curY + 6);
      curY += 8;

      if (jobTitle) {
        doc.setFont(pdfFont, 'bold');
        doc.setFontSize(fontSizes.title);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text(jobTitle, textX, curY + 3);
        curY += 5;
      }
    } else {
      // ATS & Minimal Header
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.name);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(fullName, textX, curY + 5);
      curY += 7;

      if (jobTitle) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.title);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text(jobTitle, textX, curY + 3);
        curY += 5;
      }
    }

    // Embed Profile Photo with True Vector Clipping (No Square Corners in Circle Mode)
    if (hasPhoto && photoToEmbed) {
      try {
        const photoData = photoToEmbed.trim();
        const imgFormat = options?.preparedPhoto?.format || (
          photoData.includes('image/png') || photoData.startsWith('data:image/png') || photoData.startsWith('iVBORw0KGgo') ? 'PNG' :
          photoData.includes('image/webp') || photoData.startsWith('data:image/webp') || photoData.startsWith('UklGR') ? 'WEBP' : 'JPEG'
        );

        doc.saveGraphicsState();
        try {
          if (photoShape === 'circle') {
            const cx = photoX + photoDim / 2;
            const cy = photoY + photoDim / 2;
            const r = photoDim / 2;

            // Define genuine circular vector clipping boundary
            doc.circle(cx, cy, r, null);
            doc.clip();
            doc.discardPath();

            // Embed photo strictly inside the circular clipping boundary
            doc.addImage(photoData, imgFormat, photoX, photoY, photoDim, photoDim);
          } else {
            const cornerRadius = 2; // 2mm subtle rounded square

            // Define rounded square vector clipping boundary
            doc.roundedRect(photoX, photoY, photoDim, photoDim, cornerRadius, cornerRadius, null);
            doc.clip();
            doc.discardPath();

            // Embed photo strictly inside the rounded square boundary
            doc.addImage(photoData, imgFormat, photoX, photoY, photoDim, photoDim);
          }
        } finally {
          // Always restore graphics state so clipping never affects other elements
          doc.restoreGraphicsState();
        }

        // Stroke crisp vector outline border matching the exact shape
        doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
        doc.setLineWidth(0.4);
        if (photoShape === 'circle') {
          const cx = photoX + photoDim / 2;
          const cy = photoY + photoDim / 2;
          const r = photoDim / 2;
          doc.circle(cx, cy, r, 'S');
        } else {
          doc.roundedRect(photoX, photoY, photoDim, photoDim, 2, 2, 'S');
        }
      } catch (imgErr) {
        console.warn('[ResumePDF] Could not embed profile photo into vector PDF:', imgErr);
      }
    }

    // Contact Details Line
    const contactParts: string[] = [];
    if (personalInfo.email) contactParts.push(personalInfo.email);
    if (personalInfo.phone) contactParts.push(personalInfo.phone);
    const loc = [personalInfo.city, personalInfo.country].filter(Boolean).join(', ');
    if (loc) contactParts.push(loc);
    if (personalInfo.linkedinUrl) {
      const cleanLi = personalInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/');
      contactParts.push(cleanLi);
    }
    if (personalInfo.githubUrl) {
      const cleanGh = personalInfo.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/');
      contactParts.push(cleanGh);
    }
    if (personalInfo.portfolioUrl) {
      const cleanWeb = personalInfo.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '');
      contactParts.push(cleanWeb);
    }

    if (contactParts.length > 0) {
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(fontSizes.contact);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

      const contactString = contactParts.join('  •  ');
      const lines = doc.splitTextToSize(contactString, textAvailableWidth);

      if (template === 'classic' && !hasPhoto) {
        doc.text(lines, marginX + contentWidth / 2, curY + 3, { align: 'center' });
      } else {
        doc.text(lines, textX, curY + 3);
      }
      curY += lines.length * lineHeights.contact + 2;
    }

    // Ensure header bottom line clears both text content and the photo
    if (hasPhoto) {
      curY = Math.max(curY, photoY + photoDim + 2);
    }

    // Subtle header bottom divider
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, curY + 1, marginX + contentWidth, curY + 1);
    curY += 4;
  };

  renderHeader();

  // ==========================================
  // 2. PROFESSIONAL SUMMARY
  // ==========================================
  if (personalInfo.summary?.trim()) {
    renderSectionHeader('Professional Summary');

    doc.setFont(pdfFont, 'normal');
    doc.setFontSize(fontSizes.body);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);

    const summaryLines = doc.splitTextToSize(personalInfo.summary.trim(), contentWidth);
    checkPageBreak(summaryLines.length * lineHeights.body + 2);
    doc.text(summaryLines, marginX, curY + 2);
    curY += summaryLines.length * lineHeights.body + 4;
  }

  // ==========================================
  // 3. WORK EXPERIENCE
  // ==========================================
  if (sectionVisibility.experience && experience.length > 0) {
    renderSectionHeader('Work Experience');

    experience.forEach((job) => {
      // Estimate needed height for this work item
      const roleStr = job.jobTitle || 'Role Title';
      const companyStr = job.company || 'Company';
      const locStr = job.location || '';
      const startStr = formatDateLabel(job.startDate);
      const endStr = job.current ? 'Present' : formatDateLabel(job.endDate);
      const dateRangeStr = [startStr, endStr].filter(Boolean).join(' - ');

      const validHighlights = (job.highlights || []).filter((h) => h.trim().length > 0);
      const estimatedHeight = 10 + validHighlights.length * 5;
      checkPageBreak(Math.min(estimatedHeight, 35));

      // Line 1: Job Title (Bold) & Date Range (Right aligned)
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.itemHeading);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(roleStr, marginX, curY + 2);

      if (dateRangeStr) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(dateRangeStr, marginX + contentWidth, curY + 2, { align: 'right' });
      }
      curY += lineHeights.itemHeading;

      // Line 2: Company & Location
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(fontSizes.itemSubheading);
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.text(companyStr, marginX, curY + 1.5);

      if (locStr) {
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.setFontSize(fontSizes.small);
        doc.text(locStr, marginX + contentWidth, curY + 1.5, { align: 'right' });
      }
      curY += lineHeights.itemHeading + 1;

      // Bullet Highlights
      if (validHighlights.length > 0) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.body);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);

        const bulletIndent = 4;
        const textIndent = 6;
        const textAvailableWidth = contentWidth - textIndent;

        validHighlights.forEach((hl) => {
          const hlLines = doc.splitTextToSize(hl.trim(), textAvailableWidth);
          checkPageBreak(hlLines.length * lineHeights.body + 1.5);

          // Bullet dot
          doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
          doc.text('•', marginX + bulletIndent, curY + 1.5);

          // Highlight text
          doc.setTextColor(slateText[0], slateText[1], slateText[2]);
          doc.text(hlLines, marginX + textIndent, curY + 1.5);

          curY += hlLines.length * lineHeights.body + 0.8;
        });
      }

      curY += 3;
    });
  }

  // ==========================================
  // 4. EDUCATION
  // ==========================================
  if (sectionVisibility.education && education.length > 0) {
    renderSectionHeader('Education');

    education.forEach((edu) => {
      checkPageBreak(16);

      const degreeStr = edu.degree || 'Degree';
      const schoolStr = edu.institution || 'Institution';
      const locStr = edu.location || '';
      const startStr = formatDateLabel(edu.startDate);
      const endStr = edu.current ? 'Present' : formatDateLabel(edu.endDate);
      const dateRangeStr = [startStr, endStr].filter(Boolean).join(' - ');

      // Degree & Dates
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.itemHeading);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(degreeStr, marginX, curY + 2);

      if (dateRangeStr) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(dateRangeStr, marginX + contentWidth, curY + 2, { align: 'right' });
      }
      curY += lineHeights.itemHeading;

      // Institution & Location
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(fontSizes.itemSubheading);
      doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
      doc.text(schoolStr, marginX, curY + 1.5);

      if (locStr) {
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.setFontSize(fontSizes.small);
        doc.text(locStr, marginX + contentWidth, curY + 1.5, { align: 'right' });
      }
      curY += lineHeights.itemHeading + 0.5;

      // Grade or description
      if (edu.scoreOrGrade) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        doc.text(`Grade/Score: ${edu.scoreOrGrade}`, marginX, curY + 1.5);
        curY += lineHeights.body;
      }

      if (edu.description?.trim()) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.body);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        const descLines = doc.splitTextToSize(edu.description.trim(), contentWidth);
        doc.text(descLines, marginX, curY + 1.5);
        curY += descLines.length * lineHeights.body + 1;
      }

      curY += 2.5;
    });
  }

  // ==========================================
  // 5. SKILLS
  // ==========================================
  if (sectionVisibility.skills && skills.length > 0) {
    renderSectionHeader('Skills & Competencies');
    checkPageBreak(14);

    doc.setFont(pdfFont, 'normal');
    doc.setFontSize(fontSizes.body);

    if (template === 'ats') {
      // In ATS mode, comma-separated plain list is industry standard
      const skillNames = skills.map((s) => (s.level ? `${s.name} (${s.level})` : s.name)).join(', ');
      const lines = doc.splitTextToSize(skillNames, contentWidth);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(lines, marginX, curY + 1.5);
      curY += lines.length * lineHeights.body + 3;
    } else {
      // Grid of neat bullet tags / badges
      const skillTokens = skills.map((s) => (s.level ? `${s.name} • ${s.level}` : s.name));
      const lineText = skillTokens.join('   |   ');
      const lines = doc.splitTextToSize(lineText, contentWidth);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(lines, marginX, curY + 1.5);
      curY += lines.length * lineHeights.body + 3;
    }
  }

  // ==========================================
  // 6. PROJECTS
  // ==========================================
  if (sectionVisibility.projects && projects.length > 0) {
    renderSectionHeader('Projects');

    projects.forEach((proj) => {
      checkPageBreak(16);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.itemHeading);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(proj.title || 'Project Name', marginX, curY + 2);

      if (proj.link) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
        const cleanLink = proj.link.replace(/^https?:\/\//, '');
        doc.text(cleanLink, marginX + contentWidth, curY + 2, { align: 'right' });
      }
      curY += lineHeights.itemHeading;

      if (proj.technologies) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(`Technologies: ${proj.technologies}`, marginX, curY + 1);
        curY += lineHeights.body;
      }

      if (proj.description?.trim()) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.body);
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
        const descLines = doc.splitTextToSize(proj.description.trim(), contentWidth);
        doc.text(descLines, marginX, curY + 1.5);
        curY += descLines.length * lineHeights.body + 1;
      }

      curY += 2.5;
    });
  }

  // ==========================================
  // 7. CERTIFICATIONS
  // ==========================================
  if (sectionVisibility.certifications && certifications.length > 0) {
    renderSectionHeader('Certifications');

    certifications.forEach((cert) => {
      checkPageBreak(12);

      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontSizes.itemHeading);
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.text(cert.name || 'Certification Name', marginX, curY + 2);

      if (cert.date) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.small);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(formatDateLabel(cert.date), marginX + contentWidth, curY + 2, { align: 'right' });
      }
      curY += lineHeights.itemHeading;

      if (cert.issuer) {
        doc.setFont(pdfFont, 'normal');
        doc.setFontSize(fontSizes.itemSubheading);
        doc.setTextColor(accentRGB[0], accentRGB[1], accentRGB[2]);
        doc.text(`Issuer: ${cert.issuer}`, marginX, curY + 1);
        curY += lineHeights.body + 1;
      }

      curY += 1.5;
    });
  }

  // ==========================================
  // 8. LANGUAGES
  // ==========================================
  if (sectionVisibility.languages && languages.length > 0) {
    renderSectionHeader('Languages');
    checkPageBreak(12);

    doc.setFont(pdfFont, 'normal');
    doc.setFontSize(fontSizes.body);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);

    const langTokens = languages.map((l) => `${l.language} (${l.proficiency})`);
    const lineText = langTokens.join('   •   ');
    const lines = doc.splitTextToSize(lineText, contentWidth);
    doc.text(lines, marginX, curY + 1.5);
    curY += lines.length * lineHeights.body + 2;
  }

  // ==========================================
  // PAGE NUMBERS & FOOTER ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  const rawName = (personalInfo.fullName || 'Resume').trim();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle footer separator
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 9, marginX + contentWidth, pageHeight - 9);

    // Footer text
    doc.setFont(pdfFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

    const footerLeft = `${rawName}  •  Curriculum Vitae`;
    const footerRight = `Page ${i} of ${totalPages}`;

    doc.text(footerLeft, marginX, pageHeight - 5.5);
    doc.text(footerRight, marginX + contentWidth, pageHeight - 5.5, { align: 'right' });
  }

  return doc;
}

/**
 * Asynchronously generates a professionally formatted, vector-rendered, ATS-compliant PDF resume,
 * safely pre-normalizing any imported image formats (WebP, PNG, JPEG) through in-browser Canvas
 * to ensure maximum compatibility and zero square corners.
 */
export async function generateResumePDF(data: ResumeData, options?: PDFExportOptions): Promise<jsPDF> {
  let preparedPhoto = options?.preparedPhoto || null;
  if (!preparedPhoto && data.personalInfo.photo) {
    try {
      preparedPhoto = await sanitizePhotoForPdf(data.personalInfo.photo);
    } catch (e) {
      console.warn('[ResumePDF] Failed to pre-process photo for PDF, falling back to raw data:', e);
      preparedPhoto = null;
    }
  }

  return generateResumePDFSync(data, {
    ...options,
    preparedPhoto,
  });
}

