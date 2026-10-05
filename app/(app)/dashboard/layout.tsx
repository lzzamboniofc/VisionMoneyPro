import Link from "next/link";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand"><span>V</span><strong>VisionMoneyPro</strong></Link>
        <nav>
          <Link className="nav-link active" href="/dashboard">Visão geral</Link>
          <span className="nav-link disabled">Gastos</span>
          <span className="nav-link disabled">Planejamento</span>
          <span className="nav-link disabled">Metas</span>
          <span className="nav-link disabled">Configurações</span>
        </nav>
        <small>MVP · estrutura independente do A_Dois</small>
      </aside>
      <div className="dashboard-main">{children}</div>
    </div>
  );
}
