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
    lastChat: "oombam-community-last-chat"
  };

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
    const code = safeText(country, 2).toUpperCase();
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

  const openModal = (content, { wide = false } = {}) => {
    const modal = createModalShell();
    const dialog = modal.querySelector(".community-modal__dialog");
    const body = modal.querySelector("#communityModalBody");
    dialog.classList.toggle("community-modal__dialog--wide", wide);
    body.replaceChildren();
    if (typeof content === "string") body.innerHTML = content;
    else body.append(content);
    modal.hidden = false;
    document.body.classList.add("community-modal-open");
    requestAnimationFrame(() => {
      modal.querySelector("input, textarea, select, button:not(.community-modal__close)")?.focus();
    });
  };

  const closeModal = () => {
    const modal = document.getElementById("communityModal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("community-modal-open");
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
              <option value="PH">Philippines 🇵🇭</option>
              <option value="TH">Thailand 🇹🇭</option>
              <option value="US">United States 🇺🇸</option>
              <option value="SG">Singapore 🇸🇬</option>
              <option value="MY">Malaysia 🇲🇾</option>
              <option value="ID">Indonesia 🇮🇩</option>
              <option value="VN">Vietnam 🇻🇳</option>
              <option value="JP">Japan 🇯🇵</option>
              <option value="KR">South Korea 🇰🇷</option>
              <option value="CN">China 🇨🇳</option>
              <option value="TW">Taiwan 🇹🇼</option>
              <option value="HK">Hong Kong 🇭🇰</option>
              <option value="OTHER">Other</option>
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
              <option value="PH">Philippines 🇵🇭</option>
              <option value="TH">Thailand 🇹🇭</option>
              <option value="US">United States 🇺🇸</option>
              <option value="SG">Singapore 🇸🇬</option>
              <option value="MY">Malaysia 🇲🇾</option>
              <option value="ID">Indonesia 🇮🇩</option>
              <option value="VN">Vietnam 🇻🇳</option>
              <option value="JP">Japan 🇯🇵</option>
              <option value="KR">South Korea 🇰🇷</option>
              <option value="OTHER">Other</option>
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
    if (action === "letter") renderLetterForm(actionEl.dataset.recipient || "OomBam");
    if (action === "message") renderMessageForm();
    if (action === "view-wall") renderWallModal();
    if (action === "submit-menu") renderSubmitMenu();
  });

  chatInput?.addEventListener("focus", () => {
    if (!getProfile()?.displayName) renderProfileForm();
  });

  chatForm?.addEventListener("submit", handleChatSubmit);

  async function init() {
    if (hasSupabaseConfig) {
      db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      setChatState("connecting", "Connecting to the live Blossom community…");
      await Promise.allSettled([refreshWallPreview(), loadChat()]);
    } else {
      setChatState("preview", "Preview mode: messages are saved only in this browser until Supabase is connected.");
      await loadChat();
    }
  }

  init();

  window.addEventListener("beforeunload", () => {
    if (db && realtimeChannel) db.removeChannel(realtimeChannel);
  });
})();
