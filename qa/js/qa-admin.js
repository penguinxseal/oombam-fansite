/** OOMBAM FANSITE · Developed by ObsocPH x Ben10 Admins · Maintainer B9 · © 2026 */
(()=>{
 const $=s=>document.querySelector(s),cfg=window.QA_CONFIG;
 if(!cfg?.supabaseUrl?.startsWith('https://')){$('#message').textContent='Configure qa/js/qa-config.js before use.';return;}
 const client=supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const questions=window.QA_QUESTIONS||[],total=questions.length;
 let session=null,rows=[],busy=false;
 const message=(s,err=false)=>{$('#message').textContent=s;$('#message').className=err?'error':'success'};
 const label=r=>r==='pass'?'Pass':r==='fail'?'Fail':r==='not_tested'?'Not Tested':'Unanswered';
 const counted=r=>questions.filter(q=>r.answers?.[q.id]?.result).length;
 async function api(action,extra={}){
  if(!session)throw Error('Sign in required');
  const r=await fetch(`${cfg.supabaseUrl}/functions/v1/qa-access`,{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.supabasePublishableKey,authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action,...extra}),cache:'no-store'});
  const v=await r.json();if(!r.ok)throw Error(v.error||'Request failed');return v;
 }
 function stat(title,value,sub){const el=document.createElement('div');el.className='qa-stat-card';const l=document.createElement('span');l.className='muted tiny';l.textContent=title;const v=document.createElement('strong');v.textContent=value;el.append(l,v);if(sub){const s=document.createElement('span');s.className='muted tiny';s.textContent=sub;el.append(s)}return el}
 function renderResults(){
  const root=$('#results-summary');root.replaceChildren();
  const submitted=rows.filter(r=>r.status==='submitted'&&!r.revoked_at);
  const counts={pass:0,fail:0,not_tested:0,unanswered:0};
  for(const r of submitted)for(const q of questions){const result=r.answers?.[q.id]?.result;if(Object.hasOwn(counts,result))counts[result]++;else counts.unanswered++}
  const metrics=document.createElement('div');metrics.className='qa-stat-grid';
  metrics.append(stat('Links created',`${rows.length}/11`),stat('Submitted',String(submitted.length)),stat('Questions per tester',String(total)),stat('Completion',`${submitted.length?Math.round((counts.pass+counts.fail+counts.not_tested)/(submitted.length*total)*100):0}%`,'Submitted responses answered'));
  root.append(metrics);
  const title=document.createElement('h3');title.textContent='Submitted answer breakdown';root.append(title);
  const legend=document.createElement('div');legend.className='qa-stat-grid';for(const [key,name] of [['pass','Pass'],['fail','Fail'],['not_tested','Not Tested'],['unanswered','Unanswered']])legend.append(stat(name,String(counts[key])));root.append(legend);
  const denom=submitted.length*total;const bar=document.createElement('div');bar.className='qa-result-bar';bar.setAttribute('role','img');bar.setAttribute('aria-label',`Pass ${counts.pass}, Fail ${counts.fail}, Not Tested ${counts.not_tested}, Unanswered ${counts.unanswered}`);
  for(const key of ['pass','fail','not_tested','unanswered']){const segment=document.createElement('span');segment.className=`qa-bar-${key}`;segment.style.width=`${denom?counts[key]/denom*100:0}%`;bar.append(segment)}root.append(bar);
  const note=document.createElement('p');note.className='muted tiny';note.textContent='Metrics include submitted, non-revoked testers only. Draft responses are excluded from results.';root.append(note);
  const sectionTitle=document.createElement('h3');sectionTitle.textContent='Results by testing area';root.append(sectionTitle);
  const areas=[...new Set(questions.map(q=>q.area))];const wrap=document.createElement('div');wrap.className='qa-table-scroll';const table=document.createElement('table');table.className='qa-results-table';
  const header=document.createElement('tr');for(const name of ['Testing area','Pass','Fail','Not Tested','Unanswered']){const th=document.createElement('th');th.textContent=name;header.append(th)}table.append(header);
  for(const area of areas){const qs=questions.filter(q=>q.area===area),c={pass:0,fail:0,not_tested:0,unanswered:0};for(const r of submitted)for(const q of qs){const result=r.answers?.[q.id]?.result;c[Object.hasOwn(c,result)?result:'unanswered']++}const tr=document.createElement('tr');for(const val of [area,c.pass,c.fail,c.not_tested,c.unanswered]){const td=document.createElement('td');td.textContent=String(val);tr.append(td)}table.append(tr)}wrap.append(table);root.append(wrap);
  const issuesTitle=document.createElement('h3');issuesTitle.textContent='Failed checks and tester notes';root.append(issuesTitle);
  const issues=document.createElement('div');issues.className='qa-issues';let issueCount=0;
  for(const [i,r] of rows.entries())if(r.status==='submitted'&&!r.revoked_at)for(const q of questions){const a=r.answers?.[q.id];if(a?.result!=='fail')continue;issueCount++;const item=document.createElement('div');item.className='qa-issue';const head=document.createElement('strong');head.textContent=`${q.id} · ${q.question}`;const by=document.createElement('p');by.className='muted tiny';by.textContent=`Tester ${i+1} · ${r.nickname||'Unnamed'}`;item.append(head,by);if(a.notes){const notes=document.createElement('p');notes.className='tiny';notes.textContent=a.notes;item.append(notes)}issues.append(item)}
  if(!issueCount){const empty=document.createElement('p');empty.className='muted';empty.textContent=submitted.length?'No failed checks reported.':'No submitted results yet.';issues.append(empty)}root.append(issues);
 }
 async function refresh(){const v=await api('list');rows=v.testers||[];const target=$('#testers');target.replaceChildren();renderResults();
  const stats=document.createElement('p');stats.textContent=`${rows.length}/11 links created · ${rows.filter(r=>r.status==='submitted').length} submitted`;target.append(stats);
  for(const [i,r] of rows.entries()){
   const details=document.createElement('details');details.className='tester';const summary=document.createElement('summary');summary.textContent=`Tester ${i+1} · ${r.nickname||'Not started'} · ${r.status}${r.revoked_at?' · REVOKED':''} · ${counted(r)}/${total}`;details.append(summary);
   const content=document.createElement('div');const stamp=document.createElement('p');stamp.className='muted tiny';stamp.textContent=`Updated: ${new Date(r.updated_at).toLocaleString()}`;content.append(stamp);
   for(const q of questions){const a=r.answers?.[q.id];const p=document.createElement('p');p.className='tiny';p.textContent=`${q.id} · ${q.question} — ${label(a?.result)}${a?.notes?' | '+a.notes:''}`;content.append(p)}
   if(!r.revoked_at){const b=document.createElement('button');b.className='secondary';b.textContent='Revoke link';b.onclick=async()=>{if(!confirm('Revoke this tester link?'))return;try{await api('revoke',{id:r.id});await refresh()}catch(e){message(e.message,true)}};content.append(b)}
   details.append(content);target.append(details);
  }
  $('#create').disabled=rows.length>=11;
 }
 $('#login-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('#sign-in').disabled=true;try{const {data,error}=await client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;session=data.session;await refresh();$('#login').classList.add('hidden');$('#dashboard').classList.remove('hidden');$('#password').value='';message('Administrator authenticated.')}catch(e){session=null;message(e.message,true)}finally{busy=false;$('#sign-in').disabled=false}});
 $('#create').onclick=async()=>{try{const v=await api('create');const box=$('#new-link');box.replaceChildren();const p=document.createElement('p');p.textContent='Copy this link now (it cannot be retrieved later):';const input=document.createElement('input');input.value=v.link;input.readOnly=true;const b=document.createElement('button');b.textContent='Copy link';b.onclick=()=>navigator.clipboard.writeText(input.value).then(()=>message('Link copied. Share privately.')).catch(()=>{input.select();message('Select and copy the link manually.');});box.append(p,input,b);await refresh()}catch(e){message(e.message,true)}};
 $('#refresh').onclick=()=>refresh().catch(e=>message(e.message,true));
 $('#export').onclick=()=>{const lines=[['Tester','Nickname','Status','Question ID','Result','Notes','Updated']];for(const [i,r] of rows.entries())for(const q of questions){const a=r.answers?.[q.id];lines.push([`Tester ${i+1}`,r.nickname||'',r.status,q.id,a?.result||'',a?.notes||'',r.updated_at])}const csv=lines.map(line=>line.map(v=>'"'+String(v??'').replace(/^[=+@\-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='oombam-qa-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 $('#sign-out').onclick=async()=>{await client.auth.signOut();session=null;rows=[];$('#dashboard').classList.add('hidden');$('#login').classList.remove('hidden');$('#results-summary').replaceChildren();$('#testers').replaceChildren();message('Signed out.')};
})();
