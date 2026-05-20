/**
 * Premium Layout System - Grid-based positioning
 * Ensures consistent spacing and alignment across all slides
 */

import { premiumTheme } from './premium-theme';

export class PremiumLayoutSystem {
  private slideWidth: number;
  private slideHeight: number;
  private marginLeft: number;
  private marginRight: number;
  private marginTop: number;
  private marginBottom: number;
  private columns: number;
  private gutter: number;

  constructor() {
    this.slideWidth = premiumTheme.slide.width;
    this.slideHeight = premiumTheme.slide.height;
    this.marginLeft = premiumTheme.slide.margin.left;
    this.marginRight = premiumTheme.slide.margin.right;
    this.marginTop = premiumTheme.slide.margin.top;
    this.marginBottom = premiumTheme.slide.margin.bottom;
    this.columns = premiumTheme.grid.columns;
    this.gutter = premiumTheme.grid.gutter;
  }

  /**
   * Get available width for content (after margins)
   */
  getContentWidth(): number {
    return this.slideWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Get available height for content (after margins)
   */
  getContentHeight(): number {
    return this.slideHeight - this.marginTop - this.marginBottom;
  }

  /**
   * Get column width for grid calculations
   */
  getColumnWidth(columns: number = 1): number {
    const contentWidth = this.getContentWidth();
    const gutterTotal = (columns - 1) * this.gutter;
    return (contentWidth - gutterTotal) / columns;
  }

  /**
   * Get X position for column
   */
  getColumnX(columnStart: number, columnSpan: number = 1): number {
    const columnWidth = this.getColumnWidth(this.columns);
    const x = this.marginLeft + columnStart * (columnWidth + this.gutter);
    return Math.round(x * 100) / 100;
  }

  /**
   * Get width for column span
   */
  getColumnWidth2Col(colSpan: number): number {
    const col2Width = this.getColumnWidth(2);
    return col2Width * colSpan + this.gutter * (colSpan - 1);
  }

  /**
   * Full width layout
   */
  getFullWidth() {
    return {
      x: this.marginLeft,
      y: this.marginTop,
      w: this.getContentWidth(),
      h: this.getContentHeight(),
    };
  }

  /**
   * Two column equal layout
   */
  getTwoColumn(row: number = 0, spacing: number = 0.3) {
    const contentWidth = this.getContentWidth();
    const colWidth = (contentWidth - this.gutter) / 2;
    const baseY = this.marginTop + row * spacing;

    return {
      left: {
        x: this.marginLeft,
        w: colWidth,
      },
      right: {
        x: this.marginLeft + colWidth + this.gutter,
        w: colWidth,
      },
      y: baseY,
    };
  }

  /**
   * Three column equal layout
   */
  getThreeColumn(row: number = 0, spacing: number = 0.25) {
    const contentWidth = this.getContentWidth();
    const gutterTotal = this.gutter * 2;
    const colWidth = (contentWidth - gutterTotal) / 3;
    const baseY = this.marginTop + row * spacing;

    return {
      first: {
        x: this.marginLeft,
        w: colWidth,
      },
      second: {
        x: this.marginLeft + colWidth + this.gutter,
        w: colWidth,
      },
      third: {
        x: this.marginLeft + (colWidth + this.gutter) * 2,
        w: colWidth,
      },
      y: baseY,
    };
  }

  /**
   * Left-right layout (70-30)
   */
  getLeftRight(row: number = 0) {
    const contentWidth = this.getContentWidth();
    const leftWidth = (contentWidth * 0.7 - this.gutter / 2);
    const rightWidth = (contentWidth * 0.3 - this.gutter / 2);
    const baseY = this.marginTop + row * 0.3;

    return {
      left: {
        x: this.marginLeft,
        w: leftWidth,
      },
      right: {
        x: this.marginLeft + leftWidth + this.gutter,
        w: rightWidth,
      },
      y: baseY,
    };
  }

  /**
   * Get Y position with vertical rhythm
   */
  getVerticalPos(row: number, spacing: number = 0.3): number {
    return this.marginTop + row * spacing;
  }

  /**
   * Get spacing value
   */
  getSpacing(size: keyof typeof premiumTheme.spacing): number {
    return premiumTheme.spacing[size] || 12;
  }
}

export const layoutSystem = new PremiumLayoutSystem();
