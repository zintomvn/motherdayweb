/* Thẻ lời chúc cuộn ngang + khu vườn: chạm nụ hoa để nở và nhận một lời chúc. */

(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ARROW = '<svg viewBox="0 0 16 16"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';

  /* ── 10 thẻ lời chúc ── */
  const track = $('#wishesTrack');
  const tilts = ['-1.6deg', '1.4deg', '-.8deg', '1.8deg', '-1.2deg'];
  WISHES.forEach((w, i) => {
    const pal = Flower.PAL[w.f];
    const li = document.createElement('li');
    li.className = 'wcard';
    li.style.setProperty('--tilt', tilts[i % tilts.length]);
    li.style.setProperty('--lift', (i % 2 ? '1.6rem' : '-1.4rem'));
    li.style.setProperty('--k', i);   /* thứ tự trong chồng thẻ trên điện thoại */
    li.innerHTML = `<div class="wcard__shell"><article class="wcard__core">
      <span class="wcard__num"></span>
      <div class="wcard__art"><canvas aria-hidden="true"></canvas></div>
      <h3></h3><p></p></article></div>`;
    li.querySelector('.wcard__num').textContent = String(i + 1).padStart(2, '0');
    li.querySelector('h3').textContent = w.t;
    li.querySelector('p').textContent = w.x;
    li.querySelector('.wcard__core').style.setProperty('--c1', pal.tint[0]);
    li.querySelector('.wcard__core').style.setProperty('--c2', pal.tint[1]);
    track.append(li);
    Flower.mount(li.querySelector('canvas'), pal, { seed: 30 + i * 7, n: 56, glow: .35 });
  });
  const end = document.createElement('li');
  end.className = 'wcard wcard--end';
  end.style.setProperty('--lift', '0rem');
  end.style.setProperty('--k', WISHES.length);
  end.innerHTML = `<div class="wcard__shell"><article class="wcard__core">
    <h3>Còn muôn vàn lời chúc<br>đang chờ <em>nở</em>…</h3>
    <a class="btn btn--primary" href="#khu-vuon"><span>Ghé khu vườn</span><span class="btn__icon">${ARROW}</span></a>
    </article></div>`;
  track.append(end);
  Scroll.measure();

  /* ── Khu vườn ── */
  const field = $('#gardenField'), note = $('#gardenNote');
  const noteName = $('#gardenFlower'), noteWish = $('#gardenWish');
  const count = $('#gardenCount'), done = $('#gardenDone');
  const keys = Object.keys(Flower.PAL);
  const pool = [...WISHES].sort(() => Math.random() - .5);
  let cursor = 0;
  const opened = new Set();

  const BUD = .3;   /* độ nở của nụ khi chưa chạm */
  const nextWish = () => pool[cursor++ % pool.length];

  keys.forEach((k, i) => {
    const pal = Flower.PAL[k];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gitem';
    b.setAttribute('aria-label', `Nở bông ${pal.name} và nhận lời chúc`);
    b.innerHTML = `<canvas aria-hidden="true"></canvas>
      <svg class="gitem__stem" viewBox="0 0 60 120" aria-hidden="true">
        <path class="stem" pathLength="1" d="M30 0C24 40 38 70 30 118"/>
        <path class="leaf" d="M32 74C46 62 54 66 58 58C52 80 42 84 32 74Z"/>
        <path class="leaf" d="M28 92C14 82 8 86 2 80C8 98 18 100 28 92Z"/>
      </svg>
      <span class="gitem__name"></span><span class="gitem__hint">Chạm để nở</span>`;
    b.querySelector('.gitem__name').textContent = pal.name;
    field.append(b);

    const f = Flower.mount(b.querySelector('canvas'), pal, { seed: 5 + i * 17, n: 72, glow: .55, bloom: reduce ? 1 : BUD });
    const peek = v => { if (!opened.has(k) && !reduce) f.to(v, 700); };
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') peek(.55); });
    b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') peek(BUD); });

    b.addEventListener('click', () => {
      const first = !opened.has(k);
      opened.add(k);
      b.classList.add('is-open');
      if (first) f.to(1, reduce ? 1 : 1500);
      const r = b.querySelector('canvas').getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: first ? 34 : 14, power: first ? 1.2 : .7, colors: [...pal.c, '#ffffff', '#f0cf9b'] });

      const w = nextWish();
      noteName.textContent = `${pal.name} · ${w.t}`;
      noteWish.textContent = w.x;
      note.classList.remove('swap'); void note.offsetWidth; note.classList.add('swap');

      count.textContent = `${opened.size} / ${keys.length} bông đã nở`;
      if (opened.size === keys.length && first) {
        done.hidden = false;
        setTimeout(() => FX.fireworks(), 700);
      }
    });
  });
})();
