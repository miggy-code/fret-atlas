import { test, expect } from '@playwright/test';

test('all patterns shows the entire neck, persists, and keeps the skeleton independent',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Skeleton',{exact:true}).check();
  const connections=()=>page.locator('.root-skeleton line').evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('data-from'),n.getAttribute('data-to')]));
  const skeleton=await connections();
  await page.getByRole('button',{name:'All patterns',exact:true}).click();
  await expect(page.locator('.form-status strong')).toHaveText('All patterns');
  await expect(page.getByRole('button',{name:'Next form',exact:true})).toBeDisabled();
  await expect(page.getByLabel('Whole map',{exact:true})).toBeChecked();
  expect(await page.locator('.shape-outline.rectangle').count()).toBeGreaterThan(2);
  expect(await page.locator('.shape-outline.stack').count()).toBeGreaterThan(1);
  await expect(page.locator('.note-node.is-background')).toHaveCount(0);
  await expect(page.locator('[data-note-id="1:3"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('[data-note-id="1:15"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('.shared-rail.rectangle')).toHaveCount(1);
  await expect(page.locator('.shared-rail.stack')).toHaveCount(1);
  expect(await connections()).toEqual(skeleton);
  await page.reload();
  await expect(page.locator('.form-status strong')).toHaveText('All patterns');
  await page.getByLabel('Skeleton',{exact:true}).uncheck();
  await expect(page.locator('.root-skeleton')).toHaveCount(0);
  await expect(page.locator('[data-note-id="1:3"]')).toHaveAttribute('data-visible','true');
  await page.getByRole('button',{name:'In position',exact:true}).click();
  await expect(page.getByLabel('Whole map',{exact:true})).not.toBeChecked();
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
  await page.getByLabel('Whole map',{exact:true}).check();
  expect(await page.locator('.note-node.is-background[data-visible="true"]').count()).toBeGreaterThan(12);
  await expect(page.locator('[data-note-id="1:5"]')).toHaveAttribute('data-active','true');
  expect(await paths()).toEqual(first);
  await page.getByLabel('Skeleton',{exact:true}).check();
  expect(await page.locator('.root-skeleton line').count()).toBeGreaterThan(0);
  await page.getByLabel('Whole map',{exact:true}).uncheck();
  await expect(page.locator('[data-note-id="3:2"]')).toHaveAttribute('data-visible','true');
  await expect(page.locator('[data-note-id="3:0"]')).toHaveAttribute('data-visible','false');
  await page.getByLabel('Warp',{exact:true}).uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  expect(await paths()).toEqual(first);
  await page.getByLabel('Skeleton',{exact:true}).uncheck();
  await page.getByRole('button',{name:'Shape',exact:true}).click();
  await expect(page.locator('.shape-outline')).toHaveCount(1);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(4);
  await page.getByRole('button',{name:'Stack',exact:true}).click();
  await expect(page.locator('.shape-outline.stack')).toHaveCount(1);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(6);
  await page.getByRole('button',{name:'Diagonal',exact:true}).click();
  await expect(page.locator('.form-status strong')).toHaveText('Diagonal 1');
  await expect(page.locator('[data-shape-id="stack:6:-2"]')).toHaveCount(1);
  await page.getByRole('button',{name:'Next form',exact:true}).click();
  await expect(page.locator('.form-status strong')).toHaveText('Diagonal 2');
  await expect(page.locator('.shape-outline.stack')).toHaveCount(4);
  await page.reload();
  await expect(page.locator('.form-status strong')).toHaveText('Diagonal 2');
  await expect(page.getByLabel('Warp',{exact:true})).not.toBeChecked();
  await page.getByRole('button',{name:'Rectangle',exact:true}).click();
  await expect(page.locator('.shape-outline.stack')).toHaveCount(0);
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(4);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'Share view',exact:true}).click();
  const url=await page.evaluate(()=>navigator.clipboard.readText());
  await page.evaluate(()=>localStorage.clear());
  await page.goto(url);
  await expect(page.locator('.form-status strong')).toHaveText('Diagonal 2');
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
  await page.locator('.display-settings summary').click();
  await page.getByRole('button',{name:'Rectangles',exact:true}).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(0);
  await expect(page.locator('.shape-outline.stack')).toHaveCount(stacks);
  await page.getByRole('button',{name:'Stacks',exact:true}).click();
  await expect(page.locator('.shape-outline')).toHaveCount(0);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(dots);
  await page.locator('.display-settings summary').click();
  await page.getByLabel('Warp',{exact:true}).uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Warp',{exact:true})).not.toBeChecked();
  await page.locator('.display-settings summary').click();
  for (const name of ['Rectangles','Stacks']) await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Rectangles',exact:true}).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(rectangles);
  await page.locator('.display-settings summary').click();
  await page.locator('[data-note-id="1:5"]').hover();
  await expect(page.locator('.shape-outline.is-emphasized')).toHaveCount(1);
  await page.locator('.display-settings summary').click();
  for (let string=1;string<=6;string++) await page.getByRole('button',{name:`Show patterns on string ${string}`,exact:true}).click();
  await expect(page.locator('.shape-outline')).toHaveCount(0);
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(dots);
});

test('dark mode is available in Display and persists on this device', async ({page}) => {
  await page.goto('/');
  await page.locator('.display-settings summary').click();
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
  await expect(page.locator('.shape-underlay')).toHaveCount(0);
  await expect(page.locator('.shape-halo')).toHaveCount(await page.locator('.shape-outline').count());
  await expect(page.locator('.pattern-layer.rectangle .shape-outline')).toHaveCount(await page.locator('.shape-outline.rectangle').count());
  await expect(page.locator('.pattern-layer.stack .shape-outline')).toHaveCount(await page.locator('.shape-outline.stack').count());
  const style = await page.locator('.shape-outline.stack').first().evaluate(node => {
    const computed = getComputedStyle(node);
    return { width: computed.strokeWidth, dash: computed.strokeDasharray, opacity: computed.opacity };
  });
  expect(style).toEqual({ width: '5.5px', dash: 'none', opacity: '1' });
  await expect(page.locator('.shape-outline.rectangle').first()).toHaveCSS('stroke-width', '5.5px');
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
  await page.getByRole('button',{name:'Both',exact:true}).click();
  const note = page.locator('[data-note-id="1:5"]');
  await note.click();
  await expect(note).toHaveAttribute('aria-pressed','true');
  await note.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-note-id="1:6"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.marks-list button')).toHaveCount(2);
  await page.getByRole('button',{name:'Focus',exact:true}).click();
  await page.getByRole('button',{name:'Include string 1',exact:true}).click();
  await expect(page.locator('[data-note-id="1:8"]')).toHaveAttribute('data-visible','false');
  await page.getByRole('button',{name:'Clear focus',exact:true}).click();
  await expect(page.locator('[data-note-id="1:8"]')).toHaveAttribute('data-visible','true');
  await page.locator('.display-settings summary').click();
  await page.getByLabel('Left-handed',{exact:true}).check();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness','left');
  await page.locator('#frets').selectOption('24');
  await page.getByLabel('String names',{exact:true}).check();
  await page.getByLabel('Other notes',{exact:true}).check();
  await page.getByLabel('Chord-tone colors',{exact:true}).check();
  expect(await page.locator('.note-node.third').count()).toBeGreaterThan(0);
  expect(await page.locator('.note-node.fifth').count()).toBeGreaterThan(0);
  await expect(page.getByText('Third',{exact:true})).toBeVisible();
  await expect(page.getByText('Fifth',{exact:true})).toBeVisible();
  await page.locator('#spelling').selectOption('flats');
  await page.getByRole('button',{name:'Reset display & focus',exact:true}).click();
  await expect(page.locator('.marks-list button')).toHaveCount(2);
  await expect(page.locator('.row-toggles button[aria-pressed="true"]')).toHaveCount(6);
  await page.locator('.display-settings summary').click();
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
    await expect(page.getByRole('button',{name:'Share view',exact:true})).toBeVisible();
    const region = page.locator('.board-scroll');
    expect(await region.evaluate(el=>el.scrollWidth>el.clientWidth)).toBeTruthy();
    for (const name of ['In position','Shape','Diagonal','All patterns']) {
      await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
    }
    for (const name of ['Whole map','Skeleton','Warp']) await expect(page.getByLabel(name,{exact:true})).toBeVisible();
    await page.locator('.display-settings summary').click();
    expect(await page.locator('.settings-panel').evaluate(el=>{const b=el.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth;})).toBeTruthy();
  }
});

test('old saved views migrate and pattern outlines and shift arrow mirror correctly', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('fret-atlas-v2',JSON.stringify({version:2,root:9,scaleId:'minor',lens:'shape',kind:'rectangle',shapeId:'rectangle:2:5',wholeMap:false,marks:['6:5']})));
  await page.goto('/');
  await expect(page.locator('#scale')).toHaveValue('minor');
  expect(await page.locator('.shape-outline.rectangle').count()).toBeGreaterThan(1);
  await expect(page.locator('.shape-outline.stack')).toHaveCount(0);
  await expect(page.locator('.marks-list button')).toHaveCount(1);
  await page.getByLabel('Whole map',{exact:true}).check();
  await expect(page.locator('[data-note-id="3:2"]')).toHaveAttribute('data-visible','true');
  const positions=await page.locator('.shape-outline').evaluateAll(nodes=>nodes.map(node=>{
    const box=(node as SVGPathElement).getBBox();
    return {id:node.getAttribute('data-shape-id'),x:box.x,y:box.y,width:box.width,height:box.height};
  }));
  const width=await page.locator('.fretboard').evaluate(n=>(n as SVGSVGElement).viewBox.baseVal.width);
  await page.locator('.display-settings summary').click();
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
  await page.locator('.display-settings summary').click();
  await page.getByLabel('Warp',{exact:true}).uncheck();
  await expect(page.locator('.warp-guide')).toHaveCount(0);
  expect(await page.locator('.shape-outline').count()).toBe(positions.length);
});

test('triad highlighting is independent, optional, persistent, and available with custom notes', async ({page})=>{
  await page.goto('/');
  const triad=page.getByRole('group',{name:'Triad highlight',exact:true});
  await expect(triad.getByRole('button',{name:'Off',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#scale option[value$="-triad"]')).toHaveCount(0);
  const scale=await page.locator('#scale').inputValue();
  const patterns=await page.locator('.shape-outline').count();
  await triad.getByRole('button',{name:'Major',exact:true}).click();
  await expect(page.locator('#scale')).toHaveValue(scale);
  await expect(page.locator('.shape-outline')).toHaveCount(patterns);
  const added=page.locator('[data-note-id="1:9"]');
  await expect(added).toHaveAttribute('data-triad','true');
  await expect(added).toHaveAttribute('data-visible','true');
  await added.click();
  await expect(added.locator('.triad-halo')).toHaveCount(1);
  await expect(added).toHaveAttribute('aria-pressed','true');
  await page.locator('#triad-root').selectOption('0');
  await page.reload();
  await expect(page.locator('#triad-root')).toHaveValue('0');
  await expect(page.locator('.triad-legend')).toHaveText('C major triad');
  await page.getByRole('button',{name:'Customize notes',exact:true}).click();
  const custom=await page.locator('.tone-chip[aria-pressed="true"]').count();
  await triad.getByRole('button',{name:'Minor',exact:true}).click();
  await expect(page.locator('.tone-chip[aria-pressed="true"]')).toHaveCount(custom);
  await page.locator('#root').selectOption('2');
  await expect(page.locator('.triad-legend')).toHaveText('C minor triad');
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await expect(page.locator('#triad-root')).toBeVisible();
  }
  await triad.getByRole('button',{name:'Off',exact:true}).click();
  await expect(page.locator('.triad-halo')).toHaveCount(0);
  await expect(page.locator('.marks-list button')).toHaveCount(1);
});
