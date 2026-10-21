import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1100,'height':760}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        await pg.click('#bPlay'); await pg.wait_for_timeout(1200)
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1000)
        await pg.click('[data-bots="2"]'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{OUT}/bots_card.png')
        await pg.click('#cGo'); await pg.wait_for_timeout(9000)
        print(await pg.evaluate("window.__k.app.sim.players.map(p=>p.id+(p.bot?'(bot)':'')).join(' ')"), await pg.evaluate("window.__k.app.sim.humans"))
        await pg.screenshot(path=f'{OUT}/bots_level.png')
        print(errs)
        await b.close()
asyncio.run(main())
