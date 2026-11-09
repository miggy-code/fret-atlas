import type { Shape } from './shapes';

export type Point = { x: number; y: number };
/** `horizontal` has the nut on the left; `vertical` is that board turned 90° clockwise, nut on top. */
export type Orientation = 'horizontal' | 'vertical';
export const CELL = 66;
// Phones have the height to spare only if frets stay close, so a vertical neck packs them tighter.
export const VERTICAL_CELL = 44;
export const ROW = 54;
export const TOP = 64;
export const EDGE = 22;
export const GUTTER = 30;
export const NOTE_RADIUS = 13;
export const HIT_SIZE = 44;
const VERTICAL_HIT = 48;
const FOOT = 58;
// Fret numbers and inlays sit in a margin along the neck's sides; the unused strip beside them is cropped in vertical.
const VERTICAL_CROP = 18;
const STUB = 18;

// Positions live in neck coordinates: `along` runs from the head toward the bridge, `across` from the high-e
// side to the low-E side. `project` is the only place they become SVG x/y, handedness and orientation included,
// so strings, notes, labels, outlines and hit targets cannot disagree. Text is positioned, never rotated.
export function boardGeometry(frets: number, leftHanded: boolean, orientation: Orientation = 'horizontal', cell = orientation === 'vertical' ? VERTICAL_CELL : CELL) {
  const vertical = orientation === 'vertical';
  const length = EDGE * 2 + GUTTER + cell * (frets + 1);
  const breadth = TOP + 5 * ROW + FOOT;
  // Vertical is horizontal rotated clockwise: (x, y) becomes (breadth − y, x). A left-handed neck mirrors across the
  // strings there, keeping the nut on top, and along the neck, nut on the right, when horizontal.
  const project = (along: number, across: number): Point => vertical
    ? { x: leftHanded ? across : breadth - across, y: along }
    : { x: leftHanded ? length - along : along, y: across };
  const along = (fret: number) => EDGE + GUTTER + cell * (fret + 0.5);
  const wire = (fret: number) => EDGE + GUTTER + cell * (fret + 1);
  const across = (string: number) => TOP + (string - 1) * ROW;
  /** A note position; `offset` moves it across the neck toward higher-numbered strings. */
  const at = (fret: number, string: number, offset = 0): Point => project(along(fret), across(string) + offset);
  /** The screen rectangle spanning two neck-coordinate ranges. */
  const rect = (alongFrom: number, alongTo: number, acrossFrom: number, acrossTo: number) => {
    const a = project(alongFrom, acrossFrom), b = project(alongTo, acrossTo);
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
  };
  const acrossStart = vertical ? VERTICAL_CROP : 0;
  const alongEnd = vertical ? wire(frets) + 10 : length;
  return {
    orientation, cell, breadth, project, along, wire, across, at, rect,
    width: vertical ? breadth : length,
    height: vertical ? length : breadth,
    // What the SVG shows: the whole board, or in vertical only its used strip.
    box: rect(0, alongEnd, acrossStart, breadth),
    // Margins beside and above the neck, for string names, fret numbers and inlays.
    labelAlong: EDGE,
    numberAcross: vertical ? breadth - VERTICAL_CROP : 22,
    inlayAcross: vertical ? VERTICAL_CROP + 9 : across(6) + 43,
    // The invisible touch target. Vertical spans the whole string column; its height is a little over the fret spacing
    // so that a phone, which scales the board down, still gives a 44px target. Neighbors overlap by a few units.
    hit: vertical ? { width: ROW, height: Math.max(cell, VERTICAL_HIT) } : { width: HIT_SIZE, height: HIT_SIZE },
  };
}
export type BoardGeometry = ReturnType<typeof boardGeometry>;

/** Which way the screen shows each fret and string step, so arrow keys follow what the player sees. */
export function arrowStep(geo: BoardGeometry, key: string): { fret: number; string: number } | undefined {
  const heading = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }[key];
  if (!heading) return undefined;
  const origin = geo.at(1, 1);
  const fret = geo.at(2, 1), string = geo.at(1, 2);
  const alongFrets = (fret.x - origin.x) * heading.x + (fret.y - origin.y) * heading.y;
  const alongStrings = (string.x - origin.x) * heading.x + (string.y - origin.y) * heading.y;
  return Math.abs(alongFrets) > Math.abs(alongStrings) ? { fret: Math.sign(alongFrets), string: 0 } : { fret: 0, string: Math.sign(alongStrings) };
}

export function shapeOutline(shape: Shape, geo: BoardGeometry): Point[] {
  // Straight rails through every endpoint, including the G–B tuning shift.
  const rows = shape.rows.map(r => ({ from: geo.along(Math.min(r.left, r.right)), to: geo.along(Math.max(r.left, r.right)), across: geo.across(r.string) }));
  const first = rows[0], last = rows[rows.length - 1];
  const points: [number, number][] = [[first.from, first.across], [first.to, first.across]];
  for (let i = 1; i < rows.length; i++) points.push([rows[i].to, rows[i].across]);
  points.push([last.to, last.across], [last.from, last.across]);
  for (let i = rows.length - 2; i >= 0; i--) points.push([rows[i].from, rows[i].across]);
  return points.map(([along, across]) => geo.project(along, across));
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// Single-row fragments remain open; complete shapes use crisp, straight joins.
export function shapePath(shape: Shape, geo: BoardGeometry): string {
  const path = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');
  if (shape.continuesAbove || shape.continuesBelow) {
    const top = shape.rows[0], bottom = shape.rows.at(-1)!;
    const rails = (side: 'left' | 'right') => [
      ...(shape.continuesAbove ? [geo.at(top[side], top.string, -STUB)] : []),
      ...shape.rows.map(row => geo.at(row[side], row.string)),
      ...(shape.continuesBelow ? [geo.at(bottom[side], bottom.string, STUB)] : []),
    ];
    const caps = [!shape.continuesAbove && top, !shape.continuesBelow && bottom].filter(Boolean) as typeof shape.rows;
    return [path(rails('left')), path(rails('right')), ...caps.map(row => path([geo.at(row.left, row.string), geo.at(row.right, row.string)]))].join(' ');
  }
  if (shape.rows.length === 1) {
    const row = shape.rows[0];
    return path([geo.at(row.left, row.string), geo.at(row.right, row.string)]);
  }
  const points = shapeOutline(shape, geo).filter((point, i, all) => i === 0 || point.x !== all[i - 1].x || point.y !== all[i - 1].y);
  return `${path(points)} Z`;
}

// Shared rails get a two-color stroke, keeping both pattern boundaries visible.
export function sharedShapePath(shapes: Shape[], geo: BoardGeometry): string {
  const segments = (shape: Shape) => {
    const result: [Point,Point][] = [];
    let first: Point | undefined, previous: Point | undefined;
    for (const [,command,x,y] of shapePath(shape,geo).matchAll(/([MLZ])(?:(-?[\d.]+),(-?[\d.]+))?/g)) {
      const point = command==='Z' ? first! : {x:Number(x),y:Number(y)};
      if (command!=='M' && previous) result.push([previous,point]);
      if (command==='M') first=point;
      previous=point;
    }
    return result;
  };
  const red=shapes.filter(s=>s.kind==='rectangle').flatMap(segments);
  const blue=shapes.filter(s=>s.kind==='stack').flatMap(segments);
  const paths=new Set<string>();
  for(const [a,b] of red) for(const [c,d] of blue) {
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    if (!length2 || Math.abs((c.x-a.x)*dy-(c.y-a.y)*dx)>.001 || Math.abs((d.x-a.x)*dy-(d.y-a.y)*dx)>.001) continue;
    const t=(p:Point)=>((p.x-a.x)*dx+(p.y-a.y)*dy)/length2;
    const from=Math.max(0,Math.min(t(c),t(d))),to=Math.min(1,Math.max(t(c),t(d)));
    if(to-from<.0001) continue;
    paths.add(`M${a.x+from*dx},${a.y+from*dy} L${a.x+to*dx},${a.y+to*dy}`);
  }
  return [...paths].join(' ');
}
