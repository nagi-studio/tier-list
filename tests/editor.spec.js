import {test,expect} from '@playwright/test';
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('tier-studio-v1')));
test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();});
test('desktop: drag across tiers, edit, undo, templates, persistence and exports',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await expect(page.getByRole('textbox',{name:'榜单标题'})).toBeVisible();
 const before=await state(page);const first=before.pool[0];
 const handle=page.locator(`[data-item-id="${first.id}"] .drag-handle`);const target=page.locator(`[data-container="${before.rows[0].id}"]`);
 const h=await handle.boundingBox(),t=await target.boundingBox();await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+12,h.y-12,{steps:3});await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:30});await page.mouse.up();
 await expect.poll(async()=>(await state(page)).rows[0].items.length).toBe(1);
 await page.getByRole('button',{name:'撤销',exact:true}).click();await expect.poll(async()=>(await state(page)).pool.length).toBe(before.pool.length);
 await page.getByRole('button',{name:'自定义选手',exact:true}).click();await page.getByRole('textbox',{name:'名称',exact:true}).fill('自定义选手测试');await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:before.rows[1].label,exact:true}).click();await page.getByRole('button',{name:'添加选手',exact:true}).click();await expect.poll(async()=>(await state(page)).rows[1].items[0]?.name).toBe('自定义选手测试');
 await page.getByRole('radio',{name:'从夯到拉'}).click();await expect(page.locator('.tier-label').first()).toHaveText('夯');await expect(page.locator('.tier-label')).toHaveCount(5);
 await page.reload();await expect(page.locator('.tier-label').first()).toHaveText('夯');await expect(page.getByRole('button',{name:'编辑 自定义选手测试',exact:true})).toBeVisible();
 const json=page.waitForEvent('download');await page.getByRole('button',{name:'更多操作'}).click();await page.getByRole('menuitem',{name:'保存 JSON'}).click();const jf=await json;expect(jf.suggestedFilename()).toBe('tier-studio.json');await jf.saveAs('/tmp/tier-studio-export.json');
 await page.getByRole('button',{name:`编辑 ${first.name}`,exact:true}).click();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:(await state(page)).rows[0].label,exact:true}).click();await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.locator('.tier-board .brand-avatar')).toHaveCount(1);
 const png=page.waitForEvent('download');await page.getByRole('button',{name:'导出图片',exact:true}).click();const pf=await png;expect(pf.suggestedFilename()).toMatch(/\.png$/);await pf.saveAs('/tmp/tier-studio-export.png');
 await page.screenshot({path:'/tmp/tier-studio-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
test('mobile: no horizontal overflow, catalog search, edit and real touch drag',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const page=await context.newPage();await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'打开选手库'}).tap();await page.getByRole('textbox',{name:'搜索模型或厂商'}).fill('deepseek');await expect(page.locator('.catalog-item').first()).toBeVisible();await page.getByRole('button',{name:'关闭选手库'}).tap();
 const s=await state(page),item=s.pool[0];await page.locator(`[data-item-id="${item.id}"] .tile-main`).tap();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:s.rows[3].label,exact:true}).tap();await page.getByRole('button',{name:'保存',exact:true}).tap();
 await page.locator(`[data-item-id="${item.id}"]`).evaluate(el=>el.scrollIntoView({block:'center'}));const h=await page.locator(`[data-item-id="${item.id}"] .tile-main`).boundingBox(),target=await page.locator(`[data-container="${s.rows[2].id}"]`).boundingBox();
 const cdp=await context.newCDPSession(page);const x=h.x+h.width/2,y=h.y+h.height/2,tx=target.x+target.width/2,ty=target.y+target.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(250);
 for(let i=1;i<=20;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/20,y:y+(ty-y)*i/20}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(async()=>(await state(page)).rows[2].items.some(i=>i.id===item.id)).toBe(true);
 await expect(page.locator('.overlay')).toHaveCount(0);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/tier-studio-mobile.png',fullPage:true});await context.close();
});
test('row editing, item preservation, custom image and JSON import',async({page})=>{
 const s=await state(page);
 await page.getByRole('button',{name:'编辑等级 S+',exact:true}).click();await page.getByRole('textbox',{name:'等级名称'}).fill('超级喜欢');await page.getByRole('button',{name:'保存修改'}).click();
 await page.getByRole('button',{name:'自定义选手',exact:true}).click();await page.getByRole('textbox',{name:'名称',exact:true}).fill('图片选手');
 const png=await page.locator('.wordmark').screenshot();
 await page.getByRole('tab',{name:'上传图片'}).click();await page.locator('[role="dialog"] input[type=file]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:png});
 await expect(page.locator('.dropzone img')).toBeVisible();await page.getByRole('radiogroup',{name:'放到哪里'}).getByRole('radio',{name:'超级喜欢',exact:true}).click();await page.getByRole('button',{name:'添加选手',exact:true}).click();
 await expect.poll(async()=>(await state(page)).rows[0].items[0]?.image?.startsWith('data:image/png')).toBe(true);
 await page.getByRole('button',{name:'编辑等级 超级喜欢',exact:true}).click();await page.getByRole('button',{name:'删除等级',exact:true}).click();await expect.poll(async()=>(await state(page)).pool.some(i=>i.name==='图片选手')).toBe(true);
 const restored=await state(page);restored.title='导入的榜单';
 await page.locator('input[type=file][accept="application/json,.json"]').setInputFiles({name:'board.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restored))});await page.getByRole('button',{name:'导入榜单',exact:true}).click();await expect(page.getByRole('textbox',{name:'榜单标题'})).toHaveValue('导入的榜单');
 await page.getByRole('button',{name:'切换明暗主题'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
