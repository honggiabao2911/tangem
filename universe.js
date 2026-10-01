import * as THREE from './vendor/three.module.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createUniverse(){
  const holder=document.getElementById('universe3d'),stage=document.getElementById('universeStage');
  const small=innerWidth<700;
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,small?1.5:1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.setClearColor(0xf9c4db,0);renderer.domElement.setAttribute('aria-label','Thiên hà hồng: bánh kem, khối ảnh xoay, sao và lời chúc. Kéo để xoay, chạm ảnh để xem.');holder.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(52,1,.1,150);
  const root=new THREE.Group();scene.add(root);
  scene.add(new THREE.HemisphereLight(0xffe3f4,0x8e286b,2));
  const key=new THREE.DirectionalLight(0xffedd7,3.1);key.position.set(-4,8,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff70b4,2);rim.position.set(5,3,-5);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffffff,1.4);fill.position.set(2,4,5);scene.add(fill);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  const cream=new THREE.MeshPhysicalMaterial({color:0xfff0d9,roughness:.36,metalness:0,clearcoat:.12,envMapIntensity:.6});
  const blush=new THREE.MeshPhysicalMaterial({color:0xeb83b0,roughness:.27,clearcoat:.7,clearcoatRoughness:.16,emissive:0x631b42,emissiveIntensity:.12,envMapIntensity:.8});
  const rose=new THREE.MeshPhysicalMaterial({color:0xcf5c92,roughness:.24,metalness:.14,clearcoat:.5,envMapIntensity:.8});
  const gold=new THREE.MeshStandardMaterial({color:0xecc48c,metalness:.72,roughness:.22,envMapIntensity:1.2});
  const pearl=new THREE.MeshPhysicalMaterial({color:0xffeddc,metalness:.15,roughness:.2,clearcoat:.8,envMapIntensity:1.1});
  const cake=new THREE.Group();root.add(cake);
  const occluders=[];
  function mesh(geo,mat,parent=cake){const m=new THREE.Mesh(geo,mat);parent.add(m);if(parent===cake)occluders.push(m);return m;}
  function cylinder(radius,height,y,material){const m=mesh(new THREE.CylinderGeometry(radius,radius,height,64),material);m.position.y=y;return m;}
  cylinder(1.99,.12,-.03,cream);cylinder(1.98,.04,-.09,gold);
  cylinder(.35,.34,-.25,blush);cylinder(.9,.1,-.44,blush);
  const pedestalRing=mesh(new THREE.TorusGeometry(1.94,.035,8,96),gold);pedestalRing.rotation.x=Math.PI/2;pedestalRing.position.y=.033;
  const pearlGeo=new THREE.SphereGeometry(1,10,8),dummy=new THREE.Object3D();
  function beadRing(radius,y,count,scale,mat,twist=0){const inst=new THREE.InstancedMesh(pearlGeo,mat,count);for(let i=0;i<count;i++){const a=i/count*TAU;dummy.position.set(Math.cos(a)*radius,y,Math.sin(a)*radius);dummy.rotation.set(twist,a,.3);dummy.scale.set(scale,scale*.83,scale*1.1);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);}cake.add(inst);return inst;}
  for(const [radius,bottom,height,material] of [[1.72,.04,1.1,blush],[1.3,1.14,.92,cream],[.87,2.06,.77,blush]]){
    const profile=[[0,0],[radius-.1,0],[radius-.025,.025],[radius,.08],[radius,height-.075],[radius-.024,height-.025],[radius-.075,height],[0,height]].map(([x,y])=>new THREE.Vector2(x,y));
    const tier=mesh(new THREE.LatheGeometry(profile,64),material);tier.position.y=bottom;
    const cap=cylinder(radius-.015,.055,bottom+height,cream);
    const dripGeo=new THREE.CylinderGeometry(radius+.008,radius+.025,.18,96,1,true),pos=dripGeo.attributes.position;
    for(let i=0;i<pos.count;i++){if(pos.getY(i)<0){const a=Math.atan2(pos.getZ(i),pos.getX(i));const wave=Math.pow((Math.sin(a*12)+1)/2,3);pos.setY(i,-.1-wave*.12);}}
    dripGeo.computeVertexNormals();const drip=mesh(dripGeo,cream);drip.position.y=bottom+height-.035;
    beadRing(radius-.055,bottom+height+.025,Math.round(radius*33),.079,cream);
    beadRing(radius-.025,bottom+.065,Math.round(radius*36),.065,pearl);
    // Small piped swags in 3D around the sides.
    const path=[];for(let i=0;i<=144;i++){const a=i/144*TAU;path.push(new THREE.Vector3(Math.cos(a)*(radius+.018),bottom+height*.55+Math.cos(a*8)*.085,Math.sin(a)*(radius+.018)));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),144,.019,5,false),cream);
    const dots=new THREE.InstancedMesh(pearlGeo,gold,16);for(let i=0;i<16;i++){const a=i/16*TAU;dummy.position.set(Math.cos(a)*(radius+.022),bottom+height*.46,Math.sin(a)*(radius+.022));dummy.rotation.set(0,0,0);dummy.scale.setScalar(.025);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);}cake.add(dots);
  }
  function heartGeometry(size,depth=.05){const shape=new THREE.Shape();shape.moveTo(0,-.5);shape.bezierCurveTo(-.9,.05,-.72,.7,-.3,.63);shape.bezierCurveTo(-.1,.62,0,.46,0,.35);shape.bezierCurveTo(.08,.68,.51,.79,.69,.4);shape.bezierCurveTo(.9,.02,.32,-.29,0,-.5);const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.04,bevelThickness:.035,curveSegments:14});g.center();g.scale(size,size,size);return g;}
  const topper=mesh(heartGeometry(.61,.07),gold);topper.position.set(0,3.7,0);topper.rotation.y=-.12;
  const topperStem=cylinder(.018,.75,3.17,gold);
  const flameMaterial=new THREE.MeshBasicMaterial({color:0xffd488,transparent:true,opacity:.92});
  const flameCore=new THREE.MeshBasicMaterial({color:0xfffae0});
  function radialTexture(color){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,31);r.addColorStop(0,'#ffffff');r.addColorStop(.13,color);r.addColorStop(.4,color+'70');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
  const glowTexture=radialTexture('#ffbe77'),sparkTexture=radialTexture('#ffebc0');
  const flames=[];
  for(let i=0;i<3;i++){
    const a=i/3*TAU+.35,x=Math.cos(a)*.51,z=Math.sin(a)*.51;
    const candle=mesh(new THREE.CylinderGeometry(.055,.055,.58,12),i%2?cream:rose);candle.position.set(x,3.13,z);
    const wick=mesh(new THREE.CylinderGeometry(.009,.009,.07,5),new THREE.MeshBasicMaterial({color:0x5d3643}));wick.position.set(x,3.455,z);
    const flame=mesh(new THREE.SphereGeometry(.064,12,10),flameMaterial);flame.position.set(x,3.57,z);flame.scale.set(.8,2.25,.8);
    const core=mesh(new THREE.SphereGeometry(.026,8,8),flameCore);core.position.set(x,3.5,z);core.scale.y=2.4;
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,opacity:.26,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.copy(flame.position);glow.scale.set(.95,.95,1);cake.add(glow);flames.push({flame,glow});
  }
  // Soft floor contact shadow under the pedestal.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sg=shadowCanvas.getContext('2d');const grad=sg.createRadialGradient(64,64,8,64,64,64);grad.addColorStop(0,'#87355844');grad.addColorStop(1,'#87355800');sg.fillStyle=grad;sg.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(5,5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.505;root.add(shadow);
  // Rose nebula, drawn behind the scene with a small fragment shader.
  const nebula=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uAspect:{value:1}},transparent:false,depthWrite:false,depthTest:false,
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.9999,1.0); }',
    fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uAspect;
      void main(){ vec2 p=(vUv-.5)*vec2(uAspect,1.0);float t=uTime*.027;
        float wave=p.y+p.x*.23+.08*sin(p.x*4.+t)+.035*sin(p.x*11.-t);
        float band=exp(-abs(wave)*9.);float dust=exp(-abs(wave+.09*sin(p.x*6.+t))*21.);
        float center=exp(-length(p*vec2(.7,1.2))*2.8);
        vec3 c=mix(vec3(.97,.37,.7),vec3(1.,.77,.77),dust);
        vec3 base=mix(vec3(.29,.058,.22),vec3(.71,.27,.51),center);gl_FragColor=vec4(base+c*(band*.15+dust*.07+center*.1),1.); }`
  }));nebula.frustumCulled=false;nebula.renderOrder=-1000;scene.add(nebula);
  const starCount=small?1800:3400,starPos=new Float32Array(starCount*3),starSize=new Float32Array(starCount),starPhase=new Float32Array(starCount),starColor=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){const a=Math.random()*TAU,polar=Math.acos(Math.random()*2-1),r=14+Math.random()*44;starPos[i*3]=Math.sin(polar)*Math.cos(a)*r;starPos[i*3+1]=Math.cos(polar)*r+2;starPos[i*3+2]=Math.sin(polar)*Math.sin(a)*r;starSize[i]=.45+Math.random()*1.45;starPhase[i]=Math.random()*TAU;new THREE.Color(i%5===0?0xffd59d:i%3?0xffebfa:0xf5b0da).toArray(starColor,i*3);}
  const skyGeo=new THREE.BufferGeometry();skyGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));skyGeo.setAttribute('aSize',new THREE.BufferAttribute(starSize,1));skyGeo.setAttribute('aPhase',new THREE.BufferAttribute(starPhase,1));skyGeo.setAttribute('color',new THREE.BufferAttribute(starColor,3));
  const skyMaterial=new THREE.ShaderMaterial({uniforms:{uTime:{value:0},uScale:{value:90}},vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aSize;attribute float aPhase;uniform float uTime;uniform float uScale;varying vec3 vColor;varying float vAlpha;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uScale/max(1.,-mv.z),1.,8.);vColor=color;vAlpha=.3+.7*pow(.5+.5*sin(uTime*.75+aPhase),2.);}`,
    fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;float core=exp(-d*5.);float ray=pow(max(0.,1.-abs(p.x)*16.),5.)*max(0.,1.-abs(p.y)*2.)+pow(max(0.,1.-abs(p.y)*16.),5.)*max(0.,1.-abs(p.x)*2.);float a=(core+ray*.2)*vAlpha;if(d>1.)discard;gl_FragColor=vec4(vColor,a);}`});
  const sky=new THREE.Points(skyGeo,skyMaterial);scene.add(sky);
  // Two deep orbits of photographs, plus thin ribbons of starlight.
  const orbitLines=new THREE.Group();root.add(orbitLines);
  for(let k=0;k<3;k++){const pts=[];for(let i=0;i<=180;i++){const a=i/180*TAU;pts.push(new THREE.Vector3(Math.cos(a)*(3.5+k*.4),1.1+Math.sin(a)*(1+k*.45),Math.sin(a)*(3.3+k*.3)));}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:k%2?0xffdba8:0xffa0d4,transparent:true,opacity:.25-k*.04,blending:THREE.AdditiveBlending}));line.rotation.y=k*.55;orbitLines.add(line);}
  const dustPositions=[];
  for(const [radius,base,height] of [[1.74,.04,1.1],[1.32,1.14,.92],[.89,2.06,.77]])for(let i=0;i<(small?230:450);i++){const a=Math.random()*TAU;dustPositions.push(Math.cos(a)*radius,base+Math.random()*height,Math.sin(a)*radius);}
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
  const cakeGlitter=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xffe8b4,size:.036,map:sparkTexture,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending}));cake.add(cakeGlitter);
  const moteCount=small?340:620,motePos=new Float32Array(moteCount*3);
  for(let i=0;i<moteCount;i++){const a=i*2.399,r=.7+Math.random()*4.3;motePos[i*3]=Math.cos(a)*r;motePos[i*3+1]=Math.random()*8-2;motePos[i*3+2]=Math.sin(a)*r;}
  const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePos,3));const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:0xffe4ed,size:.075,map:sparkTexture,transparent:true,opacity:.77,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(motes);
  const hearts=new THREE.Group();root.add(hearts);const hgeo=heartGeometry(.18,.2);
  for(let i=0;i<(small?18:28);i++){const h=new THREE.Mesh(hgeo,i%3?rose:gold),a=i*2.399;h.position.set(Math.cos(a)*(3+i%3*.6),-1+i%7*1.05,Math.sin(a)*(3+i%3*.6));h.rotation.set(.15,a,.2);hearts.add(h);}
  const cardGroup=new THREE.Group();root.add(cardGroup);
  const cards=[],extras=[],targets=[],photoGeo=new THREE.BoxGeometry(1.23,1.23,1.23),cubeEdges=new THREE.EdgesGeometry(photoGeo),edgeMaterial=new THREE.LineBasicMaterial({color:0xffd0ea,transparent:true,opacity:.45});
  const faceTints=[0xf5dfea,0xbca0b9,0xffffff,0xc9adc2,0xffffff,0xe3c3d9];
  function photoTexture(photo){const c=document.createElement('canvas');c.width=c.height=384;const g=c.getContext('2d');g.fillStyle='#ffe7f0';g.fillRect(0,0,384,384);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    const image=new Image();image.decoding='async';image.onload=()=>{const side=Math.min(image.naturalWidth,image.naturalHeight),sx=(image.naturalWidth-side)/2,sy=(image.naturalHeight-side)/2;g.drawImage(image,sx,sy,side,side,7,7,370,370);tex.needsUpdate=true;wake();};image.src=photo.src;return tex;}
  window.BIRTHDAY_CONFIG.photos.forEach((p,i)=>{const map=photoTexture(p),materials=faceTints.map(color=>new THREE.MeshBasicMaterial({map,color,toneMapped:false}));const card=new THREE.Mesh(photoGeo,materials);card.userData.photoIndex=i;card.userData.phase=i/8*TAU;card.add(new THREE.LineSegments(cubeEdges,edgeMaterial));cardGroup.add(card);cards.push(card);targets.push(card);
    if(!small||i%2===0){const extra=new THREE.Mesh(photoGeo,materials);extra.userData.photoIndex=i;extra.userData.phase=i/8*TAU+.35;extra.add(new THREE.LineSegments(cubeEdges,edgeMaterial));cardGroup.add(extra);extras.push(extra);targets.push(extra);}
  });
  function heartPoint(a){return new THREE.Vector3(Math.pow(Math.sin(a),3)*3.2,3.6+(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))/17*3.05,0);}
  const outlinePoints=[];for(let i=0;i<640;i++){const p=heartPoint(i/640*TAU);outlinePoints.push(p.x+(Math.random()-.5)*.09,p.y+(Math.random()-.5)*.09,(Math.random()-.5)*.17);}
  const outlineGeo=new THREE.BufferGeometry();outlineGeo.setAttribute('position',new THREE.Float32BufferAttribute(outlinePoints,3));const outline=new THREE.Points(outlineGeo,new THREE.PointsMaterial({color:0xffc9e8,map:sparkTexture,size:.095,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(outline);
  const labelsHolder=document.getElementById('universeLabels'),wishTexts=['Thương em thật nhiều ♡','Tuổi mới rực rỡ ✧','Luôn có anh bên cạnh','Mong em luôn bình an','Hạnh phúc nhé, em yêu','Happy birthday, my love'];
  const labels=wishTexts.map((text,i)=>{const el=document.createElement('span');el.className='space-wish';el.textContent=text;el.style.opacity='0';labelsHolder.append(el);return {el,phase:i/6*TAU,width:small?170:210,height:34,world:new THREE.Vector3()};});
  // Short shooting-star trails cross the distant sky.
  const comets=[];for(let j=0;j<2;j++){const geo=new THREE.BufferGeometry(),pos=new Float32Array(24*3),color=new Float32Array(24*3);for(let i=0;i<24;i++){const b=(1-i/24)**2;color.set([b,b*.77,b*.85],i*3);}geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(color,3));const comet=new THREE.Line(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(comet);comets.push(comet);}
  let active=false,paused=false,raf=0,last=0,time=0,age=0,rotation=.15,dragOffset=0,elevation=.2,zoomFactor=1,baseDistance=20,drag=null,celebrateUntil=0,ready=true,heartMode=false,heartBlend=0,width=390,height=844,frameCost=0,slowFrames=0,qualityReduced=false;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),heartQuaternion=new THREE.Quaternion(),orbitQuaternion=new THREE.Quaternion(),orbitEuler=new THREE.Euler(),scratchPos=new THREE.Vector3(),rayTargets=[...targets,...occluders];
  function resize(){const r=stage.getBoundingClientRect();width=r.width||innerWidth;height=r.height||Math.max(710,innerHeight);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();baseDistance=Math.max(10.4,5.05/(Math.tan(26*Math.PI/180)*camera.aspect));nebula.material.uniforms.uAspect.value=camera.aspect;skyMaterial.uniforms.uScale.value=70*Math.min(devicePixelRatio||1,qualityReduced?1:1.5);poseCamera();wake();}
  function poseCamera(){const approach=paused?1:1-Math.pow(1-clamp(age/2.6,0,1),3),distance=baseDistance*zoomFactor*(1.25-.25*approach),rise=elevation+.16*(1-approach);camera.position.set(0,1.65+distance*rise,distance);camera.lookAt(0,1.65,0);camera.updateMatrixWorld();}
  function positionLabels(){
    root.updateMatrixWorld(true);const candidates=labels.map((label,i)=>{const a=label.phase-rotation*.36;label.world.set(Math.cos(a)*4.8,2.1+Math.sin(a*2+i*.3)*2.9,Math.sin(a)*3.8);root.localToWorld(label.world);const depth=label.world.distanceTo(camera.position);const p=label.world.clone().project(camera),scale=clamp(baseDistance/depth,.7,1.12),x=(p.x*.5+.5)*width,y=(-p.y*.5+.5)*height;return {label,x,y,scale,depth};}).sort((a,b)=>a.depth-b.depth);
    const occupied=[];let shown=0;for(const c of candidates){const {label,x,y,scale}=c,w=(label.el.offsetWidth||label.width)*scale,h=34*scale;const bounds={left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2};
      const clear=!occupied.some(b=>bounds.left<b.right+10&&bounds.right>b.left-10&&bounds.top<b.bottom+8&&bounds.bottom>b.top-8);
      const outsideCake=Math.abs(x-width/2)>width*.19||y<height*.37||y>height*.63;
      const visible=heartBlend<.3&&shown<(small?3:6)&&clear&&outsideCake&&bounds.left>12&&bounds.right<width-12&&bounds.top>height*.25&&bounds.bottom<height*.73;
      label.el.style.opacity=visible?String(clamp(.96-c.depth/(baseDistance*5),.3,.86)):'0';if(visible){label.el.style.transform=`translate3d(${bounds.left.toFixed(1)}px,${bounds.top.toFixed(1)}px,0) scale(${scale.toFixed(3)})`;label.el.style.transformOrigin='left top';occupied.push(bounds);shown++;}
    }
  }
  function render(dt){
    if(!paused){time+=dt;age+=dt;if(!drag)rotation+=dt*.16;heartBlend+=(Number(heartMode)-heartBlend)*(1-Math.exp(-dt*2.65));}else heartBlend=Number(heartMode);
    const expansion=paused?1:1-Math.pow(1-clamp(age/2.25,0,1),3);poseCamera();root.rotation.y=dragOffset;
    const cakeScale=(.55+expansion*.45)*(1-heartBlend*.55);cake.scale.setScalar(cakeScale);cake.position.y=Math.sin(time*.75)*.045-heartBlend*1.85;cake.rotation.y=-rotation*.5;
    shadow.scale.setScalar(1-heartBlend*.5);shadow.position.y=-.505-heartBlend*1.6;shadow.material.opacity=1-heartBlend*.4;
    topper.rotation.y=time*.35;cakeGlitter.material.opacity=.65+Math.sin(time*2.3)*.25;
    for(let i=0;i<flames.length;i++){const {flame,glow}=flames[i];flame.scale.y=2.25+Math.sin(time*8+i)*.28;flame.rotation.z=Math.sin(time*4+i)*.15;glow.material.opacity=.3+Math.sin(time*5+i)*.045;}
    heartQuaternion.copy(camera.quaternion);heartQuaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-dragOffset));
    cards.forEach((card,i)=>{const a=card.userData.phase+rotation,p=heartPoint(i/8*TAU),orbitX=Math.cos(a)*3.75*expansion,orbitY=1.6+(i%4-1.5)*1.65+Math.sin(a*2+.8)*.68+Math.cos(time*.6+i)*.18,orbitZ=Math.sin(a)*3.65*expansion;
      card.position.set(THREE.MathUtils.lerp(orbitX,p.x,heartBlend),THREE.MathUtils.lerp(orbitY,p.y,heartBlend),orbitZ*(1-heartBlend));
      orbitEuler.set(Math.sin(time*.25+i)*.35,time*.16+i*.63,Math.cos(time*.17+i)*.18);orbitQuaternion.setFromEuler(orbitEuler);card.quaternion.copy(orbitQuaternion).slerp(heartQuaternion,heartBlend);
      const scale=(.65+expansion*.35)*(1-heartBlend*.19);card.scale.set(scale,scale,scale*(1-heartBlend*.93));
    });
    extras.forEach((card,i)=>{const a=card.userData.phase-rotation*.58;card.position.set(Math.cos(a)*5.5,-1.4+i%4*2.1+Math.sin(time*.45+i)*.3,Math.sin(a)*4.7);card.rotation.set(time*.16+i*.8,time*-.2+i,.2*Math.sin(time*.4+i));card.scale.setScalar((.48+i%2*.09)*expansion*(1-heartBlend));card.visible=heartBlend<.99;});
    outline.material.opacity=heartBlend*(.72+Math.sin(time*2.5)*.15);outline.scale.setScalar(1+Math.sin(time*2.4)*.009*heartBlend);
    sky.rotation.y=time*.011;sky.rotation.z=Math.sin(time*.035)*.05;skyMaterial.uniforms.uTime.value=time;nebula.material.uniforms.uTime.value=time;
    motes.rotation.y=time*.13;motes.position.y=(time*.17)%2;motes.material.size=time<celebrateUntil?.13:.075;
    hearts.rotation.y=-time*.11;hearts.children.forEach((h,i)=>{h.rotation.y=time*.35+i;h.position.y=-1+i%7*1.05+Math.sin(time*.75+i)*.2;});hearts.scale.setScalar(1-heartBlend*.2);
    orbitLines.rotation.y=-time*.055;orbitLines.scale.setScalar(1-heartBlend*.6);orbitLines.children.forEach(line=>line.material.opacity=(1-heartBlend)*.22);
    comets.forEach((comet,j)=>{const t=(time+j*6)%13,visible=t<1.5;comet.visible=visible;if(visible){const a=comet.geometry.attributes.position;for(let i=0;i<24;i++){const q=t-i*.015;a.setXYZ(i,-8+q*10,7-q*4+j*.8,-5-j*7);}a.needsUpdate=true;comet.material.opacity=Math.min(1,t*4)*(1-t/1.5);}});
    positionLabels();renderer.render(scene,camera);
  }
  function frame(now){raf=0;if(!active||document.hidden||!ready)return;if(now-last<32){raf=requestAnimationFrame(frame);return;}const interval=now-last,dt=Math.min(interval/1000,.06);last=now;const start=performance.now();render(dt);frameCost=performance.now()-start;
    // Reduce just the background density and pixel ratio on sustained slow frames.
    if(!qualityReduced&&!paused){slowFrames=frameCost>25||interval>65?slowFrames+1:Math.max(0,slowFrames-1);if(slowFrames>40){qualityReduced=true;skyGeo.setDrawRange(0,Math.floor(starCount*.6));moteGeo.setDrawRange(0,Math.floor(moteCount*.65));renderer.setPixelRatio(1);resize();}}
    if(!paused)raf=requestAnimationFrame(frame);
  }
  function wake(){if(active&&!raf&&!document.hidden&&ready)raf=requestAnimationFrame(frame);}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(!active)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>7)drag.moved=true;if(Math.abs(dx)>Math.abs(dy)*.7||e.pointerType==='mouse'){dragOffset+=(e.clientX-drag.lastX)*.008;drag.lastX=e.clientX;if(e.pointerType==='mouse')elevation=clamp(elevation+(e.clientY-drag.lastY)*.001,-.05,.55);drag.lastY=e.clientY;wake();}});
  canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const wasTap=!drag.moved;drag=null;if(wasTap){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);scene.updateMatrixWorld(true);const first=raycaster.intersectObjects(rayTargets.filter(o=>o.visible),false)[0];if(first&&Number.isInteger(first.object.userData.photoIndex)){window.dispatchEvent(new CustomEvent('birthday:photo',{detail:first.object.userData.photoIndex}));}else{window.BirthdayFX?.fireworks(e.clientX,e.clientY);}}wake();});
  canvas.addEventListener('pointercancel',()=>{drag=null;wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;cancelAnimationFrame(raf);raf=0;stage.classList.remove('webgl-ready');labelsHolder.hidden=true;for(const id of ['zoomIn','zoomOut','resetView'])document.getElementById(id).disabled=true;window.BirthdayFX?.setFormation(heartMode);window.BirthdayFX?.resize();});
  canvas.addEventListener('webglcontextrestored',()=>{ready=true;stage.classList.add('webgl-ready');labelsHolder.hidden=false;for(const id of ['zoomIn','zoomOut','resetView'])document.getElementById(id).disabled=false;wake();});
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=performance.now()-40;wake();}});
  const api={get ready(){return ready;},setActive(value){active=value;drag=null;if(value){resize();last=performance.now()-40;stage.classList.toggle('webgl-ready',ready);wake();}else{cancelAnimationFrame(raf);raf=0;}},setPaused(value){paused=value;wake();},setFormation(value){heartMode=Boolean(value);dragOffset=0;elevation=.2;zoomFactor=1;wake();},zoom(factor){zoomFactor=clamp(zoomFactor*factor,.75,1.35);poseCamera();wake();},reset(){zoomFactor=1;dragOffset=0;elevation=.2;rotation=.15;poseCamera();wake();},celebrate(){celebrateUntil=time+3;wake();}};
  resize();return api;
}
