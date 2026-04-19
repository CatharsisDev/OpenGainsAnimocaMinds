import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sendReplyAction } from "./actions";
import { AutoRefresh } from "./auto-refresh";
import { exchangeCodeForTokens, getAnimocaThreads, getAuthUrl, hasGoogleOAuthConfig } from "@/lib/gmail";

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const code = typeof params.code === "string" ? params.code : undefined;
  const accessToken = typeof params.access_token === "string" ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;
  const selectedThreadId = typeof params.thread === "string" ? params.thread : undefined;

  if (code && !accessToken) {
    const tokens = await exchangeCodeForTokens(code);
    const nextParams = new URLSearchParams();
    if (tokens.access_token) nextParams.set("access_token", tokens.access_token);
    if (tokens.refresh_token) nextParams.set("refresh_token", tokens.refresh_token);
    redirect(`/inbox?${nextParams.toString()}`);
  }

  const authReady = hasGoogleOAuthConfig();
  const authUrl = getAuthUrl();

  if (!accessToken) {
    return (
      <main className="min-h-screen text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
          <div className="chat-shell w-full rounded-[2rem] p-10 text-center">
            <div className="text-sm uppercase tracking-[0.24em] text-cyan-300">Inbox locked</div>
            <h1 className="mt-4 text-3xl font-semibold">Connect Gmail to load your AnimocaMinds conversations.</h1>
            {authReady ? (
              <a
                href={authUrl}
                className="mt-8 inline-flex rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                Continue with Google
              </a>
            ) : (
              <div className="mt-8 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-6 py-3 text-sm text-amber-100">
                Add Google OAuth env vars to enable inbox access
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const threads = await getAnimocaThreads(accessToken, refreshToken);
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) || threads[0];

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
        <AutoRefresh />
        <header className="chat-shell rounded-[2rem] px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">OpenGains AnimocaMinds Inbox</div>
              <div className="mt-2 text-zinc-300">Showing Gmail conversations that include participants ending in @animocaminds.ai</div>
            </div>
            <Link
              href={`/inbox?access_token=${encodeURIComponent(accessToken)}${refreshToken ? `&refresh_token=${encodeURIComponent(refreshToken)}` : ""}${selectedThread ? `&thread=${encodeURIComponent(selectedThread.id)}` : ""}&refresh=${Date.now()}`}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
            >
              Refresh
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-6">
          <aside className="chat-shell rounded-[2rem] p-3 sm:p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-400">Threads</div>
            <div className="space-y-3">
              {threads.length ? (
                threads.map((thread) => {
                  const isSelected = selectedThread?.id === thread.id;
                  const href = `/inbox?access_token=${encodeURIComponent(accessToken)}${refreshToken ? `&refresh_token=${encodeURIComponent(refreshToken)}` : ""}&thread=${encodeURIComponent(thread.id)}`;
                  return (
                    <Link
                      key={thread.id}
                      href={href}
                      className={`block rounded-2xl border px-4 py-3 transition ${
                        isSelected
                          ? "border-cyan-300/50 bg-cyan-300/10"
                          : "border-white/10 bg-black/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="line-clamp-2 text-sm font-semibold text-white">{thread.subject}</div>
                      <div className="mt-2 text-xs text-zinc-400">{thread.participants.join(", ")}</div>
                      <div className="mt-2 text-xs text-zinc-500">{formatDate(thread.lastDate)}</div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-400">
                  No matching conversations found yet.
                </div>
              )}
            </div>
          </aside>

          <section>
            {selectedThread ? (
              <article id={`thread-${selectedThread.id}`} className="chat-shell rounded-[2rem] p-4 sm:p-6 lg:flex lg:min-h-[70vh] lg:flex-col">
                <div className="mb-5 border-b border-white/10 pb-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">Conversation</div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{selectedThread.subject}</h2>
                  <div className="mt-2 text-sm text-zinc-400">{selectedThread.participants.join(", ")}</div>
                </div>

                <div className="space-y-4 lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto lg:pr-2 chat-scroll-area">
                  {selectedThread.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[90%] sm:max-w-[82%] rounded-3xl px-4 py-3 shadow-lg ${
                          message.mine ? "bg-cyan-300 text-slate-950" : "bg-[#1f2937] text-white"
                        }`}
                      >
                        <div className={`text-xs ${message.mine ? "text-slate-700" : "text-zinc-400"}`}>
                          {message.mine ? "You" : message.from}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {message.text || message.snippet || "(No text body extracted)"}
                        </div>
                        {message.attachments.length ? (
                          <div className={`mt-3 space-y-3 ${message.mine ? "text-slate-700" : "text-zinc-300"}`}>
                            {message.attachments.map((attachment) => {
                              const attachmentUrl = `/api/gmail/attachment?access_token=${encodeURIComponent(accessToken)}${refreshToken ? `&refresh_token=${encodeURIComponent(refreshToken)}` : ""}&messageId=${encodeURIComponent(message.id)}&attachmentId=${encodeURIComponent(attachment.attachmentId)}&filename=${encodeURIComponent(attachment.filename)}&mimeType=${encodeURIComponent(attachment.mimeType)}`;

                              return (
                                <div key={attachment.attachmentId} className="rounded-2xl border border-white/10 bg-black/10 p-2 text-xs">
                                  {attachment.inline ? (
                                    <a href={attachmentUrl} target="_blank" rel="noreferrer" className="block">
                                      <Image
                                        src={attachmentUrl}
                                        alt={attachment.filename || "Image attachment"}
                                        width={1200}
                                        height={1200}
                                        className="h-auto max-h-64 w-full rounded-2xl object-cover"
                                        unoptimized
                                      />
                                    </a>
                                  ) : null}
                                  <div className={attachment.inline ? "mt-2" : ""}>
                                    <a href={attachmentUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
                                      {attachment.filename || "Attachment"}
                                    </a>
                                    <div className="mt-1 opacity-75">{attachment.mimeType}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className={`mt-3 text-[11px] ${message.mine ? "text-slate-700" : "text-zinc-500"}`}>
                          {formatDate(message.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form action={sendReplyAction} className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4 lg:mt-4">
                  <input type="hidden" name="access_token" value={accessToken} />
                  <input type="hidden" name="refresh_token" value={refreshToken || ""} />
                  <input type="hidden" name="to" value={selectedThread.participants[0] || ""} />
                  <input type="hidden" name="subject" value={selectedThread.subject} />
                  <input type="hidden" name="thread_id" value={selectedThread.id} />
                  <input
                    type="hidden"
                    name="in_reply_to"
                    value={selectedThread.messages[selectedThread.messages.length - 1]?.messageIdHeader || ""}
                  />
                  <div className="text-sm font-medium text-zinc-300">Reply</div>
                  <textarea
                    name="body"
                    placeholder="Write a reply..."
                    className="mt-3 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Send reply
                    </button>
                  </div>
                </form>
              </article>
            ) : (
              <div className="chat-shell rounded-[2rem] p-8 text-zinc-400">No conversation selected yet.</div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
