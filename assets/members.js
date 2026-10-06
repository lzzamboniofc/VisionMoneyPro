(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("member-form");
  const list = document.getElementById("member-list");
  const status = document.getElementById("member-status");

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function flash(message, kind = "success") {
    status.textContent = message;
    status.className = "notice member-notice " + kind;
    status.hidden = false;
    setTimeout(() => { status.hidden = true; }, 3400);
  }

  function render() {
    const workspace = api.getWorkspace() || {};
    const members = api.getMembers();
    const activeCount = members.filter(item => item.status === "active").length;
    const invitedCount = members.filter(item => item.status === "invited").length;

    document.getElementById("member-workspace-name").textContent = workspace.name || "Minhas finanças";
    document.getElementById("member-mode").textContent = workspace.mode === "shared" ? "Compartilhado" : "Individual";
    document.getElementById("member-active-count").textContent = String(activeCount);
    document.getElementById("member-invite-count").textContent = String(invitedCount);

    list.innerHTML = members.map(item => `
      <article class="member-row">
        <div class="member-avatar">${escapeHtml((item.name || item.email || "?").slice(0,1).toUpperCase())}</div>
        <div class="member-main">
          <div class="member-title-row">
            <strong>${escapeHtml(item.name || "Sem nome")}</strong>
            <span class="member-role ${item.role}">${item.role === "owner" ? "Proprietário" : item.role === "admin" ? "Administrador" : "Membro"}</span>
          </div>
          <small>${escapeHtml(item.email || "E-mail não informado")}</small>
        </div>
        <div class="member-state">
          <span class="status-badge ${item.status === "active" ? "paid" : "pending"}">${item.status === "active" ? "Ativo" : "Convidado"}</span>
          ${item.owner ? "" : `
            <div class="row-actions">
              ${item.status === "invited" ? `<button type="button" data-accept-member="${item.id}">Simular aceite</button>` : ""}
              <button type="button" data-remove-member="${item.id}" class="danger-action">Remover</button>
            </div>
          `}
        </div>
      </article>
    `).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.inviteMember({
        name: document.getElementById("member-name").value,
        email: document.getElementById("member-email").value,
        role: document.getElementById("member-role").value
      });
      form.reset();
      render();
      flash("Convite adicionado à demonstração.");
    } catch (error) {
      flash(error?.message === "member_exists" ? "Essa pessoa já faz parte ou já foi convidada." : "Informe um e-mail válido.", "error");
    }
  });

  list.addEventListener("click", event => {
    const accept = event.target.closest("[data-accept-member]");
    const remove = event.target.closest("[data-remove-member]");
    if (accept) {
      api.setMemberStatus(accept.dataset.acceptMember, "active");
      render();
      flash("Aceite simulado. No produto real isso acontecerá após autenticação do convidado.");
    }
    if (remove) {
      const member = api.getMembers().find(item => item.id === remove.dataset.removeMember);
      if (member && confirm('Remover "' + member.name + '" deste espaço?')) {
        api.removeMember(member.id);
        render();
        flash("Membro removido da demonstração.");
      }
    }
  });

  render();
})();