/* The sea, reflected light and sky share a single clock and render pass. */
(() => {
  'use strict';
  const T = window.CanyonThree;
  const canvas = document.getElementById('sea');
  const host = canvas.parentElement;
  const hint = host.querySelector('.wave-hint');
  if (!T) return;
  const context = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!context) return;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, context });
  } catch { return; }

  const ripples = Array.from({ length: 4 }, () => new T.Vector3(.5, .3, 99));
  const strokes = new Float32Array(8 * 4);
  const strokeAges = new Float32Array(8).fill(9);
  const uniforms = {
    t: { value: 0 }, aspect: { value: 1 }, cursor: { value: [.5,.5] },
    ripples: { value: ripples }, strokes: { value: strokes }, strokeAges: { value: strokeAges }
  };
  const material = new T.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 p; void main(){ p=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `
        varying vec2 p; uniform float t,aspect; uniform vec2 cursor; uniform vec3 ripples[4];
        uniform vec4 strokes[8]; uniform float strokeAges[8];
        float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 q){
          vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
        }
        float swell(vec2 q){
          return sin(q.y*1.6+t*.57+sin(q.x*.56))*0.56
            +sin(q.y*4.3-q.x*.77-t*.84)*.24+sin(q.y*8.2+q.x*1.54+t*1.21)*.12;
        }

        // Angular coordinates keep the stars round in both portrait and landscape.
        float stars(vec2 direction,float grid,float salt){
          vec2 pos=direction*grid+salt,cell=floor(pos);
          vec2 center=.18+.64*vec2(hash(cell+salt),hash(cell+salt+41.));
          float seed=hash(cell+17.3);
          vec2 offset=fract(pos)-center;
          float radius=mix(.015,.042,seed);
          float aa=max(fwidth(pos.y)*.6,.009);
          float core=1.-smoothstep(radius,radius+aa,length(offset));
          float glow=.14*exp(-length(offset)*17.);
          float flicker=.76+.24*sin(t*(.6+seed)+49.*seed);
          return step(.69,seed)*(core+glow)*flicker;
        }
        float meteor(vec2 direction){
          float cycle=floor((t+10.)/16.);
          float phase=fract((t+10.)/16.)*16.;
          if(phase>1.65)return 0.;
          vec2 axis=normalize(vec2(.86,-.43));
          vec2 start=vec2(aspect*(.24+.28*hash(vec2(cycle,3.))),.86+.07*hash(vec2(cycle,7.)));
          vec2 delta=direction-(start+phase*.22*axis);
          float along=dot(delta,axis), across=abs(dot(delta,vec2(-axis.y,axis.x)));
          float width=max(.0014,fwidth(direction.y));
          float tail=exp(-across/width)*exp(-abs(along)/.035)*step(along,.001);
          return (tail+.65*exp(-length(delta)/.003))*smoothstep(0.,.24,phase)*(1.-smoothstep(1.13,1.65,phase));
        }
        float segmentDistance(vec2 p0,vec2 a,vec2 b){
          vec2 ab=b-a;
          return length(p0-a-ab*clamp(dot(p0-a,ab)/max(dot(ab,ab),.000001),0.,1.));
        }
        float flock(vec2 uv){
          float passage=fract(t/29.+.46);
          vec2 lead=vec2(mix(-.17,aspect+.19,passage),.665+.018*sin(t*.38));
          float ink=0.,aa=max(fwidth(uv.y),.0008);
          for(int i=0;i<5;i++){
            float k=float(i),side=mod(k,2.)*2.-1.;
            vec2 bird=uv-lead+vec2(k*.027,side*k*.008);
            float flap=.0042*sin(4.3*t+k*1.8);
            vec2 joint=vec2(.004,.003+.42*flap),tip=vec2(.011,.002+flap);
            bird.x=abs(bird.x);
            float d=min(segmentDistance(bird,vec2(0.),joint),segmentDistance(bird,joint,tip));
            ink=max(ink,1.-smoothstep(.00055,.00055+aa,d));
          }
          return ink;
        }
        float brushLight(vec2 uv,float wave){
          vec2 scale=vec2(aspect,1.);
          float light=0.;
          for(int i=0;i<8;i++){
            float age=strokeAges[i];
            if(age>3.5)continue;
            float d=segmentDistance(uv*scale,strokes[i].xy*scale,strokes[i].zw*scale);
            float ridge=abs(d-.018*age-.003*wave);
            light=max(light,exp(-ridge*95.-age*1.2));
          }
          return light;
        }
        void main(){
          float horizon=.49+.008*(cursor.y-.5);
          vec2 sun=vec2(.68+.018*(cursor.x-.5),horizon+.10+.009*sin(t*.16));
          float skyH=max(0.,(p.y-horizon)/(1.-horizon));
          vec3 sky=mix(vec3(.94,.49,.32),vec3(.15,.115,.245),pow(skyH,.69));
          float cloud=noise(vec2(p.x*4.+t*.023,p.y*15.))*noise(vec2(p.x*8.,p.y*31.));
          sky+=vec3(.15,.09,.09)*cloud;
          vec2 ds=(p-sun)*vec2(aspect,1.);
          float r=length(ds);
          sky+=vec3(.35,.17,.06)*exp(-r*7.);
          sky=mix(sky,vec3(1.,.84,.58),1.-smoothstep(.071,.075,r));
          vec2 skyPoint=p*vec2(aspect,1.);
          vec2 parallax=(cursor-.5)*vec2(.014,.008);
          float starlight=stars(skyPoint+parallax,21.,2.)+.54*stars(skyPoint+.45*parallax,32.,17.);
          float darkness=smoothstep(.60,.95,p.y)*(1.-.62*exp(-r*6.));
          sky+=vec3(.84,.82,.96)*(starlight*.83*darkness+meteor(skyPoint)*.80);
          if(p.y>.59 && p.y<.75)sky=mix(sky,vec3(.18,.12,.21),.80*flock(skyPoint));
          float below=max(0.,horizon-p.y);
          float depth=1./(.13+below);
          vec2 q=vec2((p.x-sun.x)*aspect*depth*8.,depth*5.);
          float w=swell(q);
          float wake=0.;
          for(int i=0;i<4;i++){
            float age=ripples[i].z;
            float d=length((p-ripples[i].xy)*vec2(aspect,1.));
            wake+=sin(d*95.-age*7.)*exp(-10.*abs(d-age*.10))*exp(-age*.77);
          }
          float reflection=exp(-abs(p.x-sun.x+.018*w)*aspect/(.024+.22*below));
          float glint=smoothstep(-.08,.67,w+.65*wake);
          vec3 water=mix(vec3(.48,.31,.38),vec3(.09,.105,.18),smoothstep(.0,.43,below));
          water+=vec3(.12,.10,.14)*smoothstep(.15,.88,w);
          water+=vec3(1.,.56,.27)*reflection*(.20+.9*glint);
          vec2 reflected=vec2(skyPoint.x+.006*w,2.*horizon-p.y+.008*w);
          water+=vec3(.21,.17,.24)*meteor(reflected)*glint;
          water+=vec3(.21,.16,.14)*max(0.,wake);
          if(below>0.)water+=vec3(.78,.49,.31)*brushLight(p,w)*(.30+.70*glint);
          vec3 col=mix(water,sky,smoothstep(horizon-.002,horizon+.002,p.y));
          col*=.72+.28*smoothstep(.0,.72,p.x);
          col+=.016*(hash(gl_FragCoord.xy)-.5);
          gl_FragColor=vec4(col,1.);
        }`
  });
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1,1,1,-1,0,1);
  const sea = new T.Mesh(new T.PlaneGeometry(2,2), material);
  sea.frustumCulled = false;
  scene.add(sea);

  let visible = true, lost = false, frame = 0, last = 0, nextRipple = 0;
  let aimX = .5, aimY = .5;
  let drag = null, nextStroke = 0;
  const moving = () => document.body.dataset.motion === 'on';
  function paint(delta) {
    const smooth = moving() ? 1 - Math.exp(-6 * delta) : 0;
    const cursor = uniforms.cursor.value;
    cursor[0] += (aimX - cursor[0]) * smooth;
    cursor[1] += (aimY - cursor[1]) * smooth;
    uniforms.t.value += delta;
    for (const ring of ripples) ring.z = Math.min(99, ring.z + delta);
    for (let i=0; i<strokeAges.length; i++) strokeAges[i] = Math.min(9, strokeAges[i]+delta);
    renderer.render(scene,camera);
  }
  function tick(now) {
    frame = 0;
    if (lost || document.hidden || !visible || document.body.classList.contains('reading-case')) { last = 0; return; }
    const animate = moving();
    if (!last || now - last >= 32 || !animate) {
      paint(last && animate ? Math.min(.10,(now-last)/1000) : 0);
      last = now;
    }
    if (animate) frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
  }
  function resize() {
    const {clientWidth: width, clientHeight: height} = host;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 720 ? 1.35 : 1.65));
    renderer.setSize(width,height,false);
    uniforms.aspect.value = width/height;
    wake();
  }
  function disturb(x,y) {
    ripples[nextRipple].set(x,y,moving() ? 0 : .52);
    nextRipple = (nextRipple+1) % ripples.length;
    wake();
  }
  function stroke(fromX,fromY,toX,toY) {
    strokes.set([fromX,fromY,toX,toY],nextStroke*4);
    strokeAges[nextStroke]=0;
    nextStroke=(nextStroke+1)%strokeAges.length;
    wake();
  }
  canvas.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button!==0) return;
    const r = canvas.getBoundingClientRect();
    const y = 1-(e.clientY-r.top)/r.height;
    if (y >= .49) return;
    const x=(e.clientX-r.left)/r.width;
    disturb(x,y);
    if (moving()) {
      drag={id:e.pointerId,x,y};
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (!moving() || (e.pointerType!=='mouse' && !drag)) return;
    const r = canvas.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width, y=1-(e.clientY-r.top)/r.height;
    if (e.pointerType==='mouse') { aimX=x; aimY=y; }
    if (drag?.id!==e.pointerId) return;
    if (Math.hypot((x-drag.x)*r.width,(y-drag.y)*r.height)<9) return;
    if (x>=0 && x<=1 && y>=0 && y<.49 && drag.y<.49) stroke(drag.x,drag.y,x,y);
    drag.x=x; drag.y=y;
  });
  canvas.addEventListener('lostpointercapture', () => { drag=null; });
  canvas.addEventListener('pointerleave', () => { aimX=.5; aimY=.5; });
  canvas.addEventListener('keydown', e => {
    if (e.key==='ArrowLeft' || e.key==='ArrowRight') {
      e.preventDefault();
      const start=aimX;
      aimX=Math.min(.95,Math.max(.05,start+(e.key==='ArrowLeft'?-.12:.12)));
      if (moving()) stroke(start,.24,aimX,.24);
      else disturb(aimX,.24);
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    disturb(.65+.13*Math.sin(nextRipple*2), .26);
  });
  document.body.addEventListener('motionchange',wake);
  document.body.addEventListener('readerchange',wake);
  document.addEventListener('visibilitychange',wake);
  new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; wake(); }).observe(host);
  new ResizeObserver(resize).observe(host);
  function setLive(live) {
    canvas.hidden = !live;
    hint.hidden = !live;
  }
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost=true; setLive(false); });
  canvas.addEventListener('webglcontextrestored', () => { lost=false; setLive(true); resize(); });
  setLive(true);
  resize();
})();
