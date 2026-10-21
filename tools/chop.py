import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':844,'height':390}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        await pg.evaluate("window.__k.S.set.hints=true; window.__k.startLevel(1)"); await pg.wait_for_timeout(3600)
        # lviv: дошка (14,2), пательня (3,0)
        await pg.evaluate("""(()=>{const s=window.__k.app.sim; const p=s.players[0];
          const b=s.tile(14,2); b.item={t:'i',id:'potato',s:'r',p:0};
          p.x=13; p.y=2; p.fx=1; p.fy=0;
          const pan=s.tile(3,0); pan.item.c=[{id:'potato',s:'c'}]; pan.item.ct=1.5;
        })()""")
        await pg.keyboard.down('KeyE'); await pg.wait_for_timeout(650)
        await pg.screenshot(path=f'{OUT}/chop1.png')
        st = await pg.evaluate("(()=>{const s=window.__k.app.sim; return [s.tile(14,2).item, s.players[0].act, s.players[0].using]})()")
        print(st)
        await pg.keyboard.up('KeyE')
        print(errs)
        await b.close()
asyncio.run(main())
