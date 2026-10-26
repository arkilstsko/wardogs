import {test,expect} from '@playwright/test';
test('title, setup, keyboard country, save/load restoration and complete eight-round autoplay game',async({page})=>{
 test.setTimeout(180000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/MERCHANTS/})).toBeVisible();
 await page.screenshot({path:'docs/production/title-1366.png'});
 await page.getByRole('button',{name:'Take your seat'}).click();await page.getByLabel('Play mode').selectOption('local');await page.getByRole('button',{name:'Take your seat'}).click();
 await expect(page.getByRole('heading',{name:'The negotiation table'})).toBeVisible();
 await page.screenshot({path:'docs/production/table-1366.png',fullPage:true});
 const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:innerWidth}));expect(width.scroll).toBeLessThanOrEqual(width.client);
 await page.getByRole('button',{name:'Denmark, stability 3, demand 2'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:/Denmark/})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByTitle('Save table').click();await expect(page.locator('.toast[role=status]')).toContainText('saved');
 await page.getByRole('button',{name:'Auto move',exact:true}).click();await expect(page.locator('.phase.active')).toContainText('Income');
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Load table',exact:true}).click();await expect(page.locator('.phase.active')).toContainText('World event');
 for(let i=0;i<350;i++){
  if(await page.getByRole('button',{name:'Final scores',exact:true}).isVisible())break;
  await page.getByRole('button',{name:'Auto move',exact:true}).click();
  const curtain=page.getByRole('button',{name:'Reveal my table'});if(await curtain.isVisible())await curtain.click();
 }
 await page.getByRole('button',{name:'Final scores',exact:true}).click();await expect(page.getByRole('heading',{name:'Final ledger'})).toBeVisible();await page.screenshot({path:'docs/production/final-ledger.png'});expect(errors).toEqual([]);
});
test('1920 and narrow viewports, Danish heading and reduced-motion setting',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await page.goto('/');await page.getByRole('button',{name:'Take your seat'}).click();await page.getByRole('button',{name:'Take your seat'}).click();await page.screenshot({path:'docs/production/table-1920.png',fullPage:true});
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Language / Sprog').selectOption('da');await page.getByLabel('Reduced motion').check();await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'Forhandlingsbordet'})).toBeVisible();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'docs/production/table-mobile.png',fullPage:true});
});
