import { google } from "googleapis";

const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
];
const TARGET_DOMAIN = process.env.TARGET_EMAIL_DOMAIN || "animocaminds.ai";

function optionalEnv(name: string) {
  return process.env[name] || "";
}

function env(name: string) {
  const value = optionalEnv(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function hasGoogleOAuthConfig() {
  return Boolean(optionalEnv("GOOGLE_CLIENT_ID") && optionalEnv("GOOGLE_CLIENT_SECRET") && optionalEnv("GOOGLE_REDIRECT_URI"));
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    env("GOOGLE_CLIENT_ID"),
    env("GOOGLE_CLIENT_SECRET"),
    env("GOOGLE_REDIRECT_URI"),
  );
}

export function getAuthUrl() {
  if (!hasGoogleOAuthConfig()) return "";
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function setClientTokens(accessToken: string, refreshToken?: string) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return client;
}

function decodeBase64Url(data?: string) {
  if (!data) return "";
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractHeader(headers: { name?: string | null; value?: string | null }[] | undefined, name: string) {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractEmailAddresses(value: string) {
  const matches = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return matches.map((email) => email.toLowerCase());
}

function stripQuotedText(text: string) {
  return text
    .split(/\nOn .*wrote:\n|\nFrom: .*\nSent: .*\n/i)[0]
    .replace(/\n--\s*[\s\S]*$/i, "")
    .trim();
}

function payloadToPlainText(payload: {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: any[] | null;
} | undefined): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain") {
    return decodeBase64Url(payload.body?.data || undefined);
  }

  for (const part of payload.parts || []) {
    const value = payloadToPlainText(part);
    if (value) return value;
  }

  return decodeBase64Url(payload.body?.data || undefined);
}

export type ChatMessage = {
  id: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  text: string;
  mine: boolean;
};

export type ChatThread = {
  id: string;
  subject: string;
  participants: string[];
  lastDate: string;
  messages: ChatMessage[];
};

export async function getAnimocaThreads(accessToken: string, refreshToken?: string) {
  const auth = setClientTokens(accessToken, refreshToken);
  const gmail = google.gmail({ version: "v1", auth });

  const profile = await gmail.users.getProfile({ userId: "me" });
  const myEmail = (profile.data.emailAddress || "").toLowerCase();

  const threadList = await gmail.users.threads.list({
    userId: "me",
    q: `@${TARGET_DOMAIN}`,
    maxResults: 30,
  });

  const threads = threadList.data.threads || [];

  const detailedThreads = await Promise.all(
    threads.map(async (thread) => {
      const full = await gmail.users.threads.get({
        userId: "me",
        id: thread.id!,
        format: "full",
      });

      const messages = (full.data.messages || []).map((message) => {
        const headers = message.payload?.headers || [];
        const from = extractHeader(headers, "From");
        const to = extractHeader(headers, "To");
        const date = extractHeader(headers, "Date");
        const subject = extractHeader(headers, "Subject");
        const rawText = payloadToPlainText(message.payload);
        const text = stripQuotedText(rawText);
        const fromEmails = extractEmailAddresses(from);
        const toEmails = extractEmailAddresses(to);
        const mine = fromEmails.includes(myEmail);

        return {
          id: message.id || Math.random().toString(36),
          from,
          to,
          date,
          snippet: message.snippet || "",
          text,
          mine,
          subject,
          participants: [...new Set([...fromEmails, ...toEmails])],
        };
      });

      const participants = [...new Set(messages.flatMap((message) => message.participants))].filter((email) =>
        email.endsWith(`@${TARGET_DOMAIN}`),
      );

      if (!participants.length) {
        return null;
      }

      return {
        id: full.data.id || thread.id || Math.random().toString(36),
        subject: messages[0]?.subject || "No subject",
        participants,
        lastDate: messages[messages.length - 1]?.date || "",
        messages: messages.map(({ subject: _subject, participants: _participants, ...message }) => message),
      } satisfies ChatThread;
    }),
  );

  return detailedThreads.filter(Boolean) as ChatThread[];
}
