import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, Sparkles, User, Terminal, ArrowDownCircle, Languages, BookmarkCheck } from "lucide-react";

interface ChatAssistantProps {
  chatHistory: Message[];
  onSendMessage: (content: string) => void;
  isSending: boolean;
  suggestedPrompts?: string[];
}

const QUICK_HINDI_PROMPTS = [
  "इस दस्तावेज़ का हिंदी में सरल सारांश बताओ",
  "मुख्य शर्तें और नियम क्या हैं? (Page citation के साथ)",
  "क्या इसमें कोई जोखिम, पेनल्टी या हिडन क्लॉज हैं?",
  "सभी वित्तीय आंकड़े और भुगतान की तारीखें बताओ",
];

export default function ChatAssistant({
  chatHistory,
  onSendMessage,
  isSending,
  suggestedPrompts,
}: ChatAssistantProps) {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    onSendMessage(input.trim());
    setInput("");
  };

  // Quick helper to render micro-markdown (paragraphs, list items, citations, and code blocks) safely
  const parseMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      // Is code block?
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
        const codeContent = language ? lines.slice(1).join("\n") : lines.join("\n");

        return (
          <div
            key={index}
            className="my-3 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden font-mono text-xs"
          >
            {language && (
              <div className="bg-slate-900 px-4 py-1.5 border-b border-slate-800/80 text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> {language}
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-emerald-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }

      // Plain text formatting (lists, bullet points, citations, subheadings)
      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            const trimmedLine = line.trim();

            // Bullet points
            if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("- ")) {
              return (
                <ul key={lIdx} className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                  <li>{renderLineWithCitations(trimmedLine.substring(2))}</li>
                </ul>
              );
            }

            // Headers
            if (trimmedLine.startsWith("### ")) {
              return (
                <h4
                  key={lIdx}
                  className="text-xs font-bold text-slate-100 font-mono tracking-wide uppercase mt-4 mb-2"
                >
                  {trimmedLine.substring(4)}
                </h4>
              );
            }
            if (trimmedLine.startsWith("## ")) {
              return (
                <h3
                  key={lIdx}
                  className="text-sm font-bold text-slate-100 font-mono tracking-wide uppercase mt-4 mb-2"
                >
                  {trimmedLine.substring(3)}
                </h3>
              );
            }

            // Normal text
            if (trimmedLine === "") {
              return <div key={lIdx} className="h-2" />;
            }

            return (
              <p key={lIdx} className="text-xs text-slate-300 leading-relaxed">
                {renderLineWithCitations(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderLineWithCitations = (line: string) => {
    // Detect bracket citations like [Page 2], [Clause 4.1], [Row 15]
    const citationRegex = /(\[[^\]]*(?:Page|Clause|Para|Row|Section|Article|धारा|पृष्ठ)[^\]]*\])/gi;
    const segments = line.split(citationRegex);

    return segments.map((seg, sIdx) => {
      if (seg.match(citationRegex)) {
        return (
          <span
            key={sIdx}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono font-semibold text-emerald-300"
          >
            <BookmarkCheck className="w-2.5 h-2.5" />
            {seg}
          </span>
        );
      }

      // Check inline backticks
      const codeParts = seg.split(/(`[^`\n]+`)/g);
      return codeParts.map((subPart, cpIdx) => {
        if (subPart.startsWith("`") && subPart.endsWith("`")) {
          return (
            <code
              key={cpIdx}
              className="bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-800 mx-0.5"
            >
              {subPart.slice(1, -1)}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden"
      id="chat-panel-container"
    >
      {/* Header */}
      <div className="bg-slate-900/60 px-5 py-3.5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wide font-mono">
              AI Query & Citation Assistant
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ask in Hindi or English • Verifiable Page/Paragraph Citations
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
        id="chat-messages-scroll"
      >
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6" id="chat-welcome-state">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-md">
              <Languages className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Hindi & English Intelligent Chat
            </p>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              आप हिंदी या अंग्रेज़ी में सवाल पूछ सकते हैं। हर उत्तर में सटीक पृष्ठ व पैराग्राफ संदर्भ (Exact Page Citations) दिए जाएँगे।
            </p>

            {/* Quick Hindi Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-w-md w-full">
              {QUICK_HINDI_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(q)}
                  className="p-2 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left text-[11px] text-slate-300 hover:text-emerald-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                id={`message-bubble-${msg.id}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border text-xs font-mono font-bold select-none ${
                    isUser
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl border leading-relaxed ${
                    isUser
                      ? "bg-slate-800/80 border-slate-700 text-slate-200 rounded-tr-none"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 rounded-tl-none"
                  }`}
                >
                  {parseMessageContent(msg.content)}
                </div>
              </div>
            );
          })
        )}

        {/* Thinking Indicator */}
        {isSending && (
          <div className="flex gap-3 mr-auto max-w-[85%]" id="chat-thinking-indicator">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border bg-emerald-950/40 text-emerald-400 border-emerald-900/30">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="text-[11px] font-mono text-slate-500 ml-1">
                Gemini is researching citations...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      {suggestedPrompts && suggestedPrompts.length > 0 && chatHistory.length > 0 && (
        <div
          className="px-5 py-2.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none"
          id="chat-suggestions-carousel"
        >
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono mr-1">
            Follow-ups:
          </span>
          {suggestedPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(prompt)}
              disabled={isSending}
              className="text-[10px] text-slate-400 hover:text-emerald-300 bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-full px-3 py-1 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-slate-900/60 border-t border-slate-800/60 flex gap-2.5 items-center"
        id="chat-input-form"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isSending ? "Waiting for response..." : "Ask in English or हिंदी (e.g. What are the key terms?)..."}
          disabled={isSending}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          id="chat-text-input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10"
          id="chat-send-btn"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
