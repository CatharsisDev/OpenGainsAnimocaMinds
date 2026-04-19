"use server";

import { sendReply } from "@/lib/gmail";

export async function sendReplyAction(formData: FormData) {
  const accessToken = String(formData.get("access_token") || "");
  const refreshToken = String(formData.get("refresh_token") || "");
  const to = String(formData.get("to") || "");
  const subject = String(formData.get("subject") || "");
  const body = String(formData.get("body") || "");
  const threadId = String(formData.get("thread_id") || "");
  const inReplyTo = String(formData.get("in_reply_to") || "");

  if (!accessToken || !to || !subject || !body) {
    throw new Error("Missing reply fields.");
  }

  await sendReply({
    accessToken,
    refreshToken: refreshToken || undefined,
    to,
    subject,
    body,
    threadId: threadId || undefined,
    inReplyTo: inReplyTo || undefined,
  });
}
