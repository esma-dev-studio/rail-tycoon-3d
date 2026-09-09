import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = process.env.RAIL_TEST_NODE_MODULES ? require(process.env.RAIL_TEST_NODE_MODULES + '/playwright') : require('playwright');
const browser = await chromium.launch({ headless: true, channel: 'msedge', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: {width:1440,height:900}, deviceScaleFactor:1 });
const page = await context.newPage();
page.setDefaultTimeout(60000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir('artifacts',{recursive:true});
try {
  await page.goto('http://127.0.0.1:5182/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('canvas')?.width > 100);
  await page.getByRole('heading',{name:'つなげよう、次の町へ。'}).waitFor();
  await page.screenshot({path:'artifacts/railway-desktop-start.png',fullPage:true});
  await page.locator('.town-picker button').filter({hasText:'みどり町'}).click();
  await page.locator('.town-picker button').filter({hasText:'まんなか町'}).click();
  await page.getByRole('button',{name:/つくって しゅっぱつ/}).click();
  await page.getByRole('button',{name:/ごほうびを うけとる/}).click();
  await page.locator('.notebook-tabs button').filter({hasText:'町づくり'}).click();
  await page.getByRole('button',{name:/つくりはじめる/}).click();
  await page.evaluate(async()=>{
    const {useGameStore:store}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/store/gameStore.ts').name);
    const {sim}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/sim/simInstance.ts').name);
    const {stepTrains,spawnPassengers}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/sim/simulation.ts').name);
    const {townAttraction}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/data/development.ts').name);
    for(let i=0;i<4000;i++){
      const s=store.getState();
      spawnPassengers(sim,.05,s.lines,()=>.2,s.towns,id=>townAttraction(id,s.projects));
      stepTrains(sim,.05,s.lines,(fare,town,p)=>store.getState().deliver(fare,town,p));
    }
    store.getState().setSpeed(0);
  });
  // Deterministic arrivals can all target the opposite town; explicitly finish this test project.
  await page.evaluate(async()=>{
    const {useGameStore:store}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/store/gameStore.ts').name);
    for(let i=0;i<8;i++)store.getState().deliver(100,'t_midori');
  });
  await page.getByRole('button',{name:/かんせいさせる/}).click();
  await page.locator('.town-chips button').filter({hasText:'こもれび'}).waitFor();
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('.notebook-tabs button').filter({hasText:'町づくり'}).click();
  await page.getByText('あそびに 来る人が ふえたよ！',{exact:true}).waitFor();
  await page.screenshot({path:'artifacts/railway-desktop-project.png',fullPage:true});
  // A developed, representative town for visual QA; isolated browser storage only.
  await page.evaluate(async()=>{
    const {useGameStore:store}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/store/gameStore.ts').name);
    const {TOWN_PROJECTS}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/data/development.ts').name);
    store.setState({money:200000,missionIndex:6,gameCleared:false});
    for(const p of TOWN_PROJECTS){
      if(!store.getState().towns.some(t=>t.id===p.townId))continue;
      if(!store.getState().lines.some(l=>l.stations.includes(p.townId))){
        store.getState().setBuildMode('route');
        store.getState().townClick('t_chuo');
        store.getState().townClick(p.townId);
        store.getState().confirmEasyRoute();
      }
      store.getState().startProject(p.id);
      for(let i=0;i<25;i++)store.getState().deliver(100,p.townId);
      store.getState().completeProject(p.id);
    }
    store.getState().upgradeLineCapacity(store.getState().lines[0].id);
    store.getState().dismissCelebration();store.getState().clearToast();
    store.getState().setSpeed(0);
    store.getState().select({type:'town',id:'t_minato'});
  });
  await page.screenshot({path:'artifacts/railway-desktop-developed.png',fullPage:true});
  await page.locator('.notebook-tabs button').filter({hasText:'手帳'}).click();
  await page.screenshot({path:'artifacts/railway-desktop-journal.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'artifacts/railway-mobile-developed.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'mobile has no horizontal overflow');
  await page.getByRole('button',{name:'せってい',exact:true}).click();
  await page.getByRole('button',{name:'はじめから あそびなおす',exact:true}).click();
  await page.getByRole('button',{name:'やめる',exact:true}).click();
  await page.getByRole('button',{name:'とじる',exact:true}).click();
  await page.getByRole('button',{name:'あそびかた',exact:true}).click();
  assert.ok(await page.getByRole('dialog').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.evaluate(async()=>{const {useGameStore}=await import(performance.getEntriesByType('resource').find(e => new URL(e.name).pathname === '/src/store/gameStore.ts').name);useGameStore.getState().reset();});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'artifacts/railway-mobile-start.png',fullPage:true});
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('browser verification passed: real route purchase, manual reward, construction completion, reload, journal, mobile layout, dialogs, reset, zero runtime errors');
} catch(error) { await page.screenshot({path:'artifacts/railway-failure.png',fullPage:true}); console.error(await page.evaluate(()=>({url:location.href,saved:JSON.parse(localStorage.getItem('rail-tycoon-3d-save-v2')||'null')}))); throw error; } finally {await context.close();await browser.close();}
