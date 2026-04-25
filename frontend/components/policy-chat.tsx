"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

const SAMPLE_QUESTIONS = [
  "What is my deductible?",
  "Am I covered for theft?",
  "What does ACORD 126 question 19 mean?",
  "Why did my premium go up?",
  "What's my claim history?",
]

type Source = {
  source: string
  page: number
  preview: string
}

type Message = {
  role: "user" | "assistant"
  text: string
  sources?: Source[]
}

export function PolicyChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function ask(question: string) {
    if (!question.trim() || loading) return

    setMessages((prev) => [...prev, { role: "user", text: question }])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/rag/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, top_k: 5 }),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Sorry — couldn't reach the policy assistant. Make sure the backend is running on port 8000.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(input)
  }

  return (
    <Card className="shadow-sm flex flex-col h-[460px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Sparkles className="w-5 h-5 text-accent" />
          Ask about your policy
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Grounded in your uploaded ACORD forms
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/70 text-foreground rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : ""}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] bg-primary text-primary-foreground px-3.5 py-2 rounded-lg rounded-br-sm text-sm"
                    : "max-w-[95%] space-y-2"
                }
              >
                <p
                  className={
                    m.role === "user"
                      ? ""
                      : "text-sm text-foreground whitespace-pre-wrap"
                  }
                >
                  {m.text}
                </p>

                {m.sources && m.sources.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Sources
                    </p>
                    {m.sources.map((s, j) => (
                      <div
                        key={j}
                        className="text-xs bg-muted/50 px-2.5 py-1.5 rounded border-l-2 border-accent"
                      >
                        <Badge
                          variant="outline"
                          className="text-[10px] mb-1 font-normal"
                        >
                          {s.source} · p.{s.page}
                        </Badge>
                        <p className="text-muted-foreground leading-snug">
                          {s.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Reading your policy...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 bg-muted/20"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
