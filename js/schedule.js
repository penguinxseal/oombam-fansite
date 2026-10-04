/* OomBam schedule automation v20.13.4 — Thailand time (ICT / UTC+7) */
(() => {
  'use strict';
  const THAI_TZ = 'Asia/Bangkok';
  const pad = n => String(Math.max(0, n)).padStart(2, '0');

  const thaiDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:THAI_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get = t => parts.find(p => p.type === t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };
  const eventInstant = el => new Date(`${el.dataset.date}T${el.dataset.time || '00:00'}:00+07:00`);
  const prettyDateTime = el => {
    const d=eventInstant(el);
    const date=new Intl.DateTimeFormat('en-GB',{timeZone:THAI_TZ,day:'2-digit',month:'short',year:'numeric'}).format(d).toUpperCase();
    if(!el.dataset.time) return `${date} · TIME TBA`;
    const time=new Intl.DateTimeFormat('en-US',{timeZone:THAI_TZ,hour:'numeric',minute:'2-digit',hour12:true}).format(d);
    return `${date} · ${time} ICT`;
  };
  const addTodayBadge = el => {
    if(el.querySelector('.schedule-today-badge')) return;
    const badge=document.createElement('span'); badge.className='schedule-today-badge'; badge.textContent='TODAY';
    el.prepend(badge);
  };
  const addChevron = el => {
    if(el.querySelector('.schedule-row-chevron')) return;
    const c=document.createElement('span'); c.className='schedule-row-chevron'; c.setAttribute('aria-hidden','true'); c.textContent='›'; el.appendChild(c);
  };
  function arrangeHome(panel){
    const today=thaiDateKey();
    const activeList=panel.querySelector('[data-active-events]');
    const pastList=panel.querySelector('[data-past-list]');
    const count=panel.querySelector('[data-past-count]');
    const events=[...panel.querySelectorAll('[data-schedule-event]')];
    const upcoming=[],past=[];
    events.forEach(el=>{
      const isPast=el.dataset.date<today, isToday=el.dataset.date===today;
      el.classList.toggle('is-past',isPast); el.classList.toggle('is-today',isToday);
      el.querySelector('.schedule-today-badge')?.remove(); if(isToday) addTodayBadge(el); addChevron(el);
      (isPast?past:upcoming).push(el);
    });
    upcoming.sort((a,b)=>eventInstant(a)-eventInstant(b)); past.sort((a,b)=>eventInstant(b)-eventInstant(a));
    upcoming.forEach(el=>activeList?.appendChild(el)); past.forEach(el=>pastList?.appendChild(el));
    if(count) count.textContent=String(past.length);
    const details=panel.querySelector('[data-past-events]'); if(details) details.hidden=past.length===0;
    return upcoming;
  }
  function statusMarkup(el){
    let dots='';
    if(el.dataset.public==='true') dots+='<span class="status-dot status-public"></span>';
    if(el.dataset.private==='true') dots+='<span class="status-dot status-private"></span>';
    if(el.dataset.gifts==='true') dots+='<span class="status-dot status-gifts"></span>';
    const words=[];
    if(el.dataset.public==='true') words.push('Public / Fan attendance encouraged');
    if(el.dataset.private==='true') words.push('Private Event');
    if(el.dataset.gifts==='true') words.push('Gifts allowed');
    else words.push('No gifts accepted');
    return dots+`<span>${words.join(' · ')}</span>`;
  }
  function setupHome(){
    const panel=document.querySelector('[data-schedule-page="home"]'); if(!panel) return;
    const active=arrangeHome(panel), next=active[0];
    const title=panel.querySelector('[data-next-title]'),meta=panel.querySelector('[data-next-meta]'),stat=panel.querySelector('[data-next-status]'),label=panel.querySelector('[data-countdown-label]');
    const out={days:panel.querySelector('[data-days]'),hours:panel.querySelector('[data-hours]'),minutes:panel.querySelector('[data-minutes]'),seconds:panel.querySelector('[data-seconds]')};
    if(!next){ if(title) title.textContent='Next schedule coming soon'; if(meta) meta.textContent='Watch this space for the next official OomBam schedule.'; panel.querySelector('[data-countdown]')?.setAttribute('hidden',''); return; }
    if(title) title.textContent=`${next.dataset.person} · ${next.dataset.title}`;
    if(meta) meta.textContent=`${prettyDateTime(next)}${next.dataset.venue?' · '+next.dataset.venue:''}`;
    if(stat) stat.innerHTML=statusMarkup(next);
    const render=ms=>{const t=Math.max(0,Math.floor(ms/1000)),d=Math.floor(t/86400),h=Math.floor((t%86400)/3600),m=Math.floor((t%3600)/60),s=t%60; if(out.days)out.days.textContent=pad(d);if(out.hours)out.hours.textContent=pad(h);if(out.minutes)out.minutes.textContent=pad(m);if(out.seconds)out.seconds.textContent=pad(s);};
    const tick=()=>{
      const today=thaiDateKey(), now=Date.now(), start=eventInstant(next).getTime(), isToday=next.dataset.date===today;
      panel.classList.toggle('has-today-event',isToday);
      if(!next.dataset.time){ if(label) label.textContent=isToday?'HAPPENING TODAY · TIME TBA':'TIME TO BE ANNOUNCED'; render(0); return; }
      if(isToday){ if(now<start){if(label)label.textContent='STARTS TODAY';render(start-now);} else {if(label)label.textContent='HAPPENING TODAY';render(0);} }
      else {if(label)label.textContent='STARTS IN';render(start-now);}
    };
    tick(); const timer=setInterval(tick,1000); document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
    let known=thaiDateKey(); setInterval(()=>{const current=thaiDateKey();if(current!==known){clearInterval(timer);location.reload();}},30000);
  }
  function setupSolo(){ document.querySelectorAll('.updates-section--schedule').forEach(section=>{ const today=thaiDateKey(); [...section.querySelectorAll('[data-schedule-event]')].forEach(el=>{el.classList.toggle('is-past',el.dataset.date<today);el.classList.toggle('is-today',el.dataset.date===today);}); }); }
  const boot=()=>{setupHome();setupSolo();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
