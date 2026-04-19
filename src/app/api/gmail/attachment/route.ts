import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { setClientTokens } from "@/lib/gmail";

function decodeBase64Url(data?: string | null) {
  if (!data) return Buffer.alloc(0);
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get("access_token") || "";
  const refreshToken = searchParams.get("refresh_token") || "";
  const messageId = searchParams.get("messageId") || "";
  const attachmentId = searchParams.get("attachmentId") || "";
  const filename = searchParams.get("filename") || "attachment";
  const mimeType = searchParams.get("mimeType") || "application/octet-stream";

  if (!accessToken || !messageId || !attachmentId) {
    return NextResponse.json({ error: "Missing attachment parameters" }, { status: 400 });
  }

  const auth = setClientTokens(accessToken, refreshToken || undefined);
  const gmail = google.gmail({ version: "v1", auth });

  const result = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });

  const buffer = decodeBase64Url(result.data.data);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
