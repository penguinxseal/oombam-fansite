/** OOMBAM FANSITE · Developed by ObsocPH x Ben10 Admins · Maintainer B9 · © 2026 */
(async()=>{
 const $=s=>document.querySelector(s),cfg=window.QA_CONFIG,form=$('#qa-form'),status=$('#status'),nick=$('#nickname');
 const token=new URLSearchParams(location.hash.slice(1)).get('token');
 // Keep the secret out of browser history's visible URL after reading it.
 if(token) history.replaceState(null,'',location.pathname+location.search);
 const show=(s,bad=false)=>{status.textContent=s;status.className=bad?'error':'success'};
 const call=async(action,extra={})=>{
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/qa-access`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey},body:JSON.stringify({action,token,...extra}),cache:'no-store'});
  const v=await r.json();if(!r.ok)throw Error(v.error||'Request failed');return v;
 };
 if(!token){show('Open your personal QA link to begin. Ask the organizer for your assigned link.',true);return;}
 if(!cfg.supabaseUrl.startsWith('https://')){show('QA Portal is not configured yet. Please contact the organizer.',true);return;}
 let locked=false;
 for(const [area,questions] of Object.entries(window.QA_QUESTIONS.reduce((acc,q)=>{(acc[q.area]??=[]).push(q);return acc;},{}))){
  const sec=document.createElement('section');sec.className='panel';const h=document.createElement('h2');h.textContent=area;sec.append(h);
  for(const q of questions){const wrap=document.createElement('div');wrap.className='question';wrap.dataset.id=q.id;
   const strong=document.createElement('strong');strong.textContent=`${q.id} · ${q.question}`;wrap.append(strong);
   const opts=document.createElement('div');opts.className='options';
   for(const [value,label] of [['pass','Pass'],['fail','Fail'],['not_tested','Not Tested']]){
    const lab=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name=q.id;radio.value=value;radio.style.width='auto';lab.append(radio,document.createTextNode(label));opts.append(lab);
   }wrap.append(opts);const note=document.createElement('textarea');note.placeholder='Optional notes / steps to reproduce';note.maxLength=3000;note.setAttribute('aria-label',`Notes for ${q.id}`);wrap.append(note);sec.append(wrap);
  }form.append(sec);
 }
 const answers=()=>{const o={};for(const el of form.querySelectorAll('.question')){const selected=el.querySelector('input:checked');if(selected)o[el.dataset.id]={result:selected.value,notes:el.querySelector('textarea').value};}return o;};
 const progress=()=>{$('#progress').textContent=`${Object.keys(answers()).length} of 37 questions answered`;};
 form.addEventListener('change',progress);
 function disable(){locked=true;nick.disabled=true;form.querySelectorAll('input,textarea').forEach(e=>e.disabled=true);$('#actions').classList.add('hidden');}
 try{
  const v=await call('get');nick.value=v.nickname||'';
  for(const [id,a] of Object.entries(v.answers||{})){const el=[...form.querySelectorAll('.question')].find(e=>e.dataset.id===id);if(!el)continue;const r=el.querySelector(`input[value="${a.result}"]`);if(r)r.checked=true;el.querySelector('textarea').value=a.notes||'';}
  form.classList.remove('hidden');$('#progress').classList.remove('hidden');progress();
  if(v.status==='submitted'){disable();show('Your final answers were submitted successfully. Thank you! 💛');}
  else{$('#actions').classList.remove('hidden');show('Your private questionnaire is ready.');}
 }catch(e){show(e.message,true);return;}
 async function save(final){if(locked)return;if(!nick.value.trim()){show('Please enter your nickname first.',true);nick.focus();return;}
  const a=answers();if(final&&Object.keys(a).length!==37){show('Please choose Pass, Fail, or Not Tested for every question.',true);return;}
  if(final&&!confirm('Submit your final answers? You will not be able to edit them afterward.'))return;
  $('#save').disabled=$('#submit').disabled=true;
  try{await call(final?'submit':'save',{nickname:nick.value.trim(),answers:a});show(final?'Submitted! Your answers are now locked. 💛':'Draft saved. Use your original private link to return.');if(final)disable();}
  catch(e){show(e.message,true);}finally{if(!locked)$('#save').disabled=$('#submit').disabled=false;}
 }
 $('#save').onclick=()=>save(false);$('#submit').onclick=()=>save(true);
})();
