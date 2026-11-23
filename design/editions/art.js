(() => {
  'use strict';
  const body=document.body;
  const host=document.querySelector('.art');
  const canvas=document.querySelector('#artwork');
  const caption=document.querySelector('.caption');
  const T=window.CanyonThree;
  const dusk=body.classList.contains('dusk');
  const porcelain=body.classList.contains('celadon');
  function poster(active){
    host.classList.toggle('poster',active);
    canvas.tabIndex=active?-1:0;
    caption.hidden=active;
  }
  if(!T){poster(true);return}
  let renderer;
  try {
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
    if(!gl){poster(true);return}
    renderer=new T.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
  }catch{poster(true);return}

  const scene=new T.Scene(), camera=new T.OrthographicCamera(-2,2,1.5,-1.5,.01,30);
  const group=new T.Group();scene.add(group);
  const uniforms={
    t:{value:0},aspect:{value:1},cursor:{value:[.5,.5]},
    ripple:{value:[.68,.32]},age:{value:99},bend:{value:0}
  };
  const TAU=2*Math.PI;
  if(dusk){
    const sea=new T.ShaderMaterial({
      uniforms,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 p; void main(){ p=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader:`
        varying vec2 p; uniform float t,aspect,age; uniform vec2 cursor,ripple;
        float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 q){
          vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
        }
        float swell(vec2 q){
          return sin(q.y*1.6+t*.57+sin(q.x*.56))*0.56
            +sin(q.y*4.3-q.x*.77-t*.84)*.24+sin(q.y*8.2+q.x*1.54+t*1.21)*.12;
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
          float below=max(0.,horizon-p.y);
          float depth=1./(.13+below);
          vec2 q=vec2((p.x-sun.x)*aspect*depth*8.,depth*5.);
          float w=swell(q);
          float d=length((p-ripple)*vec2(aspect,1.));
          float wake=sin(d*95.-age*7.)*exp(-9.*abs(d-age*.10))*exp(-age*.68);
          float reflection=exp(-abs(p.x-sun.x+.018*w)*aspect/(.024+.22*below));
          float glint=smoothstep(-.08,.67,w+.65*wake);
          vec3 water=mix(vec3(.48,.31,.38),vec3(.09,.105,.18),smoothstep(.0,.43,below));
          water+=vec3(.12,.10,.14)*smoothstep(.15,.88,w);
          water+=vec3(1.,.56,.27)*reflection*(.20+.9*glint);
          water+=vec3(.21,.16,.14)*max(0.,wake);
          vec3 col=mix(water,sky,smoothstep(horizon-.002,horizon+.002,p.y));
          col*=.72+.28*smoothstep(.0,.72,p.x);
          col+=.016*(hash(gl_FragCoord.xy)-.5);
          gl_FragColor=vec4(col,1.);
        }`
    });
    const plane=new T.Mesh(new T.PlaneGeometry(2,2),sea);plane.frustumCulled=false;scene.add(plane);
  }else{
    // A hollow fluted vessel and a radially pleated sheet share a sampled surface.
    function surfacePoint(u,v){
      if(porcelain){
        const a=u*TAU,b=v*TAU,h=(1-Math.cos(b))*.5;
        const flute=Math.cos(21*a+1.6*h);
        const radius=.48+.59*Math.pow(h,.72)+.115*Math.sin(b)+(.019+.032*h)*flute;
        return [radius*Math.cos(a),-.57+1.14*h+.09*h*h*Math.cos(5*a+.4),radius*Math.sin(a)];
      }
      const a=-2.50+4.80*u+.32*v, crease=Math.cos(TAU*23*u);
      const radius=.38+1.03*v;
      return [radius*Math.sin(a),radius*Math.cos(a)*.83+.18*Math.sin(2*a),
        (.075+.18*v)*crease+.32*Math.sin(1.6*a)+.28*v*v];
    }
    const nu=porcelain?210:138,nv=porcelain?72:24;
    const pos=[],indices=[];
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)pos.push(...surfacePoint(i/nu,j/nv));
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      const a=j*(nu+1)+i,b=a+nu+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const shape=new T.BufferGeometry();
    shape.setAttribute('position',new T.Float32BufferAttribute(pos,3));shape.setIndex(indices);shape.computeVertexNormals();
    const material=new T.ShaderMaterial({
      uniforms,side:T.DoubleSide,
      vertexShader:`
        varying vec3 n;varying vec3 eye;varying vec3 local;
        uniform float t,bend;
        void main(){
          vec3 q=position;
          ${porcelain?'':'q.z+=.12*sin(q.x*2.+t*.62)*(.4+q.y*q.y)+bend*(q.x*q.x-.5)*.54; q.x+=bend*q.y*.18;'}
          vec4 view=modelViewMatrix*vec4(q,1.);
          eye=-view.xyz;local=q;n=normalMatrix*normal;gl_Position=projectionMatrix*view;
        }`,
      fragmentShader:`
        varying vec3 n;varying vec3 eye;varying vec3 local;
        void main(){
          vec3 V=normalize(eye);
          vec3 N=normalize(${porcelain?'n':'cross(dFdx(eye),dFdy(eye))'});
          if(dot(N,V)<0.)N=-N;
          vec3 L=normalize(vec3(-.58,.72,.76)),R=reflect(-V,N);
          float diffuse=.5+.5*dot(N,L);
          ${porcelain?`
            vec3 col=mix(vec3(.14,.35,.31),vec3(.72,.84,.73),pow(diffuse,1.38));
            float strip=pow(max(0.,dot(R,normalize(vec3(-.38,.54,.7)))),12.);
            float strip2=pow(max(0.,dot(R,normalize(vec3(.53,.32,.84)))),32.);
            col+=vec3(.24,.23,.19)*strip+vec3(.16,.21,.17)*strip2;
            col+=.055*pow(1.-max(dot(N,V),0.),3.);
          `:`
            vec3 col=mix(vec3(.39,.075,.067),vec3(.99,.35,.19),pow(diffuse,1.35));
            col+=.10*pow(max(dot(R,normalize(vec3(-.5,.4,.7))),0.),12.);
          `}
          gl_FragColor=vec4(col,1.);
        }`
    });
    group.add(new T.Mesh(shape,material));
    const shadow=new T.Mesh(new T.PlaneGeometry(3.5,2.7),new T.ShaderMaterial({
      transparent:true,depthWrite:false,
      vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 p;void main(){vec2 d=(p-.5)*vec2(2.3,3.4);gl_FragColor=vec4(.11,.19,.15,.23*exp(-5.*dot(d,d)));}'
    }));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=porcelain?-.605:-1.22;scene.add(shadow);
  }
  let clock=0,last=0,frame=0,lost=false,visible=true;
  let targetX=.5,targetY=.5,x=.5,y=.5,turn=0,drag=null,age=99;
  const moving=()=>body.dataset.motion==='on';
  function paint(delta){
    if(moving()){clock+=delta;age+=delta}
    const ease=moving()?1-Math.exp(-9*delta):1;
    x+=(targetX-x)*ease;y+=(targetY-y)*ease;
    uniforms.t.value=clock;uniforms.cursor.value=[x,y];uniforms.age.value=age;
    uniforms.bend.value=Math.sin(turn+.24*Math.sin(clock*.54))*.72;
    if(!dusk){
      if(porcelain)group.rotation.set(.11*(y-.5),turn+.19*Math.sin(clock*.37)+.19*(x-.5),-.09);
      else group.rotation.set(-.28+.14*(y-.5),-.28+turn*.36+.2*Math.sin(clock*.45),.33);
    }
    renderer.render(scene,camera);
  }
  function tick(now){
    frame=0;
    if(lost||document.hidden||!visible){last=0;return}
    if(!last||now-last>=32){
      paint(last?Math.min(.1,(now-last)/1000):0);last=now;
    }
    if(moving())frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame){last=0;frame=requestAnimationFrame(tick)}}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<520?1.35:1.75));
    renderer.setSize(w,h,false);uniforms.aspect.value=w/h;
    const span=Math.max(porcelain?.98:1.52,(porcelain?1.25:1.58)*h/w);
    camera.top=span;camera.bottom=-span;camera.left=-span*w/h;camera.right=-camera.left;
    camera.position.set(0,porcelain?2.05:1.05,4.9);camera.lookAt(0,porcelain?.02:-.04,0);camera.updateProjectionMatrix();wake();
  }
  function ripple(px,py){uniforms.ripple.value=[px,Math.min(.48,py)];age=moving()?0:.9;wake()}
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;
    const r=canvas.getBoundingClientRect();
    if(dusk){ripple((e.clientX-r.left)/r.width,1-(e.clientY-r.top)/r.height);return}
    drag={id:e.pointerId,x:e.clientX,turn};canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    const r=canvas.getBoundingClientRect();
    if(e.pointerType==='mouse'&&moving()){targetX=(e.clientX-r.left)/r.width;targetY=(e.clientY-r.top)/r.height}
    if(drag&&drag.id===e.pointerId){turn=drag.turn+(e.clientX-drag.x)*.009;wake()}
  });
  canvas.addEventListener('lostpointercapture',()=>{drag=null});
  canvas.addEventListener('pointerleave',()=>{targetX=.5;targetY=.5});
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Enter'].includes(e.key))return;
    e.preventDefault();const dir=e.key==='ArrowLeft'?-1:1;
    if(dusk){targetX=Math.min(.95,Math.max(.05,targetX+dir*.10));ripple(targetX,.29)}
    else{turn+=dir*.30;wake()}
  });
  body.addEventListener('motionchange',()=>{last=0;wake()});
  document.addEventListener('visibilitychange',wake);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;wake()}).observe(host);
  new ResizeObserver(resize).observe(host);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;poster(true)});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;poster(false);resize()});
  poster(false);resize();
})();
