import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <div className="brand"><span>V</span><strong>VisionMoneyPro</strong></div>
        <Link href="/login" className="button ghost">Entrar</Link>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">FINANÇAS COM VISÃO</p>
          <h1>Veja seu dinheiro com <em>clareza.</em></h1>
          <p>Organize gastos, receitas, cartões, metas e planejamento em um único lugar — sozinho ou compartilhando sua vida financeira.</p>
          <div className="hero-actions"><Link href="/login" className="button primary">Criar minha conta</Link><a href="#produto" className="button ghost">Conhecer o produto</a></div>
          <small>VisionMoneyPro · MVP em construção</small>
        </div>
        <div className="hero-product" aria-hidden="true">
          <div className="mock-top"><span></span><span></span><span></span></div>
          <div className="mock-metrics"><div><small>Saldo</small><strong>R$ 8.420</strong></div><div><small>Economia</small><strong>24%</strong></div></div>
          <div className="mock-chart"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <div className="mock-row"><b></b><span></span><strong></strong></div>
          <div className="mock-row"><b></b><span></span><strong></strong></div>
          <div className="mock-row"><b></b><span></span><strong></strong></div>
        </div>
      </section>

      <section id="produto" className="product-strip">
        <article><strong>Individual ou compartilhado</strong><p>Uma conta financeira que se adapta ao seu jeito de organizar a vida.</p></article>
        <article><strong>Visão completa</strong><p>Gastos, entradas, cartões, metas e planejamento conectados.</p></article>
        <article><strong>Privacidade por arquitetura</strong><p>Cada workspace mantém seus dados separados dos demais clientes.</p></article>
      </section>
    </main>
  );
}
