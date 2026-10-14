// Cacingg Gila — satu file. Bagian: config · util · dunia · AI · render · input · UI
const $=s=>document.querySelector(s),W=3200,SP=7;
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),nang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ls={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
};
 
/* ---------- Konfigurasi: [kunci,label,min|opsi,max,step,default,grup (s=Pengaturan, a=Admin saja)] ---------- */
const SC=[
['baseSpeed','Kecepatan dasar',80,260,5,150,'s'],
['bots','Jumlah bot',0,20,1,10,'s'],
['food','Kepadatan makanan',100,800,20,320,'s'],
['botLevel','Kesulitan bot (1 mudah – 3 sulit)',1,3,1,2,'s'],
['joy','Sensitivitas joystick',.5,2,.1,1,'s'],
['zoom','Zoom',.2,4,.05,1,'s'],
['gfx','Kualitas grafis',{0:'Rendah',1:'Sedang',2:'Tinggi'},0,0,2,'s'],
['sound','Suara',{0:'Mati',1:'Hidup'},0,0,1,'s'],
['fxv','Efek visual',{0:'Mati',1:'Hidup'},0,0,1,'s'],
['speedMult','Pengali SPEED',1.1,3,.1,1.6,'a'],
['speedDur','Durasi SPEED (detik)',5,120,5,50,'a'],
['foodMult','Pengali makanan',{2:'×2',5:'×5',10:'×10'},0,0,5,'a'],
['foodDur','Durasi PENGGANDA (detik)',5,120,5,50,'a'],
['sharpDur','Durasi BELOK TAJAM (detik)',5,120,5,50,'a'],
['turn','Kecepatan belok normal (rad/dtk)',1.5,8,.1,4,'a'],
['turnSharp','Kecepatan belok TAJAM (rad/dtk)',6,20,.5,14,'a'],
['zMin','Zoom minimum',.2,1,.05,.5,'a'],
['zMax','Zoom maksimum',1,4,.1,2.4,'a'],
['itemEach','Jumlah tiap jenis item',1,15,1,5,'a'],
['skinMB','Batas upload skin (MB)',1,10,1,5,'a']
];
const DEF=Object.fromEntries(SC.map(r=>[r[0],r[5]]));
function clean(o){const c={};if(!o||typeof o!=='object')return c;for(const[k,,a,b]of SC){const v=o[k];if(typeof v!=='number'||!isFinite(v))continue;if(typeof a==='object'){if(v in a)c[k]=v}else c[k]=cl(v,a,b)}return c}
let cfg={...DEF,...clean(ls.get('cg_cfg',{}))};
function fixCfg(){cfg.zMax=Math.max(cfg.zMax,cfg.zMin+.1);cfg.zoom=cl(cfg.zoom,cfg.zMin,cfg.zMax)}
fixCfg();
const save=()=>ls.set('cg_cfg',cfg);
 
/* ---------- State ---------- */
const SKINS=[['#39ff88','#0b8f4a',1],['#ff5c7a','#7a1230',2],['#4cc9ff','#1b4b9b',1],['#ffd23f','#c2570c',2],['#c77dff','#4a1d8f',0],['#f4f4f4','#7f8fa6',1]];
let skin={c1:SKINS[0][0],c2:SKINS[0][1],p:1,img:0,...(ls.get('cg_skin',null)||{})},tile=null;
const cv=$('#cv'),ctx=cv.getContext('2d'),G=new Map();
const FC=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9f43'],IC=['#ffe600','#6bff8a','#ff7a1a'];
const NAMES=['Naga','Kobra','Bima','Sanca','Petir','Gesit','Lumba','Tubi','Jago','Sinyo','Bayu','Kuncen','Rimba','Gledek','Cakra','Wiro'];
let dpr=1,VW=1,VH=1,st='menu',P=null,B=[],F=[],I=[],tm=0,zoom=1,cam={x:W/2,y:W/2},ctl={a:null},keys={},joy=null,fps=60,di=0;
let stat=ls.get('cg_stat',{g:0,best:0,last:null});
 
/* ---------- Dunia ---------- */
function mk(x,y,name,type,sk){
  const a=rnd(0,6.283),w={name,type,a,wa:a,ta:a,ai:0,sd:Math.random()<.5?1:-1,pts:[],score:0,food:0,grow:0,r:8,fx:{s:0,f:0,t:0,m:1},sk,dead:0};
  for(let i=0;i<10;i++)w.pts.push({x:x-Math.cos(a)*SP*i,y:y-Math.sin(a)*SP*i,w});
  return w;
}
const mkFood=(x,y,v)=>({x:x??rnd(40,W-40),y:y??rnd(40,W-40),v:v||(Math.random()<.25?2:1),c:(Math.random()*6)|0});
const rate=w=>Math.min(22,(w.fx.t>0?cfg.turnSharp:cfg.turn)*(w===P?cfg.joy:1));
const spd=w=>cfg.baseSpeed*(w.fx.s>0?cfg.speedMult:1);
function move(w,dt){
  const p=w.pts,h=p[0],s=spd(w)*dt;
  h.x+=Math.cos(w.a)*s;h.y+=Math.sin(w.a)*s;
  for(let i=1;i<p.length;i++){const a=p[i],b=p[i-1],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;a.x=b.x+dx/d*SP;a.y=b.y+dy/d*SP}
}
function steerP(dt){
  const w=P,m=rate(w)*dt,k=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0);
  if(k){w.a+=k*m;ctl.a=null}else if(ctl.a!=null)w.a+=cl(nang(ctl.a-w.a),-m,m);
  w.a=nang(w.a);
}
function grid(){
  G.clear();
  for(const w of B){if(w.dead)continue;for(const p of w.pts){const k=(p.x/64|0)*100+(p.y/64|0);let a=G.get(k);if(!a)G.set(k,a=[]);a.push(p)}}
}
// true bila titik (x,y) dekat dinding atau badan cacing lain (dipakai bot & spawn)
function hit(x,y,w,m){
  if(x<60||y<60||x>W-60||y>W-60)return 1;
  const cx=x/64|0,cy=y/64|0;
  for(let i=cx-1;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){
    const a=G.get(i*100+j);
    if(a)for(const p of a){if(p.w===w)continue;const d=(w.r+p.w.r)*.8+m;if((p.x-x)**2+(p.y-y)**2<d*d)return 1}
  }
  return 0;
}
 
/* ---------- AI bot: 0 pemula · 1 menengah · 2 agresif · 3 evasif. Gerak & tabrakan sama dengan pemain ---------- */
function think(w){
  const h=w.pts[0],T=w.type,lv=[.7,1,1.4][cfg.botLevel-1]||1;
  let b=null,bd=(T?380:260)**2;
  for(const f of F){const d=(f.x-h.x)**2+(f.y-h.y)**2;if(d<bd){bd=d;b=f}}
  if(T)for(const i of I){const d=((i.x-h.x)**2+(i.y-h.y)**2)*.4;if(d<bd){bd=d;b=i}}
  let tx,ty;
  if(b){tx=b.x;ty=b.y}else{if(Math.random()<.1)w.wa+=rnd(-1,1);tx=h.x+Math.cos(w.wa)*300;ty=h.y+Math.sin(w.wa)*300}
  if(T>=2)for(const o of B){
    if(o===w||o.dead)continue;
    const q=o.pts[0],d=(q.x-h.x)**2+(q.y-h.y)**2;
    if(T==2&&d<450**2){const L=Math.min(160,Math.sqrt(d)*.6);tx=q.x+Math.cos(o.a)*L;ty=q.y+Math.sin(o.a)*L;break} // potong jalur di depan kepala lawan
    if(T==3&&d<170**2){tx=h.x+(h.x-q.x)*2;ty=h.y+(h.y-q.y)*2;break} // menjauh dari kepala dekat
  }
  const ang=Math.atan2(ty-h.y,tx-h.x),D=[40,75,120].slice(0,T==0?1:T==3?3:2).map(v=>v*lv),s=w.sd;
  const free=a=>D.every(d=>!hit(h.x+Math.cos(a)*d,h.y+Math.sin(a)*d,w,6));
  let a=ang;
  if(!free(a)){
    a=null;
    for(const o of[.5,1,1.6,2.4]){if(free(ang+o*s)){a=ang+o*s;break}if(free(ang-o*s)){a=ang-o*s;break}}
    if(a==null)a=ang+1.6*s;
  }
  w.ta=a;
}
function ai(w,dt){
  w.ai-=dt;if(w.ai<=0){w.ai=.09+Math.random()*.05;think(w)}
  const m=rate(w)*dt;w.a=nang(w.a+cl(nang(w.ta-w.a),-m,m));
}
 
/* ---------- Tabrakan, makan, item ---------- */
function collide(){
  const dead=new Set();
  for(const w of B){
    if(w.dead)continue;
    const h=w.pts[0];
    if(h.x<w.r||h.y<w.r||h.x>W-w.r||h.y>W-w.r){dead.add(w);continue}
    const cx=h.x/64|0,cy=h.y/64|0;
    for(let i=cx-1;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){
      const a=G.get(i*100+j);
      if(a)for(const p of a){
        const o=p.w;if(o===w||o.dead)continue;
        const d=(w.r+o.r)*.8;
        if((p.x-h.x)**2+(p.y-h.y)**2<d*d){
          if(p===o.pts[0]){if(w.pts.length<=o.pts.length)dead.add(w)} // adu kepala: yang lebih pendek kalah, sama panjang = keduanya kalah
          else dead.add(w); // kepala menabrak badan
        }
      }
    }
  }
  dead.forEach(kill);
}
function gain(w,v){
  const m=w.fx.f>0?w.fx.m:1,p=v*m; // pengali dihitung sekali per makanan
  w.score+=p;w.food++;w.grow+=p*.3;
  while(w.grow>=1){w.grow--;const l=w.pts[w.pts.length-1];w.pts.push({x:l.x,y:l.y,w})}
  w.r=8+Math.min(7,w.pts.length/70);
  if(w===P)beep(520,.04);
}
function pick(w,k){ // satu timer per efek; mengambil lagi = ulang ke durasi penuh, tanpa cooldown
  if(k==0)w.fx.s=cfg.speedDur;else if(k==1){w.fx.f=cfg.foodDur;w.fx.m=cfg.foodMult}else w.fx.t=cfg.sharpDur;
  if(w===P)beep(880,.12);
}
function eatAll(){
  for(const w of B){
    if(w.dead)continue;
    const h=w.pts[0],rr=(w.r+7)**2,ri=(w.r+16)**2;
    for(let i=F.length-1;i>=0;i--){const f=F[i];if((f.x-h.x)**2+(f.y-h.y)**2<rr){F[i]=F[F.length-1];F.pop();gain(w,f.v)}}
    for(let i=I.length-1;i>=0;i--){const f=I[i];if((f.x-h.x)**2+(f.y-h.y)**2<ri){I.splice(i,1);pick(w,f.t)}}
  }
}
function kill(w){
  w.dead=1;
  for(let i=0;i<w.pts.length;i+=2){const p=w.pts[i];F.push(mkFood(p.x+rnd(-8,8),p.y+rnd(-8,8),3))}
  const cap=cfg.food*2;if(F.length>cap)F.splice(0,F.length-cap);
  if(w===P){beep(120,.4);over()}
}
function mkItem(k){
  for(let n=0;n<8;n++){
    let x,y;
    if(P&&!P.dead&&Math.random()<.65){const a=rnd(0,6.283),d=rnd(220,800);x=P.pts[0].x+Math.cos(a)*d;y=P.pts[0].y+Math.sin(a)*d}
    else{x=rnd(100,W-100);y=rnd(100,W-100)}
    x=cl(x,100,W-100);y=cl(y,100,W-100);
    if(!hit(x,y,{r:8},20)||n==7)return{x,y,t:k};
  }
}
function spawnBot(){
  for(let n=0;n<10;n++){
    const x=rnd(250,W-250),y=rnd(250,W-250),h=P&&P.pts[0];
    if(h&&(x-h.x)**2+(y-h.y)**2<400**2)continue;
    if(hit(x,y,{r:8},40))continue;
    const hu=rnd(0,360),w=mk(x,y,NAMES[(Math.random()*NAMES.length)|0],(Math.random()*4)|0,{c1:`hsl(${hu},85%,55%)`,c2:`hsl(${(hu+40)%360},80%,30%)`,p:(Math.random()*3)|0});
    w.bot=1;B.push(w);grid();return;
  }
}
function tick(){ // menjaga jumlah makanan, item per jenis, dan bot
  while(F.length<cfg.food)F.push(mkFood());
  for(let k=0;k<3;k++){let n=0;for(const i of I)if(i.t==k)n++;for(;n<cfg.itemEach;n++)I.push(mkItem(k))}
  let nb=0;for(const w of B)if(w.bot)nb++;
  if(nb<cfg.bots)spawnBot();
}
function update(dt){
  tm+=dt;
  for(const w of B)for(const k of['s','f','t'])if(w.fx[k]>0)w.fx[k]=Math.max(0,w.fx[k]-dt);
  for(const w of B){if(w.dead)continue;if(w===P)steerP(dt);else ai(w,dt);move(w,dt)}
  grid();collide();eatAll();
  B=B.filter(w=>!w.dead);
  const h=P.pts[0],k=Math.min(1,dt*9);
  cam.x+=(h.x-cam.x)*k;cam.y+=(h.y-cam.y)*k;zoom+=(cfg.zoom-zoom)*Math.min(1,dt*8);
}
 
/* ---------- Render ---------- */
function drawW(c,pts,r,sk,glow){
  if(pts.length<2)return;
  const img=sk.img&&tile;
  c.lineCap=c.lineJoin='round';c.setLineDash([]);
  c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);
  if(glow){c.strokeStyle=glow;c.lineWidth=r*2.8;c.globalAlpha=.3;c.stroke();c.globalAlpha=1}
  c.lineWidth=r*2;c.strokeStyle=img?c.createPattern(tile,'repeat'):sk.c1;c.stroke();
  if(!img&&sk.p){
    c.strokeStyle=sk.c2;
    if(sk.p==1){c.lineCap='butt';c.lineWidth=r*2;c.setLineDash([r*.9,r*1.8])}else{c.lineWidth=r*1.1;c.setLineDash([.1,r*2.2])}
    c.stroke();c.setLineDash([]);c.lineCap='round';
  }
}
function eyes(c,h,a,r){
  for(const s of[-1,1]){
    const x=h.x+Math.cos(a)*r*.45+Math.cos(a+1.57*s)*r*.5,y=h.y+Math.sin(a)*r*.45+Math.sin(a+1.57*s)*r*.5;
    c.fillStyle='#fff';c.beginPath();c.arc(x,y,r*.32,0,6.3);c.fill();
    c.fillStyle='#000';c.beginPath();c.arc(x+Math.cos(a)*r*.1,y+Math.sin(a)*r*.1,r*.16,0,6.3);c.fill();
  }
}
function poly(c,x,y,r,n,rot){c.beginPath();for(let k=0;k<n;k++){const a=rot+k*6.283/n;c[k?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath()}
const sym=k=>k==0?'⚡':k==1?'×'+cfg.foodMult:'↪';
function item(c,i){ // bentuk beda: belah ketupat (SPEED), segi enam (PENGGANDA), segitiga (BELOK TAJAM)
  const col=IC[i.t],p=Math.sin(tm*5+i.x)*.5+.5;
  if(cfg.fxv){c.globalAlpha=.2+.15*p;c.fillStyle=col;c.beginPath();c.arc(i.x,i.y,28+8*p,0,6.3);c.fill();c.globalAlpha=1}
  poly(c,i.x,i.y,i.t==2?21:17,[4,6,3][i.t],i.t==2?-1.57:0);c.fillStyle=col;c.fill();c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#111';c.font='bold 16px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(sym(i.t),i.x,i.y+(i.t==2?3:1));
}
function ind(c,S){ // penunjuk item terdekat di tepi layar
  for(let k=0;k<3;k++){
    let b=null,bd=1e18;
    for(const i of I)if(i.t==k){const d=(i.x-cam.x)**2+(i.y-cam.y)**2;if(d<bd){bd=d;b=i}}
    if(!b)continue;
    const dx=(b.x-cam.x)*S,dy=(b.y-cam.y)*S,hx=VW/2-26,hy=VH/2-26;
    if(Math.abs(dx)<hx&&Math.abs(dy)<hy)continue;
    const a=Math.atan2(dy,dx),m=Math.min(hx/Math.abs(Math.cos(a)||1e-6),hy/Math.abs(Math.sin(a)||1e-6)),x=VW/2+Math.cos(a)*m,y=VH/2+Math.sin(a)*m;
    c.fillStyle=IC[k];c.globalAlpha=.9;c.beginPath();c.arc(x,y,13,0,6.3);c.fill();c.globalAlpha=1;
    poly(c,x+Math.cos(a)*18,y+Math.sin(a)*18,7,3,a);c.fill();
    c.fillStyle='#111';c.font='bold 13px system-ui';c.fillText(sym(k),x,y+1);
  }
}
function draw(){
  const c=ctx,S=zoom*Math.min(VW,VH)/450; // zoom hanya skala tampilan; hitbox tetap di koordinat dunia
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#070b18';c.fillRect(0,0,VW,VH);
  c.setTransform(S*dpr,0,0,S*dpr,(VW/2-cam.x*S)*dpr,(VH/2-cam.y*S)*dpr);
  const hw=VW/S/2+40,hh=VH/S/2+40,x0=cam.x-hw,x1=cam.x+hw,y0=cam.y-hh,y1=cam.y+hh;
  c.fillStyle='#10183a';c.fillRect(0,0,W,W);
  c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=2;c.beginPath();
  for(let g=Math.max(0,Math.floor(x0/100)*100);g<=Math.min(W,x1);g+=100){c.moveTo(g,Math.max(0,y0));c.lineTo(g,Math.min(W,y1))}
  for(let g=Math.max(0,Math.floor(y0/100)*100);g<=Math.min(W,y1);g+=100){c.moveTo(Math.max(0,x0),g);c.lineTo(Math.min(W,x1),g)}
  c.stroke();c.strokeStyle='#ff3d5a';c.lineWidth=12;c.strokeRect(0,0,W,W);
  for(const f of F){if(f.x<x0||f.x>x1||f.y<y0||f.y>y1)continue;c.fillStyle=FC[f.c];c.beginPath();c.arc(f.x,f.y,3+f.v*1.3,0,6.3);c.fill()}
  for(const i of I)if(i.x>x0&&i.x<x1&&i.y>y0&&i.y<y1)item(c,i);
  for(let k=B.length-1;k>=0;k--){
    const w=B[k],h=w.pts[0],m=w.pts.length*SP;
    if(Math.abs(h.x-cam.x)>hw+m||Math.abs(h.y-cam.y)>hh+m)continue;
    const g=cfg.fxv?(w.fx.s>0?'#ffe600':w.fx.t>0?'#ff7a1a':w.fx.f>0?'#6bff8a':0):0;
    drawW(c,w.pts,w.r,w.sk,g);eyes(c,h,w.a,w.r);
  }
  c.setTransform(dpr,0,0,dpr,0,0);c.textAlign='center';c.textBaseline='middle';c.font='bold 12px system-ui';c.fillStyle='#fff';
  for(const w of B){const h=w.pts[0],x=(h.x-cam.x)*S+VW/2,y=(h.y-cam.y)*S+VH/2-w.r*S-10;if(x>0&&x<VW&&y>0&&y<VH)c.fillText(w.name,x,y)}
  ind(c,S);
}
function resize(){
  const r=cv.getBoundingClientRect();
  dpr=Math.min(devicePixelRatio||1,[1,1.5,2][cfg.gfx]);VW=r.width;VH=r.height;
  cv.width=Math.round(VW*dpr);cv.height=Math.round(VH*dpr);
}
function hud(){
  if(!P)return;const f=P.fx;
  $('#stats').innerHTML=`<b>${P.score|0}</b> skor<br>Panjang ${P.pts.length} · Makan ${P.food}`;
  $('#fx').innerHTML=(f.s>0?`<span class=s>⚡ ${Math.ceil(f.s)}s</span>`:'')+(f.f>0?`<span class=f>🍏×${f.m} ${Math.ceil(f.f)}s</span>`:'')+(f.t>0?`<span class=t>↪ ${Math.ceil(f.t)}s</span>`:'');
}
let ac;
function beep(f,d){
  if(!cfg.sound)return;
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state=='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}
}
 
/* ---------- Alur game ---------- */
function start(){
  fixCfg();ls.set('cg_name',$('#name').value.trim());
  F=[];I=[];B=[];G.clear();tm=0;ctl.a=null;
  const x=rnd(W*.3,W*.7),y=rnd(W*.3,W*.7);
  P=mk(x,y,$('#name').value.trim()||'Kamu',0,skin);B.push(P);cam.x=x;cam.y=y;zoom=cfg.zoom;
  grid();for(let i=0;i<cfg.bots;i++)spawnBot();
  tick();st='play';hideAll();$('#hud').hidden=false;resize();hud();beep(660,.06);
}
function over(){
  st='over';const s=P.score|0;
  stat.g++;stat.best=Math.max(stat.best,s);stat.last={s,l:P.pts.length,f:P.food};ls.set('cg_stat',stat);
  $('#ovT').textContent=`Skor ${s} · Panjang ${P.pts.length} · Makan ${P.food} · Rekor ${stat.best}`;
  $('#hud').hidden=true;joy=null;$('#jb').hidden=true;show('over');
}
function quit(){
  st='menu';P=null;B=[];F=[];I=[];G.clear();joy=null;$('#jb').hidden=true;$('#hud').hidden=true;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
}
function pause(){if(st!='play')return;st='pause';joy=null;$('#jb').hidden=true;show('pause')}
function resume(){if(st!='pause')return;st='play';hideAll()}
function zm(k){cfg.zoom=cl(+(cfg.zoom*k).toFixed(3),cfg.zMin,cfg.zMax);save()}
let last=0,tk=0,fa=0;
function loop(ts){
  requestAnimationFrame(loop);
  const raw=(ts-last)/1000;last=ts;
  if(raw>0&&raw<1)fps+=(1/raw-fps)*.05;
  const dt=Math.min(raw>0?raw:0,1/45); // batas dt: gerak per frame kecil, tabrakan tidak tembus
  if(st=='play'){update(dt);tk+=dt;fa+=dt;if(tk>.4){tk=0;tick()}if(fa>.12){fa=0;hud()}}
  if(P&&st!='menu')draw();
}
 
/* ---------- Input ---------- */
const jb=$('#jb'),jk=$('#jk'),aim=e=>{ctl.a=Math.atan2(e.clientY-VH/2,e.clientX-VW/2)};
cv.addEventListener('pointerdown',e=>{
  if(st!='play')return;
  if(e.pointerType=='mouse')aim(e);
  else if(!joy){joy={id:e.pointerId,x:e.clientX,y:e.clientY};jb.style.left=joy.x+'px';jb.style.top=joy.y+'px';jk.style.transform='';jb.hidden=false}
});
cv.addEventListener('pointermove',e=>{
  if(st!='play')return;
  if(e.pointerType=='mouse')aim(e);
  else if(joy&&joy.id==e.pointerId){
    const dx=e.clientX-joy.x,dy=e.clientY-joy.y,m=Math.hypot(dx,dy),k=Math.min(m,50)/(m||1);
    if(m>8)ctl.a=Math.atan2(dy,dx);
    jk.style.transform=`translate(${dx*k}px,${dy*k}px)`;
  }
});
const up=e=>{if(joy&&joy.id==e.pointerId){joy=null;jb.hidden=true}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();if(st=='play')zm(e.deltaY<0?1.1:1/1.1)},{passive:false});
document.addEventListener('touchmove',e=>{if(st=='play')e.preventDefault()},{passive:false});
for(const ev of['gesturestart','gesturechange','contextmenu'])document.addEventListener(ev,e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName||''))return;
  const k=e.key.toLowerCase();keys[k]=1;
  if(st=='menu'||st=='over')return;
  if(k=='p'||k=='escape'){st=='play'?pause():resume()}
  else if(st=='play'){if(k=='+'||k=='=')zm(1.2);if(k=='-'||k=='_')zm(1/1.2);if(k.startsWith('arrow')||k==' ')e.preventDefault()}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0});
document.addEventListener('visibilitychange',()=>document.hidden&&pause());
addEventListener('blur',pause);
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
 
/* ---------- UI: layar, form, skin, admin ---------- */
const scr=document.querySelectorAll('.scr'),msg=s=>{$('#admMsg').textContent=s},skMsg=s=>{$('#skMsg').textContent=s};
function hideAll(){scr.forEach(s=>s.hidden=true);clearInterval(di)}
function show(id){
  scr.forEach(s=>s.hidden=s.id!=id);clearInterval(di);
  if(id=='skin')skinUI();
  if(id=='set')form('#setF','s');
  if(id=='adm'){form('#admF','a');dash();di=setInterval(dash,500)}
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;
  let g=b.dataset.go;if(g=='back')g=st=='pause'?'pause':'menu';
  if(b.hasAttribute('data-quit'))quit();
  show(g);
});
function apply(){fixCfg();save();resize()}
function form(sel,grp){
  const el=$(sel);el.innerHTML='';
  for(const[k,l,a,b,s,,g]of SC){
    if(grp=='s'&&g!='s')continue;
    const row=document.createElement('label'),out=document.createElement('output');row.className='fr';
    let inp;
    if(typeof a=='object'){
      inp=document.createElement('select');
      for(const[v,n]of Object.entries(a))inp.add(new Option(n,v));
      inp.value=cfg[k];inp.onchange=()=>{cfg[k]=+inp.value;apply()};
    }else{
      inp=document.createElement('input');inp.type='range';inp.min=a;inp.max=b;inp.step=s;inp.value=cfg[k];out.textContent=cfg[k];
      inp.oninput=()=>{cfg[k]=+inp.value;out.textContent=cfg[k];apply()};
    }
    row.append(l+' ',out,inp);el.append(row);
  }
}
function dash(){
  const s=stat,w=P;
  $('#dash').textContent=[
    `Status: ${st} · FPS: ${fps|0}`,
    `Game dimainkan: ${s.g} · Rekor: ${s.best}`,
    w?`Pemain: skor ${w.score|0}, panjang ${w.pts.length}, makan ${w.food}`:(s.last?`Game terakhir: skor ${s.last.s}, panjang ${s.last.l}, makan ${s.last.f}`:'Belum ada game'),
    `Bot hidup: ${B.filter(b=>b.bot).length} (target ${cfg.bots})`,
    `Makanan: ${F.length} · Item di arena: ${I.length}`
  ].join('\n');
}
$('#exp').onclick=()=>{
  const j=JSON.stringify(cfg,null,1);$('#js').value=j;
  try{navigator.clipboard.writeText(j).catch(()=>{})}catch{}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([j],{type:'application/json'}));a.download='cacingg-gila-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch{}
  msg('Diekspor: JSON ada di kotak, disalin ke clipboard, dan diunduh.');
};
$('#imp').onclick=()=>{
  let o;try{o=JSON.parse($('#js').value)}catch{return msg('JSON tidak valid.')}
  const c=clean(o),n=Object.keys(c).length;
  if(!n)return msg('Tidak ada kunci konfigurasi yang valid.');
  Object.assign(cfg,c);apply();form('#admF','a');msg(`Diimpor ${n} nilai (nilai di luar batas dikoreksi).`);
};
$('#rst').onclick=()=>{cfg={...DEF};apply();form('#admF','a');msg('Konfigurasi dikembalikan ke default.')};
 
// skin
function pv(){
  const c=$('#pv').getContext('2d'),p=[];c.clearRect(0,0,260,90);
  for(let i=0;i<24;i++)p.push({x:240-i*9,y:45+Math.sin(i*.55)*16});
  drawW(c,p,11,skin);eyes(c,p[0],0,11);
}
function setImg(d){
  const im=new Image();
  im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=40;c.getContext('2d').drawImage(im,0,0,40,40);tile=c;pv()};
  im.onerror=()=>{tile=null};
  im.src=d;
}
function saveSkin(){ls.set('cg_skin',skin);pv()}
function skinUI(){
  const sk=$('#sk');sk.innerHTML='';
  SKINS.forEach(([a,b,p])=>{const x=document.createElement('button');x.className='sw';x.style.background=`linear-gradient(90deg,${a} 50%,${b} 50%)`;x.onclick=()=>{skin={c1:a,c2:b,p,img:0};$('#c1').value=a;$('#c2').value=b;$('#pt').value=p;saveSkin()};sk.append(x)});
  $('#c1').value=skin.c1;$('#c2').value=skin.c2;$('#pt').value=skin.p;skMsg('');pv();
}
$('#c1').oninput=()=>{skin={...skin,c1:$('#c1').value,img:0};saveSkin()};
$('#c2').oninput=()=>{skin={...skin,c2:$('#c2').value,img:0};saveSkin()};
$('#pt').onchange=()=>{skin={...skin,p:+$('#pt').value,img:0};saveSkin()};
$('#up').onchange=e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  if(!/^image\/(png|jpe?g|webp)$/.test(f.type))return skMsg('Format harus PNG, JPG, atau WebP.');
  if(f.size>cfg.skinMB*1048576)return skMsg(`File terlalu besar (maksimum ${cfg.skinMB} MB).`);
  const u=URL.createObjectURL(f),im=new Image();
  im.onerror=()=>{URL.revokeObjectURL(u);skMsg('Gambar rusak atau tidak bisa dibaca.')};
  im.onload=()=>{
    const s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=64; // potong persegi dari tengah, diproses lokal
    c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,64,64);URL.revokeObjectURL(u);
    const d=c.toDataURL('image/jpeg',.85);
    if(!ls.set('cg_skinimg',d))return skMsg('Penyimpanan browser penuh; gambar tidak tersimpan.');
    setImg(d);skin={...skin,img:1};saveSkin();skMsg('Skin gambar diterapkan.');
  };
  im.src=u;
};
$('#skDel').onclick=()=>{
  try{localStorage.removeItem('cg_skinimg')}catch{}
  tile=null;skin={c1:SKINS[0][0],c2:SKINS[0][1],p:1,img:0};saveSkin();skinUI();skMsg('Gambar dihapus; skin dikembalikan ke bawaan.');
};
 
// tombol utama
$('#bPlay').onclick=start;$('#bAgain').onclick=start;$('#bRes').onclick=resume;$('#bPause').onclick=pause;
$('#bMenu').onclick=()=>{quit();show('menu')};
$('#zIn').onclick=()=>zm(1.2);$('#zOut').onclick=()=>zm(1/1.2);
 
// boot
$('#name').value=ls.get('cg_name','');
$('#name').oninput=e=>ls.set('cg_name',e.target.value.trim());
{const d=ls.get('cg_skinimg',null);if(d&&skin.img)setImg(d)}
resize();show('menu');requestAnimationFrame(loop);
 
