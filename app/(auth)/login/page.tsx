"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "O backend ainda não foi conectado. Adicione as variáveis do Supabase no GitHub para ativar o acesso." });
      setBusy(false);
      return;
    }

    const data = new FormData(event.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });

    if (error) {
      setMessage({ type: "error", text: "Não foi possível entrar. Confira e-mail e senha." });
      setBusy(false);
      return;
    }

    router.push("/dashboard");
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "O backend ainda não foi conectado. Assim que o Supabase do VisionMoneyPro estiver disponível, o cadastro será ativado." });
      setBusy(false);
      return;
    }

    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("full_name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const redirectTo = window.location.href.split("?")[0];

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage({ type: "error", text: "Não foi possível criar a conta. Revise os dados e tente novamente." });
      setBusy(false);
      return;
    }

    setMessage({ type: "success", text: "Cadastro criado. Confira seu e-mail para confirmar o acesso." });
    event.currentTarget.reset();
    setBusy(false);
  }

  return (
    <main className="auth-page">
      <Link href="/" className="brand brand-auth"><span>V</span><strong>VisionMoneyPro</strong></Link>
      <section className="auth-card">
        <p className="eyebrow">SUA VIDA FINANCEIRA</p>
        <h1>Entre ou crie sua conta.</h1>
        <p className="muted">Organize suas finanças sozinho ou compartilhe um espaço financeiro com quem você quiser.</p>
        {message ? <div className={`notice ${message.type}`}>{message.text}</div> : null}

        <div className="auth-columns">
          <form onSubmit={signIn} className="form-card">
            <h2>Entrar</h2>
            <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
            <button className="button primary" type="submit" disabled={busy}>{busy ? "Aguarde..." : "Entrar"}</button>
          </form>

          <form onSubmit={signUp} className="form-card">
            <h2>Criar conta</h2>
            <label>Nome<input name="full_name" minLength={2} maxLength={80} required /></label>
            <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
            <label>Senha<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
            <button className="button secondary" type="submit" disabled={busy}>{busy ? "Aguarde..." : "Começar agora"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
