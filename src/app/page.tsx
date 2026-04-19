import Link from "next/link";
import { getAuthUrl, hasGoogleOAuthConfig } from "@/lib/gmail";

export default function Home() {
  const authReady = hasGoogleOAuthConfig();
  const authUrl = getAuthUrl();

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="chat-shell rounded-[2rem] p-8 sm:p-10">
            <div className="text-sm uppercase tracking-[0.24em] text-cyan-300">OpenGains AnimocaMinds</div>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              A cleaner inbox for all your AnimocaMinds agent conversations.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Connect Gmail and view every conversation involving <code>@animocaminds.ai</code> in a calm,
              chat-style interface instead of classic email threads.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {authReady ? (
                <a
                  href={authUrl}
                  className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                >
                  Continue with Google
                </a>
              ) : (
                <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-6 py-3 text-sm text-amber-100">
                  Add Google OAuth env vars to enable sign-in
                </div>
              )}
              <Link
                href="/inbox"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
              >
                Open inbox
              </Link>
            </div>
          </section>

          <section className="chat-shell rounded-[2rem] p-8 sm:p-10">
            <div className="text-sm uppercase tracking-[0.24em] text-zinc-400">Why this exists</div>
            <ul className="mt-5 space-y-4 text-zinc-300">
              <li>• Read all AnimocaMinds email threads like chats, not corporate email blocks.</li>
              <li>• Filter instantly to agent-related conversations only.</li>
              <li>• Make agent communication feel closer to Telegram or WhatsApp.</li>
              <li>• Build toward one unified inbox across email and messaging channels.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
