"use strict";

(() => {
  const config = window.OOMBAM_COMMUNITY_CONFIG || {};
  const canConnect = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
  if (!canConnect) return;

  const body = document.body;
  const isHome = body.classList.contains("page-home");
  const isCommunity = body.classList.contains("page-community");
  const shouldShowSignedOutEntry = isHome || isCommunity;
  const safe = (value = "", max = 120) => String(value).replace(/\s+/g, " ").trim().slice(0, max);
  const db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  let session = null;
  let profile = null;
  let isAdmin = false;

  const headerActions = document.querySelector(".ob-header__actions");
  const mobilePanel = document.querySelector(".ob-mobile-menu__panel");
  if (!headerActions || !mobilePanel) return;

  const desktop = document.createElement("div");
  desktop.className = "ob-account ob-account--desktop";
  desktop.hidden = true;
  desktop.innerHTML = `
    <button class="ob-account__trigger" type="button" aria-expanded="false" aria-controls="siteAccountMenu" aria-label="Open Blossom account menu">
      <span class="ob-account__avatar" aria-hidden="true">🌸</span>
      <svg class="ob-account__icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"/></svg>
    </button>
    <div class="ob-account-menu" id="siteAccountMenu" hidden>
      <div class="ob-account-menu__identity">
        <span class="ob-account-menu__avatar" aria-hidden="true">🌸</span>
        <div><strong class="ob-account-menu__name">Blossom</strong><small class="ob-account-menu__role">Blossom Member</small></div>
      </div>
      <a href="community.html?account=1">My Account</a>
      <a class="ob-account-menu__moderate" href="community.html?moderate=1" hidden>Admin Hub</a>
      <button class="ob-account-menu__signout" type="button">Sign Out</button>
    </div>`;
  headerActions.insertBefore(desktop, headerActions.firstChild);

  const mobile = document.createElement("div");
  mobile.className = "ob-account-mobile";
  mobile.hidden = true;
  mobile.innerHTML = `
    <div class="ob-account-mobile__identity">
      <span class="ob-account-mobile__avatar" aria-hidden="true">🌸</span>
      <div><span class="ob-account-mobile__welcome">Welcome</span><strong class="ob-account-mobile__name">Blossom 🌸</strong><small class="ob-account-mobile__role">Blossom Member</small></div>
    </div>
    <div class="ob-account-mobile__actions">
      <a href="community.html?account=1">My Account</a>
      <a class="ob-account-mobile__moderate" href="community.html?moderate=1" hidden>Admin Hub</a>
      <button class="ob-account-mobile__signout" type="button">Sign Out</button>
    </div>`;
  mobilePanel.insertBefore(mobile, mobilePanel.firstChild);

  const trigger = desktop.querySelector(".ob-account__trigger");
  const menu = desktop.querySelector(".ob-account-menu");

  function closeMenu() {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    const opening = menu.hidden;
    menu.hidden = !opening;
    trigger.setAttribute("aria-expanded", opening ? "true" : "false");
  }
  trigger.addEventListener("click", (event) => { event.stopPropagation(); toggleMenu(); });
  document.addEventListener("click", (event) => { if (!desktop.contains(event.target)) closeMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

  async function signOut(button) {
    button.disabled = true;
    try { await db.auth.signOut(); }
    finally { button.disabled = false; closeMenu(); }
  }
  desktop.querySelector(".ob-account-menu__signout").addEventListener("click", e => signOut(e.currentTarget));
  mobile.querySelector(".ob-account-mobile__signout").addEventListener("click", e => signOut(e.currentTarget));

  const shortName = (value = "") => {
    const name = safe(value, 30) || "Blossom";
    return name.length > 14 ? `${name.slice(0, 13)}…` : name;
  };

  async function loadProfile(user) {
    const fallback = safe(user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Blossom", 30);
    try {
      const { data } = await db.from("community_profiles").select("display_name, avatar").eq("user_id", user.id).maybeSingle();
      profile = { displayName: safe(data?.display_name || fallback, 30), avatar: safe(data?.avatar || "🌸", 4) || "🌸" };
    } catch (_) {
      profile = { displayName: fallback, avatar: "🌸" };
    }
    try {
      const { data } = await db.rpc("is_community_admin");
      isAdmin = data === true;
    } catch (_) { isAdmin = false; }
  }

  function setLegacyAuthVisibility(signedIn) {
    body.classList.toggle("ob-site-auth-signed-in", signedIn);
    body.classList.toggle("ob-site-auth-signed-out", !signedIn);
    document.querySelectorAll("#homeHeaderAuth,#homeMobileAuth,#communityHeaderAuth,#communityMobileAuth").forEach(el => {
      if (signedIn) el.setAttribute("aria-hidden", "true");
      else el.removeAttribute("aria-hidden");
    });
  }

  function render() {
    const signedIn = Boolean(session?.user?.id);
    setLegacyAuthVisibility(signedIn);
    desktop.hidden = !signedIn;
    mobile.hidden = !signedIn;

    if (!signedIn) {
      document.querySelectorAll('[data-nav-key="welcome"]').forEach(link => { link.textContent = "Welcome 🌸"; link.title = "Welcome"; });
      if (!shouldShowSignedOutEntry) closeMenu();
      return;
    }

    const display = shortName(profile?.displayName || session.user.user_metadata?.display_name || "Blossom");
    const avatar = safe(profile?.avatar || "🌸", 4) || "🌸";
    document.querySelectorAll('[data-nav-key="welcome"]').forEach(link => {
      link.textContent = `Welcome ${display} 🌸`;
      link.title = `Welcome ${profile?.displayName || display}`;
    });
    desktop.querySelector(".ob-account__avatar").textContent = avatar;
    desktop.querySelector(".ob-account-menu__avatar").textContent = avatar;
    desktop.querySelector(".ob-account-menu__name").textContent = profile?.displayName || display;
    desktop.querySelector(".ob-account-menu__role").textContent = isAdmin ? "Community Admin" : "Blossom Member";
    desktop.querySelector(".ob-account-menu__moderate").hidden = !isAdmin;
    mobile.querySelector(".ob-account-mobile__avatar").textContent = avatar;
    mobile.querySelector(".ob-account-mobile__name").textContent = `${profile?.displayName || display} 🌸`;
    mobile.querySelector(".ob-account-mobile__role").textContent = isAdmin ? "Community Admin" : "Blossom Member";
    mobile.querySelector(".ob-account-mobile__moderate").hidden = !isAdmin;
  }

  async function sync(nextSession) {
    session = nextSession || null;
    profile = null;
    isAdmin = false;
    if (session?.user) await loadProfile(session.user);
    render();
  }

  db.auth.getSession().then(({ data }) => sync(data?.session || null)).catch(() => render());
  db.auth.onAuthStateChange((_event, nextSession) => { setTimeout(() => sync(nextSession), 0); });
})();
