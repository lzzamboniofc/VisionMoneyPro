(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("goal-form");
  const list = document.getElementById("goal-list");
  const empty = document.getElementById("goal-empty");
  const goalId = document.getElementById("goal-id");

  function resetForm() {
    form.reset();
    goalId.value = "";
    document.getElementById("goal-editor-title").textContent = "Nova meta";
    document.getElementById("save-goal").textContent = "Salvar meta";
    document.getElementById("cancel-goal-edit").hidden = true;
  }

  function editGoal(id) {
    const goal = api.getGoal(id);
    if (!goal) return;
    goalId.value = goal.id;
    document.getElementById("goal-name").value = goal.name;
    document.getElementById("goal-target").value = Number(goal.targetAmount).toFixed(2);
    document.getElementById("goal-date").value = goal.targetDate || "";
    document.getElementById("goal-editor-title").textContent = "Editar meta";
    document.getElementById("save-goal").textContent = "Salvar alterações";
    document.getElementById("cancel-goal-edit").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    const goals = api.getGoals();
    empty.hidden = goals.length > 0;

    list.innerHTML = goals.map(goal => {
      const progress = api.getGoalProgress(goal.id);
      const due = goal.targetDate ? api.formatDate(goal.targetDate) : "Sem prazo";
      return `
        <article class="goal-card ${goal.completed ? "completed" : ""}">
          <div class="goal-card-head">
            <div>
              <span class="eyebrow">${goal.completed ? "CONCLUÍDA" : "EM ANDAMENTO"}</span>
              <h3>${escapeHtml(goal.name)}</h3>
              <small>Meta: ${api.formatCurrency(goal.targetAmount)} · ${due}</small>
            </div>
            <strong>${progress.percent}%</strong>
          </div>
          <div class="progress-track goal-progress"><span style="width:${progress.percent}%"></span></div>
          <div class="goal-numbers">
            <span><b>${api.formatCurrency(progress.saved)}</b> acumulado</span>
            <span><b>${api.formatCurrency(progress.remaining)}</b> restante</span>
          </div>
          <div class="goal-contribution">
            <input data-contribution-amount="${goal.id}" type="number" min="0.01" step="0.01" placeholder="Adicionar valor">
            <button class="btn secondary" data-add-contribution="${goal.id}" type="button">Adicionar aporte</button>
          </div>
          <div class="goal-actions">
            <button class="text-action" data-edit-goal="${goal.id}" type="button">Editar</button>
            <button class="text-action" data-toggle-goal="${goal.id}" type="button">${goal.completed ? "Reabrir" : "Concluir"}</button>
            <button class="text-action danger-action" data-remove-goal="${goal.id}" type="button">Excluir</button>
          </div>
        </article>
      `;
    }).join("");

    const active = goals.filter(goal => !goal.completed);
    const totalTarget = active.reduce((sum, goal) => sum + Number(goal.targetAmount || 0), 0);
    const totalSaved = active.reduce((sum, goal) => sum + api.getGoalProgress(goal.id).saved, 0);
    document.getElementById("goal-count").textContent = String(active.length);
    document.getElementById("goal-total-target").textContent = api.formatCurrency(totalTarget);
    document.getElementById("goal-total-saved").textContent = api.formatCurrency(totalSaved);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      api.upsertGoal({
        name: document.getElementById("goal-name").value,
        targetAmount: document.getElementById("goal-target").value,
        targetDate: document.getElementById("goal-date").value
      }, goalId.value || null);
      resetForm();
      render();
    } catch {
      window.alert("Informe o nome da meta e um valor maior que zero.");
    }
  });

  document.getElementById("cancel-goal-edit").addEventListener("click", resetForm);

  list.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add-contribution]");
    const edit = event.target.closest("[data-edit-goal]");
    const toggle = event.target.closest("[data-toggle-goal]");
    const remove = event.target.closest("[data-remove-goal]");

    if (add) {
      const id = add.dataset.addContribution;
      const input = list.querySelector('[data-contribution-amount="' + CSS.escape(id) + '"]');
      try {
        api.addGoalContribution(id, input.value);
        render();
      } catch {
        window.alert("Informe um aporte maior que zero.");
      }
    }
    if (edit) editGoal(edit.dataset.editGoal);
    if (toggle) {
      const goal = api.getGoal(toggle.dataset.toggleGoal);
      if (goal) api.setGoalCompleted(goal.id, !goal.completed);
      render();
    }
    if (remove) {
      const goal = api.getGoal(remove.dataset.removeGoal);
      if (goal && window.confirm('Excluir a meta "' + goal.name + '" e seus aportes?')) {
        api.removeGoal(goal.id);
        render();
      }
    }
  });

  resetForm();
  render();
})();