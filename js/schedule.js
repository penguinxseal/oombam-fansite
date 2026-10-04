/* OomBam schedule automation v20.13.0 — Thailand time (ICT / UTC+7) */
(() => {
  const THAI_TZ = 'Asia/Bangkok';
  const bootThaiDate = (() => { const d=new Date(); const parts=new Intl.DateTimeFormat('en-CA',{timeZone:THAI_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d); const g=t=>parts.find(p=>p.type===t)?.value; return `${g('year')}-${g('month')}-${g('day')}`; })();
  const pad = n => String(Math.max(0, n)).padStart(2, '0');
  const thaiDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:THAI_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get=t=>parts.find(p=>p.type===t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };
  const eventInstant = el => el.dataset.time ? new Date(`${el.dataset.date}T${el.dataset.time}:00+07:00`) : new Date(`${el.dataset.date}T00:00:00+07:00`);
  const prettyDateTime = el => {
    const d = new Date(`${el.dataset.date}T${el.dataset.time || '00:00'}:00+07:00`);
    const date = new Intl.DateTimeFormat('en-GB',{timeZone:THAI_TZ,day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
    if (!el.dataset.time) return `${date} · TIME TBA · ICT`;
    const time = new Intl.DateTimeFormat('en-US',{timeZone:THAI_TZ,hour:'numeric',minute:'2-digit',hour12:true}).format(d);
    return `${date} · ${time} ICT`;
  };
  function archivePast(scope=document){
    const today=thaiDateKey();
    const events=[...scope.querySelectorAll('[data-schedule-event]')];
    const archive=scope.querySelector('[data-past-events]');
    const wrap=scope.querySelector('[data-past-events-wrap]');
    if(!archive || !wrap) return events;
    let past=0;
    events.forEach(el=>{
      const isPast=el.dataset.date < today;
      const isToday=el.dataset.date === today;
      el.classList.toggle('is-today',isToday);
      if(isToday && !el.querySelector('.schedule-today-badge')){
        const badge=document.createElement('span'); badge.className='schedule-today-badge'; badge.textContent='TODAY';
        const target=el.querySelector('time,.solo-schedule-when,.solo-schedule-meta');
        target?.appendChild(badge);
      }
      if(isPast){ archive.appendChild(el); el.classList.add('is-past'); past++; }
    });
    wrap.hidden=past===0;
    const count=wrap.querySelector('[data-past-count]'); if(count) count.textContent=String(past);
    return events.filter(el=>el.dataset.date >= today);
  }
  function statusMarkup(el){
    let h='';
    if(el.dataset.public==='true') h+='<span class="status-dot status-public"></span>';
    if(el.dataset.private==='true') h+='<span class="status-dot status-private"></span>';
    if(el.dataset.gifts==='true') h+='<span class="status-dot status-gifts"></span>';
    const words=[]; if(el.dataset.public==='true') words.push('Public'); if(el.dataset.private==='true') words.push('Private'); if(el.dataset.gifts==='true') words.push('Gifts allowed');
    return h + (words.length?`<span>${words.join(' · ')}</span>`:'');
  }
  function setupHome(){
    const panel=document.querySelector('[data-schedule-page="home"]'); if(!panel) return;
    const active=archivePast(panel).sort((a,b)=>eventInstant(a)-eventInstant(b));
    const next=active[0]; if(!next) return;
    const title=panel.querySelector('[data-next-title]'); const meta=panel.querySelector('[data-next-meta]'); const stat=panel.querySelector('[data-next-status]');
    if(title) title.textContent=`${next.dataset.person} · ${next.dataset.title}`;
    if(meta) meta.textContent=`${prettyDateTime(next)}${next.dataset.venue ? ' · '+next.dataset.venue : ''}`;
    if(stat) stat.innerHTML=statusMarkup(next);
    const label=panel.querySelector('[data-countdown-label]'), date=panel.querySelector('[data-countdown-date]');
    if(date) date.textContent=prettyDateTime(next);
    const tick=()=>{
      const today=thaiDateKey();
      if(next.dataset.date===today){
        panel.classList.add('has-today-event');
        if(label) label.textContent='HAPPENING TODAY';
        const now=Date.now(), start=eventInstant(next).getTime();
        if(next.dataset.time && now < start){
          const mins=Math.max(0,Math.floor((start-now)/60000));
          panel.querySelector('[data-days]').textContent=pad(Math.floor(mins/1440));
          panel.querySelector('[data-hours]').textContent=pad(Math.floor((mins%1440)/60));
          panel.querySelector('[data-minutes]').textContent=pad(mins%60);
        } else {
          panel.querySelector('[data-days]').textContent='—'; panel.querySelector('[data-hours]').textContent='—'; panel.querySelector('[data-minutes]').textContent='—';
        }
        return;
      }
      if(label) label.textContent='STARTS IN';
      const diff=Math.max(0,eventInstant(next).getTime()-Date.now()); const mins=Math.floor(diff/60000);
      panel.querySelector('[data-days]').textContent=pad(Math.floor(mins/1440));
      panel.querySelector('[data-hours]').textContent=pad(Math.floor((mins%1440)/60));
      panel.querySelector('[data-minutes]').textContent=pad(mins%60);
    };
    tick(); setInterval(tick,30000);
  }
  function setupSolo(){ document.querySelectorAll('.updates-section--schedule').forEach(s=>archivePast(s)); }
  const boot=()=>{setupHome();setupSolo(); setInterval(()=>{ if(thaiDateKey()!==bootThaiDate) window.location.reload(); },60000);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
