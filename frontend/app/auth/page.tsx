import LoginForm, { type OAuthParameters } from "./login-form";

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const oauthKeys = [
  "client_id",
  "redirect_uri",
  "state",
  "code_challenge",
  "code_challenge_method",
] as const;

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const oauth: OAuthParameters = {};

  for (const key of oauthKeys) {
    const value = params[key];
    if (typeof value === "string" && value) oauth[key] = value;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
          Gray Merchant
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Access your account and continue to the marketplace.
        </p>
        <LoginForm oauth={oauth} />
      </section>
    </main>
  );
}
