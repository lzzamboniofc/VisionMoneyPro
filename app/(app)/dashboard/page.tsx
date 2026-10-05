"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setChecking(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setName(String(data.user.user_metadata?.full_name ?? ""));
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return <main><div className="panel"><p className="muted">Carregando seu espaço financeiro...</p></div></main>;
  }

  return (
    <main>
      <header className="dashboard-header">
        <div><p className="eyebrow">DASHBOARD</p><h1>Olá{name ? `, ${name}` : ""}.</h1></div>
        <span className="status-pill">Base MVP</span>
      </header>

      <section className="metric-grid">
        <article className="metric-card accent"><span>Saldo do mês</span><strong>R$ 0,00</strong><small>Comece registrando suas movimentações</small></article>
        <article className="metric-card"><span>Receitas</span><strong>R$ 0,00</strong><small>Nenhuma receita cadastrada</small></article>
        <article className="metric-card"><span>Despesas</span><strong>R$ 0,00</strong><small>Nenhuma despesa cadastrada</small></article>
        <article className="metric-card"><span>Metas</span><strong>0</strong><small>Crie seu primeiro objetivo</small></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel"><p className="eyebrow">PRÓXIMO PASSO</p><h2>Seu espaço financeiro</h2><p className="muted">O banco será estruturado em workspaces. Cada pessoa poderá usar o VisionMoneyPro individualmente ou convidar membros para compartilhar o mesmo espaço financeiro.</p><div className="placeholder-chart"><span>Receitas</span><span>Gastos</span><span>Planejamento</span></div></article>
        <article className="panel"><p className="eyebrow">ARQUITETURA</p><h2>Separação por conta</h2><ul className="feature-list"><li>Dados isolados por workspace</li><li>RLS no banco</li><li>Perfis e membros</li><li>Painel administrativo separado</li><li>Preparado para planos</li></ul></article>
      </section>
    </main>
  );
}
