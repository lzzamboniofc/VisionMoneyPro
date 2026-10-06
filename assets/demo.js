(() => {
  const PROFILE_KEY = "vmp_demo_profile";
  const WORKSPACE_KEY = "vmp_demo_workspace";
  const EXPENSES_KEY = "vmp_demo_expenses";
  const INCOMES_KEY = "vmp_demo_incomes";

  const safeParse = (value, fallback = null) => {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  };

  const normalizeMoney = (value) => {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
  };

  const newId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "vmp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  };

  const currentDate = () => new Date().toISOString().slice(0, 10);

  const expenseCategories = [
    "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
    "Lazer", "Assinaturas", "Compras", "Impostos", "Outros gastos"
  ];

  const incomeCategories = [
    "Salário", "Freelance", "Rendimentos", "Outras rendas"
  ];

  function getCollection(kind) {
    const key = kind === "income" ? INCOMES_KEY : EXPENSES_KEY;
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function saveCollection(kind, items) {
    const key = kind === "income" ? INCOMES_KEY : EXPENSES_KEY;
    localStorage.setItem(key, JSON.stringify(Array.isArray(items) ? items : []));
  }

  function normalizeTransaction(kind, input, existingId) {
    const categoryList = kind === "income" ? incomeCategories : expenseCategories;
    const date = String(input?.date || currentDate()).slice(0, 10);
    const category = categoryList.includes(String(input?.category || ""))
      ? String(input.category)
      : categoryList[0];

    return {
      id: existingId || newId(),
      description: String(input?.description || "").trim().slice(0, 180),
      amount: normalizeMoney(input?.amount),
      date,
      category,
      notes: String(input?.notes || "").trim().slice(0, 500),
      createdAt: input?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function monthKey(dateLike = new Date()) {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike + "T12:00:00");
    if (Number.isNaN(date.getTime())) return currentDate().slice(0, 7);
    return date.toISOString().slice(0, 7);
  }

  window.VisionMoneyProDemo = {
    expenseCategories,
    incomeCategories,

    getProfile() {
      return safeParse(localStorage.getItem(PROFILE_KEY), { name: "", email: "" });
    },

    saveProfile(profile) {
      const value = {
        name: String(profile?.name || "").trim().slice(0, 100),
        email: String(profile?.email || "").trim().slice(0, 160)
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
      return value;
    },

    getWorkspace() {
      return safeParse(localStorage.getItem(WORKSPACE_KEY), null);
    },

    saveWorkspace(workspace) {
      const value = {
        mode: workspace?.mode === "shared" ? "shared" : "individual",
        name: String(workspace?.name || "Minhas finanças").trim().slice(0, 100),
        partnerName: String(workspace?.partnerName || "").trim().slice(0, 100),
        partnerEmail: String(workspace?.partnerEmail || "").trim().slice(0, 160)
      };
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(value));
      return value;
    },

    getTransactions(kind) {
      return getCollection(kind)
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
    },

    getTransaction(kind, id) {
      return getCollection(kind).find(item => item.id === id) || null;
    },

    upsertTransaction(kind, input, id = null) {
      const items = getCollection(kind);
      const index = id ? items.findIndex(item => item.id === id) : -1;
      const current = index >= 0 ? items[index] : null;
      const normalized = normalizeTransaction(kind, {
        ...input,
        createdAt: current?.createdAt
      }, current?.id || null);

      if (!normalized.description) throw new Error("description_required");
      if (!(normalized.amount > 0)) throw new Error("amount_required");

      if (index >= 0) items[index] = normalized;
      else items.push(normalized);

      saveCollection(kind, items);
      return normalized;
    },

    removeTransaction(kind, id) {
      const before = getCollection(kind);
      const after = before.filter(item => item.id !== id);
      saveCollection(kind, after);
      return after.length !== before.length;
    },

    getMonthSummary(month = currentDate().slice(0, 7)) {
      const expenses = getCollection("expense").filter(item => String(item.date).slice(0, 7) === month);
      const incomes = getCollection("income").filter(item => String(item.date).slice(0, 7) === month);
      const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const incomeTotal = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month,
        expenseTotal: Math.round(expenseTotal * 100) / 100,
        incomeTotal: Math.round(incomeTotal * 100) / 100,
        balance: Math.round((incomeTotal - expenseTotal) * 100) / 100,
        expenseCount: expenses.length,
        incomeCount: incomes.length
      };
    },

    getRecentTransactions(limit = 6) {
      const expenses = getCollection("expense").map(item => ({ ...item, kind: "expense" }));
      const incomes = getCollection("income").map(item => ({ ...item, kind: "income" }));
      return [...expenses, ...incomes]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, Math.max(1, Number(limit) || 6));
    },

    seedExampleData() {
      if (getCollection("expense").length || getCollection("income").length) return false;
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const day = (n) => `${y}-${m}-${String(Math.min(n, 28)).padStart(2, "0")}`;

      saveCollection("income", [
        normalizeTransaction("income", { description: "Salário", amount: 6500, date: day(5), category: "Salário" }),
        normalizeTransaction("income", { description: "Projeto freelance", amount: 1200, date: day(14), category: "Freelance" })
      ]);

      saveCollection("expense", [
        normalizeTransaction("expense", { description: "Aluguel", amount: 1850, date: day(7), category: "Moradia" }),
        normalizeTransaction("expense", { description: "Supermercado", amount: 620.35, date: day(10), category: "Alimentação" }),
        normalizeTransaction("expense", { description: "Combustível", amount: 280, date: day(12), category: "Transporte" }),
        normalizeTransaction("expense", { description: "Streaming", amount: 55.9, date: day(16), category: "Assinaturas" })
      ]);
      return true;
    },

    formatCurrency(value) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
    },

    formatDate(value) {
      if (!value) return "";
      const [year, month, day] = String(value).split("-").map(Number);
      const date = new Date(year, (month || 1) - 1, day || 1);
      return new Intl.DateTimeFormat("pt-BR").format(date);
    },

    monthKey,

    reset() {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(WORKSPACE_KEY);
      localStorage.removeItem(EXPENSES_KEY);
      localStorage.removeItem(INCOMES_KEY);
    }
  };
})();