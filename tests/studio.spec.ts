import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Controls live in collapsible `details.control-module` sections; open one by its summary title.
const openModule = async (page: Page, title: 'Overlays' | 'Practice tools' | 'Instrument & display') => {
  const module = page.locator('details.control-module').filter({ has: page.locator(':scope > summary', { hasText: title }) });
  if (!await module.evaluate(element => (element as HTMLDetailsElement).open)) {
    await module.locator(':scope > summary').click();
  }
  return module;
};
// Toggles with a hint include it in their accessible name, so match the label prefix.
const toggle = (page: Page, name: string) => page.getByRole('checkbox', { name, exact: true });
const openOverlays = (page: Page) => openModule(page, 'Overlays');
const openPractice = (page: Page) => openModule(page, 'Practice tools');
const openInstrument = (page: Page) => openModule(page, 'Instrument & display');

test('whole neck shows the entire neck, persists, and keeps the skeleton independent',async({page})=>{
  await page.goto('/');
  await openOverlays(page);
  await toggle(page,'Skeleton').check();
  const connections=()=>page.locator('.root-skeleton line').evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('data-from'),n.getAttribute('data-to')]));
  const skeleton=await connections();
  const wholeNeck=page.getByRole('button',{name:'Whole neck',exact:true});
  await wholeNeck.click();
  await expect(wholeNeck).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.map-tag')).toHaveText('Whole neck');
  // Whole neck has a single study: no Previous/Next or form status, only a pattern-family filter.
  await expect(page.getByRole('button',{name:'Next form',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Previous form',exact:true})).toHaveCount(0);
  await expect(page.locator('.form-status')).toHaveCount(0);
  const families=page.getByRole('group',{name:'Pattern families',exact:true});
  await expect(families).toBeVisible();
  await expect(families.getByRole('button',{name:'Both',exact:true})).toHaveAttribute('aria-pressed','true');
  // Whole neck already shows every note at full strength, so the Whole map toggle is not offered.
  await expect(toggle(page,'Whole map')).toHaveCount(0);
  expect(await page.locator('.shape-outline.rectangle').count()).toBeGreaterThan(2);
  expect(await page.locator('.shape-outline.stack').count()).toBeGreaterThan(1);
  await expect(page.locator('.note-node.is-background')).toHaveCount(0);
  await expect(page.locator('[data-note-id="1:3"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('[data-note-id="1:15"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('.shared-rail.rectangle')).toHaveCount(1);
  await expect(page.locator('.shared-rail.stack')).toHaveCount(1);
  expect(await connections()).toEqual(skeleton);
  await page.reload();
  await expect(page.getByRole('button',{name:'Whole neck',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.map-tag')).toHaveText('Whole neck');
  await openOverlays(page);
  await toggle(page,'Skeleton').uncheck();
  await expect(page.locator('.root-skeleton')).toHaveCount(0);
  await expect(page.locator('[data-note-id="1:3"]')).toHaveAttribute('data-visible','true');
  await page.getByRole('button',{name:'Position',exact:true}).click();
  await expect(toggle(page,'Whole map')).not.toBeChecked();
  await expect(page.locator('.shared-rails')).toHaveCount(0);
});

test('forms, isolated shapes, diagonals and map layers behave independently',async({page})=>{
  await page.goto('/');
  const paths=()=>page.locator('.shape-outline').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')));
  const first=await paths();
  await page.getByRole('button',{name:'Next form',exact:true}).click();
  await expect(page.locator('.form-status strong')).toHaveText('Form 2');
  expect(await paths()).not.toEqual(first);
  await page.getByRole('button',{name:'Previous form',exact:true}).click();
  expect(await paths()).toEqual(first);
  await openOverlays(page);
  await toggle(page,'Whole map').check();
  expect(await page.locator('.note-node.is-background[data-visible="true"]').count()).toBeGreaterThan(12);
  await expect(page.locator('[data-note-id="1:5"]')).toHaveAttribute('data-active','true');
  expect(await paths()).toEqual(first);
  await toggle(page,'Skeleton').check();
  expect(await page.locator('.root-skeleton line').count()).toBeGreaterThan(0);
  await toggle(page,'Whole map').uncheck();
  await expect(page.locator('[data-note-id="3:2"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('[data-note-id="3:0"]')).toHaveAttribute('data-visible','false');
  await toggle(page,'Warp').uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  expect(await paths()).toEqual(first);
  await toggle(page,'Skeleton').uncheck();
  await page.getByRole('button',{name:'Shape',exact:true}).click();
  // Changing view keeps the current form.
  await expect(page.locator('.form-status strong')).toHaveText('Form 1');
  await expect(page.locator('.shape-outline')).toHaveCount(1);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(4);
  await page.getByRole('button',{name:'Stack',exact:true}).click();
  await expect(page.locator('.shape-outline.stack')).toHaveCount(1);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(6);
  const stackId=await page.locator('.shape-outline.stack').getAttribute('data-shape-id');
  await page.getByRole('button',{name:'Diagonal',exact:true}).click();
  // Shape -> Diagonal selects the diagonal containing the current shape.
  await expect(page.locator(`.shape-outline[data-shape-id="${stackId}"]`)).toHaveCount(1);
  const diagonal=Number((await page.locator('.form-status strong').textContent())!.match(/^Diagonal (\d+)$/)![1]);
  await page.getByRole('button',{name:'Next form',exact:true}).click();
  const nextLabel=`Diagonal ${diagonal+1}`;
  await expect(page.locator('.form-status strong')).toHaveText(nextLabel);
  await expect(page.locator(`.shape-outline[data-shape-id="${stackId}"]`)).toHaveCount(0);
  const stacks=await page.locator('.shape-outline.stack').count();
  expect(stacks).toBeGreaterThan(1);
  await page.reload();
  await expect(page.locator('.form-status strong')).toHaveText(nextLabel);
  await expect(page.locator('.shape-outline.stack')).toHaveCount(stacks);
  await openOverlays(page);
  await expect(toggle(page,'Warp')).not.toBeChecked();
  await page.getByRole('button',{name:'Rectangle',exact:true}).click();
  await expect(page.locator('.shape-outline.stack')).toHaveCount(0);
  expect(await page.locator('.shape-outline.rectangle').count()).toBeGreaterThan(1);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'Share view',exact:true}).click();
  const url=await page.evaluate(()=>navigator.clipboard.readText());
  await page.evaluate(()=>localStorage.clear());
  await page.goto(url);
  await expect(page.locator('.form-status strong')).toHaveText(nextLabel);
  await expect(page.getByRole('button',{name:'Rectangle',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('one form renders cleanly; independent pattern and warp toggles persist without hiding notes', async ({page}) => {
  await page.goto('/');
  const dots=await page.locator('.note-node[data-visible="true"]').count();
  const rectangles=await page.locator('.shape-outline.rectangle').count();
  const stacks=await page.locator('.shape-outline.stack').count();
  expect(rectangles).toBe(2);
  expect(stacks).toBe(1);
  expect(dots).toBe(12);
  // Rectangles and stacks are chosen in one place: the form bar.
  const families=page.getByRole('group',{name:'Pattern families',exact:true});
  await expect(page.getByRole('group',{name:'Pattern outlines'})).toHaveCount(0);
  await families.getByRole('button',{name:'Stacks',exact:true}).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(0);
  await expect(page.locator('.shape-outline.stack')).toHaveCount(stacks);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(dots);
  await openOverlays(page);
  await toggle(page,'Warp').uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  await page.reload();
  await openOverlays(page);
  await expect(toggle(page,'Warp')).not.toBeChecked();
  await expect(families.getByRole('button',{name:'Stacks',exact:true})).toHaveAttribute('aria-pressed','true');
  // Shape view keeps its chosen family even though the filter excludes rectangles.
  await page.getByRole('button',{name:'Shape',exact:true}).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(1);
  await expect(page.locator('.board-notice')).toHaveCount(0);
  await page.getByRole('button',{name:'Position',exact:true}).click();
  await families.getByRole('button',{name:'Rectangles',exact:true}).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(rectangles);
  await page.locator('[data-note-id="1:5"]').hover();
  await expect(page.locator('.shape-outline.is-emphasized')).toHaveCount(1);
  for (let string=1;string<=6;string++) await page.getByRole('button',{name:`Show patterns on string ${string}`,exact:true}).click();
  await expect(page.locator('.shape-outline')).toHaveCount(0);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(dots);
});

test('dark mode is available in Instrument & display and persists on this device', async ({page}) => {
  await page.goto('/');
  await openInstrument(page);
  await page.getByLabel('Dark mode',{exact:true}).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const next=page.getByRole('button',{name:'Next form',exact:true});
  await next.hover();
  await expect.poll(()=>next.evaluate(node=>{
    const style=getComputedStyle(node);
    const luminance=(color:string)=>{
      const channels=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
      return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
    };
    const a=luminance(style.color), b=luminance(style.backgroundColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  })).toBeGreaterThanOrEqual(4.5);
});

test('pattern lines share joins and render behind opaque note badges', async ({page}) => {
  await page.goto('/');
  // Outlines fade in with each new form; check their resting style.
  await expect(page.locator('svg.fretboard.form-enter')).toHaveCount(0);
  await expect(page.locator('.shape-underlay')).toHaveCount(0);
  await expect(page.locator('.shape-halo')).toHaveCount(await page.locator('.shape-outline').count());
  await expect(page.locator('.pattern-layer.rectangle .shape-outline')).toHaveCount(await page.locator('.shape-outline.rectangle').count());
  await expect(page.locator('.pattern-layer.stack .shape-outline')).toHaveCount(await page.locator('.shape-outline.stack').count());
  const style = await page.locator('.shape-outline.stack').first().evaluate(node => {
    const computed = getComputedStyle(node);
    return { width: computed.strokeWidth, dash: computed.strokeDasharray, opacity: computed.opacity };
  });
  expect(style).toEqual({ width: '4px', dash: 'none', opacity: '1' });
  await expect(page.locator('.shape-outline.rectangle').first()).toHaveCSS('stroke-width', '4px');
  expect(await page.locator('.shape-outline').evaluateAll(nodes => nodes.every(node => !/[QC]/.test(node.getAttribute('d')!)))).toBe(true);
  expect(await page.locator('.shape-outline').first().evaluate(node => {
    const note = node.ownerSVGElement!.querySelector('[data-note-id]')!;
    return Boolean(node.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
});

test('existing musical, display, focus, mark, keyboard, custom-note and sharing features remain usable', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.locator('#scale').selectOption('minor');
  await page.getByRole('group',{name:'Note view',exact:true}).getByRole('button',{name:'Both',exact:true}).click();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-labels','both');
  const note = page.locator('[data-note-id="1:5"]');
  await note.click();
  await expect(note).toHaveAttribute('aria-pressed','true');
  await note.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-note-id="1:6"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.marks-list button')).toHaveCount(2);
  await openPractice(page);
  await page.getByRole('button',{name:'Fret & string focus',exact:true}).click();
  await page.getByRole('button',{name:'Include string 1',exact:true}).click();
  await expect(page.locator('[data-note-id="1:8"]')).toHaveAttribute('data-visible','false');
  await page.getByRole('button',{name:'Clear focus',exact:true}).click();
  await expect(page.locator('[data-note-id="1:8"]')).toHaveAttribute('data-visible','true');
  await page.getByRole('button',{name:'Include string 1',exact:true}).click();
  await openInstrument(page);
  await page.getByLabel('Left-handed',{exact:true}).check();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness','left');
  await page.locator('#frets').selectOption('24');
  await page.getByLabel('String names',{exact:true}).uncheck();
  await expect(page.locator('.string-name')).toHaveCount(0);
  await page.getByLabel('String names',{exact:true}).check();
  await expect(page.locator('.string-name')).toHaveCount(6);
  await openOverlays(page);
  await page.getByLabel('Notes outside the scale',{exact:true}).check();
  expect(await page.locator('.note-node.context[data-visible="true"]').count()).toBeGreaterThan(0);
  await page.getByRole('group',{name:'Note colors',exact:true}).getByRole('button',{name:/Chord tones/}).click();
  expect(await page.locator('.fretboard .note-node.third').count()).toBeGreaterThan(0);
  expect(await page.locator('.fretboard .note-node.fifth').count()).toBeGreaterThan(0);
  // The separate Third/Fifth legend was replaced by chord-colored markers in the scale-tone strip.
  await expect(page.locator('.tone-strip .degree-marker.third')).toHaveCount(1);
  await expect(page.locator('.tone-strip .degree-marker.fifth')).toHaveCount(1);
  await page.locator('#spelling').selectOption('flats');
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  await expect(page.locator('.marks-list button')).toHaveCount(2);
  await expect(page.locator('#scale')).toHaveValue('minor');
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness','right');
  await expect(page.locator('.fretboard')).toHaveAttribute('data-labels','none');
  await expect(page.locator('.row-toggles button[aria-pressed="true"]')).toHaveCount(6);
  await expect(page.locator('#focus-panel [aria-label="Included strings"] button[aria-pressed="true"]')).toHaveCount(6);
  await page.getByRole('button',{name:'Customize notes',exact:true}).click();
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(page.locator('.tone-sequence button.selected')).toHaveCount(0);
  await page.getByRole('button',{name:'Naturals',exact:true}).click();
  await expect(page.locator('.tone-sequence button.selected')).toHaveCount(7);
  await page.getByRole('button',{name:'All',exact:true}).click();
  await expect(page.locator('.tone-sequence button.selected')).toHaveCount(12);
  await page.getByRole('button',{name:'Guide',exact:true}).click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Guide',exact:true})).toBeFocused();
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'Share view',exact:true}).click();
  const url = await page.evaluate(()=>navigator.clipboard.readText());
  const shared = JSON.parse(new URL(url).searchParams.get('atlas')!);
  expect(shared.customPitches).toHaveLength(12);
  expect(shared.marks).toHaveLength(2);
  await page.getByRole('button',{name:'Clear marks',exact:true}).click();
  await expect(page.locator('.marks-panel')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('small screens contain controls and scroll only the instrument', async ({page}) => {
  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    for (const name of ['Share view','Guide','Reset view']) await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
    const region = page.locator('.board-scroll');
    expect(await region.evaluate(el=>el.scrollWidth>el.clientWidth)).toBeTruthy();
    for (const name of ['Position','Shape','Diagonal','Whole neck']) {
      await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
    }
    await expect(page.getByRole('group',{name:'Note view',exact:true})).toBeVisible();
    await openOverlays(page);
    for (const name of ['Whole map','Skeleton','Warp']) await expect(toggle(page,name)).toBeVisible();
    await openPractice(page);
    await openInstrument(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    for (const module of await page.locator('details.control-module').all()) {
      expect(await module.evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;})).toBeTruthy();
    }
  }
});

test('old saved views migrate and pattern outlines and shift arrow mirror correctly', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('fret-atlas-v2',JSON.stringify({version:2,root:9,scaleId:'minor',lens:'shape',kind:'rectangle',shapeId:'rectangle:2:5',wholeMap:false,marks:['6:5']})));
  await page.goto('/');
  await expect(page.locator('#scale')).toHaveValue('minor');
  expect(await page.locator('.shape-outline.rectangle').count()).toBeGreaterThan(1);
  await expect(page.locator('.shape-outline.stack')).toHaveCount(0);
  await expect(page.locator('.marks-list button')).toHaveCount(1);
  await openOverlays(page);
  await toggle(page,'Whole map').check();
  await expect(page.locator('[data-note-id="3:2"]')).toHaveAttribute('data-visible','true');
  const positions=await page.locator('.shape-outline').evaluateAll(nodes=>nodes.map(node=>{
    const box=(node as SVGPathElement).getBBox();
    return {id:node.getAttribute('data-shape-id'),x:box.x,y:box.y,width:box.width,height:box.height};
  }));
  const width=await page.locator('.fretboard').evaluate(n=>(n as SVGSVGElement).viewBox.baseVal.width);
  await openInstrument(page);
  await page.getByLabel('Left-handed',{exact:true}).check();
  for (const shape of positions) {
    const mirrored=await page.locator(`[data-shape-id="${shape.id}"]`).evaluate(node=>{
      const box=(node as SVGPathElement).getBBox();
      return {x:box.x,y:box.y,width:box.width,height:box.height};
    });
    expect(mirrored).toEqual({x:width-shape.x-shape.width,y:shape.y,width:shape.width,height:shape.height});
  }
  const boundary=await page.locator('.warp-guide line').evaluate(node=>({x1:Number(node.getAttribute('x1')),x2:Number(node.getAttribute('x2'))}));
  expect(boundary.x1).toBeGreaterThan(boundary.x2);
  await toggle(page,'Warp').uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  expect(await page.locator('.shape-outline').count()).toBe(positions.length);
});

test('triad highlighting is independent, optional, persistent, and available with custom notes', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Show tones',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#scale option[value$="-triad"]')).toHaveCount(0);
  const scale=await page.locator('#scale').inputValue();
  const patterns=await page.locator('.shape-outline').count();
  await page.getByLabel('Chord quality').selectOption('major');
  await page.getByRole('button',{name:'Show tones',exact:true}).click();
  // Chord tones are not a panel setting, so no panel reports a change.
  await expect(page.locator('em.modified-badge')).toHaveCount(0);
  await expect(page.locator('#scale')).toHaveValue(scale);
  await expect(page.locator('.shape-outline')).toHaveCount(patterns);
  const added=page.locator('[data-note-id="1:9"]');
  await expect(added).toHaveAttribute('data-triad','true');
  await expect(added).toHaveAttribute('data-visible','true');
  await added.click();
  await expect(added.locator('.triad-halo')).toHaveCount(1);
  await expect(added).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('Chord root').selectOption('0');
  await page.reload();
  await expect(page.getByLabel('Chord root')).toHaveValue('0');
  await expect(page.locator('.triad-legend')).toHaveText('C major triad');
  await page.getByRole('button',{name:'Customize notes',exact:true}).click();
  const custom=await page.locator('.tone-chip[aria-pressed="true"]').count();
  await page.getByLabel('Chord quality').selectOption('minor');
  await expect(page.locator('.tone-chip[aria-pressed="true"]')).toHaveCount(custom);
  await page.locator('#root').selectOption('2');
  await expect(page.locator('.triad-legend')).toHaveText('C minor triad');
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await expect(page.getByLabel('Chord root')).toBeVisible();
  }
  await page.getByRole('button',{name:'Hide tones',exact:true}).click();
  await expect(page.locator('.triad-halo')).toHaveCount(0);
  await expect(page.locator('.marks-list button')).toHaveCount(1);
});

test('light-mode header actions keep readable contrast', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('fret-atlas-theme','light'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  for (const name of ['Share view','Guide','Reset view']) {
    const button=page.locator('.header-actions').getByRole('button',{name,exact:true});
    const ratio=await button.evaluate(node=>{
      const parse=(color:string)=>{const [r,g,b,a=1]=color.match(/[\d.]+/g)!.map(Number);return {r,g,b,a};};
      let element:Element|null=node, background=parse('rgba(255,255,255,1)');
      while (element) {
        const color=parse(getComputedStyle(element).backgroundColor);
        if (color.a>=1) { background=color; break; }
        element=element.parentElement;
      }
      const text=parse(getComputedStyle(node).color);
      // Blend any translucent text over the opaque background.
      const blend=(c:'r'|'g'|'b')=>text[c]*text.a+background[c]*(1-text.a);
      const luminance=(rgb:number[])=>{
        const [r,g,b]=rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
        return r*.2126+g*.7152+b*.0722;
      };
      const a=luminance([blend('r'),blend('g'),blend('b')]), b=luminance([background.r,background.g,background.b]);
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    });
    expect(ratio,`${name} contrast`).toBeGreaterThanOrEqual(4.5);
  }
});

test('fit neck applies only to wide views and normal scrolling returns in Position', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const svgWidth=()=>page.locator('.fretboard').evaluate(n=>n.getBoundingClientRect().width);
  const regionWidth=()=>page.locator('.board-scroll').evaluate(n=>n.clientWidth);
  await page.getByRole('button',{name:'Diagonal',exact:true}).click();
  const fit=page.getByRole('button',{name:'Fit neck to screen',exact:true});
  await expect(fit).toBeVisible();
  await fit.click();
  await expect(fit).toHaveAttribute('aria-pressed','true');
  await expect.poll(async()=>await svgWidth()<=await regionWidth()).toBe(true);
  await page.getByRole('button',{name:'Position',exact:true}).click();
  await expect(page.getByRole('button',{name:'Fit neck to screen',exact:true})).toHaveCount(0);
  await expect.poll(async()=>await svgWidth()>await regionWidth()).toBe(true);
  expect(await page.locator('.board-scroll').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
});

test('Lucky Charms keep a root center and give each pentatonic degree its own shape', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('fret-atlas-v4',JSON.stringify({version:4,scaleId:'minor-pentatonic',studyMode:'all'})));
  await page.goto('/');
  await page.getByRole('group',{name:'Note view',exact:true}).getByRole('button',{name:/Lucky Charms/}).click();
  const roots=page.locator('.note-node.root[data-active="true"]');
  expect(await roots.count()).toBeGreaterThan(0);
  for (const root of await roots.all()) await expect(root.locator('.root-center')).toHaveCount(1);
  const shapes=await page.locator('.note-node[data-active="true"][data-charm-degree]').evaluateAll(nodes=>{
    const byDegree:Record<string,string[]>={};
    for (const node of nodes) {
      const face=node.querySelector('.note-face')!;
      const key=`${face.tagName}:${face.getAttribute('d') ?? ''}`;
      (byDegree[node.getAttribute('data-charm-degree')!] ??= []).push(key);
    }
    return Object.fromEntries(Object.entries(byDegree).map(([degree,keys])=>[degree,[...new Set(keys)]]));
  });
  // Minor pentatonic: 1, b3, 4, 5, b7.
  expect(Object.keys(shapes).sort()).toEqual(['1','3','4','5','7']);
  for (const keys of Object.values(shapes)) expect(keys).toHaveLength(1);
  expect(new Set(Object.values(shapes).map(keys=>keys[0])).size).toBe(5);
});

for (const scale of ['minor','major']) {
  test(`One string and 3 notes/string never show the pattern notice in ${scale}`, async ({page}) => {
    await page.goto('/');
    await page.locator('#scale').selectOption(scale);
    for (const name of ['One string','3 notes/string']) {
      const button=page.getByRole('button',{name,exact:true});
      await expect(button).toBeEnabled();
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('.board-notice')).toHaveCount(0);
      for (let step=0;step<6;step++) {
        await page.getByRole('button',{name:'Next form',exact:true}).click();
        await expect(page.locator('.board-notice')).toHaveCount(0);
      }
    }
  });
}
