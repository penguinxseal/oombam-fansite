/**
 * OOMBAM FANSITE
 * ------------------------------------------------
 * Developed by: ObsocPH x Ben10 Admins
 * Developer / Maintainer: B9
 * Community: OomBam Society Philippines (OBSocPH)
 *
 * Independent, fan-made archive dedicated to
 * celebrating Oom Eisaya and Bam Saralee.
 *
 * © 2026 OomBam Fansite Contributors
 * ------------------------------------------------
 */

"use strict";
(() => {
  // Approximate page-load counts; not unique people or bot-resistant.
  const config = window.OOMBAM_COMMUNITY_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;
  // One anonymous session identifier per tab; no account or personal data stored.
  const idKey = "feat010-visitor-id";
  const makeId = () => window.crypto?.randomUUID?.() || null;
  let visitorId = null;
  try { visitorId = sessionStorage.getItem(idKey); if (!visitorId) { visitorId = makeId(); if (visitorId) sessionStorage.setItem(idKey, visitorId); } } catch (_) { visitorId = makeId(); }
  const endpoint = `${config.supabaseUrl}/rest/v1/rpc/`;
  const headers = { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}`, "Content-Type": "application/json" };
  const badge = document.createElement("span");
  badge.className = "feat010-online-badge";
  badge.setAttribute("aria-label", "Visitors online now");
  badge.title = "Visitors online now (last 5 minutes)";
  badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M17 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 4 5"/></svg><span class="feat010-online-dot"></span><span data-online-count>—</span><span class="feat010-online-label">online</span>`;
  const mount = () => { const actions = document.querySelector(".ob-header__actions"); if (actions && !actions.querySelector(".feat010-online-badge")) actions.prepend(badge); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true}); else mount();
  const update = async () => {
    if (document.visibilityState === "hidden") return;
    try {
      const rpc = visitorId ? "feat010_online_heartbeat" : "feat010_online_count";
      const res = await fetch(endpoint + rpc, {method:"POST",headers,body:JSON.stringify(visitorId ? {p_visitor_id:visitorId}: {})});
      if (!res.ok) return;
      const count = Number(await res.json());
      if (Number.isFinite(count)) badge.querySelector("[data-online-count]").textContent = count.toLocaleString();
    } catch (_) {}
  };
  update();
  window.setInterval(update, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) update(); });
  // One request per page load, with no user identity sent.
  fetch(`${config.supabaseUrl}/rest/v1/rpc/feat010_record_visit`, {
    method: "POST",
    headers: {
      "apikey": config.supabaseAnonKey,
      "Authorization": `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json"
    },
    body: "{}",
    keepalive: true
  }).catch(() => {}); // Analytics must never interfere with the homepage.
})();
