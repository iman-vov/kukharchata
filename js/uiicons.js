// Кухарчата — власні значки інтерфейсу (SVG) замість стандартних емодзі.
// Усі емодзі на сторінці автоматично замінюються цими малюнками.
// товщина лінії задається на групі, щоб окремі фігури могли її змінити без дубля атрибута
const S = (body, vb = '0 0 24 24') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g stroke-width="1.4">${body}</g></svg>`;
const O = 'stroke="#3a2a1f" stroke-linejoin="round" stroke-linecap="round"';
const face = (skin, extra) => S(`<circle cx="12" cy="13" r="9" fill="${skin}" ${O}/><circle cx="9" cy="12" r="1.2" fill="#3a2a1f"/><circle cx="15" cy="12" r="1.2" fill="#3a2a1f"/><circle cx="7.5" cy="15" r="1.3" fill="#ff9aa8"/><circle cx="16.5" cy="15" r="1.3" fill="#ff9aa8"/>${extra}`);
const ICONS = {
  '👫': S(`<circle cx="8" cy="7" r="3.2" fill="#ffd7b5" ${O}/><path d="M3.5 21v-5a4.5 4.5 0 019 0v5z" fill="#e5484d" ${O}/><circle cx="16" cy="8" r="3" fill="#f1c27d" ${O}/><path d="M11.5 21v-4.5a4.5 4.5 0 019 0V21z" fill="#3d7be0" ${O}/>`),
  '🏠': S(`<path d="M3 11l9-7 9 7" fill="none" ${O} stroke-width="2"/><path d="M5.5 10v10h13V10" fill="#ffd9a8" ${O}/><rect x="10" y="14" width="4" height="6" fill="#c0392b" ${O}/><rect x="15" y="5" width="2.4" height="4" fill="#8a5a3a" ${O}/>`),
  '⚙': S(`<path d="M12 2.5l1.6 2.3 2.7-.7.6 2.7 2.6 1-.8 2.6 1.9 2-1.9 2 .8 2.6-2.6 1-.6 2.7-2.7-.7L12 21.5l-1.6-2.3-2.7.7-.6-2.7-2.6-1 .8-2.6-1.9-2 1.9-2-.8-2.6 2.6-1 .6-2.7 2.7.7z" fill="#90a4ae" ${O}/><circle cx="12" cy="12" r="3.3" fill="#fff" ${O}/>`),
  '⭐': S(`<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="#ffc93c" stroke="#c9901a" stroke-width="1.3" stroke-linejoin="round"/><path d="M9.5 9.5l1.2-2.4" stroke="#fff3c4" stroke-width="1.4" stroke-linecap="round"/>`),
  '⏸': S(`<rect x="6" y="5" width="4" height="14" rx="1.5" fill="#3a2a1f"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#3a2a1f"/>`),
  '🗺': S(`<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#a5d6a7" ${O}/><path d="M9 4v14M15 6v14" ${O}/><path d="M5 12c2-2 3 1 4-1s3 2 4 0" fill="none" stroke="#2f6fd6" stroke-width="1.3"/><circle cx="17.5" cy="10" r="1.6" fill="#e5484d"/>`),
  '🍳': S(`<circle cx="10" cy="13" r="7" fill="#37474f" ${O}/><path d="M16 9l6-4" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/><path d="M6 12c0-3 3-4 5-3s4 1 3 4-2 4-5 3-3-2-3-4z" fill="#fff"/><circle cx="10.5" cy="12.5" r="2" fill="#ffb300"/>`),
  '🤖': S(`<rect x="4.5" y="7" width="15" height="12" rx="4" fill="#b0bec5" ${O}/><rect x="7" y="10" width="10" height="4.5" rx="2" fill="#263238"/><circle cx="9.5" cy="12.2" r="1.2" fill="#41e0ff"/><circle cx="14.5" cy="12.2" r="1.2" fill="#41e0ff"/><path d="M12 7V4" ${O}/><circle cx="12" cy="3.2" r="1.4" fill="#ff5252"/><rect x="2.5" y="11" width="2" height="4" rx="1" fill="#78909c"/><rect x="19.5" y="11" width="2" height="4" rx="1" fill="#78909c"/>`),
  '🥤': S(`<path d="M6 7h12l-1.5 14h-9z" fill="#e5484d" ${O}/><path d="M7 11h10" stroke="#fff" stroke-width="1.6"/><rect x="5" y="5.5" width="14" height="2.5" rx="1" fill="#fff" ${O}/><path d="M13 5.5l2-4 3 .5" fill="none" stroke="#ffc107" stroke-width="1.8" stroke-linecap="round"/>`),
  '🔥': S(`<path d="M12 2c4 4 7 7 7 12a7 7 0 01-14 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 0-6 2-9z" fill="#ff6d00" ${O}/><path d="M12 12c2 2 3 3 3 5a3 3 0 01-6 0c0-2 2-3 3-5z" fill="#ffd54f"/>`),
  '🧯': S(`<rect x="7" y="7" width="8" height="14" rx="3" fill="#e53935" ${O}/><rect x="9" y="4" width="4" height="3" fill="#37474f" ${O}/><path d="M13 5h5l2 3" fill="none" stroke="#37474f" stroke-width="1.8" stroke-linecap="round"/><rect x="8.5" y="11" width="5" height="4" fill="#fff"/>`),
  '🧽': S(`<rect x="4" y="7" width="16" height="10" rx="2" fill="#ffd54f" ${O}/><rect x="4" y="7" width="16" height="3.5" rx="1.5" fill="#66bb6a" ${O}/><circle cx="9" cy="14" r="1" fill="#e6a700"/><circle cx="14" cy="13" r="1.2" fill="#e6a700"/><circle cx="18" cy="5" r="1.6" fill="#b3e5fc" ${O}/>`),
  '🧾': S(`<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z" fill="#fff" ${O}/><path d="M9 8h6M9 11h6M9 14h4" stroke="#90a4ae" stroke-width="1.4" stroke-linecap="round"/>`),
  '⏱': S(`<circle cx="12" cy="14" r="7.5" fill="#fff" ${O}/><path d="M12 14V9.5M12 14l3 2" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round"/><rect x="10" y="3" width="4" height="2.5" rx="1" fill="#3a2a1f"/>`),
  '📱': S(`<rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="#37474f" ${O}/><rect x="8" y="5" width="8" height="13" rx="1" fill="#81d4fa"/><circle cx="12" cy="19.7" r=".9" fill="#fff"/>`),
  '🎮': S(`<path d="M4 9c1-2 3-2.5 5-2h6c2-.5 4 0 5 2l1.5 7c.4 2-2 3.5-3.5 1.5L16 15H8l-2 2.5C4.5 19.5 2 18 2.5 16z" fill="#7e57c2" ${O}/><path d="M7.5 10v4M5.5 12h4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.1" fill="#ffeb3b"/><circle cx="18" cy="13" r="1.1" fill="#4caf50"/>`),
  '👆': S(`<path d="M10 12V4.5a1.8 1.8 0 013.6 0V11l4.2 1c1.5.4 2.4 1.9 2 3.4l-1.3 4.6H9.3L5.6 15c-1-1.2.6-2.8 1.8-1.8z" fill="#ffd7b5" ${O}/>`),
  '👑': S(`<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z" fill="#ffc93c" ${O}/><circle cx="12" cy="13" r="1.3" fill="#e53935"/><circle cx="8" cy="14" r="1" fill="#1e88e5"/><circle cx="16" cy="14" r="1" fill="#43a047"/>`),
  '🌍': S(`<circle cx="12" cy="12" r="9.5" fill="#4fc3f7" ${O}/><path d="M6 8c2 0 3 1 3 3s-2 2-2 4 2 3 2 5c-3-1-6-4-6-8 0-2 1-3 3-4zM13 4c2 1 2 3 4 3s3 2 2 4-3 1-3 3-1 4-3 5c0-3-2-4-2-6s2-2 2-4-2-2 0-5z" fill="#66bb6a"/>`),
  '🌐': S(`<circle cx="12" cy="12" r="9.5" fill="#bbdefb" ${O}/><ellipse cx="12" cy="12" rx="4" ry="9.5" fill="none" ${O}/><path d="M2.5 12h19M4.5 7h15M4.5 17h15" ${O}/>`),
  '📶': S(`<rect x="3" y="15" width="3.5" height="6" rx="1" fill="#43a047"/><rect x="8" y="11" width="3.5" height="10" rx="1" fill="#43a047"/><rect x="13" y="7" width="3.5" height="14" rx="1" fill="#43a047"/><rect x="18" y="3" width="3.5" height="18" rx="1" fill="#a5d6a7"/>`),
  '📤': S(`<path d="M4 11v9h16v-9" fill="none" ${O} stroke-width="2"/><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5" fill="none" stroke="#2f6fd6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
  '🚪': S(`<rect x="5" y="2.5" width="14" height="19" rx="1.5" fill="#a1887f" ${O}/><rect x="7.5" y="5" width="9" height="6" rx="1" fill="#8d6e63"/><rect x="7.5" y="13" width="9" height="6" rx="1" fill="#8d6e63"/><circle cx="15.5" cy="12" r="1.2" fill="#ffc93c"/>`),
  '➕': S(`<circle cx="12" cy="12" r="9.5" fill="#66bb6a"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`),
  '📷': S(`<rect x="3" y="7" width="18" height="13" rx="3" fill="#546e7a" ${O}/><path d="M8 7l1.5-3h5L16 7" fill="#546e7a" ${O}/><circle cx="12" cy="13.5" r="4" fill="#b3e5fc" ${O}/><circle cx="17.5" cy="10" r="1" fill="#ffeb3b"/>`),
  '🧪': S(`<path d="M9 3h6M10 3v6l-5 9a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-5-9V3" fill="#e1f5fe" ${O}/><path d="M7 15h10l2 3.5a1 1 0 01-.9 1.5H5.9a1 1 0 01-.9-1.5z" fill="#66bb6a"/>`),
  '🍽': S(`<circle cx="12" cy="12" r="7" fill="#fff" ${O}/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#90caf9" stroke-width="1.3"/><path d="M2.5 4v6M1.5 4v3.5a1 1 0 002 0V4M2.5 10v10" stroke="#78909c" stroke-width="1.2" stroke-linecap="round"/><path d="M21.5 4c-1.5 1-1.5 6 0 7v9" stroke="#78909c" stroke-width="1.4" stroke-linecap="round" fill="none"/>`),
  '⌛': S(`<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" fill="#ffe0b2" ${O}/><path d="M9 18.5c1-1.5 2-2 3-2s2 .5 3 2z" fill="#ffb74d"/>`),
  '⏳': S(`<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" fill="#ffe0b2" ${O}/><path d="M9 6.5h6c-1 2-2 3-3 3s-2-1-3-3z" fill="#ffb74d"/>`),
  '🪙': S(`<ellipse cx="12" cy="13.5" rx="9" ry="7" fill="#c9901a"/><ellipse cx="12" cy="11.5" rx="9" ry="7" fill="#ffc93c" stroke="#c9901a" stroke-width="1.3"/><ellipse cx="12" cy="11.5" rx="5.5" ry="4.2" fill="none" stroke="#e0a91e" stroke-width="1.3"/><path d="M10 9.5h3.5M10 11.5h3.5M10.5 9v5" stroke="#b07a10" stroke-width="1.3" stroke-linecap="round"/>`),
  '🎵': S(`<path d="M9 17V5l11-2v12" fill="none" ${O} stroke-width="2"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="#7e57c2"/><ellipse cx="17.5" cy="15.5" rx="3" ry="2.4" fill="#7e57c2"/>`),
  '🔊': S(`<path d="M4 9h4l5-4v14l-5-4H4z" fill="#78909c" ${O}/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11" fill="none" stroke="#2f6fd6" stroke-width="1.8" stroke-linecap="round"/>`),
  '💡': S(`<path d="M12 2.5a6.5 6.5 0 00-4 11.6V17h8v-2.9a6.5 6.5 0 00-4-11.6z" fill="#fff176" ${O}/><rect x="8.5" y="17" width="7" height="2.5" rx="1" fill="#90a4ae" ${O}/><path d="M10 21.5h4" ${O}/>`),
  '🗑': S(`<path d="M5 7h14l-1.3 14H6.3z" fill="#90a4ae" ${O}/><path d="M3.5 7h17M9 7V4h6v3" fill="none" ${O}/><path d="M9.5 10v8M14.5 10v8" stroke="#607d8b" stroke-width="1.3"/>`),
  '🎉': S(`<path d="M3 21l4-12 8 8z" fill="#ffc93c" ${O}/><path d="M14 4l1 2M19 6l-2 1M20 11l-2-.5M11 3c1 2 0 3 0 3" stroke="#e5484d" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="17" cy="3" r="1.1" fill="#3d7be0"/><circle cx="21" cy="15" r="1.1" fill="#43a047"/><circle cx="14" cy="9" r="1" fill="#9c27b0"/>`),
  '🎊': S(`<path d="M3 21l4-12 8 8z" fill="#ffc93c" ${O}/><circle cx="16" cy="5" r="1.3" fill="#e5484d"/><circle cx="20" cy="9" r="1.3" fill="#3d7be0"/><circle cx="12" cy="4" r="1.2" fill="#43a047"/><circle cx="19" cy="15" r="1.2" fill="#9c27b0"/>`),
  '🏆': S(`<path d="M7 3h10v5a5 5 0 01-10 0z" fill="#ffc93c" ${O}/><path d="M7 5H4a3 3 0 003 4M17 5h3a3 3 0 01-3 4" fill="none" ${O}/><path d="M12 13v4M8 21h8l-1-4H9z" fill="#c9901a" ${O}/>`),
  '😋': face('#ffd7b5', `<path d="M8.5 16c2 2 5 2 7 0" fill="none" stroke="#3a2a1f" stroke-width="1.4" stroke-linecap="round"/><path d="M13.5 16.8c.3 1.6 1.8 1.6 2 .1" fill="#e5484d"/>`),
  '😅': face('#ffd7b5', `<path d="M8.5 16c2 2 5 2 7 0" fill="#fff" stroke="#3a2a1f" stroke-width="1.4"/><path d="M19 5c1 1.5 1 3 0 3.5s-1.5-1-1-2z" fill="#4fc3f7"/>`),
  '😢': face('#ffd7b5', `<path d="M9 18c2-2 4-2 6 0" fill="none" stroke="#3a2a1f" stroke-width="1.4" stroke-linecap="round"/><path d="M8 14c.6 1.2.6 2.2 0 2.5s-.9-.8 0-2.5z" fill="#4fc3f7"/>`),
  '🚚': S(`<rect x="1.5" y="7" width="13" height="9" rx="1.5" fill="#fff" ${O}/><path d="M14.5 10h4l3 3v3h-7z" fill="#e5484d" ${O}/><circle cx="6" cy="17.5" r="2" fill="#37474f"/><circle cx="17.5" cy="17.5" r="2" fill="#37474f"/><rect x="4" y="9.5" width="6" height="2" fill="#ffc93c"/>`),
  '🔒': S(`<rect x="5" y="10" width="14" height="11" rx="2" fill="#ffc93c" ${O}/><path d="M8 10V7a4 4 0 018 0v3" fill="none" ${O} stroke-width="2"/><circle cx="12" cy="15" r="1.6" fill="#3a2a1f"/>`),
  '👵': S(`<circle cx="12" cy="9" r="5" fill="#eceff1" ${O}/>${face('#ffe0cc', '').replace(/<\/?svg[^>]*>/g, '')}<path d="M3.5 12c0-6 4-9 8.5-9s8.5 3 8.5 9c-2-3-5-4-8.5-4S5.5 9 3.5 12z" fill="#eceff1" ${O}/><circle cx="9" cy="12" r="2.2" fill="none" stroke="#8a5a3a" stroke-width="1"/><circle cx="15" cy="12" r="2.2" fill="none" stroke="#8a5a3a" stroke-width="1"/><path d="M10 17c1.3 1 2.7 1 4 0" fill="none" stroke="#3a2a1f" stroke-width="1.2" stroke-linecap="round"/>`),
  '🦝': S(`<path d="M4 4l3 6M20 4l-3 6" stroke="#757575" stroke-width="3" stroke-linecap="round"/><ellipse cx="12" cy="14" rx="9" ry="7.5" fill="#9e9e9e" ${O}/><path d="M4 13c2-2 5-2 7 0-1 2-5 3-7 0zM20 13c-2-2-5-2-7 0 1 2 5 3 7 0z" fill="#3a3a3a"/><circle cx="8" cy="13" r="1.2" fill="#fff"/><circle cx="16" cy="13" r="1.2" fill="#fff"/><path d="M8 17c2 2.5 6 2.5 8 0-2 1-6 1-8 0z" fill="#f5f5f5"/><circle cx="12" cy="17" r="1.2" fill="#3a2a1f"/>`),
  '🧑‍🍳': face('#ffd7b5', '<path d="M5 7c0-3 3-4 4-3 1-2 5-2 6 0 1-1 4 0 4 3l-1 2H6z" fill="#fff" stroke="#3a2a1f" stroke-width="1.2"/>'),
  '💨': S(`<path d="M3 9h11a3 3 0 10-3-3M3 13h15a3 3 0 11-3 3M3 17h7" fill="none" stroke="#4fc3f7" stroke-width="2" stroke-linecap="round"/>`),
  '⏰': S(`<circle cx="12" cy="13" r="8" fill="#fff" ${O}/><path d="M12 13V8.5M12 13l3 2" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round"/><circle cx="5" cy="5" r="2.5" fill="#e5484d" ${O}/><circle cx="19" cy="5" r="2.5" fill="#e5484d" ${O}/>`),
  '🎯': S(`<circle cx="12" cy="12" r="9.5" fill="#fff" ${O}/><circle cx="12" cy="12" r="6.5" fill="#e5484d"/><circle cx="12" cy="12" r="3.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#e5484d"/>`),
  '✋': S(`<path d="M7 12V6a1.5 1.5 0 013 0v5m0-6a1.5 1.5 0 013 0v6m0-5a1.5 1.5 0 013 0v6m0-3a1.5 1.5 0 013 0v5c0 4-3 7-7 7h-1c-3 0-5-2-6-4l-2.5-4a1.6 1.6 0 012.7-1.6z" fill="#ffd7b5" ${O}/>`),
  '🔪': S(`<g transform="rotate(-40 12 12)"><path d="M10 2h4.5c1 4 1 8 0 11H10z" fill="#eceff1" ${O}/><rect x="9.6" y="13" width="5" height="8" rx="1.6" fill="#6d4c41"/></g>`),
  '💾': S(`<path d="M4 3h13l3 3v15H4z" fill="#3d7be0" ${O}/><rect x="7" y="3" width="9" height="6" fill="#e3f2fd" ${O}/><rect x="13" y="4.2" width="2" height="3.6" fill="#3d7be0"/><rect x="6.5" y="12.5" width="11" height="8.5" rx="1" fill="#fff" ${O}/><path d="M8.5 15.5h7M8.5 18h5" stroke="#90a4ae" stroke-width="1.2" stroke-linecap="round"/>`),
  '💬': S(`<path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2h-9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#fff" ${O}/><circle cx="8" cy="10.5" r="1.3" fill="#ff7a2f"/><circle cx="12" cy="10.5" r="1.3" fill="#ff7a2f"/><circle cx="16" cy="10.5" r="1.3" fill="#ff7a2f"/>`),
  '👋': S(`<path d="M8 13V5.5a1.5 1.5 0 013 0V11m0-7a1.5 1.5 0 013 0v7m0-5a1.5 1.5 0 013 0v7m0-3a1.5 1.5 0 013 0v4c0 4-3 7-7 7h-1c-3 0-5-2-6-4l-2.3-4a1.6 1.6 0 012.6-1.8z" fill="#ffd7b5" ${O}/><path d="M2.5 6.5c.5-2 1.5-3 3-3.5M19 2.5c1.5.5 2.5 1.5 3 3" fill="none" stroke="#ffb300" stroke-width="1.5" stroke-linecap="round"/>`),
  '❤': S(`<path d="M12 20.5C6 16 2.5 12.5 2.5 8.5A4.8 4.8 0 0112 6a4.8 4.8 0 019.5 2.5c0 4-3.5 7.5-9.5 12z" fill="#e5484d" ${O}/><path d="M6 8.5a2.5 2.5 0 012.5-2.3" fill="none" stroke="#ffb3b5" stroke-width="1.5" stroke-linecap="round"/>`),
  '🧸': S(`<circle cx="6" cy="6" r="3" fill="#b07a4a" ${O}/><circle cx="18" cy="6" r="3" fill="#b07a4a" ${O}/><circle cx="12" cy="11" r="7" fill="#c98d5a" ${O}/><ellipse cx="12" cy="14" rx="3.2" ry="2.4" fill="#f1d3b0"/><circle cx="12" cy="13" r="1" fill="#3a2a1f"/><circle cx="9.3" cy="10" r="1" fill="#3a2a1f"/><circle cx="14.7" cy="10" r="1" fill="#3a2a1f"/><path d="M7 17.5c-1 1.5-1 3 .5 3.5h9c1.5-.5 1.5-2 .5-3.5" fill="#c98d5a" ${O}/>`),
  '🍹': S(`<path d="M5 5h14l-7 8z" fill="#e5484d" ${O}/><path d="M12 13v7M8 20.5h8" ${O} stroke-width="1.8"/>`),
  '🇺🇦': S(`<rect x="1" y="4" width="22" height="8" fill="#2f6fd6"/><rect x="1" y="12" width="22" height="8" fill="#ffd23f"/><rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="#3a2a1f" stroke-opacity=".25"/>`),
  '🇩🇪': S(`<rect x="1" y="4" width="22" height="5.4" fill="#111"/><rect x="1" y="9.3" width="22" height="5.4" fill="#dd0000"/><rect x="1" y="14.6" width="22" height="5.4" fill="#ffce00"/><rect x="1" y="4" width="22" height="16" rx="2" fill="none" stroke="#3a2a1f" stroke-opacity=".25"/>`),
  '🇬🇧': S(`<rect x="1" y="4" width="22" height="16" fill="#1f3c88"/><path d="M1 4l22 16M23 4L1 20" stroke="#fff" stroke-width="3.4"/><path d="M1 4l22 16M23 4L1 20" stroke="#cf142b" stroke-width="1.2"/><path d="M12 4v16M1 12h22" stroke="#fff" stroke-width="5"/><path d="M12 4v16M1 12h22" stroke="#cf142b" stroke-width="2.8"/>`),
};
const URL = {};
for (const k in ICONS) URL[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICONS[k]);
export function iconSrc(e) { return URL[e.replace(/️/g, '')]; }
const keys = Object.keys(ICONS).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '️?');
const RX = new RegExp('(' + keys.join('|') + ')', 'u');
const RXG = new RegExp('(' + keys.join('|') + ')', 'gu');
export function hasEmoji(s) { return RX.test(s); }
// замінити емодзі в текстовому вузлі на <img>
export function replaceEmoji(node) {
  const v = node.nodeValue;
  if (!v || !RX.test(v)) return;
  const parent = node.parentNode; if (!parent || parent.tagName === 'OPTION' || parent.tagName === 'TEXTAREA') return;
  const frag = document.createDocumentFragment();
  let last = 0;
  v.replace(RXG, (m, _g, off) => {
    if (off > last) frag.appendChild(document.createTextNode(v.slice(last, off)));
    const img = document.createElement('img'); img.className = 'em'; img.alt = m; img.src = iconSrc(m) || ''; img.draggable = false;
    frag.appendChild(img); last = off + m.length; return m;
  });
  if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
  parent.replaceChild(frag, node);
}
