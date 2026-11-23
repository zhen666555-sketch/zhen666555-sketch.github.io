'use strict';
const params = new URLSearchParams(location.search);
const keys = ['ticket', 'metro', 'revision'];
const theme = keys.includes(params.get('t')) ? params.get('t') : 'ticket';
const en = params.get('lang') === 'en';
const tr = (zh, english) => en ? english : zh;
const home = en ? '../../en/index.html' : '../../index.html';
const projects = [
  {id:'longqingxia', title:tr('龙庆峡','Longqingxia'), type:tr('文旅票务','Scenic ticketing'), stack:'Java / Spring Boot / MySQL', note:tr('部分退票后，余票继续使用原票码。','A partial refund keeps the original code valid for the remaining tickets.')},
  {id:'bike-transit', title:tr('城市共享单车协同分析系统','Bike–metro transfer analysis'), type:tr('空间数据分析','Spatial analysis'), stack:'Python / GeoPandas / XGBoost', note:tr('按物理站点划分训练与测试数据，考察模型在新站点的表现。','Hold out entire stations to test how well the model transfers to new locations.')},
  {id:'chuangling-beijing', title:tr('创龄北京','Chuangling Beijing'), type:tr('银龄人才服务','Talent services'), stack:'Vue 3 / Fastify / MySQL', note:tr('申请提交时保存快照，审核意见始终对应具体版本。','Each submission gets a snapshot so reviewers can trace a decision to the exact version.')}
];
const selected = projects[keys.indexOf(theme)];
const person = tr('曹泽祯','Zezhen Cao');
const bio = tr('我开发微信小程序和业务服务，也用 Python 分析城市出行。','I build WeChat mini programs and backend services, and use Python to study urban travel.');
const name = '<h1>'+person+'</h1>';
const role = tr('全栈开发工程师','Full-stack developer');
const detail = '<a class="case-link" href="'+home+'#'+selected.id+'" target="_blank" rel="noopener">'+tr('阅读项目','Read case study')+' ↗</a>';
const language = new URL(location.href);
language.searchParams.set('lang', en ? 'zh' : 'en');
document.documentElement.lang = en ? 'en' : 'zh-CN';
document.body.className = theme;
document.title = person+' · '+selected.title;
document.querySelector('#nav').innerHTML='<a href="#works">'+tr('作品','Work')+'</a><a href="mailto:17652855746@163.com">'+tr('联系','Contact')+'</a><a href="'+language.href+'" lang="'+tr('en','zh-CN')+'">'+tr('EN','中文')+'</a><button class="motion" type="button"></button>';
document.querySelector('#works').innerHTML='<div class="work-heading"><h2>'+tr('项目选集','Selected work')+'</h2><span>2024 — 2026</span></div><div class="works-list">'+projects.map(p=>'<a href="'+home+'#'+p.id+'" target="_blank" rel="noopener"><span class="category">'+p.type+'</span><h3>'+p.title+'</h3><p>'+p.note+'</p><small>'+p.stack+' ↗</small></a>').join('')+'</div>';
const intro = document.querySelector('#intro');
if (theme === 'ticket') {
  intro.innerHTML='<div class="ticket-copy"><p class="role">'+role+'</p>'+name+'<p class="latin">'+tr('Zezhen Cao','曹泽祯')+'</p><p class="bio">'+bio+'</p></div>'+
    '<article class="stub"><header><span>'+tr('交互样票','Sample ticket')+'</span><span>ZHEN / LQX</span></header><h2>'+selected.title+'</h2><p>'+tr('峡谷入园券','Canyon admission')+'</p><div class="perforation"></div><div class="balance"><strong id="remaining">03</strong><span>'+tr('张可用','tickets available')+'</span></div><div class="barcode" aria-hidden="true"></div><div class="stub-foot"><button id="refund" type="button"></button><span aria-live="polite" id="ledger"></span></div></article>'+
    '<div class="scene-foot"><span>'+tr('龙庆峡场景概念图','Longqingxia concept landscape')+'</span>'+detail+'</div>';
  let refunded=0;
  function updateTicket(){
    intro.dataset.step=refunded;
    intro.dispatchEvent(new Event('sceneinput'));
    document.querySelector('#remaining').textContent=String(3-refunded).padStart(2,'0');
    document.querySelector('#ledger').textContent=tr('已退 '+refunded+' 张',refunded+' refunded');
    document.querySelector('#refund').textContent=refunded===3?tr('重置样票','Reset ticket'):tr('模拟退一张','Refund one');
  }
  document.querySelector('#refund').onclick=()=>{refunded=(refunded+1)%4;updateTicket()};
  updateTicket();
} else if (theme === 'metro') {
  intro.innerHTML='<div class="metro-copy"><p class="role">'+role+'</p>'+name+'<p class="bio">'+bio+'</p><div class="metric"><b>236</b><span>'+tr('项目中的物理站点','physical stations in the study')+'</span></div>'+detail+'</div>'+
    '<figure class="map"><canvas aria-label="'+tr('示意线路及所选站点的五百米邻域','Illustrative transit lines and a 500 m catchment')+'"></canvas><figcaption><div><strong>'+tr('站点接驳','Station catchments')+'</strong><small>'+tr('线路示意 · 500 m 邻域','Schematic lines · 500 m catchment')+'</small></div><div id="stations" role="group" aria-label="'+tr('示例站点','Example stations')+'">'+['A','B','C'].map((s,i)=>'<button type="button" aria-pressed="'+(i===0)+'" data-index="'+i+'">'+s+'</button>').join('')+'</div></figcaption></figure>';
} else {
  intro.innerHTML='<div class="rev-head"><div><p class="role">'+role+'</p>'+name+'</div><div class="rev-bio"><p class="bio">'+bio+'</p>'+detail+'</div></div>'+
    '<div class="review"><div class="history"><h2>'+tr('创龄北京','Chuangling Beijing')+'</h2><p>'+tr('申请版本示例','Illustrative application history')+'</p><div class="commits" role="group" aria-label="'+tr('选择版本','Select version')+'"></div></div>'+
    '<div class="snapshot"><div class="file"><i aria-hidden="true"></i><span>application.snapshot</span><span id="revision-id"></span></div><div id="code"></div></div></div>';
  const steps=en?['Draft saved','Submitted','Returned for edits']:['保存草稿','提交快照','退回补充'];
  const status=['draft','submitted','needs_revision'];
  const notes=en?['Editable by applicant','Locked for review','Retain submitted snapshot']:['申请人可继续编辑','固定本次审核依据','保留已提交版本'];
  const commits=document.querySelector('.commits');
  commits.innerHTML=steps.map((s,i)=>'<button type="button" data-index="'+i+'"><i aria-hidden="true"></i>'+s+'</button>').join('');
  function select(i){
    intro.dataset.step=i;
    intro.dispatchEvent(new Event('sceneinput'));
    commits.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    document.querySelector('#revision-id').textContent='rev / 0'+(i+1);
    const lines=['{','  "revision": '+(i+1)+',','  "state": "'+status[i]+'",','  "note": "'+notes[i]+'"','}'];
    document.querySelector('#code').innerHTML=lines.map((l,j)=>'<div class="'+(j===2?'changed':'')+'"><span>'+String(j+1).padStart(2,'0')+'</span><code>'+l+'</code></div>').join('');
  }
  commits.onclick=e=>{const b=e.target.closest('button');if(b)select(Number(b.dataset.index))};
  select(1);
}
const media=matchMedia('(prefers-reduced-motion: reduce)');
let choice=null;
try{choice=sessionStorage.getItem('zhen-theme-motion')}catch{}
let on;
let redraw=()=>{};
function motion(){
  on=choice===null?!media.matches:choice==='on';
  document.body.dataset.motion=on?'on':'off';
  const b=document.querySelector('.motion');
  b.textContent=on?tr('暂停','Pause'):tr('播放','Play');
  b.setAttribute('aria-label',on?tr('暂停动效','Pause motion'):tr('开启动效','Enable motion'));
  b.setAttribute('aria-pressed',String(on));
  redraw();
  intro.dispatchEvent(new Event('sceneinput'));
}
document.querySelector('.motion').onclick=()=>{choice=on?'off':'on';try{sessionStorage.setItem('zhen-theme-motion',choice)}catch{}motion()};
media.addEventListener('change',motion);
motion();

if(theme==='metro') drawMap();
function drawMap(){
  const canvas=document.querySelector('.map canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const routes=[
    {c:'#174bda',p:[[-35,290],[102,290],[163,230],[271,230],[365,137],[468,137],[530,75],[655,75]]},
    {c:'#eb7140',p:[[60,-20],[60,90],[146,175],[146,214],[230,298],[349,298],[454,402],[620,402]]},
    {c:'#15847c',p:[[225,-30],[225,67],[289,131],[369,131],[423,185],[423,279],[507,362],[650,362]]}
  ];
  const stations=[[163,230],[349,298],[423,185]];
  let selected=0,time=0,last=0,frame=0,visible=true;
  function path(points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
  function circle(x,y,r,fill,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
  function render(){
    ctx.setTransform(canvas.width/620,0,0,canvas.height/420,0,0);
    ctx.fillStyle='#e8eee8';ctx.fillRect(0,0,620,420);
    ctx.save();ctx.translate(220,175);ctx.rotate(-.32);
    for(let row=-8;row<12;row++)for(let col=-10;col<14;col++){
      const x=col*39+(row%2)*8,y=row*29,v=Math.abs(row*19+col*17)%7;
      ctx.fillStyle=['#d5dfd7','#dae3d8','#d0dcd2','#d9e0d9'][v%4];ctx.fillRect(x,y,26+v,17+v%4);
    }
    ctx.restore();ctx.lineJoin='round';ctx.lineCap='round';
    ctx.strokeStyle='#b9dce2';ctx.lineWidth=24;ctx.beginPath();ctx.moveTo(-30,100);ctx.bezierCurveTo(175,60,140,370,310,368);ctx.bezierCurveTo(428,365,490,250,650,281);ctx.stroke();
    const [x,y]=stations[selected];
    circle(x,y,53,'#3065e225');ctx.lineWidth=1.4;ctx.setLineDash([4,4]);circle(x,y,53,null,'#346cbd');ctx.setLineDash([]);
    routes.forEach(({p,c},k)=>{
      ctx.strokeStyle='#f5f7ef';ctx.lineWidth=10;path(p);ctx.strokeStyle=c;ctx.lineWidth=5;path(p);
      ctx.lineWidth=2;p.slice(1,-1).forEach(([x,y])=>circle(x,y,4.6,'#f9faf1',c));
      const pos=(time*.47+k*1.7)%(p.length-1),i=Math.floor(pos),f=pos-i;
      const tx=p[i][0]+(p[i+1][0]-p[i][0])*f,ty=p[i][1]+(p[i+1][1]-p[i][1])*f;
      if(!canvas.parentElement.classList.contains('live'))circle(tx,ty,7,c,'white');
    });
    stations.forEach(([sx,sy],i)=>{circle(sx,sy,11,i===selected?'#102d68':'#f4f7ea','#173b73');ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillStyle=i===selected?'#fff':'#173b73';ctx.fillText('ABC'[i],sx,sy+4)});
    ctx.strokeStyle='#557285';ctx.lineWidth=1;path([[x+36,y-36],[x+63,y-60],[x+106,y-60]]);
    ctx.textAlign='left';ctx.font='bold 13px Consolas, monospace';ctx.fillStyle='#173b73';ctx.fillText('500 m',x+66,y-65);
    canvas.dispatchEvent(new Event('mapdraw'));
  }
  function tick(now){
    frame=0;if(document.hidden||!visible)return;
    if(!last||now-last>=38){time+=last?Math.min((now-last)/1000,.15):0;last=now;render()}
    if(on&&!canvas.parentElement.classList.contains('live'))frame=requestAnimationFrame(tick);
  }
  redraw=()=>{cancelAnimationFrame(frame);last=0;frame=requestAnimationFrame(tick)};
  const size=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));redraw()};
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e])=>{visible=e.isIntersecting;redraw()}).observe(canvas);
  document.addEventListener('visibilitychange',redraw);
  intro.addEventListener('mapmode',redraw);
  document.querySelector('#stations').onclick=e=>{const b=e.target.closest('button');if(!b)return;selected=Number(b.dataset.index);document.querySelectorAll('#stations button').forEach(t=>t.setAttribute('aria-pressed',String(b===t)));redraw()};
  size();
}
