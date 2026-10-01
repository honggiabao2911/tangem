'use strict';
(() => {
  const $=id=>document.getElementById(id), TAU=Math.PI*2;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const canvases={ambient:$('ambient'),party:$('celebrationFx'),heart:$('heartCanvas'),candle:$('candleCanvas'),universe:$('universeCanvas')};
  const ctx=Object.fromEntries(Object.entries(canvases).map(([k,c])=>[k,c.getContext('2d')]));
  let W=innerWidth,H=innerHeight,HW=W,HH=H,UW=W,UH=H,cakeSize=360;
  let scene='heart',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,raf=0,last=0,clock=0,heartStart=0,blownAt=null,captionStage=-1;
  let stars=[],particles=[],textTargets=[],partyBits=[],scheduled=[],cakePoints=[],photoImages=[],photoHits=[];
  let formation=false,formationMix=0,rotation=0,dragRotation=0,tilt=.2,dragging=false,down=null,lastPointerX=0;
  const pinks=['#af326c','#cd5284','#e189a2','#bf78a9','#ca9968'];
  function sprite(color,heart=false){
    const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    if(heart){g.font='40px Arial';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color;g.shadowColor=color;g.shadowBlur=11;g.fillText('♥',32,33);}
    else {const r=g.createRadialGradient(32,32,0,32,32,30);r.addColorStop(0,'#fff2fc');r.addColorStop(.13,color);r.addColorStop(.32,color+'a0');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);}
    return c;
  }
  const heartSprites=pinks.map(c=>sprite(c,true)),glowSprites=pinks.map(c=>sprite(c));
  const greetingSprites=['#ee1761','#ff387e','#d20d58','#fa538a','#ec2863'].map(c=>sprite(c,true));
  function fit(name,w,h){const ratio=Math.min(devicePixelRatio||1,1.5);const c=canvases[name];c.width=Math.max(1,Math.round(w*ratio));c.height=Math.max(1,Math.round(h*ratio));ctx[name].setTransform(ratio,0,0,ratio,0,0);}
  function makeTextTargets(){
    const c=document.createElement('canvas');const mobile=HW<650;
    c.width=Math.floor(Math.min(1000,HW*.9));c.height=Math.floor(Math.min(320,HH*.36));
    const g=c.getContext('2d'),lines=mobile?['CHÚC MỪNG','SINH NHẬT','EM YÊU']:['CHÚC MỪNG SINH NHẬT','EM YÊU'];
    let size=Math.min(mobile?58:78,c.width/(mobile?6.6:12.5));
    g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';
    g.font=`500 ${size}px "Be Vietnam Pro", Arial, sans-serif`;
    while(Math.max(...lines.map(line=>g.measureText(line).width))>c.width*.95){size--;g.font=`500 ${size}px "Be Vietnam Pro", Arial, sans-serif`;}
    const lineHeight=size*1.4;
    g.strokeStyle='#fff';g.lineWidth=size*.036;g.lineJoin='round';lines.forEach((line,i)=>{const y=c.height/2+(i-(lines.length-1)/2)*lineHeight;g.strokeText(line,c.width/2,y);g.fillText(line,c.width/2,y);});
    const data=g.getImageData(0,0,c.width,c.height).data,targets=[],step=mobile?2.7:3.8;
    for(let y=0;y<c.height;y+=step)for(let x=(Math.round(y/step)%2)*step*.5;x<c.width;x+=step){if(data[(Math.floor(y)*c.width+Math.floor(x))*4+3]>125)targets.push({x:x-c.width/2+rand(-.32,.32),y:y-c.height/2+rand(-.32,.32)});}
    for(let i=targets.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[targets[i],targets[j]]=[targets[j],targets[i]];}
    textTargets=targets.length?targets:[{x:0,y:0}];
  }
  function makeHeart(){
    makeTextTargets();const count=Math.min(HW<650?2500:4200,textTargets.length),scale=Math.min(HW*.021,18,HH*.011);
    particles=Array.from({length:count},(_,i)=>{
      const t=rand(0,TAU),r=Math.sqrt(Math.random()),angle=rand(0,TAU);
      return {hx:16*Math.sin(t)**3*r*scale,hy:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*r*scale,
        tx:textTargets[i].x,ty:textTargets[i].y,angle,phase:rand(0,TAU),size:rand(HW<650?4:5,HW<650?6:8),color:i%5,
        distance:rand(.15,.58)*Math.max(HW,HH),delay:rand(0,.85),duration:rand(1.05,1.85)};
    });captionStage=-1;
  }
  function resize(){
    W=innerWidth;H=innerHeight;fit('ambient',W,H);fit('party',W,H);
    stars=Array.from({length:W<600?75:140},()=>({x:rand(0,W),y:rand(0,H),s:rand(.5,1.6),phase:rand(0,TAU),speed:rand(2,7)}));
    const hr=$('scene-heart').getBoundingClientRect(),ur=$('universeStage').getBoundingClientRect();
    HW=hr.width||W;HH=hr.height||Math.max(640,H);UW=ur.width||W;UH=ur.height||Math.max(310,H*.49);
    fit('heart',HW,HH);fit('universe',UW,UH);
    cakeSize=$('cakeStage').getBoundingClientRect().width||Math.min(430,W*.9,H*.47);fit('candle',cakeSize,cakeSize);
    makeHeart();wake();
  }
  function drawAmbient(dt){
    const g=ctx.ambient;g.clearRect(0,0,W,H);
    for(const s of stars){if(!paused){s.y-=s.speed*dt;if(s.y<0)s.y=H;}
      g.globalAlpha=.16+(Math.sin(clock*.5+s.phase)+1)*.18;g.fillStyle='#ad547c';g.beginPath();g.arc(s.x,s.y,s.s,0,TAU);g.fill();
    }g.globalAlpha=1;
    if(scene!=='finale')for(let i=0;i<8;i++){const x=(Math.sin(i*5.2+clock*.065)*.43+.5)*W,y=((i*.159-clock*.009)%1+1)%1*H;g.globalAlpha=.18+Math.sin(i+clock*.4)*.06;const size=20+(i%3)*14;g.drawImage(heartSprites[i%3],x-size/2,y-size/2,size,size);}g.globalAlpha=1;
  }
  function drawHearts(){
    const g=ctx.heart;g.clearRect(0,0,HW,HH);const age=paused?12:clock-heartStart;
    const phase=age<2.75?0:age<3.55?1:age<6.5?2:3,cx=HW/2,cy=HH*.51;
    if(captionStage!==phase){$('heartCaption').textContent=['Một trái tim đang dành hết yêu thương cho em…','Một… hai… ba! ♡','Ngàn trái tim, ghép thành một lời chúc.','Chúc mừng sinh nhật, người anh thương nhất. ♡'][phase];captionStage=phase;}
    const appear=clamp(age/1.3,0,1),burst=clamp((age-2.75)/.8,0,1);
    const beat=1+Math.pow(Math.max(0,Math.sin(age*5.8)),5)*.075;
    const aura=g.createRadialGradient(cx,cy,0,cx,cy,Math.min(HW*.65,420));aura.addColorStop(0,'#ff94ba25');aura.addColorStop(1,'#ff94ba00');g.fillStyle=aura;g.fillRect(0,0,HW,HH);
    for(const p of particles){
      const bx=cx+p.hx*1.45+Math.cos(p.angle)*p.distance,by=cy+p.hy*1.45+Math.sin(p.angle)*p.distance;
      let x,y,alpha=1,size=p.size;
      if(phase===0){const ease=1-Math.pow(1-appear,3);x=cx+p.hx*beat+(1-ease)*Math.cos(p.angle)*HW;y=cy+p.hy*beat+(1-ease)*Math.sin(p.angle)*HH;alpha=.3+ease*.7;size*=.95;}
      else if(phase===1){const ease=1-Math.pow(1-burst,2);x=cx+p.hx*beat+(bx-cx-p.hx)*ease;y=cy+p.hy*beat+(by-cy-p.hy)*ease;size*=1+Math.sin(burst*Math.PI)*.6;}
      else {const progress=paused?1:clamp((age-3.55-p.delay)/p.duration,0,1),q=1-Math.pow(1-progress,2),inv=1-q;
        const endX=cx+p.tx,endY=cy+p.ty,curveX=bx+(endX-bx)*.3+Math.sin(p.phase)*HW*.13,curveY=Math.min(by,endY)-HH*.2;
        x=inv*inv*bx+2*inv*q*curveX+q*q*endX;y=inv*inv*by+2*inv*q*curveY+q*q*endY;
        size*=progress<1?1.2:.93;
        if(progress<1&&progress>.02&&p.color===0){g.globalAlpha=.17;g.strokeStyle='#ed3478';g.lineWidth=1;g.beginPath();g.moveTo(x-(endX-bx)*.018,y-(endY-by)*.018);g.lineTo(x,y);g.stroke();}
        if(progress===1){x+=Math.sin(clock*.8+p.phase)*.18;y+=Math.cos(clock*.9+p.phase)*.18;}
      }
      g.globalAlpha=alpha*(.87+Math.sin(p.phase+clock*1.7)*.1);g.drawImage(greetingSprites[p.color],x-size/2,y-size/2,size,size);
    }
    if(phase===1){g.globalAlpha=(1-burst)*.32;g.strokeStyle='#ed4685';g.lineWidth=2;g.beginPath();g.arc(cx,cy,20+burst*Math.min(HW,HH)*.58,0,TAU);g.stroke();}
    g.globalAlpha=1;
    for(let i=0;i<16;i++){const a=i*2.399+clock*.075,x=cx+Math.cos(a)*Math.min(HW*.44,480),y=cy+Math.sin(a)*HH*.21,size=8+(Math.sin(clock+i)+1)*4;g.globalAlpha=.18;g.drawImage(greetingSprites[i%5],x-size/2,y-size/2,size,size);}g.globalAlpha=1;
  }
  function drawCandle(){
    const g=ctx.candle;g.clearRect(0,0,cakeSize,cakeSize);const x=cakeSize*.5004,y=cakeSize*.1834;
    const age=blownAt===null?-1:Math.max(paused?1:0,clock-blownAt);const power=age<0?1:Math.max(0,1-age/.65);
    if(power>0){const f=cakeSize*.062*power,sw=paused?0:Math.sin(clock*6)*1.3+Math.sin(clock*11)*.6;
      const glow=g.createRadialGradient(x,y-f*.5,0,x,y-f*.5,cakeSize*.17*power);glow.addColorStop(0,'#ffd38355');glow.addColorStop(.25,'#ffa94c18');glow.addColorStop(1,'#ffa94c00');g.fillStyle=glow;g.fillRect(0,0,cakeSize,cakeSize);
      const lit=g.createLinearGradient(x,y-f,x,y);lit.addColorStop(0,'#ffb85577');lit.addColorStop(.3,'#ffdd94');lit.addColorStop(.75,'#fff8da');lit.addColorStop(1,'#92b3e9');g.fillStyle=lit;g.shadowColor='#ffd093';g.shadowBlur=12*power;
      const bend=sw+(1-power)*18;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x-f*.4,y-f*.15,x-f*.1+bend,y-f*.6,x+bend,y-f);g.bezierCurveTo(x+f*.08+bend,y-f*.56,x+f*.4,y-f*.15,x,y);g.fill();g.shadowBlur=0;
    }
    if(age>.45&&age<3.2&&!paused){const p=(age-.45)/2.75;g.strokeStyle=`rgba(122,74,96,${.3*(1-p)})`;g.lineWidth=1+p*2;g.beginPath();g.moveTo(x,y-5);g.bezierCurveTo(x+15*Math.sin(p*4),y-25-p*25,x-22*p,y-40-p*40,x+20*p,y-60-p*55);g.stroke();}
    if(age<0)for(let i=0;i<7;i++){const a=i*TAU/7+clock*.13;const sx=x+Math.cos(a)*cakeSize*.43,sy=cakeSize*.53+Math.sin(a)*cakeSize*.3;const s=5+(Math.sin(clock*2+i)+1)*3;g.globalAlpha=.3;g.drawImage(glowSprites[i%4],sx-s,sy-s,s*2,s*2);}g.globalAlpha=1;
  }
  function addRing(radius,y,color,count=140){for(let i=0;i<count;i++){const a=i/count*TAU;cakePoints.push({x:Math.cos(a)*radius,y,z:Math.sin(a)*radius,c:color,s:rand(.8,1.7),phase:rand(0,TAU)});}}
  function makeCake(){
    cakePoints=[];
    for(const [r,bottom,top]of [[112,-76,-20],[85,-20,32],[59,32,77]]){
      for(let y=bottom;y<=top;y+=5.8)addRing(r,y,y===bottom||y+6>top?1:0,115);
      for(let r2=8;r2<r;r2+=9)addRing(r2,top,1,Math.max(30,Math.floor(r2*1.6)));
      for(let i=0;i<180;i++){const a=i/180*TAU;cakePoints.push({x:Math.cos(a)*(r+1),z:Math.sin(a)*(r+1),y:top-9-(Math.sin(a*12)+1)*5,c:2,s:1.5,phase:a});}
    }
    addRing(119,-80,3,180);addRing(121,-84,1,180);
    for(let i=0;i<5;i++){const a=i*TAU/5;const x=Math.cos(a)*39,z=Math.sin(a)*39;for(let y=80;y<=119;y+=3){cakePoints.push({x,y,z,c:3,s:1.4,phase:0});}for(let j=0;j<12;j++){cakePoints.push({x:x+rand(-2,2),y:122+j*.9,z:z+rand(-2,2),c:3,s:1.8-j*.065,phase:i+j});}}
    // Limit the rendered point count on narrow phones while retaining every contour.
    if(W<600)cakePoints=cakePoints.filter((p,i)=>i%2===0||p.y>80);
  }
  function preloadPhotos(){if(photoImages.length)return;photoImages=window.BIRTHDAY_CONFIG.photos.map(p=>{const img=new Image();img.decoding='async';img.src=p.src;img.onload=wake;return img;});}
  function worldProject(x,y,z,angle=rotation+dragRotation){
    const cs=Math.cos(angle),sn=Math.sin(angle),xx=x*cs+z*sn,zz=z*cs-x*sn;
    const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt);
    const scale=Math.min(UW/460,UH/380,1.4),persp=600/(600-depth);
    return {x:UW/2+xx*scale*persp,y:UH*.535-yy*scale*persp,scale:scale*persp,z:depth};
  }
  function rounded(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
  function drawOrbitPhoto(o){
    const g=ctx.universe,img=photoImages[o.index];if(!img||!img.complete||!img.naturalWidth)return;
    const p=o.p,w=75*p.scale,h=103*p.scale,roll=Math.sin(o.angle)*.13;
    g.save();g.translate(p.x,p.y);g.rotate(roll);g.globalAlpha=clamp(.6+p.z/700,.45,1);g.shadowColor='#ff81d35a';g.shadowBlur=18*p.scale;
    rounded(g,-w/2,-h/2,w,h,3*p.scale);g.fillStyle='#ffeadf';g.fill();g.shadowBlur=0;
    const pad=4*p.scale,iw=w-pad*2,ih=h-pad*4;g.save();rounded(g,-w/2+pad,-h/2+pad,iw,ih,1);g.clip();
    const ir=img.naturalWidth/img.naturalHeight,box=iw/ih;let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
    if(ir>box){sw=sh*box;sx=(img.naturalWidth-sw)/2;}else{sh=sw/box;sy=(img.naturalHeight-sh)/2;}
    g.drawImage(img,sx,sy,sw,sh,-w/2+pad,-h/2+pad,iw,ih);g.restore();g.fillStyle='#b56a8c';g.font=`${Math.max(8,10*p.scale)}px Georgia`;g.textAlign='center';g.fillText('♡',0,h/2-4*p.scale);g.restore();
    photoHits.push({x:p.x,y:p.y,w,h,index:o.index,z:p.z});
  }
  function drawUniverse(dt){
    const g=ctx.universe;g.clearRect(0,0,UW,UH);if(!paused&&!dragging)rotation+=dt*.105;formationMix=paused?Number(formation):formationMix+(Number(formation)-formationMix)*(1-Math.exp(-dt*3));
    const cx=UW/2,cy=UH*.56;const glow=g.createRadialGradient(cx,cy,0,cx,cy,Math.min(UW*.7,410));glow.addColorStop(0,'#cd319a21');glow.addColorStop(.5,'#7f319411');glow.addColorStop(1,'#281a4000');g.fillStyle=glow;g.fillRect(0,0,UW,UH);
    photoHits=[];const orbit=[];
    for(let i=0;i<8;i++){const a=i*TAU/8+clock*.015;const r=UW<600?182:235;const y=Math.sin(a*2+.8)*100+9,t=i*TAU/8;const hx=16*Math.sin(t)**3*11,hy=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*10+40;orbit.push({angle:a,index:i%photoImages.length,p:worldProject(Math.cos(a)*r*(1-formationMix)+hx*formationMix,y*(1-formationMix)+hy*formationMix,Math.sin(a)*r*(1-formationMix))});}
    orbit.sort((a,b)=>a.p.z-b.p.z);orbit.filter(o=>o.p.z<0).forEach(drawOrbitPhoto);
    g.save();g.globalCompositeOperation='source-over';
    const ringRadius=UW<600?175:220;
    for(let i=0;i<190;i++){const a=i/190*TAU;const p=worldProject(Math.cos(a)*ringRadius,-88+Math.sin(a*2)*17,Math.sin(a)*ringRadius);g.globalAlpha=.2+(Math.sin(a*8+clock)+1)*.1;g.fillStyle='#b95886';g.fillRect(p.x,p.y,1.3*p.scale,1.3*p.scale);}
    for(let i=0;i<cakePoints.length;i++){const point=cakePoints[i],p=worldProject(point.x,point.y,point.z);const a=clamp(.48+p.z/330, .2,.95);const twinkle=.8+Math.sin(clock*2.4+point.phase)*.2;const size=(point.s+1.5)*p.scale*twinkle;
      g.globalAlpha=a;g.drawImage(glowSprites[point.c],p.x-size,p.y-size,size*2,size*2);
    }
    for(let i=0;i<20;i++){const a=i*2.399+clock*.07,r=145+i%5*15,y=Math.sin(i*1.7+clock*.1)*155;const p=worldProject(Math.cos(a)*r,y,Math.sin(a)*r),s=(9+i%4*3)*p.scale;g.globalAlpha=.45;g.drawImage(heartSprites[i%4],p.x-s/2,p.y-s/2,s,s);}
    g.restore();orbit.filter(o=>o.p.z>=0).forEach(drawOrbitPhoto);
    for(let i=0;i<3;i++){const a=i*TAU/3+clock*.07;const p=worldProject(Math.cos(a)*155,120-Math.sin(a)*33,Math.sin(a)*155);g.globalAlpha=.38;g.font=`italic ${clamp(14*p.scale,10,22)}px Georgia`;g.textAlign='center';g.fillStyle='#a34571';g.fillText(['Happy Birthday','Thương em ♡','Always, with love'][i],p.x,p.y);}g.globalAlpha=1;
  }
  function burst(x,y,kind='spark'){if(paused)return;const n=W<600?70:110;for(let i=0;i<n;i++){const a=rand(0,TAU),v=rand(50,210);partyBits.push({x,y,px:x,py:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,life:rand(1.1,2.8),age:0,color:Math.floor(rand(0,5)),size:rand(1,2.7),heart:i%9===0,kind});}if(partyBits.length>650)partyBits=partyBits.slice(-650);}
  function fireworks(x,y){if(paused)return;if(x!==undefined){burst(x,y);return;}scheduled.push({at:clock,x:W*.3,y:H*.36},{at:clock+.5,x:W*.73,y:H*.3},{at:clock+1.1,x:W*.48,y:H*.42});wake();}
  function drawParty(dt){const g=ctx.party;g.clearRect(0,0,W,H);if(paused)return;
    scheduled=scheduled.filter(s=>{if(s.at<=clock){burst(s.x,s.y);return false;}return true;});
    for(const p of partyBits){p.age+=dt;p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=35*dt;p.vx*=Math.pow(.981,dt*30);g.globalAlpha=Math.max(0,1-p.age/p.life);
      if(p.heart){const s=12;g.drawImage(heartSprites[p.color],p.x-s/2,p.y-s/2,s,s);}else{g.strokeStyle=pinks[p.color];g.lineWidth=p.size;g.beginPath();g.moveTo(p.px,p.py);g.lineTo(p.x,p.y);g.stroke();g.fillStyle=pinks[p.color];g.fillRect(p.x,p.y,1,1);}}
    g.globalAlpha=1;partyBits=partyBits.filter(p=>p.age<p.life);
  }
  function frame(now){raf=0;if(document.hidden)return;if(now-last<32){raf=requestAnimationFrame(frame);return;}const dt=Math.min((now-last)/1000,.06);last=now;if(!paused)clock+=dt;
    drawAmbient(dt);if(scene==='heart')drawHearts(dt);if(scene==='candle')drawCandle();if(scene==='finale'&&!window.Birthday3D?.ready)drawUniverse(dt);drawParty(dt);if(!paused)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
  function setScene(name){scene=name;window.Birthday3D?.setActive(name==='finale');if(name==='heart'){heartStart=clock;makeHeart();}if(name==='finale'){preloadPhotos();makeCake();}resize();}
  canvases.universe.addEventListener('pointerdown',e=>{if(scene!=='finale')return;down={x:e.clientX,y:e.clientY,at:performance.now()};lastPointerX=e.clientX;dragging=true;canvases.universe.setPointerCapture(e.pointerId);});
  canvases.universe.addEventListener('pointermove',e=>{if(!dragging||!down)return;dragRotation+=(e.clientX-lastPointerX)*.009;lastPointerX=e.clientX;tilt=clamp(.2+(e.clientY-down.y)*.0015,-.12,.6);wake();});
  canvases.universe.addEventListener('pointerup',e=>{if(!down)return;const distance=Math.hypot(e.clientX-down.x,e.clientY-down.y);dragging=false;
    if(distance<9){const rect=canvases.universe.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;const hit=[...photoHits].sort((a,b)=>b.z-a.z).find(p=>Math.abs(x-p.x)<p.w*.65&&Math.abs(y-p.y)<p.h*.6);if(hit)window.dispatchEvent(new CustomEvent('birthday:photo',{detail:hit.index}));else fireworks(e.clientX,e.clientY);}down=null;wake();});
  canvases.universe.addEventListener('pointercancel',()=>{dragging=false;down=null;});
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now()-40;wake();}});
  window.BirthdayFX={setScene,resize,setFormation(value){formation=Boolean(value);wake();},preloadPhotos,fireworks,blow(){blownAt=clock;fireworks();wake();},relight(){blownAt=null;wake();},replayHearts(){heartStart=clock;makeHeart();wake();},setPaused(value){paused=value;window.Birthday3D?.setPaused(value);partyBits=[];scheduled=[];wake();},get paused(){return paused;}};
  resize();document.fonts.ready.then(()=>{makeHeart();wake();});
})();
