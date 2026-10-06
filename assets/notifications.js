(() => {
  const api = VisionMoneyProDemo;
  const list = document.getElementById("notification-list");
  const empty = document.getElementById("notification-empty");
  const statusFilter = document.getElementById("notification-status-filter");
  const typeFilter = document.getElementById("notification-type-filter");
  const searchInput = document.getElementById("notification-search");

  const labels = {
    budget:"Orçamento",
    payables:"Contas a pagar",
    cards:"Cartões",
    accounts:"Contas",
    goals:"Metas",
    recurrences:"Recorrências",
    saving:"Economia"
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function filteredItems() {
    const term = String(searchInput.value || "").trim().toLocaleLowerCase("pt-BR");
    const status = statusFilter.value;
    const type = typeFilter.value;

    return api.getNotifications(true).filter(item => {
      const matchesTerm = !term ||
        String(item.title).toLocaleLowerCase("pt-BR").includes(term) ||
        String(item.text).toLocaleLowerCase("pt-BR").includes(term);
      const matchesStatus = !status ||
        (status === "unread" && !item.read) ||
        (status === "read" && item.read);
      const matchesType = !type || item.category === type;
      return matchesTerm && matchesStatus && matchesType;
    });
  }

  function renderMetrics(all) {
    const unread = all.filter(item => !item.read);
    const urgent = unread.filter(item => item.tone === "danger");
    const warning = unread.filter(item => item.tone === "warning");
    document.getElementById("notification-unread-count").textContent = String(unread.length);
    document.getElementById("notification-urgent-count").textContent = String(urgent.length);
    document.getElementById("notification-warning-count").textContent = String(warning.length);
  }

  function renderPreferences() {
    const prefs = api.getNotificationPreferences();
    document.querySelectorAll("[data-notification-pref]").forEach(input => {
      input.checked = prefs[input.dataset.notificationPref] !== false;
    });
  }

  function render() {
    const all = api.getNotifications(true);
    const items = filteredItems();
    renderMetrics(all);

    empty.hidden = items.length > 0;
    list.innerHTML = items.map(item => `
      <article class="notification-item ${item.tone} ${item.read ? "read" : "unread"}">
        <span class="notification-icon">${escapeHtml(item.icon)}</span>
        <div class="notification-main">
          <div class="notification-title-row">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="notification-type">${escapeHtml(labels[item.category] || item.category)}</span>
            ${item.read ? "" : '<span class="notification-unread-dot" title="Não lida"></span>'}
          </div>
          <p>${escapeHtml(item.text)}</p>
          <div class="notification-meta">
            <span>${escapeHtml(item.timeLabel || "")}</span>
            <a href="${item.href}" data-open-notification="${item.id}">Abrir</a>
            ${item.read
              ? ""
              : `<button type="button" data-read-notification="${item.id}">Marcar como lida</button>`}
          </div>
        </div>
      </article>
    `).join("");
  }

  document.getElementById("mark-all-read").addEventListener("click", () => {
    api.markAllNotificationsRead();
    render();
  });

  document.getElementById("mark-all-unread").addEventListener("click", () => {
    api.markAllNotificationsUnread();
    render();
  });

  list.addEventListener("click", event => {
    const read = event.target.closest("[data-read-notification]");
    const open = event.target.closest("[data-open-notification]");

    if (read) {
      api.markNotificationRead(read.dataset.readNotification);
      render();
      return;
    }

    if (open) {
      api.markNotificationRead(open.dataset.openNotification);
    }
  });

  [statusFilter,typeFilter,searchInput].forEach(input => input.addEventListener("input", render));

  document.querySelectorAll("[data-notification-pref]").forEach(input => {
    input.addEventListener("change", () => {
      const prefs = {};
      document.querySelectorAll("[data-notification-pref]").forEach(item => {
        prefs[item.dataset.notificationPref] = item.checked;
      });
      api.saveNotificationPreferences(prefs);
      render();
    });
  });

  renderPreferences();
  render();
})();