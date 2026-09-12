"use strict";

(() => {
  if (!document.body.classList.contains("page-community")) return;

  const config = window.OOMBAM_COMMUNITY_CONFIG || {};
  const hasSupabaseConfig = Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    window.supabase?.createClient
  );

  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
  };

  const KEYS = {
    letters: "oombam-community-preview-letters",
    wall: "oombam-community-preview-wall",
    chat: "oombam-community-preview-chat",
    profile: "oombam-community-preview-profile",
    lastSubmit: "oombam-community-last-submit",
    lastChat: "oombam-community-last-chat",
    authPreview: "oombam-community-auth-preview"
  };

  const AUTH_REQUIRED = config.requireAuthForParticipation === true;

  const safeText = (value = "", max = 5000) =>
    String(value).replace(/\s+/g, " ").trim().slice(0, max);

  const safeMultiline = (value = "", max = 5000) =>
    String(value).replace(/\r/g, "").trim().slice(0, max);

  const formatMonth = (dateValue = new Date()) => {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(d);
  };

  const flagFromCountry = (country) => {
    const code = safeText(country, 8).toUpperCase();
    if (code === "OTHER") return "🌍";
    if (!/^[A-Z]{2}$/.test(code)) return "";
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt()));
  };

  let db = null;
  let realtimeChannel = null;

  const chatStatus = document.getElementById("communityChatStatus");
  const chatStatusText = document.getElementById("communityChatStatusText");
  const chatNote = document.getElementById("communityChatNote");
  const chatWindow = document.getElementById("communityChatWindow");
  const chatForm = document.getElementById("communityChatForm");
  const chatInput = document.getElementById("communityChatInput");
  const messageGrid = document.getElementById("blossomMessageGrid");
  const authSummary = document.getElementById("communityAuthSummary");
  const authButton = document.getElementById("communityAuthButton");

  const setChatState = (state, note = "") => {
    if (chatStatus) {
      chatStatus.classList.remove("is-preview", "is-live", "is-error");
      chatStatus.classList.add(`is-${state}`);
    }
    if (chatStatusText) {
      chatStatusText.textContent =
        state === "live" ? "LIVE" :
        state === "preview" ? "PREVIEW" :
        state === "error" ? "OFFLINE" : "CONNECTING";
    }
    if (chatNote) chatNote.textContent = note;
  };


  let currentSession = null;
  let currentMember = null;

  const authRedirectUrl = () => `${window.location.origin}${window.location.pathname}`;

  const passwordLooksValid = (value = "") =>
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  const memberFromUser = (user) => ({
    userId: user?.id || "",
    email: safeText(user?.email || "", 120),
    displayName: safeText(user?.user_metadata?.display_name || "", 30),
    avatar: safeText(user?.user_metadata?.avatar || "🌸", 4) || "🌸"
  });

  const ensureMemberProfile = async (user) => {
    if (!db || !user) return null;

    const fallback = memberFromUser(user);
    const fallbackName = fallback.displayName || safeText((fallback.email.split("@")[0] || "Blossom"), 30);

    const { data: existing, error: readError } = await db
      .from("community_profiles")
      .select("user_id, display_name, avatar, country_code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) throw readError;

    if (!existing) {
      const { data: created, error: insertError } = await db
        .from("community_profiles")
        .insert({
          user_id: user.id,
          display_name: fallbackName,
          avatar: fallback.avatar || "🌸"
        })
        .select("user_id, display_name, avatar, country_code")
        .single();
      if (insertError) throw insertError;
      currentMember = {
        userId: created.user_id,
        email: fallback.email,
        displayName: created.display_name,
        avatar: created.avatar || "🌸",
        countryCode: created.country_code || ""
      };
    } else {
      currentMember = {
        userId: existing.user_id,
        email: fallback.email,
        displayName: existing.display_name,
        avatar: existing.avatar || "🌸",
        countryCode: existing.country_code || ""
      };
    }

    storage.set(KEYS.profile, {
      displayName: currentMember.displayName,
      avatar: currentMember.avatar
    });

    return currentMember;
  };

  const isSignedIn = () => {
    if (!AUTH_REQUIRED) return true;
    return Boolean(currentSession?.user?.id);
  };

  const updateAuthUI = () => {
    if (!authSummary || !authButton) return;

    if (currentSession?.user && currentMember?.displayName) {
      authSummary.textContent = `Signed in as ${currentMember.displayName}.`;
      authButton.textContent = "Account";
      authButton.classList.add("is-signed-in");
      return;
    }

    if (hasSupabaseConfig) {
      authSummary.textContent = "Leave a letter. Share a message. Join the conversation.";
      authButton.textContent = "Join / Sign In";
    } else {
      authSummary.textContent = "Community access is temporarily unavailable.";
      authButton.textContent = "Unavailable";
    }
    authButton.classList.remove("is-signed-in");
  };

  const renderAuthAccount = () => {
    if (!currentSession?.user || !currentMember) {
      renderAuthGate();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">BLOSSOM ACCOUNT</p>
      <h2 class="community-modal__title" id="communityModalTitle"></h2>
      <p class="community-modal__intro">Your Blossom Community account is active.</p>
      <div class="community-account-card">
        <span>Email</span><strong class="community-account-email"></strong>
        <span>Display name</span><strong class="community-account-name"></strong>
      </div>
      <div class="community-form__actions">
        <button class="community-form__secondary" type="button" data-community-close>Close</button>
        <button class="community-form__primary community-signout" type="button">Sign Out</button>
      </div>`;

    wrapper.querySelector("#communityModalTitle").textContent = `Hi, ${currentMember.displayName} 🌸`;
    wrapper.querySelector(".community-account-email").textContent = currentMember.email;
    wrapper.querySelector(".community-account-name").textContent = currentMember.displayName;

    wrapper.querySelector(".community-signout")?.addEventListener("click", async () => {
      const button = wrapper.querySelector(".community-signout");
      button.disabled = true;
      const { error } = await db.auth.signOut();
      if (error) {
        button.disabled = false;
        return;
      }
      currentSession = null;
      currentMember = null;
      try { localStorage.removeItem(KEYS.profile); } catch (_) {}
      updateAuthUI();
      closeModal();
    });

    openModal(wrapper);
  };

  const renderAuthGate = (onSuccess) => {
    if (!hasSupabaseConfig || !db) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <p class="community-modal__eyebrow">BLOSSOM COMMUNITY</p>
        <h2 class="community-modal__title" id="communityModalTitle">Community access unavailable</h2>
        <p class="community-modal__intro">We could not connect to Blossom Community Access right now. Please try again later.</p>
        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Close</button>
        </div>`;
      openModal(wrapper);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">BLOSSOM COMMUNITY ACCESS</p>
      <h2 class="community-modal__title" id="communityModalTitle">Grow with us 🌸</h2>
      <p class="community-modal__intro">
        Join the community to send letters, leave Blossom Wall messages, and take part in Blossom Chat.
      </p>
      <div class="community-auth-tabs" role="tablist" aria-label="Blossom account access">
        <button class="community-auth-tab is-active" type="button" data-auth-mode="signup" role="tab" aria-selected="true">Join Community</button>
        <button class="community-auth-tab" type="button" data-auth-mode="signin" role="tab" aria-selected="false">Sign In</button>
      </div>
      <form class="community-form" id="communityAuthForm">
        <label>Email address
          <input name="email" type="email" inputmode="email" autocomplete="email"
                 maxlength="120" required placeholder="you@example.com">
        </label>
        <label class="community-auth-signup-only">Display name
          <input name="displayName" maxlength="30" autocomplete="nickname"
                 required placeholder="e.g. Blossom PH">
        </label>
        <label>Password
          <input name="password" type="password" autocomplete="new-password" minlength="8"
                 maxlength="128" required placeholder="Create a secure password">
        </label>
        <div class="community-auth-guidance community-auth-signup-only" aria-label="Account requirements">
          <p class="community-auth-guidance__item">
            <span aria-hidden="true">◇</span>
            <span><strong>Password:</strong> 8+ characters with lowercase, uppercase, a number, and a symbol.</span>
          </p>
          <p class="community-auth-guidance__item">
            <span aria-hidden="true">♡</span>
            <span>Your email stays private and is never shown on Community posts.</span>
          </p>
          <p class="community-auth-guidance__item community-auth-confirm-note">
            <span aria-hidden="true">✉</span>
            <span>After joining, confirm your Blossom account from the email we send within <strong>10 minutes</strong>.</span>
          </p>
        </div>
        <p class="community-form__status" aria-live="polite"></p>
        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Cancel</button>
          <button class="community-form__primary community-auth-submit" type="submit">Join Community 🌸</button>
        </div>
      </form>`;

    const form = wrapper.querySelector("form");
    const submit = wrapper.querySelector(".community-auth-submit");
    const displayNameInput = form.elements.displayName;
    const passwordInput = form.elements.password;
    let mode = "signup";

    const setMode = (nextMode) => {
      mode = nextMode === "signin" ? "signin" : "signup";
      wrapper.querySelectorAll("[data-auth-mode]").forEach((button) => {
        const active = button.dataset.authMode === mode;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      wrapper.querySelectorAll(".community-auth-signup-only").forEach((el) => {
        el.hidden = mode !== "signup";
      });
      displayNameInput.required = mode === "signup";
      passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
      passwordInput.placeholder = mode === "signup" ? "Create a secure password" : "Enter your password";
      submit.textContent = mode === "signup" ? "Join Community 🌸" : "Sign In 🌸";
      showFormStatus(form, "");
    };

    wrapper.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.authMode));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const email = safeText(data.get("email"), 120).toLowerCase();
      const displayName = safeText(data.get("displayName"), 30);
      const password = String(data.get("password") || "");

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormStatus(form, "Please enter a valid email address.", "error");
        return;
      }
      if (mode === "signup" && !displayName) {
        showFormStatus(form, "Please choose a display name.", "error");
        return;
      }
      if (mode === "signup" && !passwordLooksValid(password)) {
        showFormStatus(form, "Password must have 8+ characters with lowercase, uppercase, a number, and a symbol.", "error");
        return;
      }

      submit.disabled = true;
      showFormStatus(form, mode === "signup" ? "Creating your Blossom account…" : "Signing you in…");

      try {
        if (mode === "signup") {
          const { data: result, error } = await db.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: authRedirectUrl(),
              data: { display_name: displayName, avatar: "🌸" }
            }
          });
          if (error) throw error;

          if (result.session?.user) {
            currentSession = result.session;
            await ensureMemberProfile(result.session.user);
            updateAuthUI();
            closeModal();
            onSuccess?.();
          } else {
            form.reset();
            showFormStatus(
              form,
              "Almost there 🌸 Check your email and confirm your account within 10 minutes, then return here to sign in.",
              "success"
            );
          }
        } else {
          const { data: result, error } = await db.auth.signInWithPassword({ email, password });
          if (error) throw error;
          currentSession = result.session;
          await ensureMemberProfile(result.user);
          updateAuthUI();
          closeModal();
          onSuccess?.();
        }
      } catch (error) {
        console.error("Blossom Auth:", error);
        const message = safeText(error?.message || "We could not complete that request. Please try again.", 220);
        showFormStatus(form, message, "error");
      } finally {
        submit.disabled = false;
      }
    });

    setMode("signup");
    openModal(wrapper);
  };

  const requireParticipationAuth = (onSuccess) => {
    if (!AUTH_REQUIRED || isSignedIn()) {
      onSuccess?.();
      return true;
    }
    renderAuthGate(onSuccess);
    return false;
  };

  const createModalShell = () => {
    let modal = document.getElementById("communityModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "communityModal";
    modal.className = "community-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="community-modal__backdrop" data-community-close></div>
      <section class="community-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="communityModalTitle">
        <button class="community-modal__close" type="button" aria-label="Close" data-community-close>×</button>
        <div id="communityModalBody"></div>
      </section>`;
    document.body.append(modal);

    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-community-close]")) closeModal();
    });

    return modal;
  };

  let modalScrollY = 0;

  const lockModalScroll = () => {
    modalScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${modalScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("community-modal-open");
  };

  const unlockModalScroll = () => {
    document.body.classList.remove("community-modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, modalScrollY);
  };

  const openModal = (content, { wide = false } = {}) => {
    const modal = createModalShell();
    const dialog = modal.querySelector(".community-modal__dialog");
    const body = modal.querySelector("#communityModalBody");
    dialog.classList.toggle("community-modal__dialog--wide", wide);
    body.replaceChildren();
    if (typeof content === "string") body.innerHTML = content;
    else body.append(content);

    lockModalScroll();
    modal.hidden = false;

    // Desktop can receive keyboard focus immediately.
    // On iPhone/iPad, auto-focusing an input can trigger Safari viewport zoom/shift.
    const touchLike = window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches;
    if (!touchLike) {
      requestAnimationFrame(() => {
        modal.querySelector("input, textarea, select, button:not(.community-modal__close)")?.focus({ preventScroll: true });
      });
    }
  };

  const closeModal = () => {
    const modal = document.getElementById("communityModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    unlockModalScroll();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  const statusLine = (form) => form.querySelector(".community-form__status");

  const showFormStatus = (form, message, type = "") => {
    const el = statusLine(form);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add(`is-${type}`);
  };

  const isRateLimited = (key, minimumMs) => {
    const last = Number(storage.get(key, 0)) || 0;
    return Date.now() - last < minimumMs;
  };

  const markRate = (key) => storage.set(key, Date.now());

  async function submitLetter(payload) {
    if (hasSupabaseConfig) {
      const { error } = await db.from("community_letters").insert({
        recipient: payload.recipient,
        display_name: payload.displayName,
        country_code: payload.countryCode || null,
        message: payload.message
      });
      if (error) throw error;
      return;
    }

    const preview = storage.get(KEYS.letters, []);
    preview.unshift({
      id: crypto.randomUUID?.() || `${Date.now()}`,
      ...payload,
      status: "pending",
      created_at: new Date().toISOString()
    });
    storage.set(KEYS.letters, preview.slice(0, 50));
  }

  async function submitWallMessage(payload) {
    if (hasSupabaseConfig) {
      const { error } = await db.from("blossom_messages").insert({
        display_name: payload.displayName,
        country_code: payload.countryCode || null,
        message: payload.message
      });
      if (error) throw error;
      return;
    }

    const preview = storage.get(KEYS.wall, []);
    preview.unshift({
      id: crypto.randomUUID?.() || `${Date.now()}`,
      ...payload,
      status: "pending",
      created_at: new Date().toISOString()
    });
    storage.set(KEYS.wall, preview.slice(0, 50));
  }

  function renderLetterForm(recipient = "OomBam") {
    if (AUTH_REQUIRED && !isSignedIn()) {
      requireParticipationAuth(() => renderLetterForm(recipient));
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">FAN LETTER</p>
      <h2 class="community-modal__title" id="communityModalTitle">Write to ${recipient}</h2>
      <p class="community-modal__intro">Your letter will be submitted for moderation before it can appear in the community.</p>
      <form class="community-form" id="communityLetterForm">
        <div class="community-form__row">
          <label>Display name
            <input name="displayName" maxlength="40" autocomplete="nickname" required placeholder="e.g. Blossom PH">
          </label>
          <label>Country
            <select name="countryCode">
              <option value="">Prefer not to say</option>
              <optgroup label="Asia">
                <option value="PH">Philippines 🇵🇭</option>
                <option value="TH">Thailand 🇹🇭</option>
                <option value="SG">Singapore 🇸🇬</option>
                <option value="MY">Malaysia 🇲🇾</option>
                <option value="ID">Indonesia 🇮🇩</option>
                <option value="VN">Vietnam 🇻🇳</option>
                <option value="JP">Japan 🇯🇵</option>
                <option value="KR">South Korea 🇰🇷</option>
                <option value="CN">China 🇨🇳</option>
                <option value="TW">Taiwan 🇹🇼</option>
                <option value="HK">Hong Kong 🇭🇰</option>
              </optgroup>
              <optgroup label="North America">
                <option value="US">United States 🇺🇸</option>
                <option value="CA">Canada 🇨🇦</option>
                <option value="MX">Mexico 🇲🇽</option>
              </optgroup>
              <optgroup label="Latin America">
                <option value="BR">Brazil 🇧🇷</option>
                <option value="CL">Chile 🇨🇱</option>
                <option value="AR">Argentina 🇦🇷</option>
                <option value="PE">Peru 🇵🇪</option>
                <option value="CO">Colombia 🇨🇴</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="GB">United Kingdom 🇬🇧</option>
                <option value="ES">Spain 🇪🇸</option>
                <option value="FR">France 🇫🇷</option>
                <option value="DE">Germany 🇩🇪</option>
                <option value="IT">Italy 🇮🇹</option>
                <option value="PT">Portugal 🇵🇹</option>
                <option value="NL">Netherlands 🇳🇱</option>
              </optgroup>
              <option value="OTHER">Other 🌍</option>
            </select>
          </label>
        </div>
        <label>Your letter
          <textarea name="message" maxlength="1500" required placeholder="Share a little love, encouragement, or thanks…"></textarea>
        </label>
        <p class="community-form__help">Maximum 1,500 characters. Please avoid private information.</p>
        <input type="hidden" name="recipient" value="${recipient}">
        <p class="community-form__status" aria-live="polite"></p>
        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Cancel</button>
          <button class="community-form__primary" type="submit">Submit for Review 🌸</button>
        </div>
      </form>`;

    const form = wrapper.querySelector("form");
    const memberName = currentMember?.displayName || getProfile()?.displayName || "";
    if (memberName && form.elements.displayName) {
      form.elements.displayName.value = memberName;
      form.elements.displayName.readOnly = AUTH_REQUIRED;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isRateLimited(KEYS.lastSubmit, 15000)) {
        showFormStatus(form, "Please wait a few seconds before submitting again.", "error");
        return;
      }

      const data = new FormData(form);
      const payload = {
        recipient: safeText(data.get("recipient"), 20),
        displayName: safeText(data.get("displayName"), 40),
        countryCode: safeText(data.get("countryCode"), 8),
        message: safeMultiline(data.get("message"), 1500)
      };

      if (!payload.displayName || payload.message.length < 3) {
        showFormStatus(form, "Please add your display name and letter.", "error");
        return;
      }

      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      showFormStatus(form, "Submitting…");

      try {
        await submitLetter(payload);
        markRate(KEYS.lastSubmit);
        form.reset();
        showFormStatus(
          form,
          hasSupabaseConfig
            ? "Submitted! 🌸 Your letter is now waiting for moderator review."
            : "Saved in preview mode. Connect Supabase to send this to the shared moderation queue.",
          "success"
        );
      } catch (error) {
        console.error(error);
        showFormStatus(form, "We could not submit your letter right now. Please try again.", "error");
      } finally {
        submit.disabled = false;
      }
    });

    openModal(wrapper);
  }

  function renderMessageForm() {
    if (AUTH_REQUIRED && !isSignedIn()) {
      requireParticipationAuth(() => renderMessageForm());
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">BLOSSOM WALL</p>
      <h2 class="community-modal__title" id="communityModalTitle">Leave a Message 🌸</h2>
      <p class="community-modal__intro">Short community notes are reviewed before they appear on the Blossom Wall.</p>
      <form class="community-form" id="communityMessageForm">
        <div class="community-form__row">
          <label>Display name
            <input name="displayName" maxlength="40" autocomplete="nickname" required placeholder="e.g. Blossom PH">
          </label>
          <label>Country
            <select name="countryCode">
              <option value="">Prefer not to say</option>
              <optgroup label="Asia">
                <option value="PH">Philippines 🇵🇭</option>
                <option value="TH">Thailand 🇹🇭</option>
                <option value="SG">Singapore 🇸🇬</option>
                <option value="MY">Malaysia 🇲🇾</option>
                <option value="ID">Indonesia 🇮🇩</option>
                <option value="VN">Vietnam 🇻🇳</option>
                <option value="JP">Japan 🇯🇵</option>
                <option value="KR">South Korea 🇰🇷</option>
                <option value="CN">China 🇨🇳</option>
                <option value="TW">Taiwan 🇹🇼</option>
                <option value="HK">Hong Kong 🇭🇰</option>
              </optgroup>
              <optgroup label="North America">
                <option value="US">United States 🇺🇸</option>
                <option value="CA">Canada 🇨🇦</option>
                <option value="MX">Mexico 🇲🇽</option>
              </optgroup>
              <optgroup label="Latin America">
                <option value="BR">Brazil 🇧🇷</option>
                <option value="CL">Chile 🇨🇱</option>
                <option value="AR">Argentina 🇦🇷</option>
                <option value="PE">Peru 🇵🇪</option>
                <option value="CO">Colombia 🇨🇴</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="GB">United Kingdom 🇬🇧</option>
                <option value="ES">Spain 🇪🇸</option>
                <option value="FR">France 🇫🇷</option>
                <option value="DE">Germany 🇩🇪</option>
                <option value="IT">Italy 🇮🇹</option>
                <option value="PT">Portugal 🇵🇹</option>
                <option value="NL">Netherlands 🇳🇱</option>
              </optgroup>
              <option value="OTHER">Other 🌍</option>
            </select>
          </label>
        </div>
        <label>Message
          <textarea name="message" maxlength="280" required placeholder="Share a little message for OomBam and fellow Blossoms…"></textarea>
        </label>
        <p class="community-form__help">Maximum 280 characters. Please keep it kind and public-safe.</p>
        <p class="community-form__status" aria-live="polite"></p>
        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Cancel</button>
          <button class="community-form__primary" type="submit">Submit for Review 🌸</button>
        </div>
      </form>`;

    const form = wrapper.querySelector("form");
    const memberName = currentMember?.displayName || getProfile()?.displayName || "";
    if (memberName && form.elements.displayName) {
      form.elements.displayName.value = memberName;
      form.elements.displayName.readOnly = AUTH_REQUIRED;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isRateLimited(KEYS.lastSubmit, 15000)) {
        showFormStatus(form, "Please wait a few seconds before submitting again.", "error");
        return;
      }

      const data = new FormData(form);
      const payload = {
        displayName: safeText(data.get("displayName"), 40),
        countryCode: safeText(data.get("countryCode"), 8),
        message: safeMultiline(data.get("message"), 280)
      };

      if (!payload.displayName || payload.message.length < 2) {
        showFormStatus(form, "Please add your display name and message.", "error");
        return;
      }

      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      showFormStatus(form, "Submitting…");

      try {
        await submitWallMessage(payload);
        markRate(KEYS.lastSubmit);
        form.reset();
        showFormStatus(
          form,
          hasSupabaseConfig
            ? "Submitted! 🌸 Your message is waiting for moderator review."
            : "Saved in preview mode. Connect Supabase to send this to the shared moderation queue.",
          "success"
        );
      } catch (error) {
        console.error(error);
        showFormStatus(form, "We could not submit your message right now. Please try again.", "error");
      } finally {
        submit.disabled = false;
      }
    });

    openModal(wrapper);
  }

  function renderSubmitMenu() {
    if (AUTH_REQUIRED && !isSignedIn()) {
      requireParticipationAuth(() => renderSubmitMenu());
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">COMMUNITY BLOSSOMS</p>
      <h2 class="community-modal__title" id="communityModalTitle">What would you like to share?</h2>
      <p class="community-modal__intro">Letters and Blossom Wall messages are active in this release. Fan-art and photo uploads can be added as the next backend phase.</p>
      <div class="community-choice-grid">
        <button class="community-choice" type="button" data-choice="letter">
          <strong>💌 Fan Letter</strong>
          <span>Write to Oom, Bam, or OomBam.</span>
        </button>
        <button class="community-choice" type="button" data-choice="message">
          <strong>🌸 Blossom Wall</strong>
          <span>Leave a short community message.</span>
        </button>
      </div>`;

    wrapper.addEventListener("click", (event) => {
      const choice = event.target.closest("[data-choice]")?.dataset.choice;
      if (choice === "letter") renderLetterRecipientMenu();
      if (choice === "message") renderMessageForm();
    });

    openModal(wrapper);
  }

  function renderLetterRecipientMenu() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">FAN LETTER</p>
      <h2 class="community-modal__title" id="communityModalTitle">Choose a recipient</h2>
      <p class="community-modal__intro">Your selection will be pre-filled in the letter form.</p>
      <div class="community-choice-grid">
        <button class="community-choice" type="button" data-recipient-choice="Oom"><strong>Oom 🩵</strong><span>Write to Oom.</span></button>
        <button class="community-choice" type="button" data-recipient-choice="Bam"><strong>Bam 🌸</strong><span>Write to Bam.</span></button>
        <button class="community-choice" type="button" data-recipient-choice="OomBam"><strong>OomBam 🩵🌸</strong><span>Write to them together.</span></button>
      </div>`;

    wrapper.addEventListener("click", (event) => {
      const recipient = event.target.closest("[data-recipient-choice]")?.dataset.recipientChoice;
      if (recipient) renderLetterForm(recipient);
    });

    openModal(wrapper);
  }

  function createWallCard(item) {
    const card = document.createElement("article");
    card.className = "message-card";

    const quote = document.createElement("span");
    quote.className = "quote-mark";
    quote.textContent = "“";

    const message = document.createElement("p");
    message.textContent = safeMultiline(item.message, 280);

    const author = document.createElement("strong");
    const flag = flagFromCountry(item.country_code || item.countryCode || "");
    author.textContent = `— ${safeText(item.display_name || item.displayName || "Blossom", 40)}${flag ? ` ${flag}` : ""}`;

    const date = document.createElement("small");
    date.textContent = formatMonth(item.created_at || new Date());

    const blossom = document.createElement("span");
    blossom.className = "card-blossom";
    blossom.textContent = "🌸";

    card.append(quote, message, author, date, blossom);
    return card;
  }

  async function getApprovedWallMessages() {
    if (!hasSupabaseConfig) return [];

    const { data, error } = await db
      .from("blossom_messages")
      .select("id, display_name, country_code, message, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return data || [];
  }

  async function refreshWallPreview() {
    if (!messageGrid || !hasSupabaseConfig) return;
    try {
      const data = await getApprovedWallMessages();
      if (!data.length) return;
      messageGrid.replaceChildren(...data.slice(0, 3).map(createWallCard));
    } catch (error) {
      console.error("Blossom Wall load failed:", error);
    }
  }

  async function renderWallModal() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">BLOSSOM WALL</p>
      <h2 class="community-modal__title" id="communityModalTitle">Messages from Blossoms</h2>
      <p class="community-modal__intro" id="communityWallIntro">Loading approved community messages…</p>
      <div class="community-wall-list" id="communityWallList"></div>`;
    openModal(wrapper, { wide: true });

    const list = wrapper.querySelector("#communityWallList");
    const intro = wrapper.querySelector("#communityWallIntro");

    try {
      const data = await getApprovedWallMessages();
      if (data.length) {
        list.replaceChildren(...data.map(createWallCard));
        intro.textContent = `${data.length} approved message${data.length === 1 ? "" : "s"} from the community.`;
      } else {
        const staticCards = [...document.querySelectorAll("#blossomMessageGrid .message-card")];
        list.replaceChildren(...staticCards.map(card => card.cloneNode(true)));
        intro.textContent = hasSupabaseConfig
          ? "No approved backend messages yet, so the launch samples are shown."
          : "Preview mode: showing the launch samples. Connect Supabase for a shared moderated wall.";
      }
    } catch (error) {
      console.error(error);
      intro.textContent = "The shared wall could not be loaded right now.";
    }
  }

  function getProfile() {
    return storage.get(KEYS.profile, null);
  }

  function renderProfileForm(onDone) {
    const existing = getProfile() || {};
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">BLOSSOM CHAT</p>
      <h2 class="community-modal__title" id="communityModalTitle">Choose your chat name</h2>
      <p class="community-modal__intro">Use a public display name only. Please do not include private information.</p>
      <form class="community-form" id="communityProfileForm">
        <label>Display name
          <input name="displayName" maxlength="30" autocomplete="nickname" required value="${safeText(existing.displayName || "", 30).replace(/"/g, "&quot;")}" placeholder="e.g. penguinseal">
        </label>
        <label>Avatar
          <select name="avatar">
            <option value="🌸">🌸 Blossom</option>
            <option value="🩵">🩵 Blue heart</option>
            <option value="🌷">🌷 Tulip</option>
            <option value="🐧">🐧 Penguin</option>
            <option value="🦭">🦭 Seal</option>
          </select>
        </label>
        <p class="community-form__status" aria-live="polite"></p>
        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Cancel</button>
          <button class="community-form__primary" type="submit">Join Chat</button>
        </div>
      </form>`;

    const select = wrapper.querySelector('select[name="avatar"]');
    if (existing.avatar) select.value = existing.avatar;

    wrapper.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const profile = {
        displayName: safeText(data.get("displayName"), 30),
        avatar: safeText(data.get("avatar"), 4) || "🌸"
      };
      if (!profile.displayName) return;
      storage.set(KEYS.profile, profile);
      closeModal();
      onDone?.(profile);
    });

    openModal(wrapper);
  }

  function createChatMessage(item) {
    const row = document.createElement("div");
    row.className = "chat-message";
    if (item.id) row.dataset.messageId = item.id;

    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = safeText(item.avatar || "🌸", 4);

    const content = document.createElement("div");
    const author = document.createElement("strong");
    author.textContent = safeText(item.display_name || item.displayName || "Blossom", 30);
    const message = document.createElement("p");
    message.textContent = safeMultiline(item.message, 280);

    content.append(author, message);
    row.append(avatar, content);
    return row;
  }

  function appendChatMessage(item) {
    if (!chatWindow) return;
    if (item.id && chatWindow.querySelector(`[data-message-id="${CSS.escape(String(item.id))}"]`)) return;
    chatWindow.append(createChatMessage(item));
    while (chatWindow.children.length > 40) chatWindow.firstElementChild?.remove();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function loadChat() {
    if (!chatWindow) return;

    if (!hasSupabaseConfig) {
      const local = storage.get(KEYS.chat, []);
      local.forEach(appendChatMessage);
      setChatState("preview", "Preview mode: messages are saved only in this browser until Supabase is connected.");
      return;
    }

    try {
      const { data, error } = await db
        .from("chat_messages")
        .select("id, display_name, avatar, message, created_at")
        .order("created_at", { ascending: true })
        .limit(40);
      if (error) throw error;

      if (data?.length) {
        chatWindow.replaceChildren(...data.map(createChatMessage));
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }

      realtimeChannel = db
        .channel("blossom-chat")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          payload => appendChatMessage(payload.new)
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setChatState("live", "Live Blossom Chat is connected. Be kind and keep personal information private.");
          }
        });
    } catch (error) {
      console.error("Chat connection failed:", error);
      setChatState("error", "The live chat could not connect. Please try again later.");
    }
  }

  async function sendChat(profile, messageText) {
    const payload = {
      displayName: profile.displayName,
      avatar: profile.avatar,
      message: safeMultiline(messageText, 280)
    };

    if (hasSupabaseConfig) {
      const { error } = await db.from("chat_messages").insert({
        display_name: payload.displayName,
        avatar: payload.avatar,
        message: payload.message
      });
      if (error) throw error;
      return;
    }

    const local = storage.get(KEYS.chat, []);
    const item = {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    local.push(item);
    storage.set(KEYS.chat, local.slice(-40));
    appendChatMessage(item);
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    if (AUTH_REQUIRED && !isSignedIn()) {
      requireParticipationAuth(() => chatInput?.focus());
      return;
    }

    const message = safeMultiline(chatInput?.value || "", 280);
    if (!message) return;

    if (isRateLimited(KEYS.lastChat, 3000)) {
      if (chatNote) chatNote.textContent = "Please wait a moment before sending another message.";
      return;
    }

    const profile = getProfile();
    if (!profile?.displayName) {
      renderProfileForm(() => handleChatSubmit(new Event("submit")));
      return;
    }

    const sendButton = document.getElementById("communityChatSend");
    if (sendButton) sendButton.disabled = true;

    try {
      await sendChat(profile, message);
      markRate(KEYS.lastChat);
      if (chatInput) chatInput.value = "";
      if (chatNote) {
        chatNote.textContent = hasSupabaseConfig
          ? "Live Blossom Chat is connected. Be kind and keep personal information private."
          : "Preview mode: messages are saved only in this browser until Supabase is connected.";
      }
    } catch (error) {
      console.error(error);
      if (chatNote) chatNote.textContent = "Message could not be sent. Please try again.";
    } finally {
      if (sendButton) sendButton.disabled = false;
      chatInput?.focus();
    }
  }

  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-community-action]");
    if (!actionEl) return;
    event.preventDefault();

    const action = actionEl.dataset.communityAction;
    if (action === "letter") {
      const recipient = actionEl.dataset.recipient || "OomBam";
      requireParticipationAuth(() => renderLetterForm(recipient));
    }
    if (action === "message") requireParticipationAuth(() => renderMessageForm());
    if (action === "view-wall") renderWallModal();
    if (action === "submit-menu") requireParticipationAuth(() => renderSubmitMenu());
  });

  chatInput?.addEventListener("focus", () => {
    if (AUTH_REQUIRED && !isSignedIn()) {
      chatInput.blur();
      requireParticipationAuth(() => chatInput?.focus());
      return;
    }
    if (!getProfile()?.displayName) {
      chatInput.blur();
      renderProfileForm();
    }
  });

  chatForm?.addEventListener("submit", handleChatSubmit);



  /* -----------------------------------------------------
     FAN PROJECT PROPOSALS
     Preview workflow now; backend/admin queue comes later.
  ----------------------------------------------------- */
  const PROJECT_PROPOSAL_KEY = "oombam-community-preview-project-proposals";

  const renderProjectProposalHub = () => {
    if (AUTH_REQUIRED && !isSignedIn()) {
      requireParticipationAuth(() => renderProjectProposalHub());
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">FAN PROJECTS</p>
      <h2 class="community-modal__title" id="communityModalTitle">Propose an Upcoming Project 🌱</h2>
      <p class="community-modal__intro">
        Blossoms may suggest future fan projects here. Every proposal will be reviewed by the
        fansite admins before it can be approved or considered for the official Projects section.
      </p>
      <div class="community-proposal-notice">
        <strong>How it works</strong>
        <span>Submit idea → Admin review → Approved proposal → Project planning</span>
      </div>
      <form class="community-form" id="communityProjectProposalForm">
        <div class="community-form__row">
          <label>Display name
            <input name="displayName" maxlength="40" autocomplete="nickname" required
                   placeholder="e.g. Blossom PH">
          </label>
          <label>Country
            <select name="countryCode">
              <option value="">Prefer not to say</option>
              <optgroup label="Asia">
                <option value="PH">Philippines 🇵🇭</option>
                <option value="TH">Thailand 🇹🇭</option>
                <option value="SG">Singapore 🇸🇬</option>
                <option value="MY">Malaysia 🇲🇾</option>
                <option value="ID">Indonesia 🇮🇩</option>
                <option value="VN">Vietnam 🇻🇳</option>
                <option value="JP">Japan 🇯🇵</option>
                <option value="KR">South Korea 🇰🇷</option>
                <option value="CN">China 🇨🇳</option>
                <option value="TW">Taiwan 🇹🇼</option>
                <option value="HK">Hong Kong 🇭🇰</option>
              </optgroup>
              <optgroup label="North America">
                <option value="US">United States 🇺🇸</option>
                <option value="CA">Canada 🇨🇦</option>
                <option value="MX">Mexico 🇲🇽</option>
              </optgroup>
              <optgroup label="Latin America">
                <option value="BR">Brazil 🇧🇷</option>
                <option value="CL">Chile 🇨🇱</option>
                <option value="AR">Argentina 🇦🇷</option>
                <option value="PE">Peru 🇵🇪</option>
                <option value="CO">Colombia 🇨🇴</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="GB">United Kingdom 🇬🇧</option>
                <option value="ES">Spain 🇪🇸</option>
                <option value="FR">France 🇫🇷</option>
                <option value="DE">Germany 🇩🇪</option>
                <option value="IT">Italy 🇮🇹</option>
                <option value="PT">Portugal 🇵🇹</option>
                <option value="NL">Netherlands 🇳🇱</option>
              </optgroup>
              <option value="OTHER">Other 🌍</option>
            </select>
          </label>
        </div>

        <label>Project title
          <input name="title" maxlength="80" required
                 placeholder="e.g. Birthday food support project">
        </label>

        <label>Project idea
          <textarea name="description" maxlength="1200" required
                    placeholder="Describe the project, purpose, and what you hope the community can do together."></textarea>
        </label>

        <div class="community-form__row">
          <label>Suggested timing
            <input name="timing" maxlength="80"
                   placeholder="e.g. October 2026 / Bam's birthday">
          </label>
          <label>Estimated budget / scale
            <input name="budget" maxlength="80"
                   placeholder="Optional">
          </label>
        </div>

        <label>Additional notes
          <textarea name="notes" maxlength="600"
                    placeholder="Optional: vendor ideas, location, coordination notes, links, etc."></textarea>
        </label>

        <p class="community-form__help">
          Submitting a proposal does not mean the project is approved. Fansite admins will review
          feasibility, timing, safety, permissions, and coordination requirements first.
        </p>

        <p class="community-form__status" aria-live="polite"></p>

        <div class="community-form__actions">
          <button class="community-form__secondary" type="button" data-community-close>Cancel</button>
          <button class="community-form__primary" type="submit">Submit Proposal for Review 🌱</button>
        </div>
      </form>`;

    const form = wrapper.querySelector("form");
    const memberName = currentMember?.displayName || getProfile()?.displayName || "";
    if (memberName && form.elements.displayName) {
      form.elements.displayName.value = memberName;
      form.elements.displayName.readOnly = AUTH_REQUIRED;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const proposal = {
        id: crypto.randomUUID?.() || `${Date.now()}`,
        displayName: safeText(data.get("displayName"), 40),
        countryCode: safeText(data.get("countryCode"), 8),
        title: safeText(data.get("title"), 80),
        description: safeMultiline(data.get("description"), 1200),
        timing: safeText(data.get("timing"), 80),
        budget: safeText(data.get("budget"), 80),
        notes: safeMultiline(data.get("notes"), 600),
        status: "pending",
        created_at: new Date().toISOString()
      };

      if (!proposal.displayName || !proposal.title || proposal.description.length < 10) {
        showFormStatus(form, "Please add your display name, project title, and a little more detail.", "error");
        return;
      }

      if (hasSupabaseConfig) {
        showFormStatus(
          form,
          "Project proposal backend approval will be connected during the Supabase access-control phase.",
          "error"
        );
        return;
      }

      const existing = storage.get(PROJECT_PROPOSAL_KEY, []);
      existing.unshift(proposal);
      storage.set(PROJECT_PROPOSAL_KEY, existing.slice(0, 30));

      form.reset();
      showFormStatus(
        form,
        "Proposal saved in Preview mode 🌱 Admin review will become active when the backend is connected.",
        "success"
      );
    });

    openModal(wrapper);
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-project-proposal-open]");
    if (!trigger) return;
    event.preventDefault();
    requireParticipationAuth(() => renderProjectProposalHub());
  });


  /* -----------------------------------------------------
     FROM THE COMMUNITY — reusable in-page archive
  ----------------------------------------------------- */
  const COMMUNITY_GALLERY = {
    art: {
      label: "Fan Arts",
      icon: "🎨",
      intro: "Illustrations, sketches, edits, and creative work inspired by OomBam.",
      layout: "visual",
      items: [
        {
          type: "preview",
          title: "Fan Arts Collection",
          description: "Approved Fan Arts submissions will appear here.",
          image: "assets/images/Fan-art.png",
          status: "approved"
        }
      ]
    },
    photos: {
      label: "Fan Photos",
      icon: "📷",
      intro: "Fan-captured moments and memories shared by Blossoms.",
      layout: "visual",
      items: [
        {
          type: "preview",
          title: "Fan Photos Collection",
          description: "Approved Fan Photo submissions will appear here.",
          image: "assets/images/Fan-photos.png",
          status: "approved"
        }
      ]
    },
    journal: {
      label: "Blossom Journal",
      icon: "📖",
      intro: "A quiet archive for stories, reflections, edits, and little thoughts from Blossoms.",
      layout: "journal",
      items: [
        {
          type: "preview",
          title: "Blossom Journal",
          description: "Approved journal entries and reflections will appear here.",
          image: "assets/images/Journal-photo.png"
        }
      ]
    }
  };

  const GALLERY_TABS = [
    ["all", "All"],
    ["art", "Fan Arts"],
    ["photos", "Fan Photos"],
    ["journal", "Blossom Journal"]
  ];

  const MODERATION_STATUS = {
    pending: {
      label: "Pending",
      description: "Waiting for fansite admin review."
    },
    approved: {
      label: "Approved",
      description: "Approved and ready for publication."
    },
    rejected: {
      label: "Rejected",
      description: "Not approved for publication."
    }
  };

  const makeModerationStatusBar = () => {
    const bar = document.createElement("div");
    bar.className = "community-moderation-status";
    bar.setAttribute("aria-label", "Submission moderation statuses");

    ["pending", "approved", "rejected"].forEach((status) => {
      const config = MODERATION_STATUS[status];
      const item = document.createElement("div");
      item.className = `community-moderation-status__item is-${status}`;
      item.innerHTML = `
        <span class="community-moderation-status__dot" aria-hidden="true"></span>
        <div>
          <strong>${config.label}</strong>
          <small>${config.description}</small>
        </div>`;
      bar.append(item);
    });

    return bar;
  };


  const makeGalleryItem = (item, categoryKey) => {
    const article = document.createElement(item.href ? "a" : "article");
    article.className = `community-archive-item community-archive-item--${item.type || "visual"}`;
    if (item.href) {
      article.href = item.href;
      article.addEventListener("click", () => closeModal());
    }

    if (item.image) {
      const media = document.createElement("div");
      media.className = "community-archive-item__media";
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title || COMMUNITY_GALLERY[categoryKey]?.label || "Community submission";
      media.append(img);
      article.append(media);
    }

    const body = document.createElement("div");
    body.className = "community-archive-item__body";

    if (item.meta) {
      const meta = document.createElement("span");
      meta.className = "community-archive-item__meta";
      meta.textContent = item.meta;
      body.append(meta);
    }

    const title = document.createElement("h3");
    title.textContent = item.title || "Community submission";
    body.append(title);

    if (item.description) {
      const desc = document.createElement("p");
      desc.textContent = item.description;
      body.append(desc);
    }

    if (item.type === "preview") {
      const note = document.createElement("span");
      note.className = "community-archive-item__preview";
      note.textContent = "Collection ready for approved submissions";
      body.append(note);
    }

    article.append(body);
    return article;
  };

  const galleryItemsFor = (filter) => {
    const keys = filter === "all"
      ? ["art", "photos", "journal"]
      : [filter];

    return keys.flatMap((key) =>
      (COMMUNITY_GALLERY[key]?.items || []).map((item) => ({ key, item }))
    );
  };

  const renderCommunityArchive = (initialFilter = "all") => {
    const wrapper = document.createElement("div");
    wrapper.className = "community-archive";
    wrapper.innerHTML = `
      <p class="community-modal__eyebrow">FROM THE COMMUNITY</p>
      <h2 class="community-modal__title" id="communityModalTitle">Community Gallery</h2>
      <p class="community-modal__intro community-archive__intro">
        Browse Fan Arts, Fan Photos, and the Blossom Journal without leaving this page.
      </p>
      <div class="community-archive__tabs" role="tablist" aria-label="Community gallery categories"></div>
      <div class="community-archive__heading">
        <div>
          <span class="community-archive__icon" aria-hidden="true"></span>
          <h3 class="community-archive__category"></h3>
        </div>
        <p class="community-archive__description"></p>
      </div>
      <div class="community-archive__grid" id="communityArchiveGrid"></div>
      <div class="community-archive__footer">
        <p>Community content shown here is curated and approved before publication.</p>
        <button class="community-form__primary" data-community-action="submit-menu" type="button">
          Submit to Community →
        </button>
      </div>`;

    const tabs = wrapper.querySelector(".community-archive__tabs");
    const grid = wrapper.querySelector("#communityArchiveGrid");
    const categoryTitle = wrapper.querySelector(".community-archive__category");
    const categoryIcon = wrapper.querySelector(".community-archive__icon");
    const categoryDescription = wrapper.querySelector(".community-archive__description");

    const setFilter = (filter) => {
      const valid = filter === "all" || COMMUNITY_GALLERY[filter];
      const active = valid ? filter : "all";

      tabs.querySelectorAll("[data-gallery-filter]").forEach((button) => {
        const selected = button.dataset.galleryFilter === active;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });

      if (active === "all") {
        categoryIcon.textContent = "🌸";
        categoryTitle.textContent = "All Community Collections";
        categoryDescription.textContent =
          "A curated view across Fan Arts, Fan Photos, and the Blossom Journal.";
      } else {
        const category = COMMUNITY_GALLERY[active];
        categoryIcon.textContent = category.icon;
        categoryTitle.textContent = category.label;
        categoryDescription.textContent = category.intro;
      }

      const existingStatus = wrapper.querySelector(".community-moderation-status");
      if (existingStatus) existingStatus.remove();

      if (active === "art" || active === "photos") {
        const statusBar = makeModerationStatusBar();
        grid.before(statusBar);
      }

      const items = galleryItemsFor(active);
      grid.className = `community-archive__grid community-archive__grid--${active}`;
      grid.replaceChildren(...items.map(({ key, item }) => makeGalleryItem(item, key)));
    };

    GALLERY_TABS.forEach(([key, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "community-archive__tab";
      button.dataset.galleryFilter = key;
      button.setAttribute("role", "tab");
      button.textContent = label;
      button.addEventListener("click", () => setFilter(key));
      tabs.append(button);
    });

    wrapper.addEventListener("click", (event) => {
      const submit = event.target.closest('[data-community-action="submit-menu"]');
      if (!submit) return;
      event.preventDefault();
      requireParticipationAuth(() => renderSubmitMenu());
    });

    setFilter(initialFilter);
    openModal(wrapper, { wide: true });
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-gallery-open]");
    if (!trigger) return;
    event.preventDefault();
    renderCommunityArchive(trigger.dataset.galleryOpen || "all");
  });


  async function init() {
    if (hasSupabaseConfig) {
      db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      const { data: { session } } = await db.auth.getSession();
      currentSession = session || null;
      if (currentSession?.user) {
        try {
          await ensureMemberProfile(currentSession.user);
        } catch (error) {
          console.error("Blossom profile load failed:", error);
        }
      }

      db.auth.onAuthStateChange(async (event, session) => {
        currentSession = session || null;
        if (currentSession?.user) {
          try {
            await ensureMemberProfile(currentSession.user);
          } catch (error) {
            console.error("Blossom profile sync failed:", error);
          }
          if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && !realtimeChannel) {
            await loadChat();
          }
        } else {
          currentMember = null;
          try { localStorage.removeItem(KEYS.profile); } catch (_) {}
          if (db && realtimeChannel) {
            db.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
          if (chatWindow) chatWindow.replaceChildren();
          setChatState("preview", "Sign in to join live Blossom Chat.");
        }
        updateAuthUI();
      });

      updateAuthUI();
      authButton?.addEventListener("click", () => {
        currentSession?.user ? renderAuthAccount() : renderAuthGate();
      });

      setChatState("connecting", currentSession?.user
        ? "Connecting to the live Blossom community…"
        : "Sign in to join live Blossom Chat.");

      await refreshWallPreview();
      if (currentSession?.user || !AUTH_REQUIRED) {
        await loadChat();
      } else if (chatWindow) {
        chatWindow.replaceChildren();
        setChatState("preview", "Sign in to join live Blossom Chat.");
      }
    } else {
      updateAuthUI();
      authButton?.addEventListener("click", () => renderAuthGate());
      setChatState("error", "Community access is temporarily unavailable.");
    }
  }

  init();

  window.addEventListener("beforeunload", () => {
    if (db && realtimeChannel) db.removeChannel(realtimeChannel);
  });
})();
