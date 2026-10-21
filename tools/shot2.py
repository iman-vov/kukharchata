import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]; LV=[int(x) for x in sys.argv[2].split(',')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1180,'height':820}, has_touch=True)
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR: '+str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1500)
        await pg.click('#bPlay'); await pg.wait_for_timeout(800)
        for li in LV:
            await pg.evaluate(f"(()=>{{const k=window.__k; const id=['kyiv','lviv','odesa','napoli','roma','venezia','tokyo','osaka','kyoto','mexico','cancun','newyork','chicago','sanfran','feast'][{li}]; k.S.assist[id]=true; k.startLevel({li});}})()")
            await pg.wait_for_timeout(3000)
            # прискорити: крокувати симуляцію вручну
            await pg.evaluate("(()=>{const s=window.__k.app.sim; for(let i=0;i<30*50;i++){s.step(1/30,true);} s.events.length=0;})()")
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=f'{OUT}/lv{li}.png')
            info = await pg.evaluate("(()=>{const s=window.__k.app.sim; return [s.score, s.delivered, s.orders.length]})()")
            print(li, info)
        print('\n'.join(errs[:20]))
        await b.close()
asyncio.run(main())
