import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':844,'height':390}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/ph_title.png')
        await pg.tap('#bPlay'); await pg.wait_for_timeout(1800)
        await pg.screenshot(path=f'{OUT}/ph_map.png')
        await pg.evaluate("window.__k.S.set.shared=false; window.__k.startLevel(3)"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path=f'{OUT}/ph_level.png')
        await pg.evaluate("window.__k.S.set.shared=true; window.__k.startLevel(0)"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path=f'{OUT}/ph_shared.png')
        print(errs)
        await b.close()
asyncio.run(main())
