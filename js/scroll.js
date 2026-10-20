/* Mọi hiệu ứng gắn với cuộn trang: tiến độ, tuyên ngôn, bó hoa tự gói, lời chúc cuộn ngang, hiện dần. */

(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* Tiến độ 0→1 của một khối cao hơn màn hình (dùng cho section có sticky bên trong). */
  const progress = el => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  };

  /* ── Hiện dần ── */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });   /* threshold 0: khối cao (form) vẫn hiện được trên màn hình thấp */
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  /* ── Tuyên ngôn: tách từng từ, *từ* in nghiêng là điểm nhấn, | là xuống đoạn ── */
  const mText = $('#manifestoText'), manifesto = $('#manifesto');
  const words = [];
  mText.dataset.text.split(/\s*\|\s*/).forEach((para, i) => {
    if (i) mText.append(Object.assign(document.createElement('span'), { className: 'br' }));
    para.split(/(\*[^*]+\*)/).forEach(seg => {
      const em = seg.startsWith('*');
      seg.replace(/\*/g, '').split(/\s+/).filter(Boolean).forEach(w => {
        const s = document.createElement('span');
        s.className = 'w' + (em ? ' em' : '');
        s.textContent = w;
        mText.append(s, ' ');
        words.push(s);
      });
    });
  });
  let lit = 0;

  /* ── Bó hoa: cành mọc chụm về nút buộc, hoa nở từ hàng sau ra trước, giấy gói khép lại, thắt nơ ── */
  const bouquet = $('#bo-hoa'), bq = $('#bq'), spot = $('#bqSpot'), front = $('#bqFront');
  const NS = 'http://www.w3.org/2000/svg', PX = 200, PY = 452;   /* nút buộc, trong hệ 400×600 của bó hoa */
  const svgEl = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.append(el);
    return el;
  };
  /* Cành: từ gốc cắt (y 598) chụm vào nút buộc rồi toả lên (x, y); đoạn trên là bezier (px,PY) (px,404) (x,c2) (x,y) */
  const curve = (x, y) => [PX + (x - PX) * .02, y + (PY - y) * .45];
  const stemD = (x, y) => {
    const bx = (PX + (x - PX) * .12).toFixed(1), [px, c2] = curve(x, y).map(v => v.toFixed(1));
    return `M${bx} 598C${bx} 530 ${px} 500 ${px} ${PY}S${x.toFixed(1)} ${c2} ${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  const bez = (a, b, c, d, t) => { const u = 1 - t; return [u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d, 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c)]; };   /* [giá trị, đạo hàm] */
  const stems = [], pops = [];   /* pops: lá và chùm bi bật ra khi tới lượt */
  const addStem = (x, y, at, stroke, width, parent) =>
    stems.push({ el: svgEl('path', { d: stemD(x, y), pathLength: 1, class: 'bq-stem', stroke, 'stroke-width': width }, parent), at, v: -1 });

  const green = $('#bqGreen'), stemBox = $('#bqStems'), buds = $('#bqBuds');
  const SPRIGS = [[-84, 196], [-62, 208], [-38, 214], [-14, 200], [10, 212], [34, 210], [58, 204], [82, 192], [-104, 170], [104, 172]];   /* [góc so với phương đứng, độ dài] từ (200, 220) */
  const LEAF = ['M0 0C1-8 15-10 17 0C15 10 1 8 0 0Z', 'M0 0C6-5 18-6 26 0C18 6 6 5 0 0Z'];   /* lá bạch đàn tròn · lá thon */
  SPRIGS.forEach(([deg, len], s) => {
    const r = deg * Math.PI / 180, x = PX + Math.sin(r) * len, y = 220 - Math.cos(r) * len, [px, c2] = curve(x, y);
    addStem(x, y, .04 + s * .008, '#6f9168', 1.6, green);
    for (let k = 0; k < 7; k++) {
      const t = .42 + k * .09, [lx, dx] = bez(px, px, x, x, t), [ly, dy] = bez(PY, 2 * PY - 500, c2, y, t);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI + (k === 6 ? 0 : k % 2 ? 52 : -52);   /* lá mọc so le, lá chót theo ngọn */
      const g = svgEl('g', { transform: `translate(${lx.toFixed(1)} ${ly.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${(1.2 - t * .45).toFixed(2)})` }, green);
      pops.push({ el: svgEl('path', { d: LEAF[s % 2], fill: s % 2 ? 'url(#bqLeaf)' : 'url(#bqEuc)', class: 'bq-leaf' }, g), at: .1 + t * .16 + s * .01, on: false });
    }
  });

  let seed = 11;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;   /* có hạt giống: lần nào mở cũng cùng một bó */
  [[34, 150], [148, 44], [262, 50], [372, 148], [24, 252], [380, 250]].forEach(([cx, cy], k) => {   /* hoa bi viền quanh */
    addStem(cx, cy + 20, .05 + k * .01, '#86a77c', 1, buds);
    const g = svgEl('g', { class: 'bq-bb' }, buds), dots = [];
    let twigs = '';
    for (let i = 0; i < 11; i++) {
      const a = rnd() * 6.283, d = 4 + rnd() * 12, x = (cx + Math.cos(a) * d).toFixed(1), y = (cy + Math.sin(a) * d * .8).toFixed(1);
      twigs += `M${cx} ${cy + 20}L${x} ${y}`;
      dots.push([x, y, (1.8 + rnd() * 1.8).toFixed(1)]);
    }
    svgEl('path', { d: twigs, fill: 'none', stroke: '#a8c49c', 'stroke-width': .6 }, g);
    for (const [x, y, r] of dots) svgEl('circle', { cx: x, cy: y, r, fill: '#fffaf2' }, g);
    pops.push({ el: g, at: .36 + k * .025, on: false });
  });

  const BLOOMS = [   /* [loài, x, y, đường kính, hàng] — vẽ từ sau ra trước, bông chính giữa cuối cùng */
    ['trang', 200, 100, 124, 0], ['tim', 118, 132, 104, 0], ['dao', 288, 128, 98, 0], ['dao', 66, 216, 88, 0], ['trang', 338, 210, 100, 0],
    ['hong', 136, 214, 120, 1], ['cam', 270, 204, 116, 1], ['trang', 86, 286, 96, 1], ['hong', 314, 284, 108, 1],
    ['tim', 140, 300, 92, 2], ['dao', 258, 306, 88, 2], ['hong', 200, 240, 168, 2]
  ];
  const STEM = ['#56804c', '#678f57', '#4c7444'];
  const blooms = BLOOMS.map(([key, x, y, d, depth], i) => {
    const hero = i === BLOOMS.length - 1, c = document.createElement('canvas');
    addStem(x, y, .02 + i * .006, STEM[i % 3], 2.4 + d / 120, stemBox);
    c.className = `bq__f bq__f--d${depth}`;
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `left:${x / 4}%;top:${y / 6}%;width:${(d / .88 / 4).toFixed(2)}%`;   /* cánh dài tối đa .44 cạnh canvas */
    front.before(c);
    const m = Flower.mount(c, Flower.PAL[key], { bloom: 0, n: hero ? 72 : 44, seed: 21 + i * 11, glow: hero ? .55 : .3, rot: i * 2.1 });
    return { c, m, q: -1, at: .17 + i / 11 * .3 };
  });

  const [tissue, backL, backR] = bq.querySelectorAll('.bq__back .bq-wrap'), [sheetL, sheetR] = front.querySelectorAll('.bq-sheet');
  const bow = $('#bqBow'), string = $('#bqString'), tag = $('#bqTag'), steps = [...$('#bqSteps').children];
  const out3 = t => 1 - (1 - t) ** 3, back = t => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;   /* back: vượt ~5% rồi về, như tay ôm giấy */
  let step = -1, tied = false, tagged = false, popped = false, lastWrap = '';

  /* ── Lời chúc: màn lớn cuộn ngang; màn nhỏ là chồng thẻ dính (CSS lo hết, JS đứng ngoài) ── */
  const wishes = $('#loi-chuc'), track = $('#wishesTrack'), meter = $('#wishesMeter');
  const deck = matchMedia('(max-width: 768px)');
  let maxX = 0, cards = [], vw = 0, lastPs = -1, lastPw = -1, pending = false;
  const measure = () => {
    vw = innerWidth; lastPw = -1;
    if (reduce || deck.matches) {
      for (const { art } of cards) art.style.transform = '';
      maxX = 0; cards = []; wishes.style.height = track.style.transform = '';
      return;
    }
    maxX = Math.max(0, track.scrollWidth - innerWidth);
    wishes.style.height = `calc(${maxX}px + 100vh)`;   /* 100vh: thanh địa chỉ di động ẩn/hiện không bắt đo lại */
    cards = [...track.querySelectorAll('.wcard__art')].map(art => {
      const el = art.closest('.wcard');
      return { art, c: el.offsetLeft + el.offsetWidth / 2 };
    });
  };

  /* Tab tới thẻ nằm ngoài màn hình: cuộn trang tới đúng vị trí thay vì để trình duyệt cuộn khung ghim. */
  track.addEventListener('focusin', e => {
    const c = e.target.closest('.wcard');
    if (!c || !maxX) return;
    const f = clamp((c.offsetLeft + c.offsetWidth / 2 - innerWidth / 2) / Math.max(1, maxX));
    scrollTo({ top: wishes.getBoundingClientRect().top + scrollY + f * maxX, behavior: 'instant' });
  });

  const bar = $('.progress i');
  let ticking = false;

  const BUDGET = matchMedia('(pointer: coarse)').matches ? 2 : 4;   /* máy cảm ứng yếu hơn: mỗi khung vẽ ít hoa hơn */

  function update() {
    ticking = false;
    /* Đọc hết vị trí rồi mới ghi style: đọc xen giữa các lần ghi ép trình duyệt tính lại bố cục nhiều lần mỗi khung. */
    const max = document.documentElement.scrollHeight - innerHeight;
    const pm = progress(manifesto), ps = progress(bouquet), pw = maxX ? progress(wishes) : 0;
    bar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, max))})`;
    if (reduce) return;

    const target = Math.round(clamp(pm / .8) * words.length);
    if (target !== lit) {
      const [a, b] = target > lit ? [lit, target] : [target, lit];
      for (let i = a; i < b; i++) words[i].classList.toggle('lit', target > lit);
      lit = target;
    }

    /* Ngoài khối thì tiến độ đứng yên ở 0 hoặc 1: khỏi ghi lại vài chục style mỗi khung. */
    if (ps !== lastPs || pending) { lastPs = ps; pending = paintBouquet(ps); if (pending) queue(); }

    if (maxX && pw !== lastPw) {
      lastPw = pw;
      track.style.transform = `translate3d(${-pw * maxX}px, 0, 0)`;
      meter.style.transform = `scaleX(${pw})`;
      const mid = vw / 2 + pw * maxX;
      for (const { art, c } of cards) art.style.transform = `translate3d(${(clamp((c - mid) / vw, -1, 1) * -34).toFixed(1)}px, 0, 0)`;
    }
  }

  /* Trả về true nếu còn hoa chưa kịp vẽ (hết lượt trong khung này). */
  function paintBouquet(ps) {
    const e = smooth(0, .9, ps);
    bq.style.transform = `translate3d(0, ${((1 - e) * 4).toFixed(2)}%, 0) scale(${(.9 + .1 * e).toFixed(4)})`;
    spot.style.opacity = .25 + .75 * smooth(.15, .85, ps);
    for (const s of stems) { const v = 1 - clamp((ps - s.at) / .22); if (v !== s.v) { s.v = v; s.el.style.strokeDashoffset = v; } }
    for (const p of pops) { const on = ps >= p.at; if (on !== p.on) { p.on = on; p.el.classList.toggle('on', on); } }

    /* Giấy lụa và hai lớp giấy sau xoè ra, rồi hai tờ trước xoay quanh nút buộc ôm vào (đuôi giấy luôn dính ở nút) */
    const fan = out3(clamp((ps - .48) / .2)), wl = clamp((ps - .58) / .2), wr = clamp((ps - .64) / .2);
    if (`${fan},${wl},${wr}` !== lastWrap) {
      lastWrap = `${fan},${wl},${wr}`;
      tissue.style.opacity = fan;
      tissue.style.transform = `scale(${.4 + .6 * fan})`;
      backL.style.opacity = backR.style.opacity = Math.min(1, fan * 3);
      backL.style.transform = `rotate(${(1 - fan) * 24}deg) scale(${.6 + .4 * fan})`;
      backR.style.transform = `rotate(${(1 - fan) * -24}deg) scale(${.6 + .4 * fan})`;
      const el = back(wl), er = back(wr);
      sheetL.style.opacity = Math.min(1, wl * 4);
      sheetL.style.transform = `rotate(${((1 - el) * -64).toFixed(2)}deg) scale(${(.88 + .12 * el).toFixed(4)})`;
      sheetR.style.opacity = Math.min(1, wr * 4);
      sheetR.style.transform = `rotate(${((1 - er) * 64).toFixed(2)}deg) scale(${(.88 + .12 * er).toFixed(4)})`;
    }

    if ((ps >= .83) !== tied) {
      tied = !tied;
      bow.classList.toggle('on', tied);
      if (tied && !popped) {   /* lần đầu thắt nơ: tung kim tuyến ngay tại nút */
        popped = true;
        const r = bq.getBoundingClientRect(), y = r.top + r.height * PY / 600;
        if (y > 0 && y < innerHeight) FX.burst(r.left + r.width / 2, y, { count: 30, power: .9, colors: ['#f0cf9b', '#ffd9a8', '#fff3e0', '#ff9db4', '#ffffff'] });
      }
    }
    if ((ps >= .88) !== tagged) { tagged = !tagged; tag.classList.toggle('on', tagged); string.classList.toggle('on', tagged); }
    const now = ps < .17 ? 0 : ps < .5 ? 1 : ps < .82 ? 2 : 3;
    if (now !== step) { step = now; steps.forEach((li, i) => { li.classList.toggle('done', i < now); li.classList.toggle('now', i === now); }); }

    let budget = BUDGET, more = false;   /* kéo nhanh thì nhiều hoa đổi nấc cùng lúc: mỗi khung vẽ vài bông, còn lại để khung sau */
    for (const f of blooms) {
      const q = Math.round(clamp((ps - f.at) / .22) * 24) / 24;   /* chỉ vẽ lại khi nấc nở đổi */
      if (q === f.q) continue;
      if (!budget--) { more = true; break; }
      f.q = q; f.c.style.opacity = Math.min(1, q * 6); f.m.set(q);
    }
    return more;
  }

  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => {
    lastPs = -1;
    if (innerWidth !== vw) measure();   /* chỉ đổi chiều cao (thanh địa chỉ di động) thì khỏi đo lại */
    queue();
  });

  /* Gọi sau khi thẻ lời chúc đã được dựng để đo lại chiều rộng. */
  window.Scroll = { measure: () => { measure(); queue(); } };
  if (reduce) while (paintBouquet(1));   /* giảm chuyển động: bó hoa gói sẵn */
  measure(); queue();
})();
