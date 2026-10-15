/** OOMBAM FANSITE · Developed by ObsocPH x Ben10 Admins · Maintainer B9 · © 2026 */
(()=>{
 const $=s=>document.querySelector(s),cfg=window.QA_CONFIG;
 if(!cfg.supabaseUrl.startsWith('https://')){$('#message').textContent='Configure qa/js/qa-config.js before use.';return;}
 const client=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 let session=null,rows=[];
 const message=(s,err=false)=>{$('#message').textContent=s;$('#message').className=err?'error':'success'};
 async function api(action,extra={}){
  if(!session)throw Error('Sign in required');
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/qa-access`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey,'authorization':`Bearer ${session.access_token}`},body:JSON.stringify({action,...extra}),cache:'no-store'});
  const v=await r.json();if(!r.ok)throw Error(v.error||'Request failed');return v;
 }
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function refresh(){const v=await api('list');rows=v.testers;const target=$('#testers');target.replaceChildren();
  const stats=document.createElement('p');stats.textContent=`${rows.length}/5 links created · ${rows.filter(r=>r.status==='submitted').length} submitted`;target.append(stats);
  for(const [i,r] of rows.entries()){
   const details=document.createElement('details');details.className='tester';const summary=document.createElement('summary');summary.textContent=`Tester ${i+1} · ${r.nickname||'Not started'} · ${r.status}${r.revoked_at?' · REVOKED':''} · ${Object.keys(r.answers||{}).length}/30`;details.append(summary);
   const content=document.createElement('div');const stamp=document.createElement('p');stamp.className='muted tiny';stamp.textContent=`Updated: ${new Date(r.updated_at).toLocaleString()}`;content.append(stamp);
   for(const q of window.QA_QUESTIONS){const a=r.answers?.[q.id];const p=document.createElement('p');p.className='tiny';p.textContent=`${q.id} · ${q.question} — ${a?.result||'Unanswered'}${a?.notes?' | '+a.notes:''}`;content.append(p);}
   if(!r.revoked_at){const b=document.createElement('button');b.className='secondary';b.textContent='Revoke link';b.onclick=async()=>{if(!confirm('Revoke this tester link?'))return;try{await api('revoke',{id:r.id});await refresh();}catch(e){message(e.message,true);}};content.append(b);}
   details.append(content);target.append(details);
  }
  $('#create').disabled=rows.length>=5;
 }
 $('#sign-in').onclick=async()=>{try{const {data,error}=await client.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});if(error)throw error;session=data.session;await refresh();$('#login').classList.add('hidden');$('#dashboard').classList.remove('hidden');$('#password').value='';message('Administrator authenticated.');}catch(e){session=null;message(e.message,true);}};
 $('#create').onclick=async()=>{try{const v=await api('create');const box=$('#new-link');box.replaceChildren();const p=document.createElement('p');p.textContent='Copy this link now (it cannot be retrieved later):';const input=document.createElement('input');input.value=v.link;input.readOnly=true;const b=document.createElement('button');b.textContent='Copy link';b.onclick=()=>navigator.clipboard.writeText(input.value).then(()=>message('Link copied. Share privately.')).catch(()=>{input.select();message('Select and copy the link manually.');});box.append(p,input,b);await refresh();}catch(e){message(e.message,true);}};
 $('#refresh').onclick=()=>refresh().catch(e=>message(e.message,true));
 $('#export').onclick=()=>{const lines=[['Tester','Nickname','Status','Question ID','Result','Notes','Updated']];for(const [i,r] of rows.entries())for(const q of window.QA_QUESTIONS){const a=r.answers?.[q.id];lines.push([`Tester ${i+1}`,r.nickname||'',r.status,q.id,a?.result||'',a?.notes||'',r.updated_at]);}
  const csv=lines.map(line=>line.map(v=>'"'+String(v??'').replace(/^[=+@\-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='oombam-qa-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 $('#sign-out').onclick=async()=>{await client.auth.signOut();session=null;rows=[];$('#dashboard').classList.add('hidden');$('#login').classList.remove('hidden');message('Signed out.');};
})();
