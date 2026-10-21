import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-features=WebRtcHideLocalIpsWithMdns'])
        errs=[]
        A = await b.new_page(viewport={'width':1000,'height':700}); B = await b.new_page(viewport={'width':1000,'height':700}, has_touch=True)
        for n,pg in (('A',A),('B',B)):
            pg.on('pageerror', lambda e, n=n: errs.append(n+' PAGEERR: '+str(e)))
            pg.on('console', lambda m, n=n: errs.append(n+' '+m.text) if m.type=='error' else None)
            await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(1200)
        await A.evaluate("window.__k.S.name='Тато'"); await B.evaluate("window.__k.S.name='Оля'")
        await A.click('#bPlay'); await B.click('#bPlay'); await A.wait_for_timeout(500)
        offer = await A.evaluate("(async()=>{const k=window.__k; const inv=await k.net.offlineOffer(); window._inv=inv; k.net.role='host'; k.afterHostStart(); return inv.code})()")
        print('offer len', len(offer))
        ans = await B.evaluate("(async(c)=>{const k=window.__k; const a=await k.net.offlineAnswer(c); window._ans=a; a.opened.then(()=>k.afterGuestJoin()); return a.code})", offer)
        print('answer len', len(ans))
        await A.evaluate("(async(c)=>{await window._inv.accept(c)})", ans)
        await A.wait_for_timeout(1500)
        print('A conns', await A.evaluate("window.__k.net.conns.length"), 'B role', await B.evaluate("window.__k.net.role"))
        print('roster', await A.evaluate("JSON.stringify(window.__k.app && window.__k.net.conns.length)"))
        await A.evaluate("window.__k.startLevel(0)"); await A.wait_for_timeout(4000)
        print('B scene', await B.evaluate("window.__k.app.scene"), 'players', await B.evaluate("window.__k.app.sim.players.map(p=>p.id+'@'+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')"))
        # гість іде вправо і бере
        await B.bring_to_front()
        await B.keyboard.down('KeyD'); await B.wait_for_timeout(700); await B.keyboard.up('KeyD')
        await B.wait_for_timeout(500)
        print('host sees', await A.evaluate("window.__k.app.sim.players.map(p=>p.id+'@'+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ')"))
        await A.screenshot(path=f'{OUT}/net_host.png'); await B.screenshot(path=f'{OUT}/net_guest.png')
        print('orders B', await B.evaluate("window.__k.app.sim.orders.length"), 'time', await B.evaluate("window.__k.app.sim.timeLeft"))
        print('\n'.join(errs[:20]))
        await b.close()
asyncio.run(main())
