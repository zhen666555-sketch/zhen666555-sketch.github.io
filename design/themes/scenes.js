/* One active exhibit per preview. All three scenes work from local files. */
(() => {
  'use strict';
  const T=window.CanyonThree;
  if(!T)return;
  const intro=document.querySelector('#intro');
  const theme=document.body.className;
  const host=document.createElement('div');
  let map;
  if(theme==='ticket'){
    host.className='foil';document.querySelector('.stub').append(host);
  }else if(theme==='metro'){
    map=document.querySelector('.map canvas');
    host.className='cartography';
    map.before(host);host.append(map);
  }else{
    host.className='branch-art';document.querySelector('.history').append(host);
  }
  const canvas=document.createElement('canvas');
  canvas.className='gpu';canvas.setAttribute('aria-hidden','true');
  let renderer;
  try{
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
    if(!gl)return;
    renderer=new T.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});
  }catch{return}
  host.append(canvas);
  const scene=new T.Scene(), group=new T.Group();
  scene.add(group);
  const camera=new T.OrthographicCamera(-1,1,1,-1,.01,50);
  camera.position.z=8;
  scene.add(new T.AmbientLight(0xfff2dd,1.7));
  const key=new T.DirectionalLight(0xffe2ca,2.7);key.position.set(-3,4,5);scene.add(key);
  const fill=new T.DirectionalLight(0xa8cbff,1.25);fill.position.set(2,-2,4);scene.add(fill);
  function basic(color){return new T.MeshBasicMaterial({color})}
  function satin(color){return new T.MeshStandardMaterial({color,metalness:.42,roughness:.35})}
  function mesh(geometry,material,parent=group){const m=new T.Mesh(geometry,material);parent.add(m);return m}
  function tube(points,radius,material,closed=false){
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed);
    return mesh(new T.TubeGeometry(curve,Math.max(32,points.length*2),radius,5,closed),material);
  }
  const TAU=Math.PI*2;
  let draw,halfHeight;
  if(theme==='ticket'){
    halfHeight=1.15;
    const gold=satin(0xcc964e),rim=satin(0x88582c),silver=satin(0xf6d9a3);
    const disk=mesh(new T.CylinderGeometry(.91,.91,.065,96),gold);disk.rotation.x=Math.PI/2;
    mesh(new T.TorusGeometry(.91,.026,8,96),rim).position.z=.05;
    for(let layer=0;layer<4;layer++){
      const points=[];
      for(let i=0;i<180;i++){
        const a=i/180*TAU;
        const r=.43+layer*.055+.19*Math.cos(11*a+layer*.78);
        points.push([r*Math.cos(a),r*Math.sin(a),.064+.027*Math.cos(4*a+layer)]);
      }
      tube(points,.013,layer%2?rim:silver,true);
    }
    const core=mesh(new T.TorusGeometry(.19,.028,10,50),silver);core.position.z=.1;
    draw=(time,step,px,py)=>{
      group.rotation.set(.18*Math.cos(time*.7)+py*.2,.36*Math.sin(time*.73)+px*.3,.09*Math.sin(time*.55)+step*.23);
      gold.color.setHex([0xd49a50,0xc58b70,0xb09980,0x929191][step]||0xd49a50);
    };
  }else if(theme==='metro'){
    halfHeight=1.04;
    const texture=new T.CanvasTexture(map);texture.colorSpace=T.SRGBColorSpace;
    map.addEventListener('mapdraw',()=>{texture.needsUpdate=true;refresh()});
    const width=620/210;
    mesh(new T.PlaneGeometry(width,2),new T.MeshBasicMaterial({map:texture}));
    function coords(x,y,z){return [(x-310)/210,(210-y)/210,z]}
    const stations=[[163,230],[349,298],[423,185]];
    const collar=mesh(new T.TorusGeometry(53/210,.008,7,90),basic(0x3b76bf));
    const routes=[
      [[-35,290],[102,290],[163,230],[271,230],[365,137],[468,137],[530,75],[655,75]],
      [[60,-20],[60,90],[146,175],[146,214],[230,298],[349,298],[454,402],[620,402]],
      [[225,-30],[225,67],[289,131],[369,131],[423,185],[423,279],[507,362],[650,362]]
    ];
    const trains=routes.map((_,i)=>mesh(new T.BoxGeometry(.085,.045,.046),satin([0x215cfa,0xf5713d,0x188073][i])));
    draw=(time,step,px,py)=>{
      const active=Number(document.querySelector('#stations [aria-pressed=true]').dataset.index);
      collar.position.set(...coords(...stations[active],.021+.012*Math.sin(time*2)));
      routes.forEach((r,i)=>{
        const phase=(time*.44+i*1.75+.62)%(r.length-1),j=Math.floor(phase),f=phase-j;
        const [x,y]=r[j],[nx,ny]=r[j+1];
        const train=trains[i];train.position.set(...coords(x+(nx-x)*f,y+(ny-y)*f,.037));
        train.rotation.z=Math.atan2(y-ny,nx-x);
      });
      group.rotation.set(-.13+py*.07,.037*Math.sin(time*.35)+px*.09,-.008);
    };
  }else{
    halfHeight=1.12;
    const paths=[
      [[-1.25,-.82,0],[-.7,-.54,.02],[-.26,-.05,.08],[.27,.40,.17],[1,.85,.10]],
      [[-.72,-.54,.02],[-.25,-.58,.25],[.35,-.27,.31],[.61,.29,.13],[1,.85,.10]],
      [[-.26,-.05,.08],[.10,.13,-.18],[.57,.06,-.22],[1.3,.18,-.07]]
    ];
    const colors=[0xecaf98,0xcba6ec,0xb37e9d];
    paths.forEach((points,i)=>tube(points,.025,satin(colors[i])));
    const nodes=[[-.7,-.54,.02],[-.26,-.05,.08],[.61,.29,.13]];
    const marks=nodes.map((p,i)=>{
      const n=mesh(new T.SphereGeometry(.085,20,12),satin(colors[i]));n.position.set(...p);return n;
    });
    const halo=mesh(new T.TorusGeometry(.147,.013,7,44),basic(0xffdfbc));
    const runner=mesh(new T.SphereGeometry(.034,12,8),basic(0xffede0));
    const curves=paths.map(path=>new T.CatmullRomCurve3(path.map(p=>new T.Vector3(...p))));
    draw=(time,step,px,py)=>{
      const idx=Math.max(0,Math.min(2,step));
      halo.position.copy(marks[idx].position);halo.scale.setScalar(1+.1*Math.sin(time*3));
      runner.position.copy(curves[idx].getPointAt((time*.15+.24)%1));
      group.rotation.set(py*.15,.30*Math.sin(time*.45)+px*.22,-.12);
    };
  }
  let time=0,last=0,frame=0,visible=true,lost=false,px=0,py=0;
  function tick(now){
    frame=0;if(lost||document.hidden||!visible){last=0;return}
    const animate=document.body.dataset.motion==='on';
    if(!last||now-last>=36){
      if(last&&animate)time+=Math.min(.12,(now-last)/1000);
      last=now;draw(time,Number(intro.dataset.step||0),px,py);renderer.render(scene,camera);
    }
    if(animate)frame=requestAnimationFrame(tick);
  }
  function refresh(){cancelAnimationFrame(frame);last=0;frame=requestAnimationFrame(tick)}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(w,h,false);
    camera.left=-halfHeight*w/h;camera.right=-camera.left;
    camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();refresh();
  }
  host.classList.add('live');intro.dispatchEvent(new Event('mapmode'));
  intro.addEventListener('sceneinput',refresh);
  intro.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||document.body.dataset.motion!=='on')return;
    const rect=intro.getBoundingClientRect();px=(e.clientX-rect.left)/rect.width-.5;py=(e.clientY-rect.top)/rect.height-.5;
  });
  intro.addEventListener('pointerleave',()=>{px=0;py=0});
  document.querySelector('#stations')?.addEventListener('click',refresh);
  document.addEventListener('visibilitychange',refresh);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;host.classList.remove('live');canvas.hidden=true;intro.dispatchEvent(new Event('mapmode'));refresh()});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;host.classList.add('live');canvas.hidden=false;intro.dispatchEvent(new Event('mapmode'));resize()});
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;refresh()}).observe(host);
  resize();
})();
