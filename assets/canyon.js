/* Interactive height-field study. Heights and sampling coordinates are model units. */
(() => {
  'use strict';
  const T = window.CanyonThree;
  const atlas = document.querySelector('.atlas');
  if (!T || !atlas) return;
  const canvas = atlas.querySelector('canvas');
  const readout = atlas.querySelector('.sample-output');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) return;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
  } catch { return; }

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, .1, 20);
  const river = z => .2 * Math.sin(3.3 * z + .2) + .105 * Math.sin(6.1 * z - .4) - .075;
  const octaves = [[3,.14], [7,.065], [15,.032], [31,.016], [57,.006]];
  function height(x, z) {
    const distance = Math.abs(x - river(z));
    const ridge = .84 * Math.exp(-(((distance - .59) / .31) ** 2));
    const shape = .48 + .5 * Math.exp(-(((z + .25 + Math.sign(x) * .27) / .58) ** 2)) + .15 * Math.sin(5*z + 5*x);
    let rock = .14;
    for (const [frequency, amplitude] of octaves) {
      rock += amplitude * Math.sin(frequency*x + 1.5*Math.sin(z*frequency*.62)) * Math.cos(z*frequency*.79 + x*.5);
    }
    return .036 + (ridge*shape + rock) * Math.min(1, Math.max(0, (distance - .045) / .16));
  }

  const grid = new T.PlaneGeometry(2, 2, 150, 150);
  grid.rotateX(-Math.PI / 2);
  const vertices = grid.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    vertices.setY(i, height(vertices.getX(i), vertices.getZ(i)));
  }
  grid.computeVertexNormals();

  const probeZ = -.28;
  const uniforms = { time: { value: 0 }, sampleX: { value: 0 }, sampleZ: { value: probeZ } };
  const vertexShader = `
    varying vec3 ground;
    varying vec3 slope;
    void main() {
      ground = position;
      slope = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
  const terrain = new T.ShaderMaterial({
    uniforms, vertexShader,
    fragmentShader: `
      uniform float time;
      uniform float sampleX;
      uniform float sampleZ;
      varying vec3 ground;
      varying vec3 slope;
      void main() {
        vec2 p = ground.xz;
        float h = ground.y;
        float light = max(0.0, dot(normalize(slope), normalize(vec3(-.45,.85,.34))));
        vec3 rock = mix(vec3(.32,.31,.42), vec3(.79,.74,.81), light) * (.85 + .17*h);
        float elevation = h * 31.0;
        float line = abs(fract(elevation + .5) - .5) / max(fwidth(elevation), .01);
        rock *= mix(.70,1.0,smoothstep(.0,1.15,line));
        float riverX = .2*sin(3.3*p.y+.2) + .105*sin(6.1*p.y-.4) - .075;
        float bank = abs(p.x-riverX);
        float channel = 1.0-smoothstep(.032,.056,bank);
        float pulse = pow(max(0.0,cos(15.0*p.y-time*2.7)),8.0);
        vec3 water = mix(vec3(.78,.46,.32),vec3(1.0,.88,.69), pulse*(1.0-smoothstep(.0,.035,bank)));
        vec3 color = mix(rock,water,channel);
        float scan = abs(p.x-sampleX);
        color += vec3(.13,.16,.16) * exp(-scan*140.0);
        float probe = length(p-vec2(sampleX,sampleZ));
        float ring = 1.0-smoothstep(.002,.009,abs(probe-.035));
        color = mix(color,vec3(1.0,.87,.63), max(ring,1.0-smoothstep(.008,.017,probe)));
        gl_FragColor = vec4(color,1.0);
      }`
  });
  scene.add(new T.Mesh(grid, terrain));

  // Close the sampled edges so the relief reads as a geological cut in every view.
  const walls = [];
  const corners = [[-1,-1], [1,-1], [1,1], [-1,1], [-1,-1]];
  for (let edge = 0; edge < 4; edge++) {
    const [ax, az] = corners[edge], [bx, bz] = corners[edge+1];
    const edgePoint = step => {
      const x = ax + (bx-ax)*step/150, z = az + (bz-az)*step/150;
      return [x, height(x,z), z];
    };
    for (let step = 0; step < 150; step++) {
      const a = edgePoint(step), b = edgePoint(step+1);
      const bottomA = [a[0],-.07,a[2]], bottomB = [b[0],-.07,b[2]];
      walls.push(...a,...b,...bottomA,...bottomA,...b,...bottomB);
    }
  }
  const border = new T.BufferGeometry();
  border.setAttribute('position', new T.Float32BufferAttribute(walls,3));
  scene.add(new T.Mesh(border,new T.ShaderMaterial({
    side: T.DoubleSide, vertexShader,
    fragmentShader: `
      varying vec3 ground;
      void main() {
        float layer = .5+.5*cos(ground.y*158.0+3.0*sin(ground.x*3.0+ground.z*2.0));
        vec3 rock = mix(vec3(.235,.21,.265),vec3(.36,.31,.37),layer*.55+clamp(ground.y,0.0,1.0)*.32);
        gl_FragColor = vec4(rock,1.);
      }`
  })));
  const base = new T.Mesh(new T.BoxGeometry(2.015,.028,2.015), new T.MeshBasicMaterial({color:0x847786}));
  base.position.y = -.083;
  scene.add(base);

  let time = 0, yaw = .58, elevation = .45, frame = 0, last = 0, readAt = -1;
  let inView = true, lost = false, dragging = null;
  const isMoving = () => document.body.dataset.motion === 'on';
  const activeView = () => atlas.querySelector('[data-view][aria-pressed=true]').dataset.view;
  function draw(delta) {
    const moving = isMoving();
    if (moving) time += delta;
    const overhead = activeView() === 'plan';
    const target = overhead ? Math.PI/2-.001 : .45;
    elevation += (target-elevation)*(moving ? 1-Math.exp(-6*delta) : 1);
    const angle = yaw + Math.sin(time*.22)*.20;
    const distance = 4*Math.cos(elevation);
    camera.position.set(distance*Math.sin(angle), .30+4*Math.sin(elevation),distance*Math.cos(angle));
    camera.lookAt(0,.30,0);
    // Frame the whole footprint, including the rear corners during the tilt to plan.
    const halfHeight = 1.02 + .52*Math.sin(elevation-.45);
    const halfWidth = halfHeight*canvas.clientWidth/Math.max(1,canvas.clientHeight);
    camera.left=-halfWidth; camera.right=halfWidth;
    camera.top=halfHeight; camera.bottom=-halfHeight;
    camera.updateProjectionMatrix();
    const x = .86*Math.sin(time*.42-.7);
    uniforms.sampleX.value=x;
    uniforms.time.value=time;
    renderer.render(scene,camera);
    if (readAt < 0 || time-readAt >= .12) {
      readout.textContent = 'height(' + x.toFixed(2) + ', ' + probeZ.toFixed(2) + ') = ' + height(x,probeZ).toFixed(2);
      readAt=time;
    }
  }
  function tick(now) {
    frame=0;
    if (lost || document.hidden || !inView) { last=0; return; }
    if (!last || now-last>=32) {
      draw(last ? Math.min(.1,(now-last)/1000) : 0);
      last=now;
    }
    if (isMoving()) frame=requestAnimationFrame(tick);
  }
  function refresh() {
    if (frame) cancelAnimationFrame(frame);
    last=0;
    frame=requestAnimationFrame(tick);
  }
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 500 ? 1.35 : 1.75));
    renderer.setSize(Math.max(1,width),Math.max(1,height),false);
    refresh();
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    dragging={id:event.pointerId, x:event.clientX, yaw};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (dragging?.id !== event.pointerId) return;
    yaw=dragging.yaw-(event.clientX-dragging.x)*.009;
    refresh();
  });
  canvas.addEventListener('lostpointercapture', () => { dragging=null; });
  canvas.addEventListener('keydown', event => {
    if (event.key!=='ArrowLeft' && event.key!=='ArrowRight') return;
    event.preventDefault();
    yaw += event.key==='ArrowLeft' ? -.14 : .14;
    refresh();
  });
  function showScene(ready) {
    atlas.classList.toggle('is-live',ready);
    canvas.hidden=!ready;
    atlas.querySelector('.sample').hidden=!ready;
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost=true; showScene(false); refresh();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost=false; showScene(true); resize();
  });
  atlas.addEventListener('scenechange',refresh);
  document.addEventListener('visibilitychange',refresh);
  new IntersectionObserver(([entry]) => { inView=entry.isIntersecting; refresh(); }).observe(atlas);
  new ResizeObserver(resize).observe(atlas.querySelector('.plot'));
  showScene(true);
  resize();
})();
