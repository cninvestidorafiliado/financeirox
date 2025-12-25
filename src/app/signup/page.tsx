"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import "@/components/login/login.css";
import "../../components/auth-signup.css";

export default function SignupPage() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const jobType = (formData.get("jobType") as string) || "";

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          jobType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Erro ao criar conta.");
        return;
      }

      alert("Conta criada com sucesso! Faça login para continuar.");
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao criar conta.");
    }
  };

  return (
    <div className="fx-auth-page">
      <div className="fx-auth-shell">
        {/* LADO ESQUERDO – mensagem forte */}
        <section className="fx-auth-left">
          <div className="fx-auth-left-inner">
            <p className="hero-tag">FINANCEIROX</p>
            <h1 className="fx-auth-title">
              Crie sua conta e simplifique
              <br />o controle financeiro <span>para autônomos no Japão</span>
            </h1>

            <p className="fx-auth-subtitle">
              Organize corridas, bicos e despesas em um só lugar e deixe o
              FinanceiroX fazer o trabalho pesado por você.
            </p>

            <ul className="fx-auth-bullets">
              <li>✔ Separação automática de ganhos e despesas</li>
              <li>✔ Relatórios prontos para Imposto de Renda</li>
              <li>✔ Tudo em ienes, pensado para sua rotina no Japão</li>
            </ul>
          </div>
        </section>

        {/* LADO DIREITO – formulário de cadastro */}
        <section className="fx-auth-right">
          <div className="fx-auth-card">
            <header className="fx-auth-card-header">
              <h2>Crie sua conta</h2>
              <p>Leva menos de 2 minutos.</p>
            </header>

            <form className="fx-auth-form" onSubmit={handleSubmit}>
              <div className="fx-auth-field">
                <label htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Como está no seu documento"
                  required
                />
              </div>

              <div className="fx-auth-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>

              <div className="fx-auth-field">
                <label htmlFor="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>

              <div className="fx-auth-field">
                <label htmlFor="confirmPassword">Confirmar senha</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a mesma senha"
                  required
                />
              </div>

              <div className="fx-auth-field">
                <label htmlFor="jobType">Tipo de trabalho</label>
                <select id="jobType" name="jobType" defaultValue="">
                  <option value="" disabled>
                    Selecione uma opção
                  </option>
                  <option value="driver">Motorista de app / entregas</option>
                  <option value="freelancer">Freelancer / bicos</option>
                  <option value="self-employed">Autônomo em geral</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <button type="submit" className="fx-auth-primary">
                Criar minha conta
              </button>

              <button
                type="button"
                className="fx-auth-secondary"
                disabled
                aria-disabled="true"
              >
                Em breve: login rápido com Google / LINE
              </button>
            </form>

            <footer className="fx-auth-footer">
              <span>Já tem uma conta?</span>
              <Link href="/login">Fazer login</Link>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}
