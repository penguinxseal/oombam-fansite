"use strict";

(() => {
  if (!document.body.classList.contains("page-home")) return;

  const config = window.OOMBAM_COMMUNITY_CONFIG || {};
  const hasConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
  const KNOWN_KEY = "oombam-community-known-account";
  const PROFILE_KEY = "oombam-community-preview-profile";
  const PENDING_KEY = "oombam-community-pending-confirmation";

  // Production custom-domain auth destinations.
  // Keep confirmation and recovery routes at the domain root; the old
  // /oombam-fansite/ GitHub Pages project path must never be used here.
  const confirmationRedirectUrl = () => `${window.location.origin}/community.html?confirmed=1`;
  const recoveryRedirectUrl = () => `${window.location.origin}/community.html`;

  const safe = (value = "", max = 5000) => String(value).replace(/\s+/g, " ").trim().slice(0, max);
  const withTimeout = (promise, ms = 10000, message = "Request timed out") => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
  const validPassword = (value = "") => value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  const knownAccount = () => { try { return localStorage.getItem(KNOWN_KEY) === "1"; } catch (_) { return false; } };
  const setKnown = () => { try { localStorage.setItem(KNOWN_KEY, "1"); } catch (_) {} };
  const setPending = (payload) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch (_) {} };
  const clearPending = () => { try { localStorage.removeItem(PENDING_KEY); } catch (_) {} };
  const saveProfile = (profile) => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (_) {} };

  const headerSignup = document.getElementById("homeHeaderSignup");
  const headerSignin = document.getElementById("homeHeaderSignin");
  const headerSignout = document.getElementById("homeHeaderSignout");
  const mobileSignup = document.getElementById("homeMobileSignup");
  const mobileSignin = document.getElementById("homeMobileSignin");
  const mobileSignout = document.getElementById("homeMobileSignout");

  let db = null;
  let session = null;
  let member = null;
  let ready = false;
  let failed = false;

  const shortName = (value = "") => {
    const name = safe(value, 30) || "Blossom";
    return name.length > 14 ? `${name.slice(0, 13)}…` : name;
  };

  const updateWelcome = () => {
    const name = session?.user && member?.displayName ? shortName(member.displayName) : "";
    document.querySelectorAll('[data-nav-key="welcome"]').forEach((link) => {
      link.textContent = name ? `Welcome ${name} 🌸` : "Welcome 🌸";
      link.title = name ? `Welcome ${member.displayName}` : "Welcome";
    });
  };

  const updateControls = () => {
    const signedIn = Boolean(session?.user?.id);
    const known = knownAccount();
    [headerSignup, mobileSignup].forEach((b) => { if (b) { b.hidden = signedIn || known; b.disabled = !ready || failed; } });
    [headerSignin, mobileSignin].forEach((b) => { if (b) { b.hidden = signedIn; b.disabled = !ready || failed; } });
    [headerSignout, mobileSignout].forEach((b) => { if (b) { b.hidden = !signedIn; b.disabled = !ready; } });
    updateWelcome();
  };

  const memberFromUser = (user) => ({
    userId: user?.id || "",
    email: safe(user?.email || "", 120),
    displayName: safe(user?.user_metadata?.display_name || "", 30),
    avatar: safe(user?.user_metadata?.avatar || "🌸", 4) || "🌸"
  });

  const ensureProfile = async (user) => {
    const fallback = memberFromUser(user);
    const fallbackName = fallback.displayName || safe((fallback.email.split("@")[0] || "Blossom"), 30);
    const { data: existing, error } = await db.from("community_profiles").select("user_id, display_name, avatar, country_code").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (existing) {
      member = { userId:existing.user_id, email:fallback.email, displayName:existing.display_name, avatar:existing.avatar || "🌸", countryCode:existing.country_code || "" };
    } else {
      const { data: created, error: insertError } = await db.from("community_profiles").insert({ user_id:user.id, display_name:fallbackName, avatar:fallback.avatar || "🌸" }).select("user_id, display_name, avatar, country_code").single();
      if (insertError) throw insertError;
      member = { userId:created.user_id, email:fallback.email, displayName:created.display_name, avatar:created.avatar || "🌸", countryCode:created.country_code || "" };
    }
    saveProfile({ displayName:member.displayName, avatar:member.avatar });
    setKnown();
    return member;
  };

  const createModal = () => {
    let modal = document.getElementById("homeAuthModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "homeAuthModal";
    modal.className = "home-auth-modal";
    modal.hidden = true;
    modal.innerHTML = `<div class="home-auth-modal__backdrop" data-home-auth-close></div><section class="home-auth-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="homeAuthTitle"><button class="home-auth-modal__close" type="button" aria-label="Close" data-home-auth-close>×</button><div id="homeAuthBody"></div></section>`;
    document.body.append(modal);
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-home-auth-close]")) closeModal(); });
    return modal;
  };
  const openModal = (content) => {
    const modal = createModal();
    modal.querySelector("#homeAuthBody").replaceChildren(content);
    modal.hidden = false;
    document.body.classList.add("home-auth-modal-open");
  };
  const closeModal = () => {
    const modal = document.getElementById("homeAuthModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("home-auth-modal-open");
  };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  const status = (form, text = "", type = "") => {
    const el = form.querySelector(".home-auth-status");
    if (!el) return;
    el.textContent = text;
    el.className = `home-auth-status${type ? ` is-${type}` : ""}`;
  };

  const renderSignupSuccess = (email) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<p class="home-auth-eyebrow">BLOSSOM COMMUNITY ACCESS</p><div class="home-auth-success-icon" aria-hidden="true">✉️</div><h2 class="home-auth-title" id="homeAuthTitle">Check your inbox 🌸</h2><p class="home-auth-intro">We sent a confirmation email to <strong></strong>.</p><div class="home-auth-guidance"><p><strong>One little step before you bloom with us.</strong></p><p>Confirm your Blossom account within <strong>10 minutes</strong>, then return to the fansite.</p></div><p class="home-auth-status" aria-live="polite"></p><div class="home-auth-actions"><button class="home-auth-secondary home-resend" type="button">Resend Email</button><button class="home-auth-primary" type="button" data-home-auth-close>Got it 🌸</button></div>`;
    wrap.querySelector(".home-auth-intro strong").textContent = email;
    wrap.querySelector(".home-resend").addEventListener("click", async (e) => {
      const b=e.currentTarget; b.disabled=true;
      try { const { error } = await db.auth.resend({ type:"signup", email, options:{ emailRedirectTo: confirmationRedirectUrl() } }); if(error) throw error; status(wrap,"Confirmation email sent again 🌸","success"); }
      catch(err){ status(wrap,safe(err.message || "Could not resend email.",180),"error"); }
      finally { b.disabled=false; }
    });
    openModal(wrap);
  };

  const renderAccount = () => {
    if (!session?.user || !member) return renderAuth("signin");
    const wrap = document.createElement("div");
    wrap.innerHTML = `<p class="home-auth-eyebrow">BLOSSOM ACCOUNT</p><h2 class="home-auth-title" id="homeAuthTitle">Welcome back, ${safe(member.displayName,30)} 🌸</h2><p class="home-auth-intro">Your Blossom Community account is active.</p><div class="home-auth-account"><span>Email</span><strong class="email"></strong><span>Display name</span><strong class="name"></strong></div><div class="home-auth-actions"><button class="home-auth-secondary" type="button" data-home-auth-close>Close</button><button class="home-auth-primary signout" type="button">Sign Out</button></div>`;
    wrap.querySelector(".email").textContent=member.email;
    wrap.querySelector(".name").textContent=member.displayName;
    wrap.querySelector(".signout").addEventListener("click", async (e)=>{ const b=e.currentTarget;b.disabled=true;try{const{error}=await db.auth.signOut();if(error)throw error;session=null;member=null;updateControls();closeModal();}catch(err){b.disabled=false;} });
    openModal(wrap);
  };

  const renderForgot = (prefill="") => {
    const wrap=document.createElement("div");
    wrap.innerHTML=`<p class="home-auth-eyebrow">BLOSSOM ACCOUNT</p><h2 class="home-auth-title" id="homeAuthTitle">Reset your password</h2><p class="home-auth-intro">Enter your account email and we’ll send password reset instructions.</p><form class="home-auth-form"><label>Email address<input name="email" type="email" required value="${safe(prefill,120).replace(/"/g,"&quot;")}"></label><p class="home-auth-status" aria-live="polite"></p><div class="home-auth-actions"><button class="home-auth-secondary" type="button" data-home-auth-close>Cancel</button><button class="home-auth-primary" type="submit">Send Reset Email</button></div></form>`;
    const form=wrap.querySelector("form");form.addEventListener("submit",async e=>{e.preventDefault();const email=safe(new FormData(form).get("email"),120).toLowerCase();const b=form.querySelector('[type="submit"]');b.disabled=true;try{const{error}=await db.auth.resetPasswordForEmail(email,{redirectTo: recoveryRedirectUrl()});if(error)throw error;status(form,"Password reset email sent 🌸","success");}catch(err){status(form,safe(err.message || "Could not send reset email.",180),"error");}finally{b.disabled=false;}});openModal(wrap);
  };

  const renderAuth = (initial="signup") => {
    if (!hasConfig || !ready || failed) {
      const w=document.createElement("div");w.innerHTML=`<p class="home-auth-eyebrow">BLOSSOM COMMUNITY</p><h2 class="home-auth-title" id="homeAuthTitle">Community access unavailable</h2><p class="home-auth-intro">We could not connect to Blossom Community Access right now. Please refresh and try again.</p><div class="home-auth-actions"><button class="home-auth-primary" data-home-auth-close type="button">Close</button></div>`;return openModal(w);
    }
    const w=document.createElement("div");
    w.innerHTML=`<p class="home-auth-eyebrow">BLOSSOM COMMUNITY ACCESS</p><h2 class="home-auth-title" id="homeAuthTitle">Grow with us 🌸</h2><p class="home-auth-intro intro"></p><div class="home-auth-tabs" role="tablist"><button class="home-auth-tab" data-mode="signup" type="button">Join Community</button><button class="home-auth-tab" data-mode="signin" type="button">Sign In</button></div><form class="home-auth-form"><label>Email address<input name="email" type="email" inputmode="email" autocomplete="email" maxlength="120" required placeholder="you@example.com"></label><label class="signup-only">Display name<input name="displayName" maxlength="30" autocomplete="nickname" placeholder="e.g. Blossom PH"></label><label>Password<input name="password" type="password" minlength="8" maxlength="128" required></label><div class="home-auth-guidance signup-only"><p><strong>Password:</strong> 8+ characters with lowercase, uppercase, a number, and a symbol.</p><p>Your email stays private and is never shown on Community posts.</p><p>After joining, confirm your Blossom account from the email we send within <strong>10 minutes</strong>.</p></div><button class="home-auth-forgot" type="button">Forgot password?</button><p class="home-auth-status" aria-live="polite"></p><div class="home-auth-actions"><button class="home-auth-secondary" type="button" data-home-auth-close>Cancel</button><button class="home-auth-primary submit" type="submit"></button></div></form>`;
    const form=w.querySelector("form"), intro=w.querySelector(".intro"), submit=w.querySelector(".submit"), forgot=w.querySelector(".home-auth-forgot"), dn=form.elements.displayName, pw=form.elements.password;
    let mode=initial==="signin"?"signin":"signup";
    const setMode=(m)=>{mode=m==="signin"?"signin":"signup";w.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("is-active",b.dataset.mode===mode));w.querySelectorAll(".signup-only").forEach(el=>el.hidden=mode!=="signup");dn.required=mode==="signup";forgot.hidden=mode!=="signin";pw.autocomplete=mode==="signup"?"new-password":"current-password";pw.placeholder=mode==="signup"?"Create a secure password":"Enter your password";submit.textContent=mode==="signup"?"Join Community 🌸":"Sign In 🌸";intro.textContent=mode==="signup"?"Join the community to send letters, leave Blossom Wall messages, and take part in Blossom Chat.":"Welcome back, Blossom. Sign in to continue sharing, chatting, and growing with the community.";status(form);};
    w.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));forgot.addEventListener("click",()=>renderForgot(form.elements.email.value));
    form.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(form), email=safe(fd.get("email"),120).toLowerCase(), displayName=safe(fd.get("displayName"),30), password=String(fd.get("password")||"");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return status(form,"Please enter a valid email address.","error");if(mode==="signup"&&!displayName)return status(form,"Please choose a display name.","error");if(mode==="signup"&&!validPassword(password))return status(form,"Password must have 8+ characters with lowercase, uppercase, a number, and a symbol.","error");submit.disabled=true;status(form,mode==="signup"?"Creating your Blossom account…":"Signing you in…");try{if(mode==="signup"){const{data,error}=await withTimeout(db.auth.signUp({email,password,options:{emailRedirectTo: confirmationRedirectUrl(),data:{display_name:displayName,avatar:"🌸"}}}),12000,"Sign up is taking longer than expected.");if(error)throw error;setKnown();setPending({email,displayName,createdAt:Date.now()});if(data.session?.user){session=data.session;await ensureProfile(data.session.user);clearPending();updateControls();closeModal();}else renderSignupSuccess(email);}else{const{data,error}=await withTimeout(db.auth.signInWithPassword({email,password}),12000,"Sign in is taking longer than expected.");if(error)throw error;session=data.session;setKnown();await ensureProfile(data.user);updateControls();closeModal();}}catch(err){status(form,safe(err.message||"We could not complete that request.",220),"error");}finally{submit.disabled=false;}});
    setMode(mode);openModal(w);
  };

  const signOut = async () => { if(!db)return; [headerSignout,mobileSignout].forEach(b=>{if(b)b.disabled=true;}); try{const{error}=await db.auth.signOut();if(error)throw error;session=null;member=null;updateControls();}finally{[headerSignout,mobileSignout].forEach(b=>{if(b)b.disabled=false;});} };

  headerSignup?.addEventListener("click",()=>renderAuth("signup"));
  headerSignin?.addEventListener("click",()=>renderAuth("signin"));
  mobileSignup?.addEventListener("click",()=>renderAuth("signup"));
  mobileSignin?.addEventListener("click",()=>renderAuth("signin"));
  headerSignout?.addEventListener("click",signOut);
  mobileSignout?.addEventListener("click",signOut);
  document.querySelectorAll('[data-nav-key="welcome"]').forEach(link=>link.addEventListener("dblclick",()=>{ if(session?.user) renderAccount(); }));

  const init = async () => {
    updateControls();
    if (!hasConfig) { failed=true; ready=true; updateControls(); return; }
    try {
      db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
      const { data, error } = await withTimeout(db.auth.getSession(),10000,"Community access took too long to load.");
      if(error) throw error;
      session=data.session || null;
      if(session?.user) await ensureProfile(session.user);
      ready=true; updateControls();
      db.auth.onAuthStateChange(async (_event,newSession)=>{session=newSession||null;if(session?.user){try{await ensureProfile(session.user);}catch(err){console.error(err);}}else member=null;ready=true;updateControls();});
    } catch(err) { console.error("Homepage Blossom Auth:",err); failed=true; ready=true; updateControls(); }
  };
  init();
})();
