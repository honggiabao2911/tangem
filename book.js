'use strict';
(() => {
  const $=id=>document.getElementById(id), book=$('memoryBook'), photos=window.BIRTHDAY_CONFIG.photos;
  let page=0,busy=false,releaseTimer=null,pointer=null,ignoreClick=false;
  const leaves=[];
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function photoFace(index,back=false){
    const p=photos[index],face=el('div','page-face'+(back?' page-back':''));
    const button=el('button','page-photo');button.type='button';button.setAttribute('aria-label','Xem ảnh '+(index+1)+': '+p.caption);
    const img=el('img');img.src=p.src;img.alt=p.alt;img.loading='lazy';img.decoding='async';img.width=800;img.height=1050;img.draggable=false;button.append(img);
    button.addEventListener('click',()=>{if(!ignoreClick&&!busy)window.dispatchEvent(new CustomEvent('birthday:photo',{detail:index}));});
    face.append(button);
    return face;
  }
  const cover=el('div','page-face book-cover');
  const coverPhoto=el('img','cover-photo');coverPhoto.src=photos[0].src;coverPhoto.alt='';coverPhoto.width=250;coverPhoto.height=310;coverPhoto.loading='lazy';
  const coverButton=el('button','cover-open','Mở cuốn sổ');coverButton.type='button';coverButton.addEventListener('click',()=>{if(!ignoreClick)turn(1);});
  cover.append(coverPhoto,coverButton);
  for(let i=0;i<5;i++){
    const leaf=el('div','book-leaf');leaf.dataset.page=String(i);
    leaf.append(i===0?cover:photoFace(i*2-1));
    if(i<4)leaf.append(photoFace(i*2,true));
    else leaf.append(el('div','page-face page-back'));
    book.append(leaf);leaves.push(leaf);
  }
  function sync(){
    book.classList.toggle('is-open',page>0);
    leaves.forEach((leaf,i)=>{
      leaf.classList.toggle('is-turned',i<page);leaf.style.zIndex=String(i<page?i+1:10-i);
      const [front,back]=leaf.children;const frontVisible=i===page,backVisible=i===page-1;
      front.setAttribute('aria-hidden',String(!frontVisible));back.setAttribute('aria-hidden',String(!backVisible));front.inert=!frontVisible;back.inert=!backVisible;
    });
    $('bookStatus').textContent=page===0?'Chạm vào ảnh bìa để mở sổ':'Trang '+String(page*2-1).padStart(2,'0')+' — '+String(page*2).padStart(2,'0')+' / 08';
    $('prevPage').disabled=page===0||busy;$('nextPage').disabled=page===4||busy;
    $('nextPage').setAttribute('aria-label',page===0?'Mở cuốn sổ':'Lật trang tiếp');
  }
  function turn(direction){
    if(busy)return;const next=Math.max(0,Math.min(4,page+direction));if(next===page)return;
    const moving=leaves[direction>0?page:page-1];page=next;busy=!window.BirthdayFX?.paused;sync();if(moving)moving.style.zIndex='30';
    if(navigator.vibrate)navigator.vibrate(8);
    clearTimeout(releaseTimer);releaseTimer=setTimeout(()=>{busy=false;sync();},busy?1010:0);
  }
  $('prevPage').addEventListener('click',()=>turn(-1));$('nextPage').addEventListener('click',()=>turn(1));
  $('bookScene').addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};ignoreClick=false;});
  $('bookScene').addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>12)ignoreClick=true;});
  $('bookScene').addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>38&&Math.abs(dx)>Math.abs(dy)*1.3){ignoreClick=true;turn(dx<0?1:-1);}setTimeout(()=>ignoreClick=false,200);});
  $('bookScene').addEventListener('pointercancel',()=>{pointer=null;ignoreClick=false;});
  $('bookScene').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();turn(1);}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}});
  window.BirthdayBook={reset(){page=0;busy=false;clearTimeout(releaseTimer);sync();},turn,get page(){return page;}};
  sync();
})();
