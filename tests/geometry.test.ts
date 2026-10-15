import test from 'node:test';
import assert from 'node:assert/strict';
import { boardGeometry, shapeOutline, shapePath } from '../src/core/geometry';
import { findShapes } from '../src/core/shapes';
import { position, scaleById } from '../src/core/music';

function onSegment(p: {x:number;y:number}, a: {x:number;y:number}, b: {x:number;y:number}) {
  return Math.abs((p.y-a.y)*(b.x-a.x)-(p.x-a.x)*(b.y-a.y)) < 1e-6 && p.x >= Math.min(a.x,b.x) && p.x <= Math.max(a.x,b.x) && p.y >= Math.min(a.y,b.y) && p.y <= Math.max(a.y,b.y);
}
test('every rectangle and stack boundary passes through its endpoint dot centers, including the tuning break and mirrored boards', () => {
  for (const root of Array.from({length:12}, (_, i) => i)) for (const kind of ['rectangle','stack'] as const) for (const leftHanded of [false,true]) {
    const geo = boardGeometry(24,leftHanded);
    for (const shape of findShapes({root,kind,scaleId:'minor-pentatonic',frets:24})) {
      const outline = shapeOutline(shape,geo);
      for (const row of shape.rows) for (const fret of [row.left,row.right]) {
        const dot = {x:geo.x(fret),y:geo.y(row.string)};
        assert.ok(outline.some((a,i)=>onSegment(dot,a,outline[(i+1)%outline.length])), `${shape.id}, root ${root}, mirrored ${leftHanded}: ${row.string}:${fret}`);
      }
    }
  }
});

test('rendered shape paths use the same endpoint centers as their geometry', () => {
  for (const root of Array.from({length:12}, (_, i) => i)) for (const kind of ['rectangle','stack'] as const) for (const leftHanded of [false,true]) {
    const geo = boardGeometry(24,leftHanded);
    for (const shape of findShapes({root,kind,scaleId:'minor-pentatonic',frets:24})) {
      const vertices = [...shapePath(shape, geo).matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map(([, x, y]) => ({x:Number(x), y:Number(y)}));
      for (const row of shape.rows) for (const fret of [row.left,row.right]) {
        assert.ok(vertices.some(point => point.x === geo.x(fret) && point.y === geo.y(row.string)), `${shape.id}, root ${root}, mirrored ${leftHanded}: rendered path misses ${row.string}:${fret}`);
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
