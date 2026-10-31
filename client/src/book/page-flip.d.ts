// Minimal typings for page-flip 2.0.7 (StPageFlip, MIT) — its package ships no .d.ts.
declare module "page-flip/dist/js/page-flip.module.js" {
  export interface FlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    startPage?: number;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    usePortrait?: boolean;
    autoSize?: boolean;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }
  export class PageFlip {
    constructor(el: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: HTMLElement[]): void;
    on(event: "flip" | "changeState" | "changeOrientation" | "init", cb: (e: { data: unknown }) => void): this;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getState(): "user_fold" | "fold_corner" | "flipping" | "read";
    getOrientation(): "portrait" | "landscape";
    destroy(): void;
  }
}
