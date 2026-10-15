import type { Shape } from './shapes';

export type Point = { x: number; y: number };
export const CELL = 66;
export const ROW = 54;
export const TOP = 64;
export const EDGE = 22;
export const GUTTER = 30;
export const NOTE_RADIUS = 13;
export const HIT_SIZE = 44;

// Everything in the SVG, including labels and hit targets, uses these points.
// Mirroring is a transform on coordinates, never on the order of musical data.
export function boardGeometry(frets: number, leftHanded: boolean) {
  const width = EDGE * 2 + GUTTER + CELL * (frets + 1);
  const mirror = (x: number) => leftHanded ? width - x : x;
  const x = (fret: number) => mirror(EDGE + GUTTER + CELL * (fret + 0.5));
  const y = (string: number) => TOP + (string - 1) * ROW;
  const line = (fret: number) => mirror(EDGE + GUTTER + CELL * (fret + 1));
  const labelX = mirror(EDGE);
  const height = TOP + 5 * ROW + 58;
  return { width, height, x, y, line, labelX, nut: line(0), end: line(frets) };
}
export type BoardGeometry = ReturnType<typeof boardGeometry>;

export function shapeOutline(shape: Shape, geo: BoardGeometry): Point[] {
  // Straight rails through every endpoint, including the G–B tuning shift.
  const rows = shape.rows.map(r => ({ left: Math.min(geo.x(r.left), geo.x(r.right)), right: Math.max(geo.x(r.left), geo.x(r.right)), y: geo.y(r.string) }));
  const first = rows[0], last = rows[rows.length - 1];
  const points = [{ x: first.left, y: first.y }, { x: first.right, y: first.y }];
  for (let i = 1; i < rows.length; i++) {
    points.push({ x: rows[i].right, y: rows[i].y });
  }
  points.push({ x: last.right, y: last.y }, { x: last.left, y: last.y });
  for (let i = rows.length - 2; i >= 0; i--) {
    points.push({ x: rows[i].left, y: rows[i].y });
  }
  return points;
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
  if (shape.continuesAbove || shape.continuesBelow) {
    const top = shape.rows[0], bottom = shape.rows.at(-1)!;
    const path = (points: Point[]) => points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');
    const rails = (side: 'left' | 'right') => [
      ...(shape.continuesAbove ? [{x:geo.x(top[side]),y:geo.y(top.string)-18}] : []),
      ...shape.rows.map(row=>({x:geo.x(row[side]),y:geo.y(row.string)})),
      ...(shape.continuesBelow ? [{x:geo.x(bottom[side]),y:geo.y(bottom.string)+18}] : []),
    ];
    const caps = [!shape.continuesAbove && top,!shape.continuesBelow && bottom].filter(Boolean) as typeof shape.rows;
    return [path(rails('left')),path(rails('right')),...caps.map(row=>path([{x:geo.x(row.left),y:geo.y(row.string)},{x:geo.x(row.right),y:geo.y(row.string)}]))].join(' ');
  }
  if (shape.rows.length === 1) {
    const row = shape.rows[0];
    const left = { x: geo.x(row.left), y: geo.y(row.string) };
    const right = { x: geo.x(row.right), y: geo.y(row.string) };
    return `M${left.x},${left.y} L${right.x},${right.y}`;
  }
  const points = shapeOutline(shape, geo).filter((point, i, all) => i === 0 || point.x !== all[i - 1].x || point.y !== all[i - 1].y);
  return `${points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')} Z`;
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
