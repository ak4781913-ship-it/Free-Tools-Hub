import jsPDF from 'jspdf';
import { VideoPromptInputs, PhotoPromptInputs } from './promptGenerators';
import { recordPrintDocument } from './printHistoryTracking';

export function generateVideoPromptPDF(inputs: VideoPromptInputs, generatedPrompt: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm

  // Colors
  const darkBg = [15, 23, 42]; // Slate 900
  const purpleAccent = [147, 51, 234]; // Purple 600
  const slateText = [51, 65, 85];
  const slateMuted = [100, 116, 139];

  // 1. Header Banner
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(marginX, 14, contentWidth, 24, 2, 2, 'F');

  doc.setFillColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
  doc.rect(marginX, 36.5, contentWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AI VIDEO PRODUCTION SCRIPT & PROMPT SPECIFICATION', marginX + 6, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(`Project: ${inputs.mainSubject.slice(0, 50)}  •  ${dateStr}`, marginX + 6, 31);

  let currentY = 46;

  // 2. Production Parameters Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('PRODUCTION PARAMETERS', marginX, currentY);
  currentY += 4;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 16;
  const metaCards = [
    { label: 'Total Duration', val: `${inputs.totalDurationSeconds}s` },
    { label: 'Aspect Ratio', val: inputs.aspectRatio },
    { label: 'Resolution', val: inputs.resolution },
    { label: 'Scenes Count', val: `${inputs.scenes.length} Scenes` },
  ];

  metaCards.forEach((c, idx) => {
    const cX = marginX + idx * (cardW + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cX, currentY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(c.label, cX + 3.5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
    doc.text(c.val, cX + 3.5, currentY + 12);
  });

  currentY += cardH + 7;

  // Aesthetic Specs
  const specs = [
    ['Visual Style', inputs.visualStyle],
    ['Lighting & Environment', inputs.lightingEnvironment],
    ['Audio Mood & SFX', inputs.musicMood],
    ['Dialogue & Accent', inputs.languageAndAccent || 'None / Ambient'],
  ];

  specs.forEach(([k, v], sIdx) => {
    const sY = currentY + sIdx * 6;
    doc.setFillColor(sIdx % 2 === 0 ? 255 : 248, sIdx % 2 === 0 ? 255 : 250, sIdx % 2 === 0 ? 255 : 252);
    doc.rect(marginX, sY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(k, marginX + 3, sY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    const cleanV = doc.splitTextToSize(v, contentWidth - 55);
    doc.text(cleanV[0] || v, marginX + 50, sY + 4.2);
  });

  currentY += specs.length * 6 + 8;

  // 3. Scene Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('SCENE-BY-SCENE PRODUCTION BREAKDOWN', marginX, currentY);
  currentY += 4;

  inputs.scenes.forEach((scene, scIdx) => {
    if (currentY + 36 > pageHeight - 20) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, currentY, contentWidth, 32, 1.5, 1.5, 'FD');

    // Scene badge
    doc.setFillColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
    doc.roundedRect(marginX + 3, currentY + 3, 24, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`SCENE ${scIdx + 1} (${scene.durationSeconds}s)`, marginX + 4.5, currentY + 7);

    // Camera movement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(`Camera: ${scene.cameraMovement || 'Dynamic'}`, marginX + 32, currentY + 7);

    // Visual description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.text('Visual:', marginX + 4, currentY + 13);
    doc.setFont('helvetica', 'normal');
    const visText = doc.splitTextToSize(scene.visualDescription, contentWidth - 25);
    doc.text(visText.slice(0, 2), marginX + 18, currentY + 13);

    // Action & Dialogue
    doc.setFont('helvetica', 'bold');
    doc.text('Action:', marginX + 4, currentY + 22);
    doc.setFont('helvetica', 'normal');
    const actText = doc.splitTextToSize(scene.characterAction || 'Atmospheric scene', contentWidth - 25);
    doc.text(actText[0] || '', marginX + 18, currentY + 22);

    if (scene.dialogue) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(`"${scene.dialogue}" (${scene.voiceStyle || 'Voiceover'})`, marginX + 18, currentY + 28);
    }

    currentY += 36;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('FreeTools Hub  •  AI Video Production Script', marginX, pageHeight - 7);
    doc.text(`Page ${p} of ${totalPages}`, marginX + contentWidth - 18, pageHeight - 7);
  }

  return doc;
}

export function downloadVideoPromptPDF(inputs: VideoPromptInputs, generatedPrompt: string): string {
  const doc = generateVideoPromptPDF(inputs, generatedPrompt);
  const cleanTitle = (inputs.mainSubject || 'Video_Script').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 30) || 'Video_Script';
  const fileName = `${cleanTitle}_Production_Script.pdf`;
  doc.save(fileName);

  recordPrintDocument('ai-video-prompt', `AI Video Script – ${inputs.mainSubject.slice(0, 40)}`, {
    toolName: 'AI Video Prompt Generator',
    format: 'Production Script PDF',
    summary: `${inputs.totalDurationSeconds}s ${inputs.aspectRatio} • ${inputs.scenes.length} Scenes • ${inputs.visualStyle.slice(0, 35)}`,
  });

  return fileName;
}

export function generatePhotoPromptPDF(inputs: PhotoPromptInputs, promptText: string): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm

  // Colors
  const darkBg = [15, 23, 42]; // Slate 900
  const amberAccent = [217, 119, 6]; // Amber 600
  const slateText = [51, 65, 85];
  const slateMuted = [100, 116, 139];

  // 1. Header Banner
  doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.roundedRect(marginX, 14, contentWidth, 24, 2, 2, 'F');

  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(marginX, 36.5, contentWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('GENERATIVE PHOTOGRAPHY PROMPT & CREATIVE SPEC', marginX + 6, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  doc.text(`Subject: ${(inputs.subjectDescription || 'Creative Portrait').slice(0, 50)}  •  ${dateStr}`, marginX + 6, 31);

  let currentY = 46;

  // 2. Technical Photographic Settings Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('CAMERA & COMPOSITION SPECIFICATIONS', marginX, currentY);
  currentY += 4;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 16;
  const metaCards = [
    { label: 'Aspect Ratio', val: inputs.aspectRatio },
    { label: 'Subject Type', val: inputs.subjectType.toUpperCase() },
    { label: 'Style Genre', val: (inputs.style || 'Photoreal').slice(0, 14) },
    { label: 'Fidelity Level', val: 'Studio 8K' },
  ];

  metaCards.forEach((c, idx) => {
    const cX = marginX + idx * (cardW + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cX, currentY, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(c.label, cX + 3.5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
    doc.text(c.val, cX + 3.5, currentY + 12);
  });

  currentY += cardH + 7;

  // Detailed Attributes Table
  const specs = [
    ['Lighting Scheme', inputs.lighting || 'Balanced natural ambient'],
    ['Camera Angle & Lens', inputs.cameraAngle || 'Eye-level 50mm portrait prime'],
    ['Setting & Background', inputs.setting || 'Architectural studio / editorial environment'],
    ['Wardrobe & Styling', inputs.clothing || 'Contemporary minimalist tailoring'],
    ['Color Palette & Mood', inputs.moodAndColor || 'Film grain warmth, balanced highlights'],
    ['Negative Prompt', inputs.negativeConstraints || 'No watermarks, no distorted anatomy, no oversaturation'],
  ];

  specs.forEach(([k, v], sIdx) => {
    const sY = currentY + sIdx * 6;
    doc.setFillColor(sIdx % 2 === 0 ? 255 : 248, sIdx % 2 === 0 ? 255 : 250, sIdx % 2 === 0 ? 255 : 252);
    doc.rect(marginX, sY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(k, marginX + 3, sY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    const cleanV = doc.splitTextToSize(v, contentWidth - 55);
    doc.text(cleanV[0] || v, marginX + 50, sY + 4.2);
  });

  currentY += specs.length * 6 + 9;

  // 3. Complete Master Prompt Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(darkBg[0], darkBg[1], darkBg[2]);
  doc.text('DIRECTORIAL MASTER PROMPT FOR GEMINI & MIDJOURNEY', marginX, currentY);
  currentY += 4;

  const promptSnippet = promptText.trim() || 'Prompt awaiting generation.';
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const promptLines = doc.splitTextToSize(promptSnippet, contentWidth - 8);
  const promptBoxH = Math.min(promptLines.length * 4.2 + 8, 125);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, promptBoxH, 1.5, 1.5, 'FD');
  doc.text(promptLines.slice(0, 26), marginX + 4, currentY + 5.5);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('FreeTools Hub  •  Gemini Photo Prompt Studio', marginX, pageHeight - 7);
  doc.text('Page 1 of 1', marginX + contentWidth - 18, pageHeight - 7);

  return doc;
}

export function downloadPhotoPromptPDF(inputs: PhotoPromptInputs, promptText: string): string {
  const doc = generatePhotoPromptPDF(inputs, promptText);
  const cleanTitle = (inputs.subjectDescription || 'Photo_Prompt').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 30) || 'Photo_Prompt';
  const fileName = `${cleanTitle}_Spec.pdf`;
  doc.save(fileName);

  recordPrintDocument('gemini-photo-prompt', `Photo Spec – ${(inputs.subjectDescription || 'Creative Portrait').slice(0, 40)}`, {
    toolName: 'Photo Prompt Studio',
    format: 'Creative Brief PDF',
    summary: `${inputs.aspectRatio} ${inputs.style || 'Photoreal'} • ${inputs.lighting || 'Natural Lighting'}`,
  });

  return fileName;
}

