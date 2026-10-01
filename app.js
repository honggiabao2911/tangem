'use strict';
(() => {
  const $=id=>document.getElementById(id),config=window.BIRTHDAY_CONFIG,fx=window.BirthdayFX;
  const music=$('birthdayMusic'),pin=$('pinInput'),form=$('pinForm');
  const scenes=['heart','lock','candle','cards','letter','finale'];
  let current='heart',unlocked=false,furthest=0,hasWished=false,universeRequested=false;
  let audioAttempted=false,manuallyMuted=false,audioRequest=0,toastTimer,shakeTimer,sceneTimer;
  let micGeneration=0,micStream=null,micContext=null,micFrame=0,micTimeout=null,micActive=false,micStarting=false,savedVolume=.55;
  let lastDialogFocus=null,pausedBeforeDialog=false,letterOpened=false,typingTimer=null;
  music.src=config.music;music.volume=.55;
  function notify(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
  function syncMusic(){const playing=!music.paused&&!music.ended;$('musicButton').setAttribute('aria-pressed',String(playing));$('musicButton').setAttribute('aria-label',playing?'Tắt nhạc':'Bật nhạc');$('musicLabel').textContent=playing?'Tắt nhạc':'Bật nhạc';}
  async function playMusic(){audioAttempted=true;const request=++audioRequest;$('musicLabel').textContent='Đang mở…';try{await music.play();if(request===audioRequest)syncMusic();}catch(e){if(request!==audioRequest)return;syncMusic();if(e.name!=='AbortError')notify('Chạm “Bật nhạc” để mở bản nhạc nhé.');}}
  function startMusic(){if(!audioAttempted&&!manuallyMuted)void playMusic();}
  $('musicButton').addEventListener('click',()=>{if(music.paused){manuallyMuted=false;void playMusic();}else{++audioRequest;manuallyMuted=true;music.pause();}});
  for(const name of ['play','pause','ended'])music.addEventListener(name,syncMusic);
  music.addEventListener('error',()=>{syncMusic();notify('Chưa tải được nhạc. Em có thể tiếp tục mở quà rồi thử bật nhạc lại.');});
  function syncMotion(){const paused=fx?.paused||false;$('motionButton').setAttribute('aria-pressed',String(paused));$('motionButton').setAttribute('aria-label',paused?'Tiếp tục chuyển động':'Tạm dừng chuyển động');$('motionButton').textContent=paused?'▷':'Ⅱ';document.body.classList.toggle('motion-paused',paused);}
  $('motionButton').addEventListener('click',()=>{fx?.setPaused(!fx.paused);if(fx?.paused&&letterOpened)finishLetter();syncMotion();});
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');reducedMotion.addEventListener('change',e=>{fx?.setPaused(e.matches);if(e.matches&&letterOpened)finishLetter();syncMotion();});
  function updatePin(){pin.value=pin.value.replace(/[^0-9]/g,'').slice(0,4);document.querySelectorAll('.pin-boxes>span').forEach((b,i)=>{b.textContent=i<pin.value.length?'♥':'';b.classList.toggle('filled',i<pin.value.length);});form.classList.remove('wrong');pin.removeAttribute('aria-invalid');}
  pin.addEventListener('input',updatePin);
  document.querySelectorAll('[data-key]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.key;if(key==='back')pin.value=pin.value.slice(0,-1);else if(key==='clear')pin.value='';else if(pin.value.length<4)pin.value+=key;updatePin();}));
  form.addEventListener('submit',event=>{event.preventDefault();if(unlocked)return;if(pin.value!==config.password){clearTimeout(shakeTimer);form.classList.remove('wrong');void form.offsetWidth;form.classList.add('wrong');pin.setAttribute('aria-invalid','true');$('pinStatus').textContent=pin.value.length===4?'Chưa đúng rồi, em thử lại nhé.':'Em nhập đủ bốn số nhé.';if(navigator.vibrate)navigator.vibrate(50);shakeTimer=setTimeout(()=>form.classList.remove('wrong'),500);return;}
    unlocked=true;startMusic();pin.blur();$('unlockButton').disabled=true;$('pinStatus').textContent='Đúng rồi! Món quà này là của em. ♡';fx?.preloadPhotos();setTimeout(()=>go('candle'),260);
  });
  function prepareUniverse(){if(universeRequested)return;universeRequested=true;import('./universe.js').then(({createUniverse})=>{window.Birthday3D=createUniverse();window.Birthday3D.setPaused(fx.paused);window.Birthday3D.setFormation($('heartFormation').getAttribute('aria-pressed')==='true');window.Birthday3D.setActive(current==='finale');}).catch(()=>{for(const id of ['zoomIn','zoomOut','resetView'])$(id).disabled=true;});}
  function go(name){
    if(!scenes.includes(name)||(!['heart','lock'].includes(name)&&!unlocked))return;
    stopMic();if(current==='letter'&&letterOpened)finishLetter();current=name;furthest=Math.max(furthest,scenes.indexOf(name));
    document.querySelectorAll('.scene').forEach(s=>s.hidden=s.id!=='scene-'+name);document.body.dataset.scene=name;$('chapterNav').hidden=['heart','lock'].includes(name);
    document.querySelectorAll('#chapterNav button').forEach(b=>{b.disabled=scenes.indexOf(b.dataset.scene)>furthest;b.setAttribute('aria-current',b.dataset.scene===name?'step':'false');});
    window.scrollTo({top:0,left:0,behavior:'instant'});fx?.setScene(name);const heading=$('scene-'+name).querySelector('h1,h2');heading?.focus({preventScroll:true});
    if(!fx.paused){clearTimeout(sceneTimer);$('sceneCurtain').classList.remove('transitioning');void $('sceneCurtain').offsetWidth;$('sceneCurtain').classList.add('transitioning');sceneTimer=setTimeout(()=>$('sceneCurtain').classList.remove('transitioning'),650);}
    if(name==='candle'||name==='cards')prepareUniverse();if(name==='finale'){prepareUniverse();fx?.fireworks();}
  }
  document.querySelectorAll('#chapterNav button').forEach(b=>b.addEventListener('click',()=>{if(!b.disabled)go(b.dataset.scene);}));
  $('heartContinue').addEventListener('click',()=>{startMusic();go(unlocked?'candle':'lock');});
  $('replayHearts').addEventListener('click',()=>{startMusic();fx?.replayHearts();});
  $('openCards').addEventListener('click',()=>go('cards'));
  $('openLetter').addEventListener('click',()=>go('letter')); 
  $('goFinale').addEventListener('click',()=>go('finale'));
  function resetWish(){hasWished=false;$('beforeWish').hidden=false;$('afterWish').hidden=true;$('candleTitle').innerHTML='Giữ một điều ước,<br><em>thổi một chút yêu thương.</em>';$('candleSubtitle').textContent='Mong mọi điều dịu dàng sẽ tìm đến em.';$('cakeStage').setAttribute('aria-label','Bánh sinh nhật màu hồng với một ngọn nến đang cháy');$('micStatus').textContent='Cho phép micro, rồi thổi nhẹ vào điện thoại.';fx?.relight();}
  function blow(){if(hasWished)return;stopMic();hasWished=true;startMusic();fx?.blow();$('beforeWish').hidden=true;$('afterWish').hidden=false;$('candleTitle').innerHTML='Một điều ước<br><em>đã bay lên trời.</em>';$('candleSubtitle').textContent='Và một lời thương vẫn còn ở đây.';$('cakeStage').setAttribute('aria-label','Bánh sinh nhật màu hồng với ngọn nến đã tắt');if(navigator.vibrate)navigator.vibrate([20,40,20]);}
  $('tapBlow').addEventListener('click',blow);$('relightButton').addEventListener('click',resetWish);
  function stopMic(){++micGeneration;cancelAnimationFrame(micFrame);clearTimeout(micTimeout);micFrame=0;micTimeout=null;
    if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null;}if(micContext){void micContext.close().catch(()=>{});micContext=null;}
    if(micActive||micStarting)music.volume=savedVolume;micActive=false;micStarting=false;$('micButton').disabled=false;$('micLabel').textContent='Thổi nến bằng micro';$('micMeter').hidden=true;$('micMeter').setAttribute('aria-valuenow','0');$('micMeter').firstElementChild.style.width='0%';
  }
  async function startMic(){
    if(micActive||micStarting){stopMic();$('micStatus').textContent='Micro đã tắt. Em có thể thử lại hoặc chạm để tắt nến.';return;}
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!navigator.mediaDevices?.getUserMedia||!AC){$('micStatus').textContent='Trình duyệt này chưa mở được micro. Em chạm nút bên dưới nhé.';return;}
    const generation=++micGeneration;micStarting=true;savedVolume=music.volume;music.volume=0;$('micButton').disabled=true;$('micLabel').textContent='Đang mở micro…';$('micStatus').textContent='Chọn Cho phép khi điện thoại hỏi quyền micro nhé.';
    try{
      const context=new AC();micContext=context;await context.resume();
      if(generation!==micGeneration)return;
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(generation!==micGeneration||current!=='candle'||hasWished){stream.getTracks().forEach(t=>t.stop());void context.close().catch(()=>{});return;}
      micStream=stream;micStarting=false;micActive=true;$('micButton').disabled=false;$('micLabel').textContent='Đang nghe…';$('micStatus').textContent='Chờ một chút rồi thổi nhẹ, kéo dài về phía micro nhé.';$('micMeter').hidden=false;
      const analyser=context.createAnalyser();analyser.fftSize=1024;context.createMediaStreamSource(stream).connect(analyser);const samples=new Uint8Array(analyser.fftSize);
      const started=performance.now();let noise=0,count=0,above=0,previous=started,lastMeter=0;
      function listen(now){if(generation!==micGeneration||!micActive)return;analyser.getByteTimeDomainData(samples);let energy=0;for(const value of samples){const v=(value-128)/128;energy+=v*v;}const rms=Math.sqrt(energy/samples.length);const elapsed=now-started,dt=Math.min(now-previous,100);previous=now;
        if(elapsed<750){noise+=rms;count++;}const baseline=count?noise/count:0;const threshold=Math.max(.036,Math.min(.14,baseline*2.2));
        if(now-lastMeter>80){const level=Math.min(100,Math.round(rms/threshold*70));$('micMeter').firstElementChild.style.width=level+'%';$('micMeter').setAttribute('aria-valuenow',String(level));lastMeter=now;}
        if(elapsed>900){above=rms>threshold?above+dt:Math.max(0,above-dt*1.3);if(above>250){blow();return;}}
        micFrame=requestAnimationFrame(listen);
      }
      micFrame=requestAnimationFrame(listen);micTimeout=setTimeout(()=>{if(generation===micGeneration){stopMic();$('micStatus').textContent='Chưa nghe rõ tiếng thổi. Thử lại hoặc chạm để tắt nến nhé.';}},15000);
    }catch(error){if(generation!==micGeneration)return;stopMic();$('micStatus').textContent=error.name==='NotAllowedError'?'Micro chưa được cho phép. Em vẫn có thể chạm để tắt nến.':'Chưa mở được micro. Em chạm để tắt nến nhé.';}
  }
  $('micButton').addEventListener('click',startMic);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&(micActive||micStarting)){stopMic();$('micStatus').textContent='Micro đã tắt khi rời trang. Chạm để thử lại nhé.';}});
  window.addEventListener('pagehide',()=>stopMic());
  const letterParagraphs=config.letter.map(text=>{const p=document.createElement('p');$('accessibleLetter').append(Object.assign(document.createElement('p'),{textContent:text}));$('typedLetter').append(p);return p;});
  $('letterSignature').textContent=config.signature;
  function finishLetter(){clearTimeout(typingTimer);typingTimer=null;letterParagraphs.forEach((p,i)=>p.textContent=config.letter[i]);$('showFullLetter').hidden=true;}
  function typeLetter(){let paragraph=0,index=0;function tick(){if(paragraph>=letterParagraphs.length){$('showFullLetter').hidden=true;typingTimer=null;return;}index+=3;const chars=Array.from(config.letter[paragraph]);letterParagraphs[paragraph].textContent=chars.slice(0,index).join('');if(index>=chars.length){paragraph++;index=0;}typingTimer=setTimeout(tick,24);}tick();}
  $('openEnvelope').addEventListener('click',()=>{if(letterOpened)return;letterOpened=true;$('envelopeWrap').classList.add('opened');$('openEnvelope').disabled=true;$('personalLetter').hidden=false;$('envelopeHint').hidden=true;$('goFinale').hidden=false;$('personalLetter').tabIndex=-1;$('personalLetter').focus({preventScroll:true});if(fx.paused)finishLetter();else typeLetter();});
  $('showFullLetter').addEventListener('click',finishLetter);
  function openDialog(dialog){if(dialog.open)return;lastDialogFocus=document.activeElement;pausedBeforeDialog=fx?.paused||false;fx?.setPaused(true);dialog.showModal();dialog.scrollTop=0;document.body.classList.add('dialog-open');}
  for(const dialog of document.querySelectorAll('dialog')){dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');fx?.setPaused(pausedBeforeDialog);if(lastDialogFocus instanceof HTMLElement)lastDialogFocus.focus({preventScroll:true});});dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});}
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
  window.addEventListener('birthday:photo',event=>{const p=config.photos[event.detail];if(!p)return;$('largePhoto').src=p.src;$('largePhoto').alt=p.alt;$('photoTitle').textContent=p.caption;$('photoNote').textContent=p.note;openDialog($('photoDialog'));});
  $('fireworksButton').addEventListener('click',()=>{if(fx?.paused)notify('Bật chuyển động ở góc trên để xem pháo hoa nhé.');else{fx?.fireworks();window.Birthday3D?.celebrate();}});
  $('lastLetterButton').addEventListener('click',()=>openDialog($('lastLetter')));
  $('restartButton').addEventListener('click',()=>{stopMic();resetWish();window.BirthdayBook.reset();go('heart');});
  $('heartFormation').addEventListener('click',()=>{const enabled=$('heartFormation').getAttribute('aria-pressed')!=='true';$('heartFormation').setAttribute('aria-pressed',String(enabled));$('heartFormation').textContent=enabled?'Trở lại thiên hà ✧':'Ghép ảnh thành tim ♡';if(window.Birthday3D?.ready)window.Birthday3D.setFormation(enabled);else fx?.setFormation(enabled);});
  $('zoomIn').addEventListener('click',()=>window.Birthday3D?.zoom(.88));$('zoomOut').addEventListener('click',()=>window.Birthday3D?.zoom(1.12));$('resetView').addEventListener('click',()=>window.Birthday3D?.reset());
  updatePin();syncMotion();fx?.setScene('heart');
})();
