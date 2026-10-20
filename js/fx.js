/* Một canvas toàn trang: cánh hoa rơi nền, pháo cánh hoa khi chạm, và vệt lấp lánh theo chuột. */

const FX = (() => {
  const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ffb3c6', '#f27b94', '#ffd2cf', '#fff0f0', '#f0cf9b', '#e2d4ff'];
  const GRAVITY = 380;

  const PETAL = new Path2D();
  PETAL.moveTo(0, 0);
  PETAL.bezierCurveTo(.15, -.28, .55, -.52, .92, -.28);
  PETAL.quadraticCurveTo(1.04, 0, .92, .28);
  PETAL.bezierCurveTo(.55, .52, .15, .28, 0, 0);

  let W = 0, H = 0, dpr = 1, parts = [], last = 0, raf = 0, hidden = false;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  const ambient = () => ({
    kind: 'amb', x: rand(0, W), y: rand(-H * .2, H), z: rand(.35, 1.1),
    r: 0, vr: rand(-1.2, 1.2), rot: rand(0, 6.28), fl: rand(0, 6.28), vf: rand(1.2, 3),
    ph: rand(0, 6.28), color: pick(COLORS), a: rand(.45, .85)
  });

  const coarse = matchMedia('(pointer: coarse)').matches;

  function resize() {
    /* Canvas cao 100vh nên thanh địa chỉ di động ẩn/hiện không đổi kích thước; cấp lại bộ nhớ canvas chỉ khi thật sự đổi. */
    const w = innerWidth, h = cv.clientHeight || innerHeight;
    if (w === W && h === H) return;
    dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);   /* cánh hoa mờ ảo, điện thoại không cần nét gấp 3 */
    W = w; H = h;
    cv.width = W * dpr; cv.height = H * dpr;
    if (!reduce) {
      const want = Math.round(Math.min(32, W / 48));
      const amb = parts.filter(p => p.kind === 'amb');
      if (amb.length < want) for (let i = amb.length; i < want; i++) parts.push(ambient());
      else amb.slice(want).forEach(p => parts.splice(parts.indexOf(p), 1));
    }
    start();
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.kind === 'amb') {
        p.y += (26 + 44 * p.z) * dt;
        p.x += Math.sin(now / 1100 + p.ph) * 22 * p.z * dt + 6 * dt;
        p.rot += p.vr * dt; p.fl += p.vf * dt;
        if (p.y > H + 40) { p.y = -30; p.x = rand(0, W); }
        draw(p, 9 + 17 * p.z, p.a);
      } else {
        p.life -= dt;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += (p.kind === 'spark' ? 40 : GRAVITY) * dt;
        const drag = Math.pow(p.kind === 'spark' ? .94 : .985, dt * 60);
        p.vx *= drag; p.vy *= drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt; p.fl += p.vf * dt;
        const a = Math.min(1, p.life / p.max * 2.2);
        if (p.kind === 'spark') spark(p, a); else draw(p, p.r, a);
      }
    }
    if (!hidden && parts.length) raf = requestAnimationFrame(frame); else raf = 0;
  }

  function draw(p, size, alpha) {
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.scale(size, size * Math.cos(p.fl));
    ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
    ctx.fill(PETAL);
    ctx.restore();
  }

  function spark(p, a) {
    ctx.globalAlpha = a; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function start() { if (!raf && !hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* Nổ cánh hoa từ (x, y). colors: mảng màu hex tuỳ chọn. */
  function burst(x, y, { count = 22, power = 1, colors = COLORS } = {}) {
    if (reduce) return;
    for (let i = 0; i < count; i++) {
      const ang = rand(0, 6.283), sp = rand(120, 460) * power;
      parts.push({
        kind: 'burst', x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 160 * power,
        r: rand(9, 22), rot: rand(0, 6.28), vr: rand(-6, 6), fl: rand(0, 6.28), vf: rand(3, 8),
        life: rand(1.6, 3), max: 3, color: pick(colors)
      });
    }
    start();
  }

  function trail(x, y) {
    if (reduce) return;
    parts.push({ kind: 'spark', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-20, 20), vy: rand(-10, 30), r: rand(1, 2.6), rot: 0, vr: 0, fl: 0, vf: 0, life: rand(.5, .9), max: .9, color: pick(['#f0cf9b', '#ffd2cf', '#ffffff']) });
    start();
  }

  /* Pháo hoa cánh hoa trên toàn màn hình. */
  function fireworks(colors) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => burst(rand(W * .12, W * .88), rand(H * .18, H * .55), { count: W < 700 ? 30 : 46, power: 1.5, colors }), i * 260);
    }
  }

  let lx = 0, ly = 0, acc = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    acc += Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
    if (acc > 34) { acc = 0; trail(lx, ly); }
  }, { passive: true });

  addEventListener('pointerdown', e => {
    if (e.target.closest('a,button,input,textarea,label,select,[data-no-fx]')) return;
    burst(e.clientX, e.clientY, { count: 12, power: .6 });
  });

  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (!hidden) start(); });
  addEventListener('resize', resize);
  resize();

  return { burst, fireworks, trail, COLORS };
})();
