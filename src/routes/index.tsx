import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, FileText, MessageSquare, Send, Loader2, Sparkles } from "lucide-react";
import {
  chatCompletion,
  generateEmail,
  summarizeMeeting,
} from "@/lib/api/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkMate AI Assistant" },
      {
        name: "description",
        content:
          "WorkMate AI: generate professional emails, summarize meeting notes, and chat with an AI assistant built for office workers.",
      },
      { property: "og:title", content: "WorkMate AI Assistant" },
      {
        property: "og:description",
        content: "AI tools for office workers: email writing, meeting summaries, and an assistant chat.",
      },
    ],
  }),
  component: WorkMate,
});

type Tab = "email" | "meeting" | "chat";

function WorkMate() {
  const [tab, setTab] = useState<Tab>("email");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "email", label: "Email", icon: Mail },
    { id: "meeting", label: "Meeting", icon: FileText },
    { id: "chat", label: "Chatbot", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
              WorkMate AI Assistant
            </h1>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              Your daily office sidekick
            </p>
          </div>
        </div>
        <nav className="mx-auto max-w-4xl px-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 min-w-[100px] items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {tab === "email" && <EmailTab />}
        {tab === "meeting" && <MeetingTab />}
        {tab === "chat" && <ChatTab />}
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>;
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function PrimaryBtn({
  children,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function ErrorText({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {msg}
    </div>
  );
}

/* ---------------- Email ---------------- */

function EmailTab() {
  const fn = useServerFn(generateEmail);
  const [tone, setTone] = useState("Formal");
  const [recipient, setRecipient] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);

  const submit = async () => {
    if (!recipient.trim() || !topic.trim()) {
      setError("Please fill in recipient and topic.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fn({ data: { tone, recipient, topic } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Email Generator</h2>
        <div className="grid gap-4">
          <div>
            <Label>Tone</Label>
            <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)}>
              <option>Formal</option>
              <option>Friendly</option>
              <option>Professional</option>
              <option>Apologetic</option>
              <option>Persuasive</option>
              <option>Concise</option>
            </select>
          </div>
          <div>
            <Label>Who is this email to?</Label>
            <input
              className={inputCls}
              placeholder="e.g. My manager, Sarah from marketing"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div>
            <Label>What is it about?</Label>
            <textarea
              className={`${inputCls} min-h-[110px] resize-y`}
              placeholder="Describe the purpose, key points, and any details to include."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <ErrorText msg={error} />
          <div>
            <PrimaryBtn onClick={submit} loading={loading}>
              Generate Email
            </PrimaryBtn>
          </div>
        </div>
      </Card>

      {result && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Generated Email
          </h3>
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-xs font-medium text-slate-500">Subject</div>
            <div className="text-sm font-semibold text-slate-900">{result.subject || "—"}</div>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800">
            {result.body}
          </pre>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Meeting ---------------- */

function MeetingTab() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    keyDecisions: string[];
    actionItems: { task: string; owner: string; deadline: string }[];
    deadlines: string[];
  } | null>(null);

  const submit = async () => {
    if (notes.trim().length < 5) {
      setError("Please paste your meeting notes.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fn({ data: { notes } });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to summarize.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Meeting Summarizer</h2>
        <Label>Paste your meeting notes here</Label>
        <textarea
          className={`${inputCls} min-h-[240px] resize-y`}
          placeholder="Paste raw meeting notes, transcripts, or bullet points..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="mt-4 space-y-3">
          <ErrorText msg={error} />
          <PrimaryBtn onClick={submit} loading={loading}>
            Summarize
          </PrimaryBtn>
        </div>
      </Card>

      {result && (
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Summary</h3>

          <Section title="Key Decisions">
            {result.keyDecisions.length ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-800">
                {result.keyDecisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Action Items">
            {result.actionItems.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Task</th>
                      <th className="py-2 pr-3 font-medium">Owner</th>
                      <th className="py-2 font-medium">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.actionItems.map((a, i) => (
                      <tr key={i} className="align-top">
                        <td className="py-2 pr-3 text-slate-800">{a.task}</td>
                        <td className="py-2 pr-3 text-slate-700">{a.owner}</td>
                        <td className="py-2 text-slate-700">{a.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Main Deadlines" last>
            {result.deadlines.length ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-800">
                {result.deadlines.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Section>
        </Card>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-5 border-b border-slate-100 pb-5"}>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm italic text-slate-400">None found.</p>;
}

/* ---------------- Chat ---------------- */

type ChatMsg = { role: "user" | "assistant"; content: string };

function ChatTab() {
  const fn = useServerFn(chatCompletion);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi! I'm WorkMate. Ask me anything — drafting, brainstorming, or quick questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await fn({
        data: {
          messages: [
            { role: "system", content: "You are WorkMate, a helpful, concise AI assistant for office workers." },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.content || "(no response)" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-white text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-slate-500 shadow-sm">
              <span className="inline-flex gap-1">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className={inputCls}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
