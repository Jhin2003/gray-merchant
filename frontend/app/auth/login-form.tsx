"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type OAuthParameters = Partial<
  Record<
    | "client_id"
    | "redirect_uri"
    | "state"
    | "code_challenge"
    | "code_challenge_method",
    string
  >
>;

type LoginFormProps = {
  oauth: OAuthParameters;
};

type ErrorPayload = {
  message?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function LoginForm({ oauth }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          ...oauth,
        }),
      });

      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
      if (!response.ok) {
        setError(payload.message ?? "Sign-in failed. Please try again.");
        return;
      }

      router.replace("/shop");
      router.refresh();
    } catch {
      setError("The authentication service is unavailable.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-zinc-200">
        Email
        <input
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="block text-sm font-medium text-zinc-200">
        Password
        <input
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
