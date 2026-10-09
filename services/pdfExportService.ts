import { jsPDF } from 'jspdf';
import { AnalysisResult } from '../types';

interface ExportPdfOptions {
  result: AnalysisResult;
  imageUrl?: string | null;
  activePrompt?: string;
  aspectRatio?: string;
}

/**
 * Strips unsupported non-ASCII / non-Latin characters from strings for safe rendering
 * in standard jsPDF default fonts, while preserving formatting, quotes, and punctuation.
 */
function cleanTextForPdf(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\x7F]/g, ' ') // convert non-latin to space for standard font safety
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a Hex color (#RRGGBB) to [R, G, B]
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
    const g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
    const b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
    return [r, g, b];
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return [r, g, b];
  }
  return [120, 120, 120];
}

/**
 * Exports a comprehensive, beautifully styled PDF specification report of the AI prompt
 * and visual reverse-engineering analysis.
 */
export async function exportAnalysisToPdf({
  result,
  imageUrl,
  activePrompt,
  aspectRatio = '16:9'
}: ExportPdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;
  let currentPage = 1;

  const drawPageHeader = () => {
    // Header top accent line
    doc.setFillColor(124, 58, 237); // Purple-600
    doc.rect(margin, cursorY, contentWidth, 1.5, 'F');
    cursorY += 4;

    // Brand and Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 27, 75); // Deep Indigo
    doc.text('PROMPTVISION AI', margin, cursorY + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('AI Prompt Reverse-Engineering & Creative Blueprint Report', margin + 50, cursorY + 2);

    cursorY += 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 5;
  };

  const drawPageFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('PromptVision AI - Reverse Engineering Studio | Confidential Creative Specs', margin, footerY);

    const pageStr = `Page ${pageNum} of ${totalPages}`;
    const pageStrWidth = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageWidth - margin - pageStrWidth, footerY);
  };

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      currentPage++;
      cursorY = margin;
      drawPageHeader();
    }
  };

  // --- INITIAL PAGE HEADER ---
  drawPageHeader();

  // --- REPORT SUMMARY BANNER ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('DOCUMENT SPECIFICATION', margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleString();
  const providerStr = cleanTextForPdf(result.usedProvider || 'Multi-API Intelligence');
  doc.text(`Generated: ${dateStr}`, margin + 4, cursorY + 10);
  doc.text(`Engine / Provider: ${providerStr} ${result.generationDurationMs ? `(${result.generationDurationMs}ms)` : ''}`, margin + 4, cursorY + 14);

  const artStyleStr = cleanTextForPdf(result.artStyle || 'High-Fidelity DSLR Photography');
  doc.text(`Detected Art Style: ${artStyleStr.substring(0, 45)}`, margin + 95, cursorY + 10);
  doc.text(`Target Midjourney Ratio: --ar ${aspectRatio}`, margin + 95, cursorY + 14);

  cursorY += 23;

  // --- IMAGE PREVIEW & QUICK DNA OVERVIEW ---
  let imageRendered = false;
  if (imageUrl && imageUrl.startsWith('data:image')) {
    try {
      ensureSpace(48);
      const imgWidth = 44;
      const imgHeight = 44;

      // Draw image container box
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, cursorY, imgWidth, imgHeight, 2, 2, 'FD');

      // Determine image format (JPEG vs PNG)
      const format = imageUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(imageUrl, format, margin + 1, cursorY + 1, imgWidth - 2, imgHeight - 2);

      // Metadata card on the right side of the image
      const metaX = margin + imgWidth + 5;
      const metaWidth = contentWidth - imgWidth - 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(metaX, cursorY, metaWidth, imgHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(109, 40, 217); // Purple
      doc.text('SOURCE IMAGE FORENSIC SCAN', metaX + 4, cursorY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Color DNA & Harmony:', metaX + 4, cursorY + 11);

      // Draw color swatches right inside the header card
      if (result.colorPalette && result.colorPalette.length > 0) {
        let swatchX = metaX + 4;
        const swatchY = cursorY + 13;
        result.colorPalette.slice(0, 5).forEach((hex) => {
          const rgb = hexToRgb(hex);
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.setDrawColor(148, 163, 184);
          doc.roundedRect(swatchX, swatchY, 14, 8, 1, 1, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(255, 255, 255);
          // Small contrasting label
          doc.text(hex.toUpperCase(), swatchX + 1.2, swatchY + 5.5);
          swatchX += 16;
        });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const colorDesc = cleanTextForPdf(result.colorDescription || 'Balanced chromatic tones');
      const splitColorDesc = doc.splitTextToSize(`Palette grading: ${colorDesc}`, metaWidth - 8);
      doc.text(splitColorDesc.slice(0, 2), metaX + 4, cursorY + 26);

      const lightOrigin = cleanTextForPdf(result.lightTrajectory?.origin || 'Natural / Studio light');
      const splitLight = doc.splitTextToSize(`Lighting vector: ${lightOrigin}`, metaWidth - 8);
      doc.text(splitLight.slice(0, 2), metaX + 4, cursorY + 34);

      const tags = (result.suggestedTags || []).map((t) => `#${t}`).join(' ');
      const cleanTags = cleanTextForPdf(tags);
      const splitTags = doc.splitTextToSize(cleanTags, metaWidth - 8);
      doc.text(splitTags.slice(0, 1), metaX + 4, cursorY + 41);

      cursorY += imgHeight + 6;
      imageRendered = true;
    } catch {
      // If image adding fails for any reason, gracefully continue without crashing
      imageRendered = false;
    }
  }

  // --- SECTION: MASTER REPLICA PROMPT ---
  const masterPromptText = cleanTextForPdf(activePrompt || result.masterPrompt);
  ensureSpace(40);

  doc.setFillColor(109, 40, 217); // Purple primary
  doc.rect(margin, cursorY, 3, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 27, 75);
  doc.text('1. MASTER REPLICA PROMPT (EXACT PHOTOREALISTIC DNA)', margin + 6, cursorY + 5.5);
  cursorY += 9;

  // Box for master prompt
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const promptLines = doc.splitTextToSize(masterPromptText, contentWidth - 10);
  const promptBoxHeight = Math.max(22, promptLines.length * 4.2 + 8);

  ensureSpace(promptBoxHeight + 4);
  doc.setFillColor(245, 243, 255); // Soft purple-50
  doc.setDrawColor(196, 181, 253); // Purple-300
  doc.roundedRect(margin, cursorY, contentWidth, promptBoxHeight, 2, 2, 'FD');

  doc.setTextColor(46, 16, 101); // Dark Purple text
  doc.text(promptLines, margin + 5, cursorY + 6);
  cursorY += promptBoxHeight + 6;

  // --- SECTION: PLATFORM VARIATIONS ---
  ensureSpace(35);
  doc.setFillColor(79, 70, 229); // Indigo
  doc.rect(margin, cursorY, 3, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('2. PLATFORM-OPTIMIZED PROMPT VARIANTS', margin + 6, cursorY + 5.5);
  cursorY += 9;

  const renderPromptVariantBox = (title: string, content: string) => {
    const cleaned = cleanTextForPdf(content);
    if (!cleaned) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const titleLines = doc.splitTextToSize(title, contentWidth - 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const textLines = doc.splitTextToSize(cleaned, contentWidth - 10);
    const boxH = Math.max(14, textLines.length * 3.8 + 9);

    ensureSpace(boxH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(79, 70, 229);
    doc.text(titleLines, margin + 4, cursorY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(textLines, margin + 4, cursorY + 8.5);

    cursorY += boxH + 4;
  };

  renderPromptVariantBox('Midjourney v6.1 (--style raw --v 6.1):', result.midjourneyPrompt || `${result.masterPrompt} --ar ${aspectRatio} --v 6.1 --style raw`);
  renderPromptVariantBox('Short Fast Prompt (Concise Key Elements):', result.shortPrompt);
  renderPromptVariantBox('Character / Subject Swap Template:', result.subjectSwapPrompt);
  renderPromptVariantBox('Style Transfer Prompt (Aesthetics & Composition only):', result.styleTransferPrompt);

  // --- SECTION: OPTICAL, CAMERA & LIGHTING DNA ---
  ensureSpace(35);
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(margin, cursorY, 3, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('3. OPTICAL, CAMERA & LIGHTING SPECIFICATIONS', margin + 6, cursorY + 5.5);
  cursorY += 9;

  const renderDetailBlock = (heading: string, value: string) => {
    const cleaned = cleanTextForPdf(value);
    if (!cleaned) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const lines = doc.splitTextToSize(cleaned, contentWidth - 10);
    const boxH = Math.max(12, lines.length * 3.6 + 8);

    ensureSpace(boxH + 3);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 118, 110);
    doc.text(heading, margin + 4, cursorY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(lines, margin + 4, cursorY + 8.2);

    cursorY += boxH + 3;
  };

  renderDetailBlock('Camera Gear, Lens & Composition:', result.cameraAndComposition);
  renderDetailBlock('Subject, Attire & Interaction Dynamics:', result.subjectAndAttire);
  renderDetailBlock('Ambient Lighting & Color Temperature (Kelvin):', result.lightingAndAtmosphere);

  if (result.lightTrajectory) {
    const lightSummary = `Origin: ${result.lightTrajectory.origin || 'N/A'} | Trajectory Path: ${result.lightTrajectory.path || 'N/A'} | Impact & Shadows: ${result.lightTrajectory.impact || 'N/A'}`;
    renderDetailBlock('Directional Light Trajectory & Shadow Mapping:', lightSummary);
  }

  // --- SECTION: GRAPHIC DESIGN FORENSICS & TEXTURE GRINDING ---
  if (result.graphicDesign) {
    ensureSpace(35);
    doc.setFillColor(236, 72, 153); // Pink
    doc.rect(margin, cursorY, 3, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text('4. GRAPHIC DECONSTRUCTION & TEXTURE GRINDING MAP', margin + 6, cursorY + 5.5);
    cursorY += 9;

    if (result.graphicDesign.elementOrigin) {
      renderDetailBlock('Graphic Element Origins & Vector Layout:', result.graphicDesign.elementOrigin);
    }
    if (result.graphicDesign.textureGrinding) {
      const tg = result.graphicDesign.textureGrinding;
      const grindSummary = `Texture Style: ${tg.textureType || 'N/A'} | Heavy Grinding Zones: ${tg.heavyGrindingZones || 'N/A'} | Smooth Pristine Zones: ${tg.smoothZones || 'N/A'}`;
      renderDetailBlock('Texture Grinding & Distressed Surface Analysis:', grindSummary);
    }
    if (result.graphicDesign.typographyStyle) {
      renderDetailBlock('Typography Classification & Badge Specs:', result.graphicDesign.typographyStyle);
    }
    if (result.graphicDesign.gridPlacement) {
      renderDetailBlock('3x3 Composition Dial Grid Positioning:', result.graphicDesign.gridPlacement);
    }
  }

  // --- SECTION: COLOR PALETTE BREAKDOWN ---
  ensureSpace(32);
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(margin, cursorY, 3, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text('5. CHROMATIC PALETTE & TONAL VALUES', margin + 6, cursorY + 5.5);
  cursorY += 9;

  if (result.colorPalette && result.colorPalette.length > 0) {
    const paletteBoxH = 22;
    ensureSpace(paletteBoxH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, paletteBoxH, 2, 2, 'FD');

    let pX = margin + 6;
    const pY = cursorY + 3.5;
    result.colorPalette.forEach((hex) => {
      const rgb = hexToRgb(hex);
      // Colored circle or box
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(pX, pY, 26, 14, 1.5, 1.5, 'FD');

      // Hex code label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      // If dark color, white text, else black
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      doc.setTextColor(brightness > 128 ? 30 : 255, brightness > 128 ? 30 : 255, brightness > 128 ? 30 : 255);
      doc.text(hex.toUpperCase(), pX + 5, pY + 8);

      pX += 32;
    });

    cursorY += paletteBoxH + 4;
  }

  // --- SECTION: NEGATIVE PROMPT & REJECTION FILTER ---
  if (result.negativePrompt) {
    ensureSpace(25);
    doc.setFillColor(239, 68, 68); // Red
    doc.rect(margin, cursorY, 3, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 27, 75);
    doc.text('6. NEGATIVE PROMPT (ANTI-CGI & ARTIFACT FILTER)', margin + 6, cursorY + 5.5);
    cursorY += 9;

    renderDetailBlock('Exclusion Negative Tokens:', result.negativePrompt);
  }

  // Add footers across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(i, totalPages);
  }

  // Trigger file download
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  doc.save(`PromptVision-Report-${timestamp}.pdf`);
}
