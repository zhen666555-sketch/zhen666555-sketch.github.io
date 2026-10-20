/* 深空场景：所有动画共用一条渲染循环，离屏和后台自动停绘 */
(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  const starCanvas = document.querySelector('#starfield');
  const orbCanvas = document.querySelector('#orb');
  const starsCtx = starCanvas.getContext('2d');
  const orbCtx = orbCanvas.getContext('2d');
  const toggle = document.querySelector('.motion-toggle');
  const motionLabel = toggle.querySelector('.motion-label');
  let userMotion = null;
  try { userMotion = localStorage.getItem('zhen-motion'); } catch (_) { /* 隐私模式仍可使用开关 */ }
  let running = userMotion === null ? !reducedMotion.matches : userMotion === 'on';
  let frame = 0;
  let lastPaint = 0;
  let sceneTime = 0;
  let lastTimestamp = 0;
  let orbVisible = true;
  let view = { width: 0, height: 0, orbWidth: 0, orbHeight: 0 };
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let stars = [];
  let nodes = [];
  const TAU = Math.PI * 2;

  const glow = document.createElement('canvas');
  glow.width = glow.height = 48;
  const glowCtx = glow.getContext('2d');
  const glowGradient = glowCtx.createRadialGradient(24, 24, 0, 24, 24, 24);
  glowGradient.addColorStop(0, '#ecffff');
  glowGradient.addColorStop(.08, '#aff6ff');
  glowGradient.addColorStop(.2, '#41cfffbd');
  glowGradient.addColorStop(.5, '#2198ff38');
  glowGradient.addColorStop(1, '#187bff00');
  glowCtx.fillStyle = glowGradient;
  glowCtx.fillRect(0, 0, 48, 48);

  function sizeCanvas(canvas, context, width, height) {
    const ratio = Math.min(devicePixelRatio || 1, mobile.matches ? 1.5 : 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function resize() {
    view.width = innerWidth;
    view.height = innerHeight;
    const box = orbCanvas.getBoundingClientRect();
    view.orbWidth = box.width;
    view.orbHeight = box.height;
    sizeCanvas(starCanvas, starsCtx, view.width, view.height);
    sizeCanvas(orbCanvas, orbCtx, box.width, box.height);
    stars = Array.from({ length: mobile.matches ? 100 : 220 }, () => ({
      x: Math.random() * view.width, y: Math.random() * view.height,
      z: .2 + Math.random() * .8, phase: Math.random() * TAU,
      radius: .3 + Math.random() * .9
    }));
    const count = mobile.matches ? 440 : 820;
    nodes = Array.from({ length: count }, (_, i) => {
      const y = 1 - 2 * (i + .5) / count;
      const r = Math.sqrt(1 - y * y);
      const angle = i * Math.PI * (3 - Math.sqrt(5));
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const density = Math.sin(x * 8 + Math.cos(y * 6)) + Math.cos(z * 9 + y * 4);
      return { x, y, z, bright: density > .35, phase: i * .14 };
    });
    drawScene(sceneTime);
  }

  function drawStars(time) {
    const ctx = starsCtx;
    ctx.clearRect(0, 0, view.width, view.height);
    for (const s of stars) {
      const x = (s.x + time * s.z * 2.4 + view.width) % view.width + pointer.x * s.z * 10;
      const y = (s.y + time * s.z * .65 + view.height) % view.height + pointer.y * s.z * 8;
      const alpha = .18 + s.z * .42 + Math.sin(time * .7 + s.phase) * .16;
      ctx.fillStyle = `rgba(168,215,250,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, s.radius, 0, TAU);
      ctx.fill();
      if (s.z > .94) {
        ctx.globalAlpha = alpha * .4;
        ctx.drawImage(glow, x - 6, y - 6, 12, 12);
        ctx.globalAlpha = 1;
      }
    }
    // 流星沿远处轨迹滑过，避免遮挡正文
    const meteor = time % 12;
    if (meteor > 7 && meteor < 8.6) {
      const phase = (meteor - 7) / 1.6;
      const x = view.width * (.5 + phase * .48);
      const y = view.height * (.06 + phase * .26);
      const length = mobile.matches ? 65 : 130;
      const tail = ctx.createLinearGradient(x - length, y - length * .45, x, y);
      tail.addColorStop(0, '#6cdfff00');
      tail.addColorStop(1, `rgba(143,232,255,${Math.sin(phase * Math.PI) * .7})`);
      ctx.strokeStyle = tail;
      ctx.lineWidth = 1;
      ctx.beginPath();ctx.moveTo(x - length, y - length * .45);ctx.lineTo(x, y);ctx.stroke();
    }
  }

  function project(x, y, z, yaw, tilt, radius, cx, cy) {
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const xx = x * cos + z * sin;
    const zz = -x * sin + z * cos;
    const yy = y * Math.cos(tilt) - zz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
    const perspective = 3.8 / (3.8 + depth);
    return { x: cx + xx * radius * perspective, y: cy + yy * radius * perspective, z: depth, p: perspective };
  }

  function drawOrb(time) {
    const ctx = orbCtx;
    const width = view.orbWidth, height = view.orbHeight;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width * .32, height * .35);
    const cx = width * .57 + pointer.x * 12;
    const cy = height * .49 + pointer.y * 9;
    const yaw = time * .075 + pointer.x * .11;
    const tilt = -.24 + Math.sin(time * .11) * .035 + pointer.y * .055;
    const point = (x, y, z) => project(x, y, z, yaw, tilt, radius, cx, cy);

    const halo = ctx.createRadialGradient(cx, cy, radius * .45, cx, cy, radius * 1.65);
    halo.addColorStop(0, '#1a6baf05');halo.addColorStop(.35, '#1778d729');
    halo.addColorStop(.57, '#2689df18');halo.addColorStop(1, '#1365ab00');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    // 经纬网络组成球体，前后半球分别处理透明度
    const curves = [];
    const segments = mobile.matches ? 54 : 76;
    for (let latitude = -4; latitude <= 4; latitude++) {
      const phi = latitude * Math.PI / 11;
      const ring = [];
      for (let j = 0; j <= segments; j++) {
        const theta = j / segments * TAU;
        ring.push(point(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)));
      }
      curves.push(ring);
    }
    for (let longitude = 0; longitude < 12; longitude++) {
      const theta = longitude / 12 * Math.PI;
      const ring = [];
      for (let j = 0; j <= segments; j++) {
        const phi = j / segments * TAU;
        ring.push(point(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)));
      }
      curves.push(ring);
    }
    for (const front of [false, true]) {
      ctx.strokeStyle = front ? '#66d8ff41' : '#3776ab20';
      ctx.lineWidth = front ? .65 : .45;
      ctx.beginPath();
      for (const curve of curves) {
        for (let j = 1; j < curve.length; j++) {
          const a = curve[j - 1], b = curve[j];
          if ((b.z < 0) === front) { ctx.moveTo(a.x, a.y);ctx.lineTo(b.x, b.y); }
        }
      }
      ctx.stroke();
    }

    const body = ctx.createRadialGradient(cx - radius * .3, cy - radius * .4, 0, cx, cy, radius * 1.06);
    body.addColorStop(0, '#1b6a9e0b');body.addColorStop(.76, '#07294005');
    body.addColorStop(.92, '#2582be14');body.addColorStop(.98, '#83e8ff3d');body.addColorStop(1, '#37a4eb00');
    ctx.fillStyle = body;ctx.beginPath();ctx.arc(cx, cy, radius * 1.06, 0, TAU);ctx.fill();

    // 旋转的点云形成不规则数字大陆
    const points = nodes.map(n => ({ ...point(n.x, n.y, n.z), node: n }));
    points.sort((a, b) => b.z - a.z);
    for (const p of points) {
      const front = p.z < 0;
      const alpha = (front ? .58 : .12) * (p.node.bright ? 1 : .38);
      ctx.fillStyle = `rgba(133,220,255,${alpha})`;
      ctx.beginPath();ctx.arc(p.x, p.y, (p.node.bright ? 1.15 : .6) * p.p, 0, TAU);ctx.fill();
      if (p.node.bright && front && Math.sin(p.node.phase + time * .55) > .96) {
        ctx.globalAlpha = .55;ctx.drawImage(glow, p.x - 7, p.y - 7, 14, 14);ctx.globalAlpha = 1;
      }
    }

    // 多层空间轨道与运行中的数据光点
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 5; i++) {
      const orbit = [];
      const angle = -.85 + i * .49;
      const orbitRadius = 1.16 + i * .075;
      const orbitPoint = phase => {
        const x = Math.cos(phase) * orbitRadius;
        const z = Math.sin(phase) * orbitRadius;
        const y = z * Math.sin(angle);
        return project(x, y, z * Math.cos(angle), yaw * .45 + i * .68, tilt + .25, radius, cx, cy);
      };
      const count = mobile.matches ? 85 : 125;
      for (let j = 0; j <= count; j++) orbit.push(orbitPoint(j / count * TAU));
      ctx.strokeStyle = i === 0 ? '#9beaff68' : '#6abfff3d';
      ctx.lineWidth = i === 0 ? 1.1 : .6;
      ctx.beginPath();
      orbit.forEach((p, j) => { if (j === 0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
      ctx.stroke();
      for (let trail = 16; trail >= 0; trail--) {
        const p = orbitPoint(time * (.18 + i * .025) + i * 1.8 - trail * .014);
        ctx.globalAlpha = (1 - trail / 17) * .72;
        const size = trail === 0 ? 24 : 4.5;
        ctx.drawImage(glow, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      const satellite = orbitPoint(-time * .09 + i * 2.1);
      ctx.drawImage(glow, satellite.x - 6, satellite.y - 6, 12, 12);
    }
    // 跨越球面的少量长连线，表现服务之间的连接
    const network = points.filter(p => p.node.bright && p.z < -.3);
    for (let i = 0; i < Math.min(network.length - 13, 72); i += 6) {
      const a = network[i], b = network[i + 13];
      ctx.strokeStyle = '#9ddfff25';ctx.lineWidth = .7;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      const phase = (time * .2 + i * .07) % 1;
      const x = a.x + (b.x - a.x) * phase, y = a.y + (b.y - a.y) * phase;
      ctx.globalAlpha = .6;ctx.drawImage(glow,x-4,y-4,8,8);ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawScene(time) {
    if (!starsCtx || !orbCtx) return;
    drawStars(time);
    if (orbVisible) drawOrb(time);
  }

  function animate(timestamp) {
    frame = 0;
    if (!running || document.hidden) return;
    const elapsed = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, .08) : 0;
    lastTimestamp = timestamp;
    sceneTime += elapsed;
    const interval = mobile.matches ? 1000 / 30 : 1000 / 45;
    if (timestamp - lastPaint >= interval) {
      pointer.x += (pointer.targetX - pointer.x) * .055;
      pointer.y += (pointer.targetY - pointer.y) * .055;
      drawScene(sceneTime);
      lastPaint = timestamp;
    }
    frame = requestAnimationFrame(animate);
  }

  function applyMotion() {
    document.body.dataset.motion = running ? 'on' : 'off';
    toggle.setAttribute('aria-pressed', String(running));
    motionLabel.textContent = running ? '动态：开启' : '动态：暂停';
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTimestamp = 0;
    if (running && !document.hidden) frame = requestAnimationFrame(animate);
    else drawScene(sceneTime);
  }
  toggle.addEventListener('click', () => {
    running = !running;
    userMotion = running ? 'on' : 'off';
    try { localStorage.setItem('zhen-motion', userMotion); } catch (_) { /* 开关仍在本次访问生效 */ }
    applyMotion();
  });
  reducedMotion.addEventListener('change', () => {
    if (userMotion === null) { running = !reducedMotion.matches;applyMotion(); }
  });
  document.addEventListener('visibilitychange', applyMotion);
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    pointer.targetX = (event.clientX / innerWidth - .5) * 2;
    pointer.targetY = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.targetX = pointer.targetY = 0; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      orbVisible = entries[0].isIntersecting;
      if (orbVisible && !running) drawOrb(sceneTime);
    }, { rootMargin: '80px' }).observe(orbCanvas);
    const navLinks = [...document.querySelectorAll('nav a')];
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(link => {
        if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-10% 0px -65% 0px' });
    document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
  }
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  function closeMenu() { nav.classList.remove('is-open');menu.setAttribute('aria-expanded', 'false'); }
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu();menu.focus(); } });
  resize();
  applyMotion();
})();
