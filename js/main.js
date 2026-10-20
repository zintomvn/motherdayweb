/* Khởi động: hero, sao, marquee, menu, cá nhân hoá theo link, kết. */

(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ── Sao: 4 nhóm mỗi bầu trời, mỗi nhóm một <i> mang ~18 sao bằng box-shadow, nhấp nháy lệch pha nhau ── */
  for (const stars of document.querySelectorAll('.stars')) {
    const hv = stars.offsetHeight / innerHeight * 100 || 100;
    for (let g = 0; g < 4; g++) {
      const dots = Array.from({ length: 18 }, () =>
        `${(Math.random() * 100).toFixed(1)}vw ${(Math.random() * hv).toFixed(1)}vh 0 ${(Math.random() * 1.2 - .4).toFixed(1)}px rgba(255,255,255,${(.45 + Math.random() * .55).toFixed(2)})`);
      const s = document.createElement('i');
      s.style.cssText = `box-shadow:${dots.join()};--d:${3 + g * 1.3}s;--dl:${-g * 1.7}s`;
      stars.append(s);
    }
  }

  /* ── Khối ra khỏi màn hình thì dừng animation lặp bên trong (sao, cực quang, hoa xoay, bó hoa, dải chữ) ── */
  const idle = new IntersectionObserver(es => { for (const e of es) e.target.classList.toggle('is-idle', !e.isIntersecting); });
  document.querySelectorAll('.hero, .bouquet, .marquee, .finale').forEach(el => idle.observe(el));

  /* ── Dải chữ chạy: nhân đôi để vòng lặp liền mạch ── */
  const set = ['Rạng rỡ', 'Dịu dàng', 'Mạnh mẽ', 'Yêu thương', 'Tự tin', 'Hạnh phúc', 'Bình yên', 'Tỏa sáng']
    .map(w => `<span>${w}</span><i></i>`).join('');
  $('#marquee').innerHTML = set + set;

  /* ── Hoa ở hero ── */
  const art = $('#heroArt'), tilt = $('#heroTilt');
  const pal = Flower.PAL.hong;
  const hero = Flower.mount($('#heroFlower'), pal, { bloom: 0, n: 84, seed: 3, glow: .9 });

  Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(() => {
    root.classList.add('is-ready');
    if (reduce) hero.set(1); else setTimeout(() => hero.to(1, 2800), 350);
  });

  art.addEventListener('click', e => {
    FX.burst(e.clientX, e.clientY, { count: 40, power: 1.3, colors: [...pal.c, '#ffffff', '#f0cf9b'] });
    if (!reduce) hero.to(.05, 600, () => hero.to(1, 2200));
  });

  art.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); art.click(); }
  });

  if (!reduce) {
    art.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `rotateX(${-y * 14}deg) rotateY(${x * 14}deg)`;
    });
    art.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ── Menu di động ── */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  menu.inert = true;
  const setMenu = open => {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    nav.toggleAttribute('data-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    menu.setAttribute('aria-hidden', !open);
    root.style.overflow = open ? 'hidden' : '';
    $('#top').inert = open;
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) { setMenu(false); burger.focus(); } });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 760) setMenu(false); });

  /* ── Kết: pháo hoa khi tới nơi, và khi bấm nút ── */
  const finale = $('#finale');
  new IntersectionObserver((es, o) => {
    if (es[0].isIntersecting) { FX.fireworks(); o.disconnect(); }
  }, { threshold: .3 }).observe(finale);

  $('#btnFinale').addEventListener('click', e => {
    const r = e.currentTarget.getBoundingClientRect();
    FX.fireworks();
    FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 60, power: 1.5 });
  });
})();
