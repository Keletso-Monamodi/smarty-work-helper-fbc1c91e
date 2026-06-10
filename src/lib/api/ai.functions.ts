import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
});

async function callGateway(messages: Array<{ role: string; content: string }>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in your workspace.");
    throw new Error(`AI request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

export const chatCompletion = createServerFn({ method: "POST" })
  .inputValidator(ChatInput)
  .handler(async ({ data }) => {
    const content = await callGateway(data.messages);
    return { content };
  });

const EmailInput = z.object({
  tone: z.string().min(1).max(40),
  recipient: z.string().min(1).max(200),
  topic: z.string().min(1).max(2000),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator(EmailInput)
  .handler(async ({ data }) => {
    const system =
      "You are an expert office email writer. Produce a clear, well-structured email. Respond ONLY with valid minified JSON of shape {\"subject\": string, \"body\": string}. No markdown fences.";
    const user = `Tone: ${data.tone}\nRecipient: ${data.recipient}\nTopic / context: ${data.topic}\n\nWrite the email now.`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    let subject = "";
    let body = raw;
    try {
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      subject = String(parsed.subject ?? "");
      body = String(parsed.body ?? "");
    } catch {
      const m = raw.match(/subject\s*[:\-]\s*(.+)/i);
      if (m) subject = m[1].trim();
    }
    return { subject, body };
  });

const SummarizeInput = z.object({
  notes: z.string().min(5).max(20000),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator(SummarizeInput)
  .handler(async ({ data }) => {
    const system =
      'You are a meeting analyst. From the notes, produce strict minified JSON: {"keyDecisions": string[], "actionItems": {"task": string, "owner": string, "deadline": string}[], "deadlines": string[]}. Use "Unassigned" or "None" when missing. No markdown fences.';
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.notes },
    ]);

    try {
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions.map(String) : [],
        actionItems: Array.isArray(parsed.actionItems)
          ? parsed.actionItems.map((a: { task?: unknown; owner?: unknown; deadline?: unknown }) => ({
              task: String(a.task ?? ""),
              owner: String(a.owner ?? "Unassigned"),
              deadline: String(a.deadline ?? "None"),
            }))
          : [],
        deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines.map(String) : [],
      };
    } catch {
      return { keyDecisions: [], actionItems: [], deadlines: [], raw } as {
        keyDecisions: string[];
        actionItems: { task: string; owner: string; deadline: string }[];
        deadlines: string[];
        raw?: string;
      };
    }
  });
