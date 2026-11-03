// Cacingg Gila — satu file. Bagian: config · util · dunia · AI · render · input · UI
const $=s=>document.querySelector(s),W=22600,SP=7,GK=1000,CS=96,FS=128; // W = ukuran arena: 22600² ≈ 50× luas arena lama (3200²)
const rnd=(a,b)=>a+Math.random()*(b-a),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),nang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ls={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
};

/* ---------- Konfigurasi game ----------
   [kunci, label, min|opsi, max, step, default, grup]
   grup: s = tampil di Pengaturan · p = disimpan tapi tanpa slider (zoom) · a = konfigurasi kode (ubah angka default di sini; tidak ada panel admin) */
const SC=[
['baseSpeed','Kecepatan dasar',80,260,5,150,'s'],
['bots','Jumlah bot',0,150,5,60,'s'],
['food','Jumlah makanan di arena',1000,25000,500,9000,'s'],
['botLevel','Kesulitan bot (1 mudah – 3 sulit)',1,3,1,2,'s'],
['joy','Sensitivitas joystick',.5,2,.1,1,'s'],
['renderDist','Jarak render cacing lain',800,10000,100,3000,'s'],
['maxRender','Maks. cacing lain yang dirender',4,40,1,16,'s'],
['gfx','Kualitas grafis',{0:'Rendah',1:'Sedang',2:'Tinggi'},0,0,2,'s'],
['sound','Suara',{0:'Mati',1:'Hidup'},0,0,1,'s'],
['fxv','Efek visual',{0:'Mati',1:'Hidup'},0,0,1,'s'],
['zoom','Zoom (1 = standar, .02 = pandangan 50× lebih luas)',.02,4,.01,1,'p'],
['turn','Kecepatan belok NORMAL (rad/dtk)',1.5,8,.1,2.6,'a'],
['turnSharp','Kecepatan belok item TURN (rad/dtk)',6,20,.5,10,'a'],
['speedMult','Pengali kecepatan item SPEED',1.1,3,.1,2,'a'],
['boostMult','Pengali kecepatan tombol SPEED',1.1,2,.05,1.45,'a'],
['speedCap','Batas kecepatan gabungan (pengali)',1.5,4,.1,2.6,'a'],
['speedDur','Durasi efek SPEED setelah dimakan (detik)',5,300,5,50,'a'],
['turnDur','Durasi efek TURN setelah dimakan (detik)',5,300,5,50,'a'],
['foodDur','Durasi efek X2/X5/X10 setelah dimakan (detik)',5,300,5,50,'a'],
['thick','Pertumbuhan ketebalan cacing',0,2,.1,1,'a'],
['itemSee','Jarak item terlihat (satuan dunia)',600,6000,100,1800,'a'],
['zMin','Zoom minimum (pandangan 50×)',.02,1,.01,.02,'a'],
['zMax','Zoom maksimum',1,4,.1,2.4,'a'],
['skinMB','Batas upload skin (MB)',1,10,1,5,'a']
];
// Item di arena. ttl = berapa detik item bertahan di peta sebelum menghilang & muncul lagi di lokasi lain (timer terpisah dari durasi efek)
// cnt = jumlah item aktif per jenis di seluruh arena
const ITEMS=[
{n:'SPEED',sym:'⚡',col:'#ffe600',shape:4,ttl:180,cnt:30},
{n:'TURN',sym:'↪',col:'#ff7a1a',shape:3,ttl:180,cnt:30},
{n:'X2',sym:'×2',col:'#6bff8a',shape:6,ttl:900,cnt:36},
{n:'X5',sym:'×5',col:'#4cc9ff',shape:5,ttl:600,cnt:20},
{n:'X10',sym:'×10',col:'#ff4fd8',shape:8,ttl:120,cnt:10}
];
const MULT=[0,0,2,5,10];
const DEF=Object.fromEntries(SC.map(r=>[r[0],r[5]]));
function clean(o){const c={};if(!o||typeof o!=='object')return c;for(const[k,,a,b,,,g]of SC){if(g=='a')continue;const v=o[k];if(typeof v!=='number'||!isFinite(v))continue;if(typeof a==='object'){if(v in a)c[k]=v}else c[k]=cl(v,a,b)}return c}
let cfg={...DEF,...clean(ls.get('cg_cfg3',{}))};
function fixCfg(){cfg.zMax=Math.max(cfg.zMax,cfg.zMin+.1);cfg.zoom=cl(cfg.zoom,cfg.zMin,cfg.zMax)}
fixCfg();
const save=()=>ls.set('cg_cfg3',Object.fromEntries(SC.filter(r=>r[6]!='a').map(r=>[r[0],cfg[r[0]]])));

/* ---------- State ---------- */
const SKINS=[['#39ff88','#0b8f4a',1],['#ff5c7a','#7a1230',2],['#4cc9ff','#1b4b9b',1],['#ffd23f','#c2570c',2],['#c77dff','#4a1d8f',0],['#f4f4f4','#7f8fa6',1]];
let skin={c1:SKINS[0][0],c2:SKINS[0][1],p:1,img:0,...(ls.get('cg_skin',null)||{})},tile=null;
const cv=$('#cv'),ctx=cv.getContext('2d'),G=new Map(),FG=new Map();
const FC=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff','#ff9f43'];
const NAMES=['Naga','Kobra','Bima','Sanca','Petir','Gesit','Lumba','Tubi','Jago','Sinyo','Bayu','Kuncen','Rimba','Gledek','Cakra','Wiro'];
let dpr=1,VW=1,VH=1,st='menu',P=null,B=[],I=[],FD=[],fc=0,RL=[],tm=0,zoom=1,cam={x:W/2,y:W/2},ctl={a:null},keys={},joy=null,fps=60,btnS=0,lastBd=0;
let stat=ls.get('cg_stat',{g:0,best:0,last:null});

/* ---------- Makanan: grid spasial supaya arena luas tetap ringan ---------- */
const fk=(x,y)=>(x/FS|0)*GK+(y/FS|0);
const mkFood=(x,y,v)=>({x:x??rnd(40,W-40),y:y??rnd(40,W-40),v:v||(Math.random()<.25?2:1),c:(Math.random()*6)|0,d:0});
function addFood(f,drop){const k=fk(f.x,f.y);let a=FG.get(k);if(!a)FG.set(k,a=[]);a.push(f);fc++;if(drop)FD.push(f)}
function delFood(a,i){const f=a[i];f.d=1;a[i]=a[a.length-1];a.pop();fc--}
function trimDrops(){ // makanan sisa cacing mati dibatasi supaya jumlah total tidak meledak
  while(fc>cfg.food*1.3&&FD.length){const f=FD.shift();if(f.d)continue;const a=FG.get(fk(f.x,f.y)),j=a?a.indexOf(f):-1;if(j>=0)delFood(a,j)}
  if(FD.length>4000)FD=FD.filter(f=>!f.d);
}
function nearFood(x,y,R){ // makanan terdekat dalam radius R (lewat grid)
  let b=null,bd=R*R;const c=Math.ceil(R/FS),cx=x/FS|0,cy=y/FS|0;
  for(let i=cx-c;i<=cx+c;i++)for(let j=cy-c;j<=cy+c;j++){const a=FG.get(i*GK+j);if(a)for(const f of a){const d=(f.x-x)**2+(f.y-y)**2;if(d<bd){bd=d;b=f}}}
  lastBd=bd;return b;
}

/* ---------- Dunia: cacing = kepala + jejak (riwayat posisi kepala). Tiap ruas ditaruh di jarak busur tetap sepanjang jejak ---------- */
function mk(x,y,name,type,sk){
  const a=rnd(0,6.283),w={name,type,a,wa:a,ta:a,ai:0,sd:Math.random()<.5?1:-1,pts:[],trail:[],score:0,food:0,grow:0,r:8,tr:8,sp:SP,sv:1,kv:0,va:1,dd:0,hs:0,boost:0,fx:{s:0,f:0,t:0,m:1},sk,dead:0};
  for(let i=0;i<10;i++)w.pts.push({x:x-Math.cos(a)*SP*i,y:y-Math.sin(a)*SP*i,w});
  for(let i=40;i>=0;i--)w.trail.push(x-Math.cos(a)*3*i,y-Math.sin(a)*3*i); // terlama → terbaru (kepala)
  return w;
}
const rate=w=>Math.min(22,(w.fx.t>0?cfg.turnSharp:cfg.turn)*(w===P?cfg.joy:1));
const spd=w=>cfg.baseSpeed*w.sv;
function body(w){ // taruh ruas ke-i di jarak i·sp sepanjang jejak kepala → badan selalu mengikuti jalur kepala, tanpa patah
  const p=w.pts,T=w.trail,n=p.length,sp=w.sp;let ax=p[0].x,ay=p[0].y,rem=sp,i=1,k=T.length/2-1;
  while(i<n&&k>=0){
    const bx=T[k*2],by=T[k*2+1],dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy);
    if(rem<=L){const t=rem/L;ax+=dx*t;ay+=dy*t;p[i].x=ax;p[i].y=ay;i++;rem=sp}
    else{rem-=L;ax=bx;ay=by;k--}
  }
  const full=i>=n;
  for(;i<n;i++){p[i].x=ax;p[i].y=ay}
  if(full&&k>60)T.splice(0,(k-25)*2); // buang jejak yang tidak terpakai
}
function move(w,dt){
  const h=w.pts[0],s=spd(w)*dt,T=w.trail,n=T.length;
  h.x+=Math.cos(w.a)*s;h.y+=Math.sin(w.a)*s;
  if(!n||(h.x-T[n-2])**2+(h.y-T[n-1])**2>=6.25)T.push(h.x,h.y);
  body(w);
}
function steerP(dt){
  const w=P,m=rate(w)*dt,tp=w.fx.t>0,k=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0);
  if(k)ctl.a=null;
  w.kv+=(k-w.kv)*Math.min(1,dt*(tp?26:10)); // item TURN: respons kontrol jauh lebih cepat
  if(Math.abs(w.kv)>.02)w.a+=w.kv*m;
  else if(ctl.a!=null)w.a+=cl(nang(ctl.a-w.a)*Math.min(1,dt*(tp?30:12)),-m,m);
  w.a=nang(w.a);
}
function grid(){
  G.clear();
  for(const w of B){if(w.dead)continue;for(const p of w.pts){const k=(p.x/CS|0)*GK+(p.y/CS|0);let a=G.get(k);if(!a)G.set(k,a=[]);a.push(p)}}
}
// true bila titik (x,y) dekat dinding atau badan cacing lain (dipakai bot & spawn)
function hit(x,y,w,m){
  const wm=w.r*1.5+45;if(x<wm||y<wm||x>W-wm||y>W-wm)return 1;
  const cx=x/CS|0,cy=y/CS|0;
  for(let i=cx-1;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){
    const a=G.get(i*GK+j);
    if(a)for(const p of a){if(p.w===w)continue;const d=(w.r+p.w.r)*.8+m;if((p.x-x)**2+(p.y-y)**2<d*d)return 1}
  }
  return 0;
}

/* ---------- AI bot: 0 pemula · 1 menengah · 2 agresif · 3 evasif. Gerak & tabrakan sama dengan pemain ---------- */
function think(w){
  const h=w.pts[0],T=w.type,lv=[.7,1,1.4][cfg.botLevel-1]||1;
  let b=nearFood(h.x,h.y,T?380:260),bd=b?lastBd:(T?380:260)**2;
  if(T)for(const i of I){const d=((i.x-h.x)**2+(i.y-h.y)**2)*.4;if(d<bd){bd=d;b=i}}
  let tx,ty;
  if(b){tx=b.x;ty=b.y}else{if(Math.random()<.1)w.wa+=rnd(-1,1);tx=h.x+Math.cos(w.wa)*300;ty=h.y+Math.sin(w.wa)*300}
  if(T>=2)for(const o of B){
    if(o===w||o.dead)continue;
    const q=o.pts[0],d=(q.x-h.x)**2+(q.y-h.y)**2;
    if(T==2&&d<450**2){const L=Math.min(160,Math.sqrt(d)*.6);tx=q.x+Math.cos(o.a)*L;ty=q.y+Math.sin(o.a)*L;break} // potong jalur di depan kepala lawan
    if(T==3&&d<170**2){tx=h.x+(h.x-q.x)*2;ty=h.y+(h.y-q.y)*2;break} // menjauh dari kepala dekat
  }
  const ang=Math.atan2(ty-h.y,tx-h.x),D=[55,100,150].slice(0,T==0?1:T==3?3:2).map(v=>v*lv*Math.max(1,w.r/9)*(w.sv>1.3?1.4:1)),s=w.sd;
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

/* ---------- Tabrakan, headshot, makan, item ---------- */
function collide(){
  const dead=new Set(),hp=[];
  for(const w of B){
    if(w.dead)continue;
    const h=w.pts[0];
    if(h.x<w.r||h.y<w.r||h.x>W-w.r||h.y>W-w.r){dead.add(w);continue}
    const cx=h.x/CS|0,cy=h.y/CS|0;
    for(let i=cx-1;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){
      const a=G.get(i*GK+j);
      if(a)for(const p of a){
        const o=p.w;if(o===w||o.dead)continue;
        const d=(w.r+o.r)*.8;
        if((p.x-h.x)**2+(p.y-h.y)**2<d*d){
          if(p===o.pts[0]){if(w.pts.length<=o.pts.length){dead.add(w);hp.push(w,o)}} // adu kepala: yang lebih pendek kalah, sama panjang = keduanya kalah
          else dead.add(w); // kepala menabrak badan
        }
      }
    }
  }
  if(P&&!dead.has(P)){const seen=new Set();for(let i=0;i<hp.length;i+=2)if(hp[i+1]===P&&hp[i]!==P&&!seen.has(hp[i])){seen.add(hp[i]);headshot()}} // HEADSHOT: kepala pemain mengalahkan kepala lawan
  dead.forEach(kill);
}
function headshot(){
  P.hs++;P.score+=25;beep(1000,.15);
  const e=$('#hs');e.textContent='HEADSHOT! +25';e.classList.remove('on');void e.offsetWidth;e.classList.add('on');
}
function gain(w,v){
  const m=w.fx.f>0?w.fx.m:1,p=v*m; // pengali dihitung sekali per makanan
  w.score+=p;w.food++;w.grow+=p*.3;
  while(w.grow>=1){w.grow--;const l=w.pts[w.pts.length-1];w.pts.push({x:l.x,y:l.y,w})}
  w.tr=8+Math.min(28,Math.sqrt(Math.max(0,w.pts.length-10))*.95*cfg.thick); // makin banyak makan: makin panjang DAN makin tebal
  if(w===P)beep(520,.04);
}
function pick(w,k){ // satu timer efek per jenis; mengambil lagi = ulang ke durasi penuh
  if(k==0)w.fx.s=cfg.speedDur;
  else if(k==1)w.fx.t=cfg.turnDur;
  else{w.fx.m=w.fx.f>0?Math.max(w.fx.m,MULT[k]):MULT[k];w.fx.f=cfg.foodDur}
  if(w===P)beep(880,.12);
}
function eatAll(){
  for(const w of B){
    if(w.dead)continue;
    const h=w.pts[0],rr=(w.r+8)**2,ri=(w.r+16)**2,cx=h.x/FS|0,cy=h.y/FS|0;
    for(let i=cx-1;i<=cx+1;i++)for(let j=cy-1;j<=cy+1;j++){
      const a=FG.get(i*GK+j);
      if(a)for(let n=a.length-1;n>=0;n--){const f=a[n];if((f.x-h.x)**2+(f.y-h.y)**2<rr){delFood(a,n);gain(w,f.v)}}
    }
    for(let n=I.length-1;n>=0;n--){const f=I[n];if((f.x-h.x)**2+(f.y-h.y)**2<ri){I.splice(n,1);pick(w,f.t)}}
  }
}
function kill(w){
  w.dead=1;
  const n=w.pts.length,stp=Math.max(2,Math.ceil(n/160)),v=Math.min(14,stp*1.5);
  for(let i=0;i<n;i+=stp){const p=w.pts[i];addFood(mkFood(cl(p.x+rnd(-8,8),40,W-40),cl(p.y+rnd(-8,8),40,W-40),v),1)}
  trimDrops();
  if(w===P){beep(120,.4);over()}
}
function mkItem(k,avoid){ // item baru di lokasi acak yang bisa dijangkau (di dalam dinding, bukan di badan cacing); bukan di dekat lokasi lamanya
  let x,y;
  for(let n=0;n<10;n++){
    x=rnd(300,W-300);y=rnd(300,W-300);
    if(avoid&&(x-avoid.x)**2+(y-avoid.y)**2<2500**2)continue;
    if(!hit(x,y,{r:8},20))break;
  }
  return{x,y,t:k,ttl:ITEMS[k].ttl};
}
function spawnBot(){
  const h=P&&P.pts[0];
  for(let n=0;n<10;n++){
    let x,y;
    if(h&&Math.random()<.5){const a=rnd(0,6.283),d=rnd(1500,5000);x=cl(h.x+Math.cos(a)*d,300,W-300);y=cl(h.y+Math.sin(a)*d,300,W-300)} // separuh bot muncul di sekitar pemain supaya arena luas tetap ramai
    else{x=rnd(300,W-300);y=rnd(300,W-300)}
    if(h&&(x-h.x)**2+(y-h.y)**2<600**2)continue;
    if(hit(x,y,{r:8},40))continue;
    const hu=rnd(0,360),w=mk(x,y,NAMES[(Math.random()*NAMES.length)|0],(Math.random()*4)|0,{c1:`hsl(${hu},85%,55%)`,c2:`hsl(${(hu+40)%360},80%,30%)`,p:(Math.random()*3)|0});
    w.bot=1;B.push(w);grid();return;
  }
}
function tick(){ // menjaga jumlah makanan, item per jenis, dan bot
  let g=0;while(fc<cfg.food&&g++<1500)addFood(mkFood());
  for(let k=0;k<ITEMS.length;k++){let n=0;for(const i of I)if(i.t==k)n++;for(;n<ITEMS[k].cnt;n++)I.push(mkItem(k))}
  let nb=0;for(const w of B)if(w.bot)nb++;
  for(let i=0;i<3&&nb<cfg.bots;i++,nb++)spawnBot();
}
function update(dt){
  tm+=dt;
  for(const w of B){
    const f=w.fx;for(const k of['s','f','t'])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);
    w.r+=(w.tr-w.r)*Math.min(1,dt*3);w.sp=SP*(.75+w.r/32);
    const tg=Math.min(cfg.speedCap,(f.s>0?cfg.speedMult:1)*(w.boost?cfg.boostMult:1));
    w.sv+=(tg-w.sv)*Math.min(1,dt*(tg>w.sv?5:1.4)); // naik cepat, turun bertahap
  }
  P.boost=(keys[' ']||keys.shift||btnS)?1:0;
  for(const w of B){if(w.dead)continue;if(w===P)steerP(dt);else ai(w,dt);move(w,dt)}
  grid();collide();eatAll();
  for(let i=I.length-1;i>=0;i--){const it=I[i];it.ttl-=dt;if(it.ttl<=0)I[i]=mkItem(it.t,it)} // despawn → respawn di lokasi berbeda; timer tiap item mandiri
  B=B.filter(w=>!w.dead);
  const h=P.pts[0];cam.x=h.x;cam.y=h.y; // pemain selalu di pusat kamera
  const zt=Math.max(cfg.zMin,cfg.zoom*Math.pow(8/P.r,.55)); // makin besar cacing, kamera otomatis menjauh
  const dz=cl((Math.log(zt)-Math.log(zoom))*Math.min(1,dt*6),-.07*dt*60,.07*dt*60); // zoom halus (skala log), laju per frame dibatasi
  zoom=Math.exp(Math.log(zoom)+dz);
}
// pilih cacing lain yang dirender: terdekat dulu, dibatasi jarak & jumlah; simulasi tetap jalan untuk semua
function vis(dt){
  const h=P.pts[0],R=cfg.renderDist,c=[];
  for(const w of B){if(w===P){w.va=1;w.dd=0;continue}const q=w.pts[0];w.dd=(q.x-h.x)**2+(q.y-h.y)**2;if(w.dd<R*R)c.push(w)}
  c.sort((a,b)=>a.dd-b.dd);
  const keep=new Set(c.slice(0,cfg.maxRender));RL=[];
  for(const w of B){
    if(w===P){RL.push(w);continue}
    const edge=cl((R-Math.sqrt(w.dd))/(R*.2),0,1); // memudar halus di tepi jarak render
    w.va+=((keep.has(w)?edge:0)-w.va)*Math.min(1,dt*6);
    if(w.va>.03)RL.push(w);
  }
  RL.sort((a,b)=>b.dd-a.dd); // terjauh digambar dulu, terdekat di atas
}

/* ---------- Render ---------- */
function drawW(c,pts,r,sk,glow,step){
  if(pts.length<2)return;
  step=step||1;const img=sk.img&&tile;
  c.lineCap=c.lineJoin='round';c.setLineDash([]);
  c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=step;i<pts.length;i+=step)c.lineTo(pts[i].x,pts[i].y);
  if((pts.length-1)%step){const l=pts[pts.length-1];c.lineTo(l.x,l.y)}
  if(glow){c.strokeStyle=glow;c.lineWidth=r*2.8;const ga=c.globalAlpha;c.globalAlpha=ga*.3;c.stroke();c.globalAlpha=ga}
  c.lineWidth=r*2;c.strokeStyle=img?c.createPattern(tile,'repeat'):sk.c1;c.stroke();
  if(!img&&sk.p&&step<3){ // sisik/pola mengikuti jalur badan
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
function item(c,i,k){ // bentuk beda per jenis: belah ketupat SPEED, segitiga TURN, segi enam X2, segi lima X5, segi delapan X10
  const it=ITEMS[i.t],p=Math.sin(tm*5+i.x)*.5+.5;
  c.save();c.translate(i.x,i.y);c.scale(k,k);
  if(i.ttl<10)c.globalAlpha=.55+.45*Math.sin(tm*10); // berkedip sebelum menghilang
  if(cfg.fxv){const ga=c.globalAlpha;c.globalAlpha=ga*(.2+.15*p);c.fillStyle=it.col;c.beginPath();c.arc(0,0,28+8*p,0,6.3);c.fill();c.globalAlpha=ga}
  poly(c,0,0,i.t==1?21:18,it.shape,i.t==1?-1.57:0);c.fillStyle=it.col;c.fill();c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#111';c.font='bold 14px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(it.sym,0,i.t==1?3:1);
  c.restore();
}
function draw(){
  const c=ctx,S=zoom*Math.min(VW,VH)/450; // zoom hanya skala tampilan; dunia & hitbox tetap
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#070b18';c.fillRect(0,0,VW,VH);
  c.setTransform(S*dpr,0,0,S*dpr,(VW/2-cam.x*S)*dpr,(VH/2-cam.y*S)*dpr);
  const hw=VW/S/2+40,hh=VH/S/2+40,x0=cam.x-hw,x1=cam.x+hw,y0=cam.y-hh,y1=cam.y+hh;
  c.fillStyle='#10183a';c.fillRect(0,0,W,W);
  let gs=100;while(gs*S<16)gs*=2;
  c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=Math.max(2,1/S);c.beginPath();
  for(let g=Math.max(0,Math.floor(x0/gs)*gs);g<=Math.min(W,x1);g+=gs){c.moveTo(g,Math.max(0,y0));c.lineTo(g,Math.min(W,y1))}
  for(let g=Math.max(0,Math.floor(y0/gs)*gs);g<=Math.min(W,y1);g+=gs){c.moveTo(Math.max(0,x0),g);c.lineTo(Math.min(W,x1),g)}
  c.stroke();c.strokeStyle='#ff3d5a';c.lineWidth=Math.max(12,2.5/S);c.strokeRect(0,0,W,W);
  if(S>=.06){ // makanan: hanya sel grid yang terlihat
    const ca=Math.max(0,Math.floor(x0/FS)),cb=Math.min(W/FS|0,Math.floor(x1/FS)),da=Math.max(0,Math.floor(y0/FS)),db=Math.min(W/FS|0,Math.floor(y1/FS)),arc=S>.35;
    for(let i=ca;i<=cb;i++)for(let j=da;j<=db;j++){
      const a=FG.get(i*GK+j);if(!a)continue;
      for(const f of a){const r=Math.max(3+Math.min(f.v,7)*1.3,1.6/S);c.fillStyle=FC[f.c];if(arc){c.beginPath();c.arc(f.x,f.y,r,0,6.3);c.fill()}else c.fillRect(f.x-r,f.y-r,r*2,r*2)}
    }
  }
  const ik=Math.max(1,11/(20*S)),ih=cam,id=cfg.itemSee**2; // item hanya terlihat dari dekat: tidak ada radar/panah, harus dicari
  for(const i of I)if(i.x>x0&&i.x<x1&&i.y>y0&&i.y<y1&&(i.x-ih.x)**2+(i.y-ih.y)**2<id)item(c,i,ik);
  for(const w of RL){
    const h=w.pts[0],sp=w.sp,m=w.pts.length*sp;
    if(Math.abs(h.x-cam.x)>hw+m||Math.abs(h.y-cam.y)>hh+m)continue;
    const rr=Math.max(w.r,1.6/S),near=w.dd<(cfg.renderDist*.5)**2;
    const g=cfg.fxv&&near?(w.fx.s>0?'#ffe600':w.fx.t>0?'#ff7a1a':w.fx.f>0?'#6bff8a':0):0;
    c.globalAlpha=w.va;
    drawW(c,w.pts,rr,w.sk,g,Math.max(1,Math.floor(2.5/(S*sp))));
    if(rr*S>3)eyes(c,h,w.a,rr);
    c.globalAlpha=1;
  }
  c.setTransform(dpr,0,0,dpr,0,0);
  if(S>=.3){c.textAlign='center';c.textBaseline='middle';c.font='bold 12px system-ui';c.fillStyle='#fff';
    for(const w of RL){if(w.va<.5)continue;const h=w.pts[0],x=(h.x-cam.x)*S+VW/2,y=(h.y-cam.y)*S+VH/2-w.r*S-10;if(x>0&&x<VW&&y>0&&y<VH)c.fillText(w.name,x,y)}}
  mini(c,hw,hh);
}
function mini(c,hw,hh){ // peta mini: posisi pemain + area pandang (tanpa item)
  const M=Math.min(130,VW*.3),mx=12,my=VH-M-12,k=M/W;
  c.globalAlpha=.55;c.fillStyle='#000';c.fillRect(mx,my,M,M);c.globalAlpha=1;
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;c.strokeRect(mx,my,M,M);
  c.fillStyle='#ff5c7a';for(const w of RL){if(w===P)continue;const h=w.pts[0];c.fillRect(mx+h.x*k-1.5,my+h.y*k-1.5,3,3)}
  const vw=Math.max(4,hw*2*k),vh=Math.max(4,hh*2*k);
  c.save();c.beginPath();c.rect(mx,my,M,M);c.clip();c.strokeStyle='rgba(255,255,255,.85)';c.strokeRect(mx+cam.x*k-vw/2,my+cam.y*k-vh/2,vw,vh);c.restore();
  c.fillStyle='#39ff88';c.beginPath();c.arc(mx+cam.x*k,my+cam.y*k,3.5,0,6.3);c.fill();
}
function resize(){
  const r=cv.getBoundingClientRect();
  dpr=Math.min(devicePixelRatio||1,[1,1.5,2][cfg.gfx]);VW=r.width;VH=r.height;
  cv.width=Math.round(VW*dpr);cv.height=Math.round(VH*dpr);
}
function hud(){
  if(!P)return;const f=P.fx;
  $('#stats').innerHTML=`<b>${P.score|0}</b> skor<br>Panjang ${P.pts.length} · Makan ${P.food}<br>Headshot ${P.hs}`;
  $('#fx').innerHTML=(f.s>0?`<span class=s>⚡ ${Math.ceil(f.s)}s</span>`:'')+(f.t>0?`<span class=t>↪ ${Math.ceil(f.t)}s</span>`:'')+(f.f>0?`<span class=f>×${f.m} ${Math.ceil(f.f)}s</span>`:'');
  $('#zl').textContent=cfg.zoom>1.05?'dekat':(1/cfg.zoom).toFixed(cfg.zoom<.2?0:1)+'×';
}
let ac;
function beep(f,d){
  if(!cfg.sound)return;
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state=='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}
}

/* ---------- Alur game ---------- */
function start(){
  fixCfg();ls.set('cg_name',$('#name').value.trim());
  FG.clear();FD=[];fc=0;I=[];B=[];RL=[];G.clear();tm=0;ctl.a=null;btnS=0;$('#bSpd').classList.remove('on');$('#hs').classList.remove('on');
  const x=rnd(W*.3,W*.7),y=rnd(W*.3,W*.7);
  P=mk(x,y,$('#name').value.trim()||'Kamu',0,skin);B.push(P);cam.x=x;cam.y=y;zoom=cfg.zoom;
  for(let i=0;i<cfg.food;i++)addFood(mkFood());
  grid();for(let i=0;i<cfg.bots;i++)spawnBot();
  tick();st='play';hideAll();$('#hud').hidden=false;resize();hud();beep(660,.06);
}
function over(){
  st='over';const s=P.score|0;btnS=0;
  stat.g++;stat.best=Math.max(stat.best,s);stat.last={s,l:P.pts.length,f:P.food};ls.set('cg_stat',stat);
  $('#ovT').textContent=`Skor ${s} · Panjang ${P.pts.length} · Makan ${P.food} · Headshot ${P.hs} · Rekor ${stat.best}`;
  $('#hud').hidden=true;joy=null;$('#jb').hidden=true;show('over');
}
function quit(){
  st='menu';P=null;B=[];RL=[];I=[];FG.clear();FD=[];fc=0;G.clear();joy=null;btnS=0;$('#jb').hidden=true;$('#hud').hidden=true;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
}
function pause(){if(st!='play')return;st='pause';joy=null;btnS=0;$('#bSpd').classList.remove('on');$('#jb').hidden=true;show('pause')}
function resume(){if(st!='pause')return;st='play';hideAll()}
function zm(k){cfg.zoom=cl(+(cfg.zoom*k).toFixed(4),cfg.zMin,cfg.zMax);save()}
let last=0,tk=0,fa=0;
function loop(ts){
  requestAnimationFrame(loop);
  const raw=(ts-last)/1000;last=ts;
  if(raw>0&&raw<1)fps+=(1/raw-fps)*.05;
  const dt=Math.min(raw>0?raw:0,.1);
  if(st=='play'){
    const n=Math.min(6,Math.max(1,Math.ceil(dt*60-1e-6))); // langkah ≤1/60 dtk: kecepatan konstan, tabrakan tidak tembus, gerak halus
    for(let i=0;i<n&&st=='play';i++)update(dt/n);
    tk+=dt;fa+=dt;if(tk>.4){tk=0;tick()}if(fa>.12){fa=0;hud()}
  }
  if(P&&st!='menu'){vis(dt);draw()}
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
cv.addEventListener('wheel',e=>{e.preventDefault();if(st=='play')zm(e.deltaY<0?1.15:1/1.15)},{passive:false});
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
addEventListener('blur',()=>{keys={};btnS=0});
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
// tombol SPEED di layar (tahan untuk ngebut)
{const bs=$('#bSpd'),off=()=>{btnS=0;bs.classList.remove('on')};
 bs.addEventListener('pointerdown',e=>{e.preventDefault();btnS=1;bs.classList.add('on');try{bs.setPointerCapture(e.pointerId)}catch{}});
 for(const ev of['pointerup','pointercancel','lostpointercapture'])bs.addEventListener(ev,off)}
// tombol zoom: tekan = satu langkah, tahan = terus mengubah
function hold(btn,k){
  let t1,t2;const stop=()=>{clearTimeout(t1);clearInterval(t2)};
  btn.addEventListener('pointerdown',()=>{stop();zm(k);t1=setTimeout(()=>{t2=setInterval(()=>zm(Math.pow(k,.3)),60)},350)});
  for(const ev of['pointerup','pointerleave','pointercancel'])btn.addEventListener(ev,stop);
}
hold($('#zIn'),1.25);hold($('#zOut'),1/1.25);

/* ---------- UI: layar, form, skin ---------- */
const scr=document.querySelectorAll('.scr'),skMsg=s=>{$('#skMsg').textContent=s};
function hideAll(){scr.forEach(s=>s.hidden=true)}
function show(id){
  scr.forEach(s=>s.hidden=s.id!=id);
  if(id=='skin')skinUI();
  if(id=='set')form('#setF');
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-go]');if(!b)return;
  let g=b.dataset.go;if(g=='back')g=st=='pause'?'pause':'menu';
  if(b.hasAttribute('data-quit'))quit();
  show(g);
});
function apply(){fixCfg();save();resize()}
function form(sel){
  const el=$(sel);el.innerHTML='';
  for(const[k,l,a,b,s,,g]of SC){
    if(g!='s')continue;
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

// boot
$('#name').value=ls.get('cg_name','');
$('#name').oninput=e=>ls.set('cg_name',e.target.value.trim());
{const d=ls.get('cg_skinimg',null);if(d&&skin.img)setImg(d)}
resize();show('menu');requestAnimationFrame(loop);
