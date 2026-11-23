(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const themes = ['celadon','dusk','fold'];
  const theme = themes.includes(query.get('t')) ? query.get('t') : themes[0];
  const english = query.get('lang') === 'en';
  const t = (zh,en) => english ? en : zh;
  const home = english ? '../../en/index.html' : '../../index.html';
  const page = document.body;
  page.classList.add(theme);
  document.documentElement.lang=t('zh-CN','en');
  const captions = {
    celadon: t('瓷褶 · 拖动转动器身','Porcelain pleats · Drag to turn'),
    dusk: t('潮面 · 轻点水面泛起涟漪','Tidal light · Tap the water to ripple'),
    fold: t('折纸习作 · 拖动舒展纸面','Paper study · Drag to open the pleats')
  };
  const names = english ? ['G · Celadon','H · Afterglow','I · Fold'] : ['G · 天青','H · 余晖','I · 折页'];
  const get = s => document.querySelector(s);
  document.querySelectorAll('[data-theme]').forEach((a,i)=>{
    a.textContent=names[i];a.href='?t='+a.dataset.theme+(english?'&lang=en':'');
    if(a.dataset.theme===theme)a.setAttribute('aria-current','page');
  });
  document.querySelector('.options').setAttribute('aria-label',t('选择主题','Choose theme'));
  document.title=names[themes.indexOf(theme)]+' · '+t('曹泽祯','Zezhen Cao');
  get('#language').textContent=t('EN','中文');
  get('#language').href='?t='+theme+'&lang='+t('en','zh');
  get('#language').lang=t('en','zh-CN');
  get('.signature').textContent=theme==='fold'?t('曹泽祯','曹泽祯 / Portfolio'):t('Zezhen Cao','曹泽祯');
  get('h1').textContent=theme==='fold'?'Zezhen Cao':t('曹泽祯','Zezhen Cao');
  get('.intro').textContent=t('全栈开发者。我做小程序和业务服务，也用数据研究城市出行。','I’m a full-stack developer. I build mini programs and backend services, and use data to study how people move through cities.');
  get('.browse').textContent=t('读我的作品','Explore my work')+' ↓';
  get('.caption').textContent=captions[theme];
  get('#artwork').setAttribute('aria-label',captions[theme]+t('，也可使用左右方向键或回车','; use the arrow keys or Enter'));
  get('#artwork').setAttribute('role','img');
  get('.work h2').textContent=t('近作','Selected work');
  get('.credit').textContent=t('曹泽祯','Zezhen Cao')+' © 2026';
  const cases=[
    ['chuangling-beijing',t('创龄北京','Chuangling Beijing'),t('银龄人才服务','Talent services'),t('一份履历从草稿到入库，审核意见如何跟随正确的版本。','Following a résumé from draft to approval while keeping reviews tied to the right version.')],
    ['longqingxia',t('龙庆峡','Longqingxia'),t('文旅票务','Visitor ticketing'),t('一笔多人订单，怎样退掉其中几张票，又保留余票的原票码。','Refunding part of a group booking while keeping the original code valid for the remaining tickets.')],
    ['bike-transit',t('单车与地铁','Bikes and metros'),t('深圳 · 空间分析','Shenzhen · Spatial analysis'),t('从 236 个物理站点出发，观察共享单车与地铁怎样接驳。','Studying how bike-share trips connect to the metro across 236 physical stations.')]
  ];
  get('.projects').innerHTML=cases.map(([id,name,field,note])=>'<a href="'+home+'#'+id+'"><div><small>'+field+'</small><h3>'+name+'</h3></div><p>'+note+'</p><b aria-hidden="true">↗</b></a>').join('');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let chosen=null;
  try { chosen=sessionStorage.getItem('zhen-edition-motion'); } catch {}
  function setMotion(){
    const on=chosen===null?!media.matches:chosen==='on';
    page.dataset.motion=on?'on':'off';
    get('#motion').setAttribute('aria-pressed',String(on));
    get('#motion').textContent=on?t('暂停动效','Pause motion'):t('开启动效','Enable motion');
    page.dispatchEvent(new Event('motionchange'));
  }
  get('#motion').onclick=()=>{
    chosen=page.dataset.motion==='on'?'off':'on';
    try {sessionStorage.setItem('zhen-edition-motion',chosen)} catch {}
    setMotion();
  };
  media.addEventListener('change',setMotion);
  setMotion();
})();
