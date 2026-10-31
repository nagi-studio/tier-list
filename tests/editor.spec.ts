import type {Page, BrowserContext, Locator} from '@playwright/test';
import sharp from 'sharp';
import jsQR from 'jsqr';
import {must} from './helpers';
import {boardSchema} from '../src/lib/board';
import {test,expect} from '@playwright/test';
const state=async(page: Page)=>boardSchema.parse(await page.evaluate((): unknown=>JSON.parse(localStorage.getItem('tier-studio-v1') ?? 'null')));
// Keep tests deterministic: no real Toy SDK (it needs a Bilibili login). Tests that need one stub it.
const noSdk=(ctx: BrowserContext)=>ctx.route('**/toy-sdk.js',r=>r.abort());
test.beforeEach(async({page})=>{await noSdk(page.context());await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('desktop: drag across tiers, edit, undo, templates, persistence and exports',async({page})=>{
 const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.getByRole('textbox',{name:'榜单标题'})).toBeVisible();
 const before=await state(page);const first=must(before.pool[0]);
 const handle=page.locator(`[data-item-id="${first.id}"] .drag-handle`);const target=page.locator(`[data-container="${must(before.rows[0]).id}"]`);
 const h=must(await handle.boundingBox()),t=must(await target.boundingBox());await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+12,h.y-12,{steps:3});await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:30});await page.mouse.up();
 await expect.poll(async()=>must((await state(page)).rows[0]).items.length).toBe(1);
 await page.getByRole('button',{name:'撤销',exact:true}).click();await expect.poll(async()=>(await state(page)).pool.length).toBe(before.pool.length);
 await page.getByRole('button',{name:'自定义选手',exact:true}).click();await page.getByRole('textbox',{name:'名称',exact:true}).fill('自定义选手测试');await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:must(before.rows[1]).label,exact:true}).click();await page.getByRole('button',{name:'添加选手',exact:true}).click();await expect.poll(async()=>must(must((await state(page)).rows[1]).items[0])?.name).toBe('自定义选手测试');
 await page.getByRole('radio',{name:'从夯到拉'}).click();await expect(page.locator('.tier-label').first()).toHaveText('夯');await expect(page.locator('.tier-label')).toHaveCount(5);
 await page.reload();await expect(page.locator('.tier-label').first()).toHaveText('夯');await expect(page.getByRole('button',{name:'编辑 自定义选手测试',exact:true})).toBeVisible();
 const json=page.waitForEvent('download');await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitem',{name:'保存 JSON'}).click();const jf=await json;expect(jf.suggestedFilename()).toBe('tier-studio.json');await jf.saveAs('artifacts/tier-studio-export.json');
 await page.getByRole('button',{name:`编辑 ${first.name}`,exact:true}).click();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:must((await state(page)).rows[0]).label,exact:true}).click();await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.locator('.tier-board .brand-avatar')).toHaveCount(1);
 const png=page.waitForEvent('download');await page.getByRole('button',{name:'导出图片',exact:true}).click();const pf=await png;expect(pf.suggestedFilename()).toMatch(/\.png$/);await pf.saveAs('artifacts/tier-studio-export.png');
 await page.screenshot({path:'artifacts/tier-studio-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
test('mobile: no horizontal overflow, catalog search, edit and real touch drag',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await noSdk(context);const page=await context.newPage();await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'打开选手库'}).tap();await page.getByRole('textbox',{name:'搜索模型或厂商'}).fill('deepseek');await expect(page.locator('.catalog-item').first()).toBeVisible();await page.getByRole('button',{name:'关闭选手库'}).tap();
 const s=await state(page),item=must(s.pool[0]);await page.locator(`[data-item-id="${item.id}"] .tile-main`).tap();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:must(s.rows[3]).label,exact:true}).tap();await page.getByRole('button',{name:'保存',exact:true}).tap();
 await page.locator(`[data-item-id="${item.id}"]`).evaluate(el=>el.scrollIntoView({block:'center'}));const h=must(await page.locator(`[data-item-id="${item.id}"] .tile-main`).boundingBox()),target=must(await page.locator(`[data-container="${must(s.rows[2]).id}"]`).boundingBox());
 const cdp=await context.newCDPSession(page);const x=h.x+h.width/2,y=h.y+h.height/2,tx=target.x+target.width/2,ty=target.y+target.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(250);
 for(let i=1;i<=20;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/20,y:y+(ty-y)*i/20}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(async()=>must((await state(page)).rows[2]).items.some(i=>i.id===item.id)).toBe(true);
 await expect(page.locator('.overlay')).toHaveCount(0);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/tier-studio-mobile.png',fullPage:true});await context.close();
});
test('row editing, item preservation, custom image and JSON import',async({page})=>{
 const s=await state(page);
 await page.getByRole('button',{name:'编辑等级 S+',exact:true}).click();await page.getByRole('textbox',{name:'等级名称'}).fill('超级喜欢');await page.getByRole('button',{name:'保存修改'}).click();
 await page.getByRole('button',{name:'自定义选手',exact:true}).click();await page.getByRole('textbox',{name:'名称',exact:true}).fill('图片选手');
 const png=await page.locator('.wordmark').screenshot();
 await page.getByRole('tab',{name:'上传图片'}).click();await page.locator('[role="dialog"] input[type=file]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:png});
 await expect(page.locator('.dropzone img')).toBeVisible();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:'超级喜欢',exact:true}).click();await page.getByRole('button',{name:'添加选手',exact:true}).click();
 await expect.poll(async()=>must(must((await state(page)).rows[0]).items[0])?.image?.startsWith('data:image/png')).toBe(true);
 await page.getByRole('button',{name:'编辑等级 超级喜欢',exact:true}).click();await page.getByRole('button',{name:'删除等级',exact:true}).click();await expect.poll(async()=>(await state(page)).pool.some(i=>i.name==='图片选手')).toBe(true);
 const restored=await state(page);restored.title='导入的榜单';
 await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles({name:'board.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restored))});await page.getByRole('button',{name:'导入榜单',exact:true}).click();await expect(page.getByRole('textbox',{name:'榜单标题'})).toHaveValue('导入的榜单');
 await page.getByRole('button',{name:'切换明暗主题'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('tiers can be dragged as a whole; clicking a tier still edits it',async({page})=>{
 const before=await state(page);const label=page.getByRole('button',{name:'编辑等级 S+',exact:true});const target=page.getByRole('button',{name:'编辑等级 B',exact:true});
 const l=must(await label.boundingBox()),t=must(await target.boundingBox());await page.mouse.move(l.x+l.width/2,l.y+l.height/2);await page.mouse.down();await page.mouse.move(l.x+l.width/2,l.y+l.height/2+12,{steps:3});await page.mouse.move(t.x+t.width/2,t.y+t.height/2+10,{steps:25});await page.mouse.up();
 await expect.poll(async()=>(await state(page)).rows.map(r=>r.label).join(',')).toBe('S,A,B,S+,C,D');
 expect(must((await state(page)).rows[3]).id).toBe(must(before.rows[0]).id);
 await page.getByRole('button',{name:'撤销',exact:true}).click();await expect.poll(async()=>must((await state(page)).rows[0]).label).toBe('S+');
 await page.getByRole('button',{name:'编辑等级 A',exact:true}).click();await expect(page.getByRole('textbox',{name:'等级名称'})).toHaveValue('A');
});
test('right-click menus and the trash',async({page})=>{
 const s=await state(page),first=must(s.pool[0]),second=must(s.pool[1]);
 // Tile menu: move to tier A
 await page.locator(`[data-item-id="${first.id}"] .tile-main`).click({button:'right'});await page.getByRole('menuitem',{name:'移到'}).hover();await page.getByRole('menuitem',{name:'A',exact:true}).click();
 await expect.poll(async()=>must(must((await state(page)).rows[2]).items[0])?.id).toBe(first.id);
 // Row menu: delete tier A sends its items to the pool
 await page.getByRole('button',{name:'编辑等级 A',exact:true}).click({button:'right'});await page.getByRole('menuitem',{name:'删除这一级'}).click();
 await expect.poll(async()=>(await state(page)).rows.map(r=>r.label).join(',')).toBe('S+,S,B,C,D');
 expect((await state(page)).pool.some(i=>i.id===first.id)).toBe(true);
 // Drag a tile into the trash, then undo from the toast
 const dragTo=async(from: Locator,getTarget: ()=>Locator)=>{const h=must(await from.boundingBox());await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+h.width/2+10,h.y+h.height/2+10,{steps:3});await expect(page.locator('.trash.visible')).toBeVisible();const t=must(await getTarget().boundingBox());await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:20});await expect(page.locator('.trash.over')).toBeVisible();await page.mouse.up();};
 await dragTo(page.locator(`[data-item-id="${second.id}"] .drag-handle`),()=>page.locator('.trash'));
 await expect.poll(async()=>(await state(page)).pool.some(i=>i.id===second.id)).toBe(false);
 await page.getByRole('button',{name:'撤销'}).last().click();
 await expect.poll(async()=>(await state(page)).pool.some(i=>i.id===second.id)).toBe(true);
 // Drag a whole tier into the trash
 await dragTo(page.getByRole('button',{name:'编辑等级 D',exact:true}),()=>page.locator('.trash'));
 await expect.poll(async()=>(await state(page)).rows.map(r=>r.label).join(',')).toBe('S+,S,B,C');
});
test('community template with logos, then share link round-trip',async({page,browser})=>{
 await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitem',{name:'模板中心…'}).click();
 await page.getByRole('button',{name:/编程语言排位/}).click();
 await expect.poll(async()=>(await state(page)).title).toBe('编程语言排位');
 const s=await state(page);expect(s.pool.length).toBe(16);expect(must(s.pool[0]).asset).toMatch(/^community\/programming-languages\/[a-f0-9]{12}\.webp$/);
 await expect.poll(()=>page.locator('.pool .tile img').first().evaluate(img=>img instanceof HTMLImageElement && img.complete&&img.naturalWidth)).toBe(128);
 await page.getByRole('button',{name:'编辑 Rust',exact:true}).click();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:'S+',exact:true}).click();await page.getByRole('button',{name:'保存',exact:true}).click();
 await page.getByRole('button',{name:'分享',exact:true}).click();await page.getByRole('button',{name:'生成分享链接'}).click();
 const url=await page.getByRole('textbox',{name:'分享链接'}).inputValue();expect(url).toMatch(/index\.html\?t=z/);
 const other=await page.context().newPage();await other.goto(url);await other.getByRole('button',{name:'打开',exact:true}).click();
 await expect.poll(async()=>must(must((await state(other)).rows[0]).items[0])?.name).toBe('Rust');
 expect(new URL(other.url()).searchParams.has('t')).toBe(false);
 await expect(other.locator('.tier-board .tile img').first()).toBeVisible();await other.close();
});
test('sharing is blocked when the platform content check rejects the text',async({page})=>{
 const fake=`window.toy={isSupport:async a=>a==='checkInputSafety',checkInputSafety:async({text})=>text.includes('违规')?{passed:false,status:'rejected'}:{passed:true,status:'ok'}};`;
 await page.context().unroute('**/toy-sdk.js');await page.context().route('**/toy-sdk.js',r=>r.fulfill({contentType:'text/javascript',body:fake}));await page.reload();
 await page.getByRole('textbox',{name:'榜单标题'}).fill('违规标题');
 await page.getByRole('button',{name:'分享',exact:true}).click();await page.getByRole('button',{name:'生成分享链接'}).click();
 await expect(page.getByText('不能公开的内容')).toBeVisible();await expect(page.getByRole('textbox',{name:'分享链接'})).toHaveCount(0);
 await page.getByRole('button',{name:'关闭'}).click();await page.getByRole('textbox',{name:'榜单标题'}).fill('正常标题');
 await page.getByRole('button',{name:'分享',exact:true}).click();await page.getByRole('button',{name:'生成分享链接'}).click();
 await expect(page.getByRole('textbox',{name:'分享链接'})).toBeVisible();
});
test('template credit, follow link, export QR code and ?tpl= deep link',async({page})=>{
 const decodeQr=async(file:string)=>{const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});return jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data;};
 await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitem',{name:'模板中心…'}).click();
 await expect(page.locator('.template-author').first()).toContainText('卡普迪姆');
 await page.getByRole('button',{name:/编程语言排位/}).click();
 await expect(page.locator('.credit-bar')).toContainText('模板来自 @卡普迪姆');
 await expect(page.locator('.credit-bar .follow-btn')).toHaveAttribute('href','https://space.bilibili.com/312249633');
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'导出图片'}).click();const file='/tmp/tier-list-credit.png';await (await dl).saveAs(file);
 expect(await decodeQr(file)).toBe('https://www.bilibili.com/toy/tier-list/?tpl=programming-languages');
 await expect(page.locator('.qr')).toBeHidden(); // QR only exists in the export
 // Turning the QR off removes it from exports
 await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitemcheckbox',{name:'导出图片带二维码'}).click();await page.keyboard.press('Escape');
 const dl2=page.waitForEvent('download');await page.getByRole('button',{name:'导出图片'}).click();await (await dl2).saveAs('/tmp/tier-list-noqr.png');
 expect(await decodeQr('/tmp/tier-list-noqr.png')).toBeUndefined();
 // Scanning the code lands on the same template, with credit
 await page.goto('/?tpl=drinks');await page.getByRole('button',{name:'打开',exact:true}).click();
 await expect.poll(async()=>(await state(page)).title).toBe('今天喝什么');
 expect((await state(page)).credit?.bilibili).toBe('312249633');
 expect(new URL(page.url()).searchParams.has('tpl')).toBe(false);
});
test('the Toy author is followable and credited on the built-in AI template',async({page})=>{
 await expect(page.locator('.toy-author .follow-btn')).toHaveAttribute('href','https://space.bilibili.com/312249633');
 expect((await state(page)).credit).toEqual({template:'ai-models',author:'卡普迪姆',bilibili:'312249633'});
 await expect(page.locator('.credit-bar')).toContainText('模板来自 @卡普迪姆');
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'导出图片'}).click();const file='/tmp/tier-list-ai.png';await (await dl).saveAs(file);
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 expect(jsQR(new Uint8ClampedArray(data),info.width,info.height)?.data).toBe('https://www.bilibili.com/toy/tier-list/?tpl=ai-models');
 expect(info.width).toBe(1080);
 // A blank board drops the credit; the AI deep link brings it back
 await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitem',{name:'模板中心…'}).click();await page.getByRole('button',{name:/空白/}).click();
 expect((await state(page)).credit).toBeUndefined();
 await page.goto('/?tpl=ai-models');await page.getByRole('button',{name:'打开',exact:true}).click();
 await expect.poll(async()=>(await state(page)).credit?.template).toBe('ai-models');
 expect((await state(page)).pool.length).toBeGreaterThan(5);
});
test('tiles never scale while another tile is dragged over them',async({page})=>{
 // Put a very short and a very long name side by side, then drag the short one across the long one.
 await page.goto('/?tpl=programming-languages');await page.getByRole('button',{name:'打开',exact:true}).click();
 await expect.poll(async()=>(await state(page)).pool.length).toBe(16);
 const s=await state(page),short=must(s.pool.find(i=>i.name==='C')),long=must(s.pool.find(i=>i.name==='JavaScript'));
 const h=must(await page.locator(`[data-item-id="${short.id}"] .drag-handle`).boundingBox()),t=must(await page.locator(`[data-item-id="${long.id}"]`).boundingBox());
 await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+10,h.y+10,{steps:3});
 const scales:number[]=[];
 for(let i=1;i<=12;i++){await page.mouse.move(h.x+(t.x+t.width/2-h.x)*i/12,h.y+(t.y+t.height/2-h.y)*i/12);
  scales.push(...await page.locator('.pool .tile:not(.dragging)').evaluateAll(els=>els.map(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return Math.max(Math.abs(m.a-1),Math.abs(m.d-1));})));}
 await page.mouse.up();
 expect(Math.max(...scales)).toBe(0);
});
test('random drags across tiers never crash the page (tile ping-pong between containers)',async({page})=>{
 // Seed 1 crashed on its 4th drag before the settle guard in Board: a tile moved between two tiers in a
 // loop within one frame until React threw "Maximum update depth exceeded" and the page went blank.
 test.setTimeout(120_000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=0;i<30;i++){
  const tiles=await page.locator('.tile').all();const src=must(tiles[Math.floor(rnd()*tiles.length)]);const sb=await src.boundingBox({timeout:1000}).catch(()=>null);
  const targets=await page.locator('.tile, .tier-items, .pool-items, .tier-label').all();const tb=await must(targets[Math.floor(rnd()*targets.length)]).boundingBox({timeout:1000}).catch(()=>null);
  if(!sb||!tb)continue;
  await page.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2);await page.mouse.down();await page.mouse.move(sb.x+sb.width/2+8,sb.y+sb.height/2+8,{steps:2});
  const steps=5+Math.floor(rnd()*15);
  for(let k=1;k<=steps;k++)await page.mouse.move(sb.x+(tb.x+tb.width*rnd()-sb.x)*k/steps,sb.y+(tb.y+tb.height*rnd()-sb.y)*k/steps);
  await page.mouse.up();
 }
 expect(errors).toEqual([]);
 await expect(page.locator('.app-shell')).toBeVisible();
 expect(new Set((await state(page)).rows.flatMap(r=>r.items).concat((await state(page)).pool).map(i=>i.id)).size).toBe(14);
});
