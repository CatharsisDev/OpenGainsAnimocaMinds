import { exchangeCodeForTokens, getAnimocaThreads, getAuthUrl } from "@/lib/gmail";

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const code = typeof params.code === "string" ? params.code : undefined;
  const accessToken = typeof params.access_token === "string" ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;

  let authUrl = "";
  let threads: Awaited<ReturnType<typeof getAnimocaThreads>> = [];
  let tokenOutput = "";
  let error = "";

  try {
    authUrl = getAuthUrl();

    if (code) {
      const tokens = await exchangeCodeForTokens(code);
      tokenOutput = JSON.stringify(tokens, null, 2);

      if (tokens.access_token) {
        threads = await getAnimocaThreads(tokens.access_token, tokens.refresh_token || undefined);
      }
    } else if (accessToken) {
      threads = await getAnimocaThreads(accessToken, refreshToken);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  return (
    <main className="min-h-screen bg-[#111827] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">Gmail chat viewer</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Animoca Minds conversations, but chat-style.</h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            This prototype only shows email threads that include participants ending in <code>@animocaminds.ai</code>,
            and renders them like a messaging app instead of classic email blocks.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={authUrl}
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Connect Gmail
            </a>
          </div>
        </header>

        {error ? (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
            <div className="font-semibold">Something broke</div>
            <div className="mt-2 whitespace-pre-wrap text-sm text-red-100/80">{error}</div>
          </section>
        ) : null}

        {tokenOutput ? (
          <section className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-50">
            <div className="font-semibold">OAuth tokens received</div>
            <p className="mt-2 text-amber-50/80">
              Copy these into a safer session flow later. For now this helps us bootstrap read-only access fast.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs">{tokenOutput}</pre>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-400">Filtered threads</div>
            <div className="space-y-3">
              {threads.length ? (
                threads.map((thread, index) => (
                  <a
                    key={thread.id}
                    href={`#thread-${thread.id}`}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      index === 0
                        ? "border-cyan-300/50 bg-cyan-300/10"
                        : "border-white/10 bg-black/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="line-clamp-2 text-sm font-semibold text-white">{thread.subject}</div>
                    <div className="mt-2 text-xs text-zinc-400">{thread.participants.join(", ")}</div>
                    <div className="mt-2 text-xs text-zinc-500">{formatDate(thread.lastDate)}</div>
                  </a>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">
                  Connect Gmail to load matching conversations.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            {threads.length ? (
              threads.map((thread) => (
                <article
                  key={thread.id}
                  id={`thread-${thread.id}`}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="mb-5 border-b border-white/10 pb-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Conversation</div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{thread.subject}</h2>
                    <div className="mt-2 text-sm text-zinc-400">{thread.participants.join(", ")}</div>
                  </div>

                  <div className="space-y-4">
                    {thread.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-lg ${
                            message.mine
                              ? "bg-cyan-300 text-slate-950"
                              : "bg-[#1f2937] text-white"
                          }`}
                        >
                          <div className={`text-xs ${message.mine ? "text-slate-700" : "text-zinc-400"}`}>
                            {message.mine ? "You" : message.from}
                          </div>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                            {message.text || message.snippet || "(No text body extracted)"}
                          </div>
                          <div className={`mt-3 text-[11px] ${message.mine ? "text-slate-700" : "text-zinc-500"}`}>
                            {formatDate(message.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-zinc-400">
                Your matching email threads will appear here in a chat-style layout.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
