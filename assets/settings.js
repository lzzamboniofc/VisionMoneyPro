(() => {
  const api = VisionMoneyProDemo;
  const profileForm = document.getElementById("profile-settings-form");
  const workspaceForm = document.getElementById("workspace-settings-form");
  const modeInputs = [...document.querySelectorAll('input[name="workspace_mode"]')];
  const sharedFields = document.getElementById("settings-shared-fields");
  const importInput = document.getElementById("import-data-file");
  const status = document.getElementById("settings-status");

  function showStatus(message, type = "success") {
    status.textContent = message;
    status.className = "notice settings-notice " + type;
    status.hidden = false;
    window.setTimeout(() => { status.hidden = true; }, 3600);
  }

  function syncSharedFields() {
    const mode = modeInputs.find(input => input.checked)?.value || "individual";
    sharedFields.hidden = mode !== "shared";
  }

  function hydrate() {
    const profile = api.getProfile() || {};
    const workspace = api.getWorkspace() || {};

    document.getElementById("settings-name").value = profile.name || "";
    document.getElementById("settings-email").value = profile.email || "";
    document.getElementById("settings-workspace-name").value = workspace.name || "Minhas finanças";
    document.getElementById("settings-partner-name").value = workspace.partnerName || "";
    document.getElementById("settings-partner-email").value = workspace.partnerEmail || "";

    const mode = workspace.mode === "shared" ? "shared" : "individual";
    const radio = modeInputs.find(input => input.value === mode);
    if (radio) radio.checked = true;
    syncSharedFields();
  }

  function exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("vmp_demo_")) {
        data[key] = localStorage.getItem(key);
      }
    }

    const payload = {
      app: "VisionMoneyPro",
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visionmoneypro-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showStatus("Backup local exportado.");
  }

  async function importData(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload?.app !== "VisionMoneyPro" || !payload?.data || typeof payload.data !== "object") {
        throw new Error("invalid_backup");
      }

      const entries = Object.entries(payload.data)
        .filter(([key, value]) => key.startsWith("vmp_demo_") && typeof value === "string");

      if (!entries.length) throw new Error("empty_backup");

      entries.forEach(([key, value]) => localStorage.setItem(key, value));
      hydrate();
      showStatus("Backup importado. As telas já podem usar os dados restaurados.");
    } catch {
      showStatus("Não foi possível importar este arquivo de backup.", "error");
    } finally {
      importInput.value = "";
    }
  }

  profileForm.addEventListener("submit", event => {
    event.preventDefault();
    api.saveProfile({
      name: document.getElementById("settings-name").value,
      email: document.getElementById("settings-email").value
    });
    showStatus("Perfil atualizado localmente.");
  });

  workspaceForm.addEventListener("submit", event => {
    event.preventDefault();
    const mode = modeInputs.find(input => input.checked)?.value || "individual";
    api.saveWorkspace({
      mode,
      name: document.getElementById("settings-workspace-name").value,
      partnerName: document.getElementById("settings-partner-name").value,
      partnerEmail: document.getElementById("settings-partner-email").value
    });
    showStatus("Espaço financeiro atualizado localmente.");
  });

  modeInputs.forEach(input => input.addEventListener("change", syncSharedFields));
  document.getElementById("export-data").addEventListener("click", exportData);
  document.getElementById("import-data").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", () => importData(importInput.files?.[0]));

  document.getElementById("clear-finance-data").addEventListener("click", () => {
    const keys = [
      "vmp_demo_expenses","vmp_demo_incomes","vmp_demo_budgets",
      "vmp_demo_goals","vmp_demo_goal_contributions","vmp_demo_cards","vmp_demo_payables",
      "vmp_demo_custom_categories","vmp_demo_recurrences","vmp_demo_planning_income",
      "vmp_demo_accounts","vmp_demo_transfers","vmp_demo_card_bill_payments",
      "vmp_demo_import_history","vmp_demo_notification_read"
    ];
    if (!window.confirm("Apagar todos os lançamentos, cartões, contas, orçamentos e metas desta demonstração?")) return;
    keys.forEach(key => localStorage.removeItem(key));
    showStatus("Dados financeiros locais apagados.");
  });

  document.getElementById("clear-all-data").addEventListener("click", () => {
    if (!window.confirm("Apagar todos os dados locais do VisionMoneyPro neste navegador?")) return;
    api.reset();
    window.location.href = "../login/";
  });

  hydrate();
})();