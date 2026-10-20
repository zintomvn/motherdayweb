/* Vẽ hoa bằng canvas: mỗi loài một cách vẽ riêng, nở dần theo tham số p (0 → 1). */

const Flower = (() => {
  const TAU = Math.PI * 2, GOLD = 2.399963, DEG = Math.PI / 180;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));   /* p chạy trong [a, b] → 0..1 */
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const back = x => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  /* Mở chậm hơn back: chồi vẫn còn nhỏ và khép khi p ≈ 0.3, rồi nhô nhẹ qua cỡ thật ở cuối. */
  const unfurl = x => 1 - Math.pow(1 - x, 1.8) + .1 * Math.sin(Math.PI * clamp((x - .5) * 2));
  const out3 = x => 1 - Math.pow(1 - x, 3);
  const inOut = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  /* c = [gốc, giữa, mép] của cánh; glow = quầng sáng; bg = nền thiệp; tint = nền thẻ sáng.
     Mỗi khoá là một loài: hong=hoa hồng, dao=hoa đào, tim=lan, vang=hướng dương, trang=huệ, cam=sen
     (giữ khoá cũ để link chia sẻ đã gửi vẫn mở được). */
  const RAW = {
    hong:  { kind: 'rose',      name: 'Hoa hồng',    c: ['#5c0a28', '#c92d56', '#ff9db4'], glow: '255,96,140',  bg: ['#2a0a1f', '#7a1d4a'], tint: ['#ffffff', '#ffe1e8'] },
    dao:   { kind: 'blossom',   name: 'Hoa đào',     c: ['#d6336c', '#f7a1bd', '#fff0f4'], glow: '255,150,170', bg: ['#34101f', '#b04a68'], tint: ['#ffffff', '#ffe6ee'] },
    tim:   { kind: 'orchid',    name: 'Lan hồ điệp', c: ['#3d1470', '#9b53cf', '#f0dcff'], glow: '180,140,255', bg: ['#150a2e', '#4d3490'], tint: ['#ffffff', '#ece4ff'] },
    vang:  { kind: 'sunflower', name: 'Hướng dương', c: ['#c25a08', '#ffb01f', '#ffe680'], glow: '255,200,90',  bg: ['#2e1507', '#8f4b14'], tint: ['#fffdf5', '#fff0c9'] },
    trang: { kind: 'lily',      name: 'Huệ trắng',   c: ['#9fb067', '#fffaf4', '#f2c9d4'], glow: '255,235,235', bg: ['#1d1020', '#5a3a5e'], tint: ['#ffffff', '#f6ecf0'] },
    cam:   { kind: 'lotus',     name: 'Sen hồng',    c: ['#fff0b0', '#ffc3d4', '#ee4580'], glow: '255,140,180', bg: ['#06202a', '#1f6b66'], tint: ['#ffffff', '#e4f5f0'] }
  };
  const PAL = Object.create(null);   /* không kế thừa: #f=constructor không được lọt qua PAL[SHARE.f] */
  for (const k in RAW) PAL[k] = { ...RAW[k], key: k, rgb: RAW[k].c.map(hex) };

  const rng = seed => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const many = (n, f) => Array.from({ length: n }, f);

  /* Số ngẫu nhiên dựng một lần cho mỗi (loài, seed) để mọi khung hình giống nhau. */
  const BUILD = {
    rose: (r, n) => ({
      petals: many(n, (_, i) => {
        const t = i / (n - 1);
        return { t, a: i * GOLD + (r() - .5) * .1, len: (.16 + .84 * Math.pow(t, .78)) * (.94 + r() * .12), w: .66 - .16 * t, j: r() - .5 };
      })
    }),
    blossom: r => ({
      len: many(5, () => .96 + r() * .08),
      wob: many(5, () => r() - .5),
      st: many(38, () => ({ a: r() * TAU, l: .2 + r() * .22, k: r() }))
    }),
    orchid: () => ({}),
    sunflower: r => ({
      ray: many(78, () => ({ a: (r() - .5) * .09, l: .9 + r() * .14 })),
      br: many(20, () => r())
    }),
    lily: r => ({
      spk: many(66, () => ({ t: .14 + r() * .5, y: (r() - .5) * .8, s: .6 + r() * .7 })),
      j: many(6, () => r() - .5)
    }),
    lotus: r => ({
      j: many(30, () => r() - .5),
      st: many(46, () => ({ a: r() * TAU, l: .1 + r() * .12 }))
    })
  };
  const cache = new Map();
  const jit = (kind, seed, n) => {
    const key = `${kind}:${seed}:${n}`;
    let j = cache.get(key);
    if (!j) cache.set(key, j = BUILD[kind](rng(seed), n));
    return j;
  };

  /* Hình cánh, gốc ở (0,0), chiều dài L dọc trục +x, nửa bề ngang W. */
  const SHAPE = {
    round(ctx, L, W) {          /* hồng: cánh tròn như chiếc quạt */
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * .12, -W * .75, L * .6, -W * 1.3, L * .95, -W * .5);
      ctx.quadraticCurveTo(L * 1.08, 0, L * .95, W * .5);
      ctx.bezierCurveTo(L * .6, W * 1.3, L * .12, W * .75, 0, 0);
      ctx.closePath();
    },
    notch(ctx, L, W) {          /* đào: cánh tròn, xẻ lõm ở đầu */
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * .08, -W * .55, L * .28, -W * 1.25, L * .7, -W * 1.05);
      ctx.bezierCurveTo(L * .98, -W * .9, L * 1.04, -W * .3, L * .99, -W * .1);
      ctx.quadraticCurveTo(L * .86, 0, L * .99, W * .1);
      ctx.bezierCurveTo(L * 1.04, W * .3, L * .98, W * .9, L * .7, W * 1.05);
      ctx.bezierCurveTo(L * .28, W * 1.25, L * .08, W * .55, 0, 0);
      ctx.closePath();
    },
    broad(ctx, L, W) {          /* lan: cánh bầu, gần như tròn */
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * .05, -W * .9, L * .45, -W * 1.45, L * .8, -W * .9);
      ctx.bezierCurveTo(L * 1.02, -W * .5, L * 1.02, W * .5, L * .8, W * .9);
      ctx.bezierCurveTo(L * .45, W * 1.45, L * .05, W * .9, 0, 0);
      ctx.closePath();
    },
    pointed(ctx, L, W) {        /* huệ, sen, tia hướng dương: nhọn đầu */
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(L * .22, -W * 1.3, L * .68, -W * 1.1, L, 0);
      ctx.bezierCurveTo(L * .68, W * 1.1, L * .22, W * 1.3, 0, 0);
      ctx.closePath();
    }
  };

  /* Dải màu chạy dọc cánh (từ gốc tới mép). */
  const along = (ctx, L, stops) => {
    const g = ctx.createLinearGradient(0, 0, L, 0);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  };
  const dot = (ctx, x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); };
  const disc = (ctx, x, y, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };

  /* ── Mỗi hàm vẽ vào hệ toạ độ đã dời về tâm; R là bán kính tối đa của hoa. ── */
  const DRAW = {};

  /* Hồng: cánh tròn xếp xoắn theo góc vàng, cánh ngoài nở rộng, lõi cuộn chặt. */
  DRAW.rose = (ctx, R, pal, p, J) => {
    const [dk, md, lt] = pal.rgb;
    for (let i = J.petals.length - 1; i >= 0; i--) {
      const q = J.petals[i], local = seg(p, q.t * .5, q.t * .5 + .5);
      if (local <= 0) continue;
      const L = R * q.len * back(local), W = L * q.w;
      const base = mix(dk, [18, 0, 12], (1 - q.t) * .3);
      const mid = mix(md, q.j > 0 ? lt : dk, Math.abs(q.j) * .5);
      const tip = mix(lt, [255, 255, 255], q.t * .25);
      ctx.save();
      ctx.globalAlpha = Math.min(1, local * 4);
      ctx.rotate(q.a + (1 - local) * .9);
      ctx.translate(L * .07, 0);
      SHAPE.round(ctx, L, W);
      ctx.lineWidth = R * .014; ctx.strokeStyle = 'rgba(20,0,12,.22)'; ctx.stroke();
      ctx.fillStyle = along(ctx, L, [[0, css(base)], [.5, css(mid)], [1, css(tip)]]); ctx.fill();
      ctx.lineWidth = R * .004; ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.stroke();
      ctx.restore();
    }
  };

  /* Đào: năm cánh tròn xẻ đầu, gân mảnh, nhụy với nhiều tua phấn vàng. */
  DRAW.blossom = (ctx, R, pal, p, J) => {
    const [dk, md, lt] = pal.rgb;
    for (let i = 0; i < 5; i++) {
      const local = unfurl(seg(p, i * .025, .9 + i * .025));
      if (local <= 0) continue;
      const L = R * J.len[i] * local, W = L * lerp(.64, .5, clamp(local));
      ctx.save();
      ctx.globalAlpha = Math.min(1, local * 4);
      ctx.rotate(i * TAU / 5 - Math.PI / 2 + J.wob[i] * .1 + (1 - local) * .9);
      SHAPE.notch(ctx, L, W);
      ctx.lineWidth = R * .016; ctx.strokeStyle = css(mix(dk, [90, 0, 40], .5), .22); ctx.stroke();
      ctx.fillStyle = along(ctx, L, [[0, css(dk)], [.42, css(md)], [1, css(lt)]]); ctx.fill();
      ctx.lineWidth = R * .004; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.stroke();
      ctx.clip();
      ctx.strokeStyle = css(dk, .22); ctx.lineWidth = R * .005;
      ctx.beginPath();
      for (const k of [-.75, -.4, 0, .4, .75]) { ctx.moveTo(L * .05, 0); ctx.quadraticCurveTo(L * .5, k * W * .5, L * .9, k * W * .85); }
      ctx.stroke();
      ctx.restore();
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .3);
    core.addColorStop(0, css(mix(dk, [150, 0, 60], .6), .9 * out3(seg(p, .15, .6))));
    core.addColorStop(1, css(dk, 0));
    disc(ctx, 0, 0, R * .3, core);

    const sp = seg(p, .45, 1);
    if (sp <= 0) return;
    const e = out3(sp), r0 = R * .035, tip = s => [Math.cos(s.a) * (r0 + R * s.l * e), Math.sin(s.a) * (r0 + R * s.l * e)];
    ctx.strokeStyle = css(mix(lt, md, .4), .95); ctx.lineWidth = R * .0065;
    ctx.beginPath();
    for (const s of J.st) {
      const c = Math.cos(s.a), n = Math.sin(s.a), l = R * s.l * e, bend = (s.k - .5) * l * .45;
      ctx.moveTo(c * r0, n * r0);
      ctx.quadraticCurveTo(c * (r0 + l * .55) - n * bend, n * (r0 + l * .55) + c * bend, ...tip(s));
    }
    ctx.stroke();
    for (const [col, warm] of [['#ffd23f', true], ['#ff9a2e', false]]) {
      ctx.fillStyle = col; ctx.beginPath();
      for (const s of J.st) if ((s.k > .35) === warm) dot(ctx, ...tip(s), R * .014);
      ctx.fill();
    }
    disc(ctx, 0, 0, R * .024 * e, '#d4e48c');
  };

  /* Lan hồ điệp: ba cánh đài, hai cánh to tròn, môi dưới có râu, trụ nhuỵ trắng. */
  DRAW.orchid = (ctx, R, pal, p) => {
    const [dk, md, lt] = pal.rgb;
    const petal = (deg, len, wid, a, b) => {
      const local = unfurl(seg(p, a, b));
      if (local <= 0) return;
      const L = R * len * local, W = R * wid * local * lerp(1.5, 1, clamp(local));
      ctx.save();
      ctx.globalAlpha = Math.min(1, local * 4);
      ctx.rotate(deg * DEG + (1 - local) * .35);
      SHAPE.broad(ctx, L, W);
      ctx.lineWidth = R * .014; ctx.strokeStyle = css(dk, .28); ctx.stroke();
      ctx.fillStyle = along(ctx, L, [[0, css(mix(dk, md, .25))], [.38, css(md)], [.85, css(mix(md, lt, .65))], [1, css(lt)]]); ctx.fill();
      ctx.lineWidth = R * .004; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.stroke();
      ctx.clip();
      ctx.strokeStyle = css(dk, .24); ctx.lineWidth = R * .0045;
      ctx.beginPath();
      for (let k = -3; k <= 3; k++) { ctx.moveTo(L * .04, 0); ctx.quadraticCurveTo(L * .45, k * W * .28, L * .92, k * W * .62 * (1 - Math.abs(k) * .06)); }
      ctx.stroke();
      ctx.restore();
    };
    petal(50, .88, .24, 0, .9);
    petal(130, .88, .24, .03, .93);
    petal(-90, .9, .25, .06, .96);
    petal(-6, .98, .4, .15, 1);
    petal(186, .98, .4, .17, 1);

    const lp = back(seg(p, .45, .95));
    if (lp > 0) {
      const lipD = mix(dk, [120, 20, 110], .35), lipL = mix(md, [255, 120, 200], .35);
      ctx.save();
      ctx.rotate(90 * DEG);
      ctx.globalAlpha = Math.min(1, lp * 4);
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.rotate(s * 68 * DEG);
        const L = R * .32 * lp;
        SHAPE.broad(ctx, L, R * .1 * lp);
        ctx.fillStyle = along(ctx, L, [[0, css(lipD)], [1, css(lipL)]]); ctx.fill();
        ctx.lineWidth = R * .005; ctx.strokeStyle = css(dk, .4); ctx.stroke();
        ctx.restore();
      }
      const L = R * .52 * lp;
      SHAPE.pointed(ctx, L, R * .15 * lp);
      ctx.fillStyle = along(ctx, L, [[0, css(lipD)], [.6, css(mix(lipD, lipL, .5))], [1, css(lipL)]]); ctx.fill();
      ctx.lineWidth = R * .005; ctx.strokeStyle = css(dk, .45); ctx.stroke();
      ctx.strokeStyle = css(lipD); ctx.lineWidth = R * .012; ctx.lineCap = 'round';
      ctx.beginPath();
      for (const s of [-1, 1]) { ctx.moveTo(L * .97, 0); ctx.bezierCurveTo(L * 1.1, s * R * .02, L * 1.14, s * R * .08, L * 1.08, s * R * .13); }
      ctx.stroke();
      ctx.fillStyle = '#ffcf3d'; ctx.beginPath(); ctx.ellipse(R * .09 * lp, 0, R * .07 * lp, R * .045 * lp, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(200,80,20,.6)'; ctx.beginPath();
      for (const [x, y] of [[.07, -.02], [.1, .015], [.12, -.01]]) dot(ctx, R * x * lp, R * y * lp, R * .006);
      ctx.fill();
      ctx.restore();
    }
    const cp = seg(p, .6, 1);
    if (cp > 0) {
      const r = R * .075 * out3(cp);
      const g = ctx.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, css(mix(lt, md, .35)));
      disc(ctx, 0, 0, r, g);
      ctx.lineWidth = R * .004; ctx.strokeStyle = css(dk, .4); ctx.stroke();
      disc(ctx, 0, r * .4, r * .22, '#ffe27a');
    }
  };

  /* Hướng dương: chồi xanh nở ra ba vòng tia vàng, đĩa hạt xếp xoắn Fibonacci. */
  DRAW.sunflower = (ctx, R, pal, p, J) => {
    const [dk, md, lt] = pal.rgb;
    const open = out3(seg(p, .22, 1)), dR = R * lerp(.2, .4, out3(seg(p, 0, .85)));

    const bl = clamp(p * 6);
    if (bl > 0) {
      for (let i = 0; i < 20; i++) {
        const L = R * (.5 + J.br[i] * .12) * bl;
        ctx.save();
        ctx.rotate(i * TAU / 20 + J.br[i] * .1);
        SHAPE.pointed(ctx, L, R * .11);
        ctx.fillStyle = along(ctx, L, [[0, '#2a5f26'], [1, '#8fc45a']]); ctx.fill();
        ctx.lineWidth = R * .004; ctx.strokeStyle = 'rgba(20,50,15,.45)'; ctx.stroke();
        ctx.restore();
      }
    }
    if (open > 0) {
      for (let r = 0; r < 3; r++) {
        const shade = (2 - r) * .16;
        const c0 = mix(dk, [90, 30, 0], shade), c1 = mix(md, dk, shade), c2 = mix(lt, md, shade);
        for (let i = 0; i < 26; i++) {
          const j = J.ray[r * 26 + i], r0 = dR * .75, L = R * (1 - r * .06) * j.l * open - r0;
          if (L <= 0) continue;
          ctx.save();
          ctx.rotate((i + r / 3) * TAU / 26 + j.a);
          ctx.translate(r0, 0);
          SHAPE.pointed(ctx, L, R * .072 * (1 + r * .08));
          ctx.fillStyle = along(ctx, L, [[0, css(c0)], [.4, css(c1)], [1, css(c2)]]); ctx.fill();
          ctx.lineWidth = R * .003; ctx.strokeStyle = css(dk, .4); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * .9, 0);
          ctx.strokeStyle = css(dk, .22); ctx.lineWidth = R * .0035; ctx.stroke();
          ctx.restore();
        }
      }
    }

    const sh = ctx.createRadialGradient(0, 0, dR * .9, 0, 0, dR * 1.2);
    sh.addColorStop(0, 'rgba(60,20,0,.5)'); sh.addColorStop(1, 'rgba(60,20,0,0)');
    disc(ctx, 0, 0, dR * 1.2, sh);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, dR);
    g.addColorStop(0, '#1b0b03'); g.addColorStop(.62, '#3a1d08'); g.addColorStop(.88, '#6f4710'); g.addColorStop(1, '#b8801f');
    disc(ctx, 0, 0, dR, g);

    const N = 340, c = dR / Math.sqrt(N), sr = c * .42;
    for (const [col, from, to, dx, dy, k] of [
      ['rgba(8,3,0,.5)', 1, N, 0, 0, 1],
      ['rgba(255,190,90,.3)', 1, N, -.25, -.3, .5],
      ['rgba(236,170,40,.85)', N * .82, N, 0, 0, 1]
    ]) {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = Math.ceil(from); i <= to; i++) {
        const rad = c * Math.sqrt(i), a = i * GOLD;
        dot(ctx, rad * Math.cos(a) + dx * sr, rad * Math.sin(a) + dy * sr, sr * k);
      }
      ctx.fill();
    }
  };

  /* Huệ: sáu cánh nhọn cong đầu, họng xanh, đốm hồng, sáu nhị với bao phấn nâu cam. */
  DRAW.lily = (ctx, R, pal, p, J) => {
    const [gr, wh, bl] = pal.rgb;
    const tepal = (deg, len, wid, a, b, grp) => {
      const local = unfurl(seg(p, a, b));
      if (local <= 0) return;
      const L = R * len * local, W = R * wid * lerp(1.45, 1, clamp(local));
      ctx.save();
      ctx.globalAlpha = Math.min(1, local * 4);
      ctx.rotate(deg * DEG + (1 - local) * .7);
      SHAPE.pointed(ctx, L, W);
      ctx.lineWidth = R * .014; ctx.strokeStyle = 'rgba(130,70,95,.3)'; ctx.stroke();
      ctx.fillStyle = along(ctx, L, [[0, css(gr)], [.2, css(mix(gr, wh, .65))], [.5, css(wh)], [.86, css(mix(wh, bl, .6))], [1, css(bl)]]); ctx.fill();
      ctx.clip();
      ctx.lineCap = 'round';
      ctx.strokeStyle = css(mix(gr, wh, .3), .5); ctx.lineWidth = R * .012;
      ctx.beginPath(); ctx.moveTo(L * .04, 0); ctx.lineTo(L * .88, 0); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,100,120,.16)'; ctx.lineWidth = R * .004;
      ctx.beginPath();
      for (const k of [-.55, -.3, .3, .55]) { ctx.moveTo(L * .08, 0); ctx.quadraticCurveTo(L * .45, k * W * .7, L * .9, k * W * .15); }
      ctx.stroke();
      if (grp !== undefined) {
        ctx.fillStyle = 'rgba(168,60,96,.55)'; ctx.beginPath();
        for (let i = 0; i < 22; i++) { const s = J.spk[grp * 22 + i]; dot(ctx, L * s.t, s.y * W * .5, R * .0085 * s.s); }
        ctx.fill();
      }
      ctx.restore();
    };
    tepal(-90, 1, .2, 0, .9);
    tepal(30, 1, .2, .03, .93);
    tepal(150, 1, .2, .06, .96);
    tepal(-30, .96, .27, .1, 1, 0);
    tepal(90, .96, .27, .12, 1, 1);
    tepal(210, .96, .27, .14, 1, 2);

    const throat = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .28);
    throat.addColorStop(0, css(mix(gr, [200, 215, 90], .4), .9 * seg(p, .1, .5))); throat.addColorStop(1, css(gr, 0));
    disc(ctx, 0, 0, R * .28, throat);

    const sp = seg(p, .55, 1);
    if (sp <= 0) return;
    const e = out3(sp);
    ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 + 30 + J.j[k] * 14) * DEG, l = R * (.5 + J.j[k] * .06) * e;
      const x = Math.cos(a) * l, y = Math.sin(a) * l;
      ctx.strokeStyle = '#e4ecc4'; ctx.lineWidth = R * .014;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a + .14) * l * .5, Math.sin(a + .14) * l * .5, x, y); ctx.stroke();
      ctx.fillStyle = '#9a3a0a'; ctx.beginPath(); ctx.ellipse(x, y, R * .075, R * .025, a + J.j[k], 0, TAU); ctx.fill();
      ctx.fillStyle = '#e08a30'; ctx.beginPath(); ctx.ellipse(x - R * .01, y - R * .006, R * .045, R * .011, a + J.j[k], 0, TAU); ctx.fill();
    }
    const pl = R * .62 * e, pa = 100 * DEG;
    ctx.strokeStyle = '#dfe8b8'; ctx.lineWidth = R * .018;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(pa) * pl, Math.sin(pa) * pl); ctx.stroke();
    disc(ctx, Math.cos(pa) * pl, Math.sin(pa) * pl, R * .03 * e, '#dfe6a0');
  };

  /* Sen: bốn vòng cánh nhọn từ ngoài vào trong, nhị vàng quanh đài sen. */
  DRAW.lotus = (ctx, R, pal, p, J) => {
    const [yl, pk, dp] = pal.rgb;
    const RINGS = [[8, 1, .3, 0, .9], [8, .86, .29, .05, .95], [7, .7, .28, .1, 1], [6, .52, .26, .15, 1]];
    let k = 0;
    RINGS.forEach(([n, len, wid, a, b], ri) => {
      const local = unfurl(seg(p, a, b));
      for (let i = 0; i < n; i++) {
        const j = J.j[k++];
        if (local <= 0) continue;
        const L = R * len * (.97 + j * .06) * local, W = L * wid * lerp(1.4, 1, clamp(local));
        ctx.save();
        ctx.globalAlpha = Math.min(1, local * 4);
        ctx.rotate((i + (ri % 2) * .5) * TAU / n + ri * .16 + j * .05 + (1 - local) * .8);
        ctx.translate(L * .05, 0);
        SHAPE.pointed(ctx, L, W);
        ctx.lineWidth = R * .012; ctx.strokeStyle = css(dp, .22); ctx.stroke();
        ctx.fillStyle = along(ctx, L, [[0, css(yl)], [.28, css(mix(yl, pk, .75))], [.62, css(pk)], [1, css(dp)]]); ctx.fill();
        ctx.clip();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,.34)'; ctx.lineWidth = R * .008;
        ctx.beginPath(); ctx.moveTo(L * .1, 0); ctx.lineTo(L * .86, 0); ctx.stroke();
        ctx.strokeStyle = css(dp, .2); ctx.lineWidth = R * .004;
        ctx.beginPath();
        for (const v of [-.7, -.4, .4, .7]) { ctx.moveTo(L * .12, 0); ctx.quadraticCurveTo(L * .5, v * W * .6, L * .88, v * W * .2); }
        ctx.stroke();
        ctx.restore();
      }
    });

    const sp = seg(p, .5, 1);
    if (sp <= 0) return;
    const e = out3(sp), pr = R * .115 * e;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffd23c'; ctx.lineWidth = R * .008;
    ctx.beginPath();
    for (const s of J.st) { const c = Math.cos(s.a), n = Math.sin(s.a), l = pr + R * s.l * e; ctx.moveTo(c * pr, n * pr); ctx.lineTo(c * l, n * l); }
    ctx.stroke();
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath();
    for (const s of J.st) { const l = pr + R * s.l * e; dot(ctx, Math.cos(s.a) * l, Math.sin(s.a) * l, R * .011 * e); }
    ctx.fill();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, pr);
    g.addColorStop(0, '#f3ee9a'); g.addColorStop(1, '#a9b94a');
    disc(ctx, 0, 0, pr, g);
    ctx.lineWidth = R * .005; ctx.strokeStyle = 'rgba(127,143,44,.55)'; ctx.stroke();
    ctx.fillStyle = 'rgba(70,85,20,.7)'; ctx.beginPath();
    dot(ctx, 0, 0, R * .014 * e);
    for (let i = 0; i < 7; i++) dot(ctx, Math.cos(i * TAU / 7) * pr * .55, Math.sin(i * TAU / 7) * pr * .55, R * .012 * e);
    ctx.fill();
  };

  /* Vẽ vào hình vuông S×S (ctx đã scale theo dpr, caller tự clear). */
  function draw(ctx, S, pal, p, o = {}) {
    const R = S * .44, kind = DRAW[pal.kind] ? pal.kind : 'rose';
    const J = jit(kind, o.seed || 7, o.n || 72);
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate((o.rot || 0) + (1 - p) * 1.1);

    const glow = (o.glow ?? 1) * clamp(p * 1.6);
    if (glow > 0) {
      const GR = S / 2;   /* quầng sáng không vượt khung canvas, tránh lộ viền vuông */
      const g = ctx.createRadialGradient(0, 0, R * .1, 0, 0, GR);
      g.addColorStop(0, `rgba(${pal.glow},${.5 * glow})`);
      g.addColorStop(1, `rgba(${pal.glow},0)`);
      disc(ctx, 0, 0, GR, g);
    }
    ctx.lineCap = ctx.lineJoin = 'round';
    DRAW[kind](ctx, R, pal, p, J);
    ctx.restore();
  }

  /* Gắn hoa vào một <canvas> (CSS phải tự định kích thước). Trả về điều khiển bloom. */
  function mount(canvas, pal, o = {}) {
    const ctx = canvas.getContext('2d');
    let S = 0, dpr = 1, p = o.bloom ?? 1, raf = 0;
    const render = () => {
      if (!S) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      draw(ctx, S, pal, p, o);
    };
    const fit = () => {
      const w = canvas.offsetWidth;   /* kích thước bố cục, không bị scale/rotate của khung cha làm mờ */
      if (!w || w === S) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      S = w; canvas.width = canvas.height = Math.round(w * dpr);
      render();
    };
    new ResizeObserver(fit).observe(canvas);
    fit();
    return {
      set(v) { cancelAnimationFrame(raf); p = v; render(); },
      to(target, ms = 1400, done) {
        cancelAnimationFrame(raf);
        const from = p, t0 = performance.now();
        const step = now => {
          const x = clamp((now - t0) / ms);
          p = from + (target - from) * inOut(x);
          render();
          if (x < 1) raf = requestAnimationFrame(step); else if (done) done();
        };
        raf = requestAnimationFrame(step);
      },
      get p() { return p; }
    };
  }

  return { PAL, draw, mount };
})();
