import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]; L=sys.argv[2]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1100,'height':760}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(800)
        await pg.evaluate(f"localStorage.setItem('kukharchata.v1', JSON.stringify({{set:{{lang:'{L}'}}}}))")
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/{L}_title.png')
        await pg.click('#bPlay'); await pg.wait_for_timeout(1500)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/{L}_card.png')
        await pg.evaluate("window.__k.startLevel(1)"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path=f'{OUT}/{L}_level.png')
        left = await pg.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.children.length===0 && /[\\u0400-\\u04FF]/.test(e.textContent) && e.offsetParent).map(e=>e.textContent.slice(0,60))")
        print('cyr left:', left[:20]); print(errs)
        await b.close()
asyncio.run(main())
