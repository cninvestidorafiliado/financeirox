"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import "@/components/login/login.css"; // importa o CSS global da tela de login

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;

      // Só tenta fazer .json() se realmente vier JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch (err) {
          console.error("Falha ao ler JSON da resposta de /api/login:", err);
        }
      }

      if (!res.ok) {
        alert(data?.message || "Erro ao entrar. Verifique seus dados.");
        return;
      }

      alert(data?.message || "Login realizado com sucesso!");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao tentar entrar.");
    }
  }

  function handleCreateAccount() {
    router.push("/signup");
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        {/* LADO ESQUERDO – Branding */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">FINANCEIROX</span>
            <h1>
              Seu controle financeiro
              <br />
              para <span className="highlight">autônomos no Japão</span>
            </h1>
            <p>
              Registre corridas, bicos e despesas do dia a dia, acompanhe o
              saldo do mês e gere relatórios prontos para declarar o{" "}
              <strong>Imposto de Renda</strong>.
            </p>

            <ul className="hero-list">
              <li>✓ Separação automática de ganhos e despesas</li>
              <li>✓ Relatório mensal pronto para IR</li>
              <li>✓ Tudo em ienes, pensado para sua rotina no Japão</li>
            </ul>
          </div>
        </section>

        {/* LADO DIREITO – Formulário */}
        <section className="panel">
          <div className="panel-card">
            <header className="panel-header">
              <h2>Login</h2>
              <p>Preencha seus dados para acessar o seu FinanceiroX.</p>
            </header>

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite o seu e-mail"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" className="btn-primary">
                Acessar
              </button>

              <button
                type="button"
                className="btn-secondary-orange"
                onClick={handleCreateAccount}
              >
                Criar minha conta
              </button>

              <p className="hint">
                Em breve: login rápido com Google / LINE para facilitar ainda
                mais seu acesso.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
