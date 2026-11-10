/**
 * OOMBAM FANSITE | FEAT-011 Visitor Accuracy & Page Analytics
 * Developed by: ObsocPH x Ben10 Admins | Maintainer: B9
 * Anonymous browser-based measurement; no Supabase Auth sign-in required.
 */
"use strict";
(() => {
  const config = window.OOMBAM_COMMUNITY_CONFIG;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;
  const pageKeys = Object.freeze({
    "/": "home", "/index.html": "home", "/oom.html": "oom",
    "/bam.html": "bam", "/community.html": "community",
    "/just-the-two-of-us.html": "just-the-two-of-us",
    "/community-guidelines.html": "community-guidelines",
    "/submission-guidelines.html": "submission-guidelines"
  });
  // Exclude QA, Admin Hub (modal), auth callbacks and all non-allowlisted paths.
  if (location.search.includes("access_token=") || location.hash.includes("access_token=")) return;
  const pageKey = pageKeys[location.pathname.replace(/\/+$/, "") || "/"];
  if (!pageKey) return;
  const uuid = () => crypto?.randomUUID?.() || null;
  const storageKey = "feat010-visitor-id"; // Preserve existing anonymous browser IDs.
  let visitorId = null;
  try {
    visitorId = localStorage.getItem(storageKey);
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(visitorId || "")) visitorId = null;
    if (!visitorId) { visitorId = uuid(); if (visitorId) localStorage.setItem(storageKey, visitorId); }
  } catch (_) { visitorId = uuid(); }
  const eventId = uuid(); // One ID per actual page load; reused only on retry.
  const base = `${config.supabaseUrl}/rest/v1/rpc/`;
  const headers = { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}`, "Content-Type": "application/json" };
  const call = async (name, payload, keepalive = false) => {
    const res = await fetch(base + name, { method: "POST", headers, body: JSON.stringify(payload), keepalive });
    if (!res.ok) throw new Error(`FEAT-011 RPC ${name}: ${res.status}`);
    return res.json();
  };
  // Keep the existing public badge's markup, class names, and insertion point.
  const badge = document.createElement("span");
  badge.className = "feat010-online-badge";
  badge.setAttribute("aria-label", "Visitors online now");
  badge.title = "Visitors online now (last 5 minutes)";
  badge.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M17 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 4 5"/></svg><span class="feat010-online-dot"></span><span data-online-count>—</span><span class="feat010-online-label">online</span>`;
  const mount = () => { const actions = document.querySelector(".ob-header__actions"); if (actions && !actions.querySelector(".feat010-online-badge")) actions.prepend(badge); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once:true}); else mount();
  const showCount = value => { const n = Number(value); if (Number.isFinite(n)) badge.querySelector("[data-online-count]").textContent = n.toLocaleString(); };
  // A real page load is counted once. A transient retry retains the same event ID.
  const record = async () => {
    if (!visitorId || !eventId) return;
    for (let attempt = 0; attempt < 2; attempt++) {
      try { await call("feat011_track_page", {p_visitor_id:visitorId, p_event_id:eventId, p_page_key:pageKey}, true); return; }
      catch (_) { if (attempt === 0 && !document.hidden) await new Promise(resolve => setTimeout(resolve, 1200)); }
    }
  };
  void record();
  let inFlight = false;
  const heartbeat = async () => {
    if (document.hidden || inFlight) return;
    inFlight = true;
    try {
      const count = visitorId ? await call("feat011_heartbeat", {p_visitor_id:visitorId}) : await call("feat010_online_count", {});
      showCount(count);
    } catch (_) { /* Analytics must never interrupt browsing. */ }
    finally { inFlight = false; }
  };
  // Genuine interaction extends an existing session, never a page view.
  // No timer/visibility event is treated as visitor activity. The server
  // independently caps accepted activity updates to once every 30 seconds.
  let activityInFlight = false;
  let lastActivityAttempt = 0;
  const activity = async () => {
    if (!visitorId || document.hidden || activityInFlight) return;
    const now = Date.now();
    if (now - lastActivityAttempt < 30000) return;
    lastActivityAttempt = now;
    activityInFlight = true;
    try { await call("feat011_record_activity", {p_visitor_id:visitorId}); }
    catch (_) { /* Visitor analytics must never interrupt browsing. */ }
    finally { activityInFlight = false; }
  };
  // Pointer, keyboard, scrolling and touch are intentional browser interactions.
  // Capture lets activity be recorded even when other components stop bubbling.
  for (const type of ["pointerdown", "keydown", "scroll", "touchstart"]) {
    document.addEventListener(type, () => { void activity(); }, {capture:true, passive:true});
  }
  // A visible page is considered active. Hidden/background tabs do not send heartbeats.
  void heartbeat();
  setInterval(heartbeat, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void heartbeat(); });
})();
