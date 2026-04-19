"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ReplyForm({
  action,
  accessToken,
  refreshToken,
  to,
  subject,
  threadId,
  inReplyTo,
}: {
  action: (formData: FormData) => Promise<void>;
  accessToken: string;
  refreshToken?: string;
  to: string;
  subject: string;
  threadId: string;
  inReplyTo?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError("");
        startTransition(async () => {
          try {
            await action(formData);
            formRef.current?.reset();
            setFileName("");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reply.");
          }
        });
      }}
      className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4 lg:mt-4"
    >
      <input type="hidden" name="access_token" value={accessToken} />
      <input type="hidden" name="refresh_token" value={refreshToken || ""} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="thread_id" value={threadId} />
      <input type="hidden" name="in_reply_to" value={inReplyTo || ""} />
      <div className="text-sm font-medium text-zinc-300">Reply</div>
      <textarea
        name="body"
        placeholder="Write a reply..."
        className="mt-3 min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
      />
      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-zinc-300 hover:bg-white/8">
        <input
          type="file"
          name="attachment"
          className="hidden"
          onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
        />
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-200">Attach file</span>
        <span className="truncate text-xs text-zinc-400">{fileName || "No file selected"}</span>
      </label>
      {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}
