(() => {
  const PROFILE_KEY = "vmp_demo_profile";
  const WORKSPACE_KEY = "vmp_demo_workspace";

  const safeParse = (value, fallback = null) => {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  };

  window.VisionMoneyProDemo = {
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
    reset() {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(WORKSPACE_KEY);
    }
  };
})();