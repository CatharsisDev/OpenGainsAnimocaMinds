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
  const attachment = formData.get("attachment");

  if (!accessToken || !to || !subject || !body) {
    throw new Error("Missing reply fields.");
  }

  const attachments =
    attachment instanceof File && attachment.size > 0
      ? [
          {
            filename: attachment.name || "attachment",
            mimeType: attachment.type || "application/octet-stream",
            content: Buffer.from(await attachment.arrayBuffer()),
          },
        ]
      : [];

  await sendReply({
    accessToken,
    refreshToken: refreshToken || undefined,
    to,
    subject,
    body,
    threadId: threadId || undefined,
    inReplyTo: inReplyTo || undefined,
    attachments,
  });
}
