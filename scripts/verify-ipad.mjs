import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.RAIL_TEST_NODE_MODULES?require(process.env.RAIL_TEST_NODE_MODULES+'/playwright'):require('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage();page.setDefaultTimeout(45000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('artifacts',{recursive:true});
const state=async(body)=>page.evaluate(async(body)=>{const entry=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/store/gameStore.ts');const {useGameStore:store}=await import(entry.name);return Function('store',body)(store);},body);
const drive=async(waves=0)=>page.evaluate(async(waves)=>{
 const load=async(path)=>import(performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===path).name);
 const {useGameStore:store}=await load('/src/store/gameStore.ts');const {sim}=await load('/src/sim/simInstance.ts');const {stepTrains}=await load('/src/sim/simulation.ts');
 for(let wave=0;wave<=waves;wave++){if(waves)store.getState().inviteVisitors('t_midori');for(let i=0;i<1500;i++)stepTrains(sim,.05,store.getState().lines,(fare,t,p)=>store.getState().deliver(fare,t,p));}
},waves);
try{
 await page.goto('http://127.0.0.1:5182/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-town-id="t_midori"]').waitFor();
 assert.equal(await page.locator('[data-town-id]').count(),2);
 await page.screenshot({path:'artifacts/ipad-landscape-start.png'});
 const a=await page.locator('[data-town-id="t_midori"]').boundingBox(),b=await page.locator('[data-town-id="t_chuo"]').boundingBox();
 assert.ok(a.width>=44&&a.height>=44,'large touch target');
 const cdp=await context.newCDPSession(page);
 const x=a.x+a.width/2,y=a.y+a.height/2,x2=b.x+b.width/2,y2=b.y+b.height/2;
 await page.locator('[data-town-id="t_midori"]').focus();await page.keyboard.press('Enter');
 await page.locator('[data-town-id="t_chuo"]').focus();await page.keyboard.press('Enter');
 assert.equal(await state('return store.getState().routeEndTown;'),'t_chuo','keyboard selection');
 await page.getByRole('button',{name:'えらびなおす',exact:true}).tap();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+40,y:y+80,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.deepEqual(await state('return {a:store.getState().routeStartTown,b:store.getState().routeEndTown,money:store.getState().money};'),{a:null,b:null,money:10000},'drawing outside a station cancels safely');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(x2-x)*i/12,y:y+(y2-y)*i/12,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.deepEqual(await state('return {a:store.getState().routeStartTown,b:store.getState().routeEndTown,money:store.getState().money};'),{a:'t_midori',b:'t_chuo',money:10000},'drawing previews without charging');
 await page.screenshot({path:'artifacts/ipad-landscape-route.png'});
 await page.getByRole('button',{name:/しゅっぱつ！/}).tap();
 await page.getByRole('button',{name:'うけとる！',exact:true}).tap();
 await state('store.getState().setSpeed(0);');await drive();
 await page.locator('.arrival-result').waitFor();
 assert.equal(await page.locator('.play-world .arrival-receipt').count(),0,'arrival feedback leaves map unobstructed');
 await page.screenshot({path:'artifacts/ipad-arrival.png'});
 await page.getByRole('button',{name:'うけとる！',exact:true}).tap();
 await page.waitForFunction(()=>document.querySelectorAll('[data-town-id]').length===5);
 await page.getByRole('button',{name:'町をそだてる',exact:true}).tap();
 await page.getByRole('button',{name:/^つくる\s/}).tap();
 await page.getByRole('button',{name:'おきゃくさんを よぶ',exact:true}).tap();
 await page.screenshot({path:'artifacts/ipad-landscape-dream.png'});
 await drive(3);
 await page.getByRole('button',{name:/かんせい！ ＋/}).tap();
 assert.equal(await state('return store.getState().towns.length;'),6);
 await page.getByRole('button',{name:'うけとる！',exact:true}).tap();
 await page.reload({waitUntil:'domcontentloaded'});
 assert.equal(await state('return store.getState().towns.length;'),6);
 await page.getByRole('button',{name:'町をそだてる',exact:true}).tap();
 for(const viewport of [{width:1180,height:820},{width:820,height:1180},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),'fits viewport '+JSON.stringify(viewport));
  await page.screenshot({path:`artifacts/ipad-${viewport.width}x${viewport.height}.png`});
 }
 await page.setViewportSize({width:1024,height:768});
 await page.getByRole('button',{name:'たびのアルバム',exact:true}).tap();
 await page.getByRole('dialog').waitFor();
 assert.equal(await state('return store.getState().speed;'),0);
 await page.screenshot({path:'artifacts/ipad-album.png'});
 await page.getByRole('button',{name:'とじる',exact:true}).tap();
 await page.getByRole('button',{name:'あそびかた',exact:true}).tap();
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await state('return import("/src/data/world.ts").then(({ALL_TOWNS})=>store.setState({towns:ALL_TOWNS,missionIndex:15}));');
 await page.waitForFunction(()=>document.querySelectorAll('[data-town-id]').length===8);
 for(const viewport of [{width:1024,height:768},{width:768,height:1024}]){
  await page.setViewportSize(viewport);
  await page.getByRole('button',{name:'地図をもとにもどす',exact:true}).tap();
  await page.screenshot({path:`artifacts/ipad-all-stations-${viewport.width}.png`});
  const obstructed=await page.locator('[data-town-id]').evaluateAll(nodes=>nodes.filter(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-town-id]')!==n;}).map(n=>n.textContent));
  assert.deepEqual(obstructed,[],'all eight station targets can be touched');
 }
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('iPad verification passed: touch drawing, purchase guards, tutorial expansion, invited passengers, completion, saves, four viewports, dialogs and zero runtime errors');
}catch(e){await page.screenshot({path:'artifacts/ipad-failure.png',fullPage:true});throw e;}finally{await browser.close();}
