"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Markdown from "./Markdown";
import { DEFAULT_PERSONA, PERSONAS } from "./personas";
import styles from "./dark.module.css";

type Msg = {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
};

type Conv = {
  id: string;
  title: string;
  persona: string;
  messages: Msg[];
  updatedAt: number;
};

const STORE_KEY = "darkgpt.conversations.v1";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c${Date.now()}${Math.random().toString(16).slice(2)}`;

const titleFrom = (text: string) => {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 42 ? `${t.slice(0, 42)}…` : t || "Nouvelle conversation";
};

const EXAMPLES = [
  "Explique-moi la différence entre CPM, CPC et CPA.",
  "Écris trois accroches pour une pub Meta sur une crème solaire.",
  "Relis ce plan et dis-moi ce qui cloche : …",
  "Comment structurer un projet Next.js à plusieurs équipes ?",
];

export default function DarkGPT() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [openThinking, setOpenThinking] = useState<Record<number, boolean>>({});

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const active = useMemo(
    () => convs.find((c) => c.id === activeId) ?? null,
    [convs, activeId],
  );

  /* --- Persistance ------------------------------------------------------ */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Conv[];
        if (Array.isArray(parsed) && parsed.length) {
          setConvs(parsed);
          setActiveId(parsed[0].id);
        }
      }
    } catch {
      /* stockage indisponible ou corrompu : on repart d'une liste vide */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(convs.slice(0, 50)));
    } catch {
      /* quota dépassé ou mode privé : la session reste utilisable en mémoire */
    }
  }, [convs, loaded]);

  /* --- Défilement + zone de saisie -------------------------------------- */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [active?.messages, busy]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [input]);

  /* --- Actions sur les conversations ------------------------------------ */

  const createConv = useCallback((persona = DEFAULT_PERSONA): Conv => {
    const conv: Conv = {
      id: newId(),
      title: "Nouvelle conversation",
      persona,
      messages: [],
      updatedAt: Date.now(),
    };
    setConvs((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv;
  }, []);

  const patch = useCallback((id: string, fn: (c: Conv) => Conv) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const removeConv = (id: string) => {
    setConvs((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const setPersona = (persona: string) => {
    if (!active) {
      createConv(persona);
      return;
    }
    patch(active.id, (c) => ({ ...c, persona }));
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  /* --- Envoi ------------------------------------------------------------ */

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;

    setError(null);
    setInput("");

    const conv = active ?? createConv();
    const history = [...conv.messages, { role: "user" as const, content }];

    patch(conv.id, (c) => ({
      ...c,
      title: c.messages.length === 0 ? titleFrom(content) : c.title,
      messages: [...c.messages, { role: "user", content }, { role: "assistant", content: "" }],
      updatedAt: Date.now(),
    }));

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);

    // Met à jour le dernier message (celui de l'assistant, ajouté juste au-dessus).
    const appendToLast = (delta: Partial<Msg>) => {
      patch(conv.id, (c) => {
        const messages = [...c.messages];
        const i = messages.length - 1;
        if (i < 0 || messages[i].role !== "assistant") return c;
        messages[i] = {
          ...messages[i],
          content: messages[i].content + (delta.content ?? ""),
          thinking: (messages[i].thinking ?? "") + (delta.thinking ?? "") || undefined,
        };
        return { ...c, messages, updatedAt: Date.now() };
      });
    };

    try {
      const res = await fetch("/api/dark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, persona: conv.persona }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error ?? `Le serveur a répondu ${res.status}.`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const consume = (line: string) => {
        if (!line.trim()) return;
        let evt: { type: string; text?: string; message?: string };
        try {
          evt = JSON.parse(line);
        } catch {
          return; // ligne tronquée ou bruit : on l'ignore
        }
        if (evt.type === "text") appendToLast({ content: evt.text ?? "" });
        else if (evt.type === "thinking") appendToLast({ thinking: evt.text ?? "" });
        else if (evt.type === "error") setError(evt.message ?? "Erreur inconnue.");
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(consume);
      }
      consume(buffer);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError(
          err instanceof Error ? err.message : "Impossible de contacter le serveur.",
        );
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
      // Retire la bulle vide si la réponse n'a rien produit du tout.
      patch(conv.id, (c) => {
        const last = c.messages[c.messages.length - 1];
        if (last?.role === "assistant" && !last.content && !last.thinking) {
          return { ...c, messages: c.messages.slice(0, -1) };
        }
        return c;
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const copyMessage = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1600);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const exportConv = () => {
    if (!active) return;
    const md = active.messages
      .map((m) => `## ${m.role === "user" ? "Vous" : "DarkGPT"}\n\n${m.content}`)
      .join("\n\n---\n\n");
    const url = URL.createObjectURL(
      new Blob([`# ${active.title}\n\n${md}\n`], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/[^\w\-À-ÿ ]+/g, "").trim() || "conversation"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const messages = active?.messages ?? [];
  const persona = active?.persona ?? DEFAULT_PERSONA;

  return (
    <div className={styles.page}>
      {/* --- Barre latérale ------------------------------------------- */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.dot} />
          <strong>DarkGPT</strong>
        </div>

        <button className={styles.newBtn} onClick={() => createConv(persona)}>
          + Nouvelle conversation
        </button>

        <nav className={styles.convList}>
          {convs.length === 0 && (
            <p className={styles.emptyList}>Aucune conversation enregistrée.</p>
          )}
          {convs.map((c) => (
            <div
              key={c.id}
              className={`${styles.convItem} ${c.id === activeId ? styles.convActive : ""}`}
            >
              <button
                className={styles.convOpen}
                onClick={() => {
                  setActiveId(c.id);
                  setSidebarOpen(false);
                }}
                title={c.title}
              >
                {c.title}
              </button>
              <button
                className={styles.convDel}
                onClick={() => removeConv(c.id)}
                aria-label={`Supprimer « ${c.title} »`}
              >
                ×
              </button>
            </div>
          ))}
        </nav>

        <a className={styles.backLink} href="/">
          ← Retour au studio
        </a>
      </aside>

      {sidebarOpen && (
        <div className={styles.scrim} onClick={() => setSidebarOpen(false)} />
      )}

      {/* --- Zone de conversation -------------------------------------- */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.burger}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Ouvrir la liste des conversations"
          >
            ☰
          </button>

          <div className={styles.personas} role="group" aria-label="Mode de réponse">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                title={p.hint}
                className={`${styles.chip} ${p.id === persona ? styles.chipOn : ""}`}
                onClick={() => setPersona(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            className={styles.ghost}
            onClick={exportConv}
            disabled={messages.length === 0}
          >
            Exporter
          </button>
        </header>

        <div className={styles.scroll}>
          <div className={styles.thread}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                <h1>
                  Dark<span>GPT</span>
                </h1>
                <p>
                  Un chat en thème sombre, branché sur Claude quand{" "}
                  <code>ANTHROPIC_API_KEY</code> est présent dans <code>.env</code>,
                  et sur le mode gratuit sinon. Les conversations restent dans votre
                  navigateur.
                </p>
                <div className={styles.examples}>
                  {EXAMPLES.map((ex) => (
                    <button key={ex} onClick={() => void send(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <article
                key={i}
                className={`${styles.msg} ${m.role === "user" ? styles.user : styles.bot}`}
              >
                <div className={styles.avatar}>{m.role === "user" ? "Vous" : "DG"}</div>
                <div className={styles.bubble}>
                  {m.thinking && (
                    <div className={styles.thinking}>
                      <button
                        onClick={() =>
                          setOpenThinking((prev) => ({ ...prev, [i]: !prev[i] }))
                        }
                      >
                        {openThinking[i] ? "▾" : "▸"} Raisonnement
                      </button>
                      {openThinking[i] && <p>{m.thinking}</p>}
                    </div>
                  )}

                  {m.role === "user" ? (
                    <p className={styles.userText}>{m.content}</p>
                  ) : m.content ? (
                    <Markdown text={m.content} />
                  ) : (
                    <span className={styles.typing}>
                      <i />
                      <i />
                      <i />
                    </span>
                  )}

                  {m.content && (
                    <button
                      className={styles.copyMsg}
                      onClick={() => void copyMessage(i, m.content)}
                    >
                      {copiedIdx === i ? "Copié" : "Copier"}
                    </button>
                  )}
                </div>
              </article>
            ))}

            {error && <div className={styles.error}>{error}</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className={styles.composer}>
          <div className={styles.composerInner}>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Écrivez votre message…"
              rows={1}
            />
            {busy ? (
              <button className={styles.stopBtn} onClick={stop}>
                Arrêter
              </button>
            ) : (
              <button
                className={styles.sendBtn}
                onClick={() => void send(input)}
                disabled={!input.trim()}
              >
                Envoyer
              </button>
            )}
          </div>
          <p className={styles.note}>
            Entrée pour envoyer · Maj+Entrée pour un saut de ligne — DarkGPT peut se
            tromper, vérifiez les informations importantes.
          </p>
        </div>
      </main>
    </div>
  );
}
