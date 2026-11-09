import test from 'node:test';
import assert from 'node:assert/strict';
import { arrowStep, boardGeometry, CELL, pointInPolygon, ROW, shapeOutline, shapePath, VERTICAL_CELL } from '../src/core/geometry';
import type { BoardGeometry, Orientation, Point } from '../src/core/geometry';
import { findShapes } from '../src/core/shapes';
import { position, scaleById } from '../src/core/music';
import { defaultState } from '../src/core/state';
import { studyChoices } from '../src/core/study';

const ORIENTATIONS: Orientation[] = ['horizontal', 'vertical'];
const KEYS = Array.from({ length: 12 }, (_, i) => i);
const STRINGS = [1, 2, 3, 4, 5, 6];


function onSegment(p: {x:number;y:number}, a: {x:number;y:number}, b: {x:number;y:number}) {
  return Math.abs((p.y-a.y)*(b.x-a.x)-(p.x-a.x)*(b.y-a.y)) < 1e-6 && p.x >= Math.min(a.x,b.x) && p.x <= Math.max(a.x,b.x) && p.y >= Math.min(a.y,b.y) && p.y <= Math.max(a.y,b.y);
}
test('every rectangle and stack boundary passes through its endpoint dot centers, including the tuning break and mirrored boards', () => {
  for (const root of KEYS) for (const kind of ['rectangle','stack'] as const) for (const leftHanded of [false,true]) for (const orientation of ORIENTATIONS) {
    const geo = boardGeometry(24,leftHanded,orientation);
    for (const shape of findShapes({root,kind,scaleId:'minor-pentatonic',frets:24})) {
      const outline = shapeOutline(shape,geo);
      for (const row of shape.rows) for (const fret of [row.left,row.right]) {
        const dot = geo.at(fret,row.string);
        assert.ok(outline.some((a,i)=>onSegment(dot,a,outline[(i+1)%outline.length])), `${shape.id}, root ${root}, mirrored ${leftHanded}, ${orientation}: ${row.string}:${fret}`);
      }
    }
  }
});

test('rendered shape paths use the same endpoint centers as their geometry', () => {
  for (const root of KEYS) for (const kind of ['rectangle','stack'] as const) for (const leftHanded of [false,true]) for (const orientation of ORIENTATIONS) {
    const geo = boardGeometry(24,leftHanded,orientation);
    for (const shape of findShapes({root,kind,scaleId:'minor-pentatonic',frets:24})) {
      const vertices = [...shapePath(shape, geo).matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(([, x, y]) => ({x:Number(x), y:Number(y)}));
      for (const row of shape.rows) for (const fret of [row.left,row.right]) {
        const dot = geo.at(fret,row.string);
        assert.ok(vertices.some(point => point.x === dot.x && point.y === dot.y), `${shape.id}, root ${root}, mirrored ${leftHanded}, ${orientation}: rendered path misses ${row.string}:${fret}`);
      }
    }
  }
});

test('every neighboring pentatonic pair belongs to the pattern map, including outer strings and open frets', () => {
  for (let root=0;root<12;root++) for (const scaleId of ['minor-pentatonic','major-pentatonic']) {
    const shapes = (['rectangle','stack'] as const).flatMap(kind=>findShapes({root,scaleId,kind,frets:24}));
    const pairs = new Set(shapes.flatMap(s=>s.rows.map(r=>`${r.string}:${r.left}:${r.right}`)));
    const pitches=scaleById(scaleId).tones.map(t=>(root+t.semitones)%12);
    for(let string=1;string<=6;string++) {
      const frets=Array.from({length:25},(_,i)=>i).filter(f=>pitches.includes(position(string,f).pitch));
      for(let i=1;i<frets.length;i++) assert.ok(pairs.has(`${string}:${frets[i-1]}:${frets[i]}`),`${root} ${scaleId} S${string} ${frets[i-1]}–${frets[i]}`);
    }
  }
});

// Every form of every key, as the outlines the board draws and the notes it places.
function forms(root: number, scaleId = 'minor-pentatonic') {
  return studyChoices({ ...defaultState(), root, scaleId, frets: 24 });
}
const rotateClockwise = (point: Point, horizontal: BoardGeometry): Point => ({ x: horizontal.height - point.y, y: point.x });
const mirrorAcross = (point: Point, vertical: BoardGeometry): Point => ({ x: vertical.width - point.x, y: point.y });
const sameDot = (a: Point, b: Point, message: string) => {
  assert.ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9, `${message}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
};

test('a vertical neck is the horizontal neck turned 90° clockwise, for every note and outline point of every form in every key', () => {
  // The spacing along the neck is a presentation choice; the relationship must hold at any spacing, including the one phones use.
  for (const cell of [CELL, VERTICAL_CELL]) {
    const horizontal = boardGeometry(24, false, 'horizontal', cell), vertical = boardGeometry(24, false, 'vertical', cell);
    assert.equal(vertical.width, horizontal.height);
    assert.equal(vertical.height, horizontal.width);
    for (const string of STRINGS) for (let fret = 0; fret <= 24; fret++) {
      sameDot(vertical.at(fret, string), rotateClockwise(horizontal.at(fret, string), horizontal), `note ${string}:${fret}, cell ${cell}`);
    }
    for (const root of KEYS) for (const form of forms(root)) for (const shape of form.shapes) {
      const flat = shapeOutline(shape, horizontal), upright = shapeOutline(shape, vertical);
      assert.equal(upright.length, flat.length);
      flat.forEach((point, i) => sameDot(upright[i], rotateClockwise(point, horizontal), `${shape.id} point ${i}, root ${root} form ${form.form}, cell ${cell}`));
    }
  }
});

test('strings run in columns: low E on the left and high e on the right, nut on top; left-handed mirrors across the strings', () => {
  for (const frets of [12, 24]) {
    const right = boardGeometry(frets, false, 'vertical'), left = boardGeometry(frets, true, 'vertical');
    for (const string of STRINGS) for (let fret = 0; fret <= frets; fret++) {
      sameDot(left.at(fret, string), mirrorAcross(right.at(fret, string), right), `left-handed ${string}:${fret}`);
      if (string < 6) {
        assert.ok(right.at(fret, string).x > right.at(fret, string + 1).x, 'higher strings are further right');
        assert.ok(left.at(fret, string).x < left.at(fret, string + 1).x, 'left-handed puts the high strings on the left');
      }
      if (fret) assert.ok(right.at(fret, string).y > right.at(fret - 1, string).y && left.at(fret, string).y > left.at(fret - 1, string).y, 'frets run down');
    }
  }
});

test('a horizontal neck is unchanged by the vertical option, and left-handed mirrors it along the neck', () => {
  const right = boardGeometry(12, false), left = boardGeometry(12, true);
  assert.equal(right.width, 22 * 2 + 30 + CELL * 13);
  assert.equal(right.height, 392);
  assert.deepEqual(right.box, { x: 0, y: 0, width: right.width, height: right.height });
  assert.deepEqual(right.at(5, 3), { x: 22 + 30 + CELL * 5.5, y: 64 + 2 * ROW });
  for (const string of STRINGS) for (let fret = 0; fret <= 12; fret++) {
    const flat = right.at(fret, string), flipped = left.at(fret, string);
    sameDot(flipped, { x: right.width - flat.x, y: flat.y }, `left-handed ${string}:${fret}`);
  }
});

test('every note and its touch target stay inside what the vertical board shows', () => {
  for (const leftHanded of [false, true]) {
    const geo = boardGeometry(24, leftHanded, 'vertical');
    for (const string of STRINGS) for (let fret = 0; fret <= 24; fret++) {
      const { x, y } = geo.at(fret, string);
      assert.ok(x - geo.hit.width / 2 >= geo.box.x && x + geo.hit.width / 2 <= geo.box.x + geo.box.width, `${string}:${fret} fits across`);
      assert.ok(y - geo.hit.height / 2 >= geo.box.y && y + geo.hit.height / 2 <= geo.box.y + geo.box.height, `${string}:${fret} fits along`);
    }
    assert.equal(geo.hit.width, ROW, 'a target spans its string column');
    assert.ok(geo.hit.height >= geo.cell, 'targets cover the fret spacing');
    assert.ok(geo.hit.width >= 44 && geo.hit.height >= 44, 'touch targets stay 44 units');
  }
});

test('a point is inside a shape in every orientation exactly when it is inside in the neck coordinates', () => {
  const reference = boardGeometry(24, false);
  for (const root of [0, 4, 9]) for (const form of forms(root)) for (const shape of form.shapes) {
    const polygon = shapeOutline(shape, reference);
    const others = ORIENTATIONS.flatMap(orientation => [false, true].map(leftHanded => boardGeometry(24, leftHanded, orientation, CELL)));
    // Samples sit off the integer grid the outline edges lie on, where inside and outside would be a coin flip.
    for (let along = 0.5; along < reference.width; along += 17) for (let across = 0.5; across < reference.height; across += 13) {
      const expected = pointInPolygon({ x: along, y: across }, polygon);
      for (const geo of others) {
        // The reference is horizontal and right-handed, so its x is the position along the neck and its y the position across.
        const actual = pointInPolygon(geo.project(along, across), shapeOutline(shape, geo));
        assert.equal(actual, expected, `${shape.id} at ${along},${across}, ${geo.orientation}`);
      }
    }
  }
});

test('arrow keys move toward where the screen shows the next fret or string', () => {
  const horizontal = boardGeometry(12, false), horizontalLeft = boardGeometry(12, true);
  assert.deepEqual(arrowStep(horizontal, 'ArrowRight'), { fret: 1, string: 0 });
  assert.deepEqual(arrowStep(horizontal, 'ArrowLeft'), { fret: -1, string: 0 });
  assert.deepEqual(arrowStep(horizontal, 'ArrowDown'), { fret: 0, string: 1 });
  assert.deepEqual(arrowStep(horizontal, 'ArrowUp'), { fret: 0, string: -1 });
  assert.deepEqual(arrowStep(horizontalLeft, 'ArrowRight'), { fret: -1, string: 0 });
  assert.deepEqual(arrowStep(horizontalLeft, 'ArrowLeft'), { fret: 1, string: 0 });
  const vertical = boardGeometry(12, false, 'vertical'), verticalLeft = boardGeometry(12, true, 'vertical');
  assert.deepEqual(arrowStep(vertical, 'ArrowDown'), { fret: 1, string: 0 });
  assert.deepEqual(arrowStep(vertical, 'ArrowUp'), { fret: -1, string: 0 });
  // Low E is on the left, so left is toward string 6.
  assert.deepEqual(arrowStep(vertical, 'ArrowLeft'), { fret: 0, string: 1 });
  assert.deepEqual(arrowStep(vertical, 'ArrowRight'), { fret: 0, string: -1 });
  assert.deepEqual(arrowStep(verticalLeft, 'ArrowLeft'), { fret: 0, string: -1 });
  assert.deepEqual(arrowStep(verticalLeft, 'ArrowRight'), { fret: 0, string: 1 });
  assert.equal(arrowStep(vertical, 'Enter'), undefined);
});
