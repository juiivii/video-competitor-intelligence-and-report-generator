/**
 * Premium Component Library
 * Reusable, consistent, professionally-styled slide elements
 */

import PptxGenJS from 'pptxgenjs';
import { premiumTheme } from './premium-theme';
import { layoutSystem } from './premium-layout';

export class PremiumComponents {
  private prs: any;

  constructor(prs: any) {
    this.prs = prs;
  }

  /**
   * Add section title with premium styling
   */
  addSectionTitle(
    slide: any,
    title: string,
    subtitle?: string,
    y: number = 0.4
  ): number {
    slide.addText(title, {
      x: premiumTheme.slide.margin.left,
      y: y,
      w: layoutSystem.getContentWidth(),
      h: 0.6,
      fontSize: premiumTheme.typography.h2.fontSize,
      bold: true,
      color: premiumTheme.colors.textPrimary,
      align: 'left',
      fontFace: 'Calibri',
    });

    let nextY = y + 0.65;

    if (subtitle) {
      slide.addText(subtitle, {
        x: premiumTheme.slide.margin.left,
        y: nextY,
        w: layoutSystem.getContentWidth(),
        h: 0.3,
        fontSize: premiumTheme.typography.body.fontSize,
        color: premiumTheme.colors.textSecondary,
        align: 'left',
        fontFace: 'Calibri',
      });
      nextY += 0.35;
    }

    return nextY;
  }

  /**
   * Add title with accent underline
   */
  addAccentTitle(slide: any, title: string, y: number = 0.4): number {
    // Title text
    slide.addText(title, {
      x: premiumTheme.slide.margin.left,
      y: y,
      w: layoutSystem.getContentWidth(),
      h: 0.5,
      fontSize: premiumTheme.typography.h3.fontSize,
      bold: true,
      color: premiumTheme.colors.textPrimary,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Accent underline
    slide.addShape(this.prs.ShapeType.rect, {
      x: premiumTheme.slide.margin.left,
      y: y + 0.55,
      w: 0.4,
      h: 0.06,
      fill: { color: premiumTheme.colors.accent },
      line: { type: 'none' },
    });

    return y + 0.7;
  }

  /**
   * Add metric card with KPI styling
   */
  addMetricCard(
    slide: any,
    options: {
      label: string;
      value: string | number;
      subtext?: string;
      x: number;
      y: number;
      w?: number;
      h?: number;
      highlight?: boolean;
    }
  ): void {
    const { label, value, subtext, x, y, w = 1.8, h = 1.2, highlight = false } = options;

    // Card background
    slide.addShape(this.prs.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      fill: { color: premiumTheme.colors.surface },
      line: { color: highlight ? premiumTheme.colors.accent : premiumTheme.colors.neutral[700], width: 1 },
      rectRadius: premiumTheme.borderRadius.md,
    });

    // Label
    slide.addText(label, {
      x: x + 0.12,
      y: y + 0.12,
      w: w - 0.24,
      h: 0.25,
      fontSize: premiumTheme.typography.metricLabel.fontSize,
      color: premiumTheme.colors.textTertiary,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Value
    slide.addText(String(value), {
      x: x + 0.12,
      y: y + 0.42,
      w: w - 0.24,
      h: 0.5,
      fontSize: highlight ? 28 : 24,
      bold: true,
      color: highlight ? premiumTheme.colors.accent : premiumTheme.colors.textPrimary,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Subtext
    if (subtext) {
      slide.addText(subtext, {
        x: x + 0.12,
        y: y + 0.95,
        w: w - 0.24,
        h: 0.18,
        fontSize: premiumTheme.typography.caption.fontSize,
        color: premiumTheme.colors.success,
        align: 'left',
        fontFace: 'Calibri',
      });
    }
  }

  /**
   * Add insight card with quote styling
   */
  addInsightCard(
    slide: any,
    options: {
      title: string;
      insight: string;
      x: number;
      y: number;
      w: number;
      h?: number;
      accent?: string;
    }
  ): void {
    const { title, insight, x, y, w, h = 1.4, accent = premiumTheme.colors.accent } = options;

    // Left accent bar
    slide.addShape(this.prs.ShapeType.rect, {
      x,
      y,
      w: 0.06,
      h,
      fill: { color: accent },
      line: { type: 'none' },
    });

    // Card background
    slide.addShape(this.prs.ShapeType.rect, {
      x: x + 0.06,
      y,
      w: w - 0.06,
      h,
      fill: { color: premiumTheme.colors.surface },
      line: { color: premiumTheme.colors.neutral[700], width: 0.5 },
    });

    // Title
    slide.addText(title, {
      x: x + 0.18,
      y: y + 0.1,
      w: w - 0.3,
      h: 0.3,
      fontSize: premiumTheme.typography.h4.fontSize,
      bold: true,
      color: accent,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Insight text
    slide.addText(insight, {
      x: x + 0.18,
      y: y + 0.45,
      w: w - 0.3,
      h: 0.9,
      fontSize: premiumTheme.typography.body.fontSize,
      color: premiumTheme.colors.textSecondary,
      align: 'left',
      fontFace: 'Calibri',
      wrap: true,
    });
  }

  /**
   * Add modern comparison table (not default PPT table)
   */
  addComparisonTable(
    slide: any,
    options: {
      columns: string[];
      rows: (string | number)[][];
      x: number;
      y: number;
      w: number;
      rowHeight?: number;
      colWidths?: number[];
    }
  ): number {
    const { columns, rows, x, y, w, rowHeight = 0.35, colWidths } = options;

    // Calculate column widths
    const totalColWidths = colWidths || columns.map(() => w / columns.length);
    const colWidth = (col: number) => totalColWidths[col] || w / columns.length;

    let currentX = x;
    let currentY = y;

    // Header row
    columns.forEach((col, idx) => {
      // Header background
      slide.addShape(this.prs.ShapeType.rect, {
        x: currentX,
        y: currentY,
        w: colWidth(idx),
        h: rowHeight,
        fill: { color: premiumTheme.colors.accent },
        line: { type: 'none' },
      });

      // Header text
      slide.addText(col, {
        x: currentX + 0.1,
        y: currentY + 0.06,
        w: colWidth(idx) - 0.2,
        h: rowHeight - 0.12,
        fontSize: premiumTheme.typography.h4.fontSize,
        bold: true,
        color: premiumTheme.colors.background,
        align: 'center',
        fontFace: 'Calibri',
      });

      currentX += colWidth(idx);
    });

    currentY += rowHeight;

    // Data rows
    rows.forEach((row, rowIdx) => {
      currentX = x;
      const isAlternate = rowIdx % 2 === 1;

      row.forEach((cell, colIdx) => {
        // Row background
        slide.addShape(this.prs.ShapeType.rect, {
          x: currentX,
          y: currentY,
          w: colWidth(colIdx),
          h: rowHeight,
          fill: { color: isAlternate ? premiumTheme.colors.surface : premiumTheme.colors.neutral[800] },
          line: { color: premiumTheme.colors.neutral[700], width: 0.5 },
        });

        // Cell text
        slide.addText(String(cell), {
          x: currentX + 0.1,
          y: currentY + 0.06,
          w: colWidth(colIdx) - 0.2,
          h: rowHeight - 0.12,
          fontSize: premiumTheme.typography.body.fontSize,
          color: premiumTheme.colors.textPrimary,
          align: 'center',
          fontFace: 'Calibri',
        });

        currentX += colWidth(colIdx);
      });

      currentY += rowHeight;
    });

    return currentY + 0.2;
  }

  /**
   * Add ranking card for leaderboard
   */
  addRankingCard(
    slide: any,
    options: {
      rank: number;
      company: string;
      score: number;
      metrics: string;
      x: number;
      y: number;
      w: number;
      h?: number;
    }
  ): void {
    const { rank, company, score, metrics, x, y, w, h = 0.8 } = options;

    // Rank badge background
    const rankColor = rank === 1 ? premiumTheme.colors.warning : 
                     rank === 2 ? premiumTheme.colors.info : 
                     premiumTheme.colors.success;

    slide.addShape(this.prs.ShapeType.roundRect, {
      x,
      y,
      w: 0.5,
      h,
      fill: { color: rankColor },
      line: { type: 'none' },
      rectRadius: premiumTheme.borderRadius.sm,
    });

    // Rank number
    slide.addText(`#${rank}`, {
      x,
      y: y + 0.15,
      w: 0.5,
      h: 0.5,
      fontSize: 24,
      bold: true,
      color: premiumTheme.colors.background,
      align: 'center',
      fontFace: 'Calibri',
    });

    // Company name
    slide.addText(company, {
      x: x + 0.65,
      y: y + 0.08,
      w: w - 0.75,
      h: 0.3,
      fontSize: premiumTheme.typography.h4.fontSize,
      bold: true,
      color: premiumTheme.colors.textPrimary,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Score
    slide.addText(`Score: ${score}`, {
      x: x + 0.65,
      y: y + 0.42,
      w: w - 0.75,
      h: 0.25,
      fontSize: premiumTheme.typography.body.fontSize,
      color: rankColor,
      bold: true,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Metrics
    slide.addText(metrics, {
      x: x + 0.65,
      y: y + 0.55,
      w: w - 0.75,
      h: 0.2,
      fontSize: premiumTheme.typography.small.fontSize,
      color: premiumTheme.colors.textSecondary,
      align: 'left',
      fontFace: 'Calibri',
    });
  }

  /**
   * Add recommendation card with gradient
   */
  addRecommendationCard(
    slide: any,
    options: {
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      x: number;
      y: number;
      w: number;
      h?: number;
    }
  ): void {
    const { title, description, impact, x, y, w, h = 1.0 } = options;

    const impactColor = impact === 'high' ? premiumTheme.colors.danger :
                       impact === 'medium' ? premiumTheme.colors.warning :
                       premiumTheme.colors.info;

    // Card background
    slide.addShape(this.prs.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      fill: { color: premiumTheme.colors.surface },
      line: { color: impactColor, width: 1.5 },
      rectRadius: premiumTheme.borderRadius.md,
    });

    // Impact indicator
    slide.addShape(this.prs.ShapeType.rect, {
      x,
      y,
      w: 0.06,
      h,
      fill: { color: impactColor },
      line: { type: 'none' },
      rectRadius: premiumTheme.borderRadius.md,
    });

    // Title
    slide.addText(title, {
      x: x + 0.15,
      y: y + 0.08,
      w: w - 0.25,
      h: 0.25,
      fontSize: premiumTheme.typography.h4.fontSize,
      bold: true,
      color: impactColor,
      align: 'left',
      fontFace: 'Calibri',
    });

    // Description
    slide.addText(description, {
      x: x + 0.15,
      y: y + 0.38,
      w: w - 0.25,
      h: 0.55,
      fontSize: premiumTheme.typography.body.fontSize,
      color: premiumTheme.colors.textSecondary,
      align: 'left',
      fontFace: 'Calibri',
      wrap: true,
    });
  }

  /**
   * Add section divider
   */
  addSectionDivider(slide: any, y: number): void {
    slide.addShape(this.prs.ShapeType.rect, {
      x: premiumTheme.slide.margin.left,
      y,
      w: layoutSystem.getContentWidth(),
      h: 0.02,
      fill: { color: premiumTheme.colors.neutral[700] },
      line: { type: 'none' },
    });
  }

  /**
   * Add background shape (for visual variety)
   */
  addBackgroundAccent(
    slide: any,
    options: {
      x: number;
      y: number;
      w: number;
      h: number;
      color?: string;
      opacity?: number;
    }
  ): void {
    const { x, y, w, h, color = premiumTheme.colors.accent, opacity = 0.08 } = options;

    slide.addShape(this.prs.ShapeType.roundRect, {
      x,
      y,
      w,
      h,
      fill: { color, transparency: Math.round((1 - opacity) * 100) },
      line: { type: 'none' },
      rectRadius: premiumTheme.borderRadius.lg,
    });
  }
}
