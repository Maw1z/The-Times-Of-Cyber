import type { ReactNode } from "react";
import type { SectionId } from "../pages/registry";

/**
 * The paper is typeset as a flow of small items (headings, paragraphs, table rows,
 * list entries, photos). The paginator measures each one and pours them into
 * fixed-size pages; the phone layout simply stacks them.
 */
export interface Item {
  key: string;
  sec: SectionId;
  node: ReactNode;
  /** Space above the item. Dropped at the top of a page; stretched to absorb leftover space. */
  gap?: number;
  /** Never end a page on this item (headings, table headers, bylines). */
  keep?: boolean;
  /** Line height of a plain-text paragraph: the item may split across pages at line boundaries. */
  lh?: number;
  /** Photo with flexible height: it shrinks (to `min`) to fit a page or grows (to `max`) to fill one. */
  img?: { min: number; pref: number; max: number; render: (h: number) => ReactNode };
  /** Rows of one table / entries of one list share a group… */
  group?: string;
  /** …and this item is repeated at the top of a page when the group continues there. */
  cont?: Item;
  /** Skip the item if it would be the first thing on a page (rules between stories). */
  dropAtTop?: boolean;
  /** DOM id (section anchors in the scrolling layout). */
  anchor?: string;
}

/** Collects items for one section at a time. */
export class Flow {
  items: Item[] = [];
  sec: SectionId = "a1";
  /** Content width in CSS px — tables pick their columns from it. */
  readonly cw: number;
  readonly now: number;
  constructor(cw: number, now: number) {
    this.cw = cw;
    this.now = now;
  }
  section(id: SectionId) {
    this.sec = id;
  }
  private keys = new Map<string, number>();
  add(it: Omit<Item, "sec">): Item {
    const full = { ...it, sec: this.sec } as Item;
    const n = this.keys.get(full.key) ?? 0;
    this.keys.set(full.key, n + 1);
    if (n) full.key = `${full.key}~${n}`;
    if (full.cont) full.cont = { ...full.cont, sec: this.sec };
    this.items.push(full);
    return full;
  }
  /** Mark the last item as the end of a run (so `keep` never dangles past a section end). */
  last(): Item | undefined {
    return this.items[this.items.length - 1];
  }
}

/** Every measured key, including continuation headers that aren't in the flow itself. */
export function measurable(items: Item[]): Item[] {
  const out: Item[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!seen.has(it.key)) {
      seen.add(it.key);
      out.push(it);
    }
    if (it.cont && !seen.has(it.cont.key)) {
      seen.add(it.cont.key);
      out.push(it.cont);
    }
  }
  return out;
}

/** Natural rendering of an item (photo at its preferred height). */
export function natural(it: Item): ReactNode {
  return it.img ? it.img.render(it.img.pref) : it.node;
}
