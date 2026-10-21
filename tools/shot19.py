import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for (W,H,tag) in [(1180,820,'tab'),(844,390,'ph')]:
            pg = await b.new_page(viewport={'width':W,'height':H}, has_touch=True)
            errs=[]
            pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
            pg.on('pageerror', lambda e: errs.append('PAGEERR: '+str(e)))
            await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(3000)
            await pg.screenshot(path=f'{OUT}/{tag}_title.png')
            await pg.evaluate("window.__k.startLevel(1)"); await pg.wait_for_timeout(1500)
            await pg.evaluate("document.querySelector('#cGo') && document.querySelector('#cGo').click()"); await pg.wait_for_timeout(4500)
            await pg.screenshot(path=f'{OUT}/{tag}_lvl.png')
            await pg.click('#bZin'); await pg.click('#bZin'); await pg.wait_for_timeout(1200)
            await pg.screenshot(path=f'{OUT}/{tag}_zoom.png')
            print(tag, errs[:10])
            await pg.close()
        await b.close()
asyncio.run(main())
