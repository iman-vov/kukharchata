import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        for mode in ['dish','ing']:
            pg = await b.new_page(viewport={'width':1100,'height':900}); errs=[]
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
            await pg.goto(f'http://localhost:8765/tools/gallery.html#{mode}'); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=f'{OUT}/gal_{mode}.png', full_page=True); print(mode, errs[:5])
        await b.close()
asyncio.run(main())
