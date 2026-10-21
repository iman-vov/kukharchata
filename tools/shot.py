import asyncio, sys, os
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':1180,'height':820}, device_scale_factor=1, has_touch=True)
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR: '+str(e)))
        await pg.goto('http://localhost:8765/index.html')
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{OUT}/1_title.png')
        await pg.click('#bPlay'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{OUT}/2_map.png')
        await pg.evaluate("document.querySelector('#modal').classList.contains('hide')")
        # відкрити картку першого рівня
        await pg.evaluate("window.__k.app.map && 0")
        await pg.mouse.click(10,10)
        await pg.evaluate("""(()=>{const k=window.__k; })()""")
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/3_card.png')
        await pg.click('#cGo'); await pg.wait_for_timeout(3500)
        # рух і дії
        await pg.keyboard.down('KeyA'); await pg.wait_for_timeout(500); await pg.keyboard.up('KeyA')
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{OUT}/4_level.png')
        st = await pg.evaluate("(()=>{const s=window.__k.app.sim; return {t:s.timeLeft, started:s.started, players:s.players.map(p=>[p.x.toFixed(2),p.y.toFixed(2),p.held&&p.held.t]), orders:s.orders.length}})()")
        print(st)
        print('\n'.join(errs[:30]))
        await b.close()
asyncio.run(main())
