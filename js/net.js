// Кухарчата — гра разом: через інтернет (PeerJS + TURN) або без інтернету (QR-коди, пряме WebRTC по Wi‑Fi)
const PREFIX = 'kukharchata-';

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s);
  });
}

/* ---------- безкоштовний ретранслятор Open Relay (Metered): тимчасовий логін за спільним секретом ---------- */
async function openRelay() {
  try {
    const user = (Math.floor(Date.now() / 1000) + 3 * 86400) + ':kukharchata';
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode('openrelayprojectsecret'), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(user)));
    let b = ''; sig.forEach(x => b += String.fromCharCode(x));
    const h = 'staticauth.openrelay.metered.ca';
    return { urls: [`turn:${h}:80`, `turn:${h}:80?transport=tcp`, `turn:${h}:443`, `turns:${h}:443?transport=tcp`], username: user, credential: btoa(b) };
  } catch (_) { return null; }
}
// які кандидати зібрали (для підказки, чому не вийшло)
export async function candInfo(pc) {
  const n = { host: 0, srflx: 0, relay: 0 }; let st = '';
  try { st = pc.iceConnectionState; (await pc.getStats()).forEach(r => { if (r.type === 'local-candidate' && n[r.candidateType] !== undefined) n[r.candidateType]++; }); } catch (_) { }
  return `ICE ${st || '?'} · host ${n.host} · stun ${n.srflx} · relay ${n.relay}`;
}

/* ---------- обгортка з'єднання ---------- */
class Conn {
  constructor(kind, raw) {
    this.kind = kind; this.raw = raw; this.open = false; this.id = Math.random().toString(36).slice(2, 8);
    this.onData = () => { }; this.onClose = () => { }; this.onOpen = () => { };
    this.rtt = 0; this.relay = null;
    if (kind === 'peer') {
      raw.on('open', () => { this.open = true; this.onOpen(); this.probe(raw.peerConnection); });
      raw.on('data', d => this.recv(d));
      raw.on('close', () => this.closed());
      raw.on('error', () => this.closed());
      if (raw.open) { this.open = true; setTimeout(() => this.onOpen(), 0); }
    } else { // RTCDataChannel
      raw.onopen = () => { this.open = true; this.onOpen(); this.probe(this.pc); };
      raw.onmessage = e => { try { this.recv(JSON.parse(e.data)); } catch (_) { } };
      raw.onclose = () => this.closed();
      if (raw.readyState === 'open') { this.open = true; setTimeout(() => this.onOpen(), 0); }
    }
  }
  recv(d) { if (d && d.k === 'ping') { this.send({ k: 'pong', t: d.t }); return; } if (d && d.k === 'pong') { this.rtt = performance.now() - d.t; return; } this.onData(d); }
  send(o) {
    if (!this.open) return;
    try { if (this.kind === 'peer') this.raw.send(o); else if (this.raw.readyState === 'open') this.raw.send(JSON.stringify(o)); } catch (_) { }
  }
  closed() { if (this.dead) return; this.dead = true; this.open = false; this.onClose(); }
  close() { try { this.raw.close(); } catch (_) { } try { this.pc && this.pc.close(); } catch (_) { } this.closed(); }
  async probe(pc) { // пряме чи через ретранслятор
    if (!pc || !pc.getStats) return;
    setTimeout(async () => {
      try {
        const st = await pc.getStats(); let pair = null; const cands = {};
        st.forEach(r => { if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded') pair = r; if (r.type === 'local-candidate' || r.type === 'remote-candidate') cands[r.id] = r; });
        if (pair) { const l = cands[pair.localCandidateId], r = cands[pair.remoteCandidateId]; this.relay = (l && l.candidateType === 'relay') || (r && r.candidateType === 'relay'); }
      } catch (_) { }
    }, 1500);
    this.pinger = setInterval(() => { if (this.open) this.send({ k: 'ping', t: performance.now() }); else clearInterval(this.pinger); }, 2000);
  }
}

/* ---------- стиснення SDP для QR ---------- */
async function pack(obj) {
  const txt = JSON.stringify(obj);
  if (window.CompressionStream) {
    try {
      const cs = new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const buf = new Uint8Array(await new Response(cs).arrayBuffer());
      let s = ''; buf.forEach(b => s += String.fromCharCode(b));
      return 'K1.' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (_) { }
  }
  return 'K0.' + btoa(unescape(encodeURIComponent(txt)));
}
async function unpack(code) {
  code = code.trim();
  if (code.startsWith('K0.')) return JSON.parse(decodeURIComponent(escape(atob(code.slice(3)))));
  if (!code.startsWith('K1.')) throw new Error('bad');
  const b = atob(code.slice(3).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
  const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(ds).text());
}
// прибираємо зайве з SDP, щоб QR був меншим
function slim(sdp) {
  return sdp.split('\r\n').filter(l => l && !/^a=(extmap|rtcp-fb|ssrc|msid|ice-options:trickle|extmap-allow-mixed)/.test(l)
    && !/ typ (srflx|relay)/.test(l) && !/ tcptype /.test(l)).join('\r\n') + '\r\n';
}
function waitIce(pc, ms = 2500) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, ms);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}

/* ================================================================ */
export class Net {
  constructor() {
    this.role = 'solo'; this.code = ''; this.peer = null; this.conns = []; this.hostConn = null;
    this.on = {}; this.ice = null; this.status = '';
  }
  emit(type, ...a) { (this.on[type] || []).forEach(f => f(...a)); }
  listen(type, f) { (this.on[type] = this.on[type] || []).push(f); }

  // ICE-сервери: Google STUN + твій TURN (Metered/ExpressTURN) — потрібно для гри через кордон
  async iceServers(cfg) {
    const list = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      // безкоштовні ретранслятори PeerJS (вбудовані в PeerJS; раніше ми їх випадково вимикали)
      { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' }];
    const orl = await openRelay(); if (orl) list.push(orl);
    if (cfg && cfg.meteredUrl) {
      try { const r = await fetch(cfg.meteredUrl); const j = await r.json(); if (Array.isArray(j)) list.push(...j); } catch (_) { }
    }
    if (cfg && cfg.turnUrl && cfg.turnUser) {
      const urls = cfg.turnUrl.split(/[\s,]+/).filter(Boolean);
      list.push({ urls, username: cfg.turnUser, credential: cfg.turnPass || '' });
    }
    return list;
  }

  /* ---------- через інтернет ---------- */
  async hostOnline(code, turnCfg) {
    await loadScript('vendor/peerjs.min.js');
    const iceServers = await this.iceServers(turnCfg);
    return new Promise((res, rej) => {
      const peer = new Peer(PREFIX + code, { config: { iceServers } });
      this.peer = peer;
      peer.on('open', () => { this.role = 'host'; this.code = code; res(code); });
      peer.on('connection', c => this.addGuest(new Conn('peer', c)));
      peer.on('error', e => { if (this.role !== 'host') rej(e); else this.emit('error', e); });
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (_) { } });
    });
  }
  async joinOnline(code, turnCfg) {
    await loadScript('vendor/peerjs.min.js');
    const iceServers = await this.iceServers(turnCfg);
    return new Promise((res, rej) => {
      const peer = new Peer({ config: { iceServers } }); this.peer = peer;
      let done = false;
      let c = null;
      const to = setTimeout(async () => { if (!done) { done = true; const info = c && c.peerConnection ? await candInfo(c.peerConnection) : 'no pc'; rej({ type: 'timeout', info }); } }, 30000);
      peer.on('open', () => {
        c = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
        const conn = new Conn('peer', c);
        conn.onOpen = () => { if (done) return; done = true; clearTimeout(to); this.role = 'guest'; this.code = code; this.setHostConn(conn); res(conn); };
      });
      peer.on('error', e => { if (!done) { done = true; clearTimeout(to); rej(e); } });
    });
  }

  /* ---------- без інтернету: QR ---------- */
  // хост: створити запрошення для одного гравця
  async offlineOffer() {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const dc = pc.createDataChannel('kk', { ordered: true });
    const conn = new Conn('dc', dc); conn.pc = pc;
    await pc.setLocalDescription(await pc.createOffer());
    await waitIce(pc);
    const code = await pack({ t: 'o', s: slim(pc.localDescription.sdp) });
    return {
      code,
      accept: async (answerCode) => {
        const a = await unpack(answerCode);
        if (a.t !== 'a') throw new Error('not answer');
        await pc.setRemoteDescription({ type: 'answer', sdp: a.s });
        return new Promise((res, rej) => {
          const to = setTimeout(() => rej(new Error('timeout')), 15000);
          conn.onOpen = () => { clearTimeout(to); this.role = 'host'; this.addGuest(conn); res(conn); };
        });
      },
      cancel: () => { try { pc.close(); } catch (_) { } },
    };
  }
  // гість: прочитав QR хоста → повертає свій QR-відповідь
  async offlineAnswer(offerCode) {
    const o = await unpack(offerCode);
    if (o.t !== 'o') throw new Error('not offer');
    const pc = new RTCPeerConnection({ iceServers: [] });
    const opened = new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('timeout')), 120000);
      pc.ondatachannel = e => {
        const conn = new Conn('dc', e.channel); conn.pc = pc;
        conn.onOpen = () => { clearTimeout(to); this.role = 'guest'; this.setHostConn(conn); res(conn); };
      };
    });
    await pc.setRemoteDescription({ type: 'offer', sdp: o.s });
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce(pc);
    const code = await pack({ t: 'a', s: slim(pc.localDescription.sdp) });
    return { code, opened, cancel: () => { try { pc.close(); } catch (_) { } } };
  }

  addGuest(conn) {
    if (this.conns.includes(conn)) return;
    this.conns.push(conn);
    conn.onData = d => this.emit('data', conn, d);
    conn.onClose = () => { this.conns = this.conns.filter(c => c !== conn); this.emit('leave', conn); };
    this.emit('join', conn);
  }
  setHostConn(conn) {
    this.hostConn = conn;
    conn.onData = d => this.emit('data', conn, d);
    conn.onClose = () => { this.hostConn = null; this.role = 'solo'; this.emit('lost'); };
  }
  wake() { try { if (this.peer && this.peer.disconnected && !this.peer.destroyed) this.peer.reconnect(); } catch (_) { } }
  send(o) { if (this.role === 'guest' && this.hostConn) this.hostConn.send(o); }
  broadcast(o, except) { for (const c of this.conns) if (c !== except) c.send(o); }
  get connected() { return this.role === 'host' ? this.conns.length : this.role === 'guest' ? (this.hostConn ? 1 : 0) : 0; }
  leave() {
    for (const c of this.conns) c.close(); this.conns = [];
    if (this.hostConn) { const h = this.hostConn; this.hostConn = null; h.onClose = () => { }; h.close(); }
    try { this.peer && this.peer.destroy(); } catch (_) { }
    this.peer = null; this.role = 'solo'; this.code = '';
  }
}

/* ---------- QR: показати і сканувати ---------- */
export async function qrCanvas(text, size = 300) {
  await loadScript('vendor/qrcode.js');
  const qr = window.qrcode(0, 'L'); qr.addData(text, 'Byte'); qr.make();
  const n = qr.getModuleCount(), c = document.createElement('canvas');
  const cell = Math.max(2, Math.floor(size / (n + 8))); c.width = c.height = cell * (n + 8);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) g.fillRect((x + 4) * cell, (y + 4) * cell, cell, cell);
  return c;
}
let camStream = null;
export async function cameraOn() {
  if (camStream && camStream.active) return camStream;
  camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
  return camStream;
}
export function cameraOff() { if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; } }
export async function scanQR(video, onCode, prefix = 'K') {
  await loadScript('vendor/jsQR.js');
  const stream = await cameraOn();
  video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
  await video.play();
  const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
  let stop = false;
  const tick = () => {
    if (stop) return;
    if (video.readyState >= 2) {
      const w = Math.min(800, video.videoWidth), h = Math.round(video.videoHeight * w / video.videoWidth);
      c.width = w; c.height = h; g.drawImage(video, 0, 0, w, h);
      const r = window.jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (r && r.data && r.data.startsWith(prefix)) { stop = true; onCode(r.data); return; }
    }
    setTimeout(tick, 160);
  };
  tick();
  return () => { stop = true; };
}
