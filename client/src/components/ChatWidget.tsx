import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, ChevronDown, Lock, Unlock, Download, Upload, FileText, Shield, Trash2, BarChart3, Dumbbell, Pill, Clock, Database, Command, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  isSystem?: boolean;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatAIText(text: string): string {
  if (!text) return "";
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/g, "$1");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "$1");
  formatted = formatted.replace(/\*(.*?)\*/g, "$1");
  formatted = formatted.replace(/\*/g, "");
  formatted = formatted.replace(/`(.*?)`/g, '$1');
  formatted = formatted.replace(/\n/g, "<br/>");
  return formatted;
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-[#7c5cff] animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 rounded-full bg-[#9b7fff] animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function ChatPromptPopup({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 300000);
    const handleClick = () => onDismiss();
    document.addEventListener("click", handleClick, { once: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.8 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none select-none"
      style={{ position: "fixed", bottom: "96px", right: "16px", left: "auto", zIndex: 10000 }}
      data-testid="chat-prompt-popup"
    >
      <div className="relative">
        <div
          className="px-6 py-4 rounded-2xl max-w-[260px]"
          style={{
            background: "linear-gradient(135deg, rgba(124, 92, 255, 0.25), rgba(56, 189, 248, 0.15))",
            border: "1px solid rgba(124, 92, 255, 0.35)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(124, 92, 255, 0.3), 0 0 60px rgba(124, 92, 255, 0.1)",
          }}
        >
          <p
            className="text-white m-0 leading-relaxed"
            style={{
              fontFamily: "'Caveat', 'Dancing Script', 'Segoe Script', 'Comic Sans MS', cursive",
              fontSize: "clamp(22px, 3vw, 28px)",
              fontWeight: 700,
              textShadow: "0 2px 8px rgba(124, 92, 255, 0.4)",
              letterSpacing: "0.5px",
            }}
          >
            Try my web chat AI!
          </p>
        </div>
        <div className="absolute -bottom-3 right-8 flex flex-col items-center">
          <ChevronDown size={28} className="text-[#7c5cff] animate-bounce" style={{ filter: "drop-shadow(0 2px 4px rgba(124, 92, 255, 0.5))" }} />
        </div>
      </div>
    </motion.div>
  );
}

const quickPromptsVisitor = [
  { label: "Best squat?", text: "What's John's best squat?" },
  { label: "Workout stats", text: "Show me the workout stats" },
  { label: "Days logged?", text: "How many days logged?" },
];

const quickPromptsOwner = [
  { label: "Stats", text: "show my stats", icon: BarChart3 },
  { label: "Home logs", text: "show all home workouts", icon: Dumbbell },
  { label: "Gym logs", text: "show all gym workouts", icon: Dumbbell },
  { label: "Supplements", text: "show supplements", icon: Pill },
  { label: "Reminders", text: "list reminders", icon: Clock },
  { label: "Export home", text: "export home logs", icon: FileText },
  { label: "Export gym", text: "export gym logs", icon: FileText },
  { label: "Backup", text: "create a backup", icon: Database },
];

interface SlashCommand {
  command: string;
  description: string;
  fill: string;
  icon: typeof BarChart3;
  category: "view" | "manage" | "tools";
  action?: "download_backup" | "upload_backup";
}

const slashCommands: SlashCommand[] = [
  { command: "/stats", description: "View workout statistics", fill: "show my stats", icon: BarChart3, category: "view" },
  { command: "/home", description: "View all home workouts", fill: "show all home workouts", icon: Dumbbell, category: "view" },
  { command: "/gym", description: "View all gym workouts", fill: "show all gym workouts", icon: Dumbbell, category: "view" },
  { command: "/supplements", description: "View all supplements", fill: "show supplements", icon: Pill, category: "view" },
  { command: "/reminders", description: "View all reminders", fill: "list reminders", icon: Clock, category: "view" },
  { command: "/log", description: "Log a new workout day", fill: "save day [number] [home/gym]: ", icon: Dumbbell, category: "manage" },
  { command: "/update", description: "Update an existing day", fill: "update day [number] [home/gym]: ", icon: Dumbbell, category: "manage" },
  { command: "/delete", description: "Delete a workout day", fill: "delete day [number] [home/gym]", icon: Trash2, category: "manage" },
  { command: "/addsupplement", description: "Add a new supplement", fill: "add supplement [name] [amount]", icon: Pill, category: "manage" },
  { command: "/updatesupplement", description: "Update a supplement", fill: "update supplement [name] to [new amount]", icon: Pill, category: "manage" },
  { command: "/deletesupplement", description: "Delete a supplement", fill: "delete supplement [name]", icon: Trash2, category: "manage" },
  { command: "/addreminder", description: "Add a new reminder", fill: "add reminder: ", icon: Clock, category: "manage" },
  { command: "/deletereminder", description: "Delete a reminder", fill: "delete reminder [number]", icon: Trash2, category: "manage" },
  { command: "/backup", description: "Download full backup (.json)", fill: "", icon: Download, category: "tools", action: "download_backup" },
  { command: "/upload", description: "Upload/restore a backup file", fill: "", icon: Upload, category: "tools", action: "upload_backup" },
  { command: "/export", description: "Export logs by category", fill: "export [home/gym] logs", icon: FileText, category: "tools" },
  { command: "/clearmemory", description: "Clear AI memory", fill: "clear AI memory", icon: Trash2, category: "tools" },
  { command: "/remember", description: "Save persistent instruction", fill: "remember: ", icon: Database, category: "tools" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredSlashCommands = useMemo(() => {
    if (!slashFilter) return slashCommands;
    const lower = slashFilter.toLowerCase();
    return slashCommands.filter(
      c => c.command.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower)
    );
  }, [slashFilter]);

  useEffect(() => {
    setSelectedSlashIndex(0);
  }, [filteredSlashCommands]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    handleScroll();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setShowPrompt(false);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setShowScrollDown(!isNearBottom && messages.length > 3);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/days"] });
    queryClient.invalidateQueries({ queryKey: ["/api/supplements"] });
  }, [queryClient]);

  useEffect(() => {
    if (!showSlashMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSlashMenu]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.length > 1 ? val.slice(1) : "");
      if (!isOwnerMode) setIsOwnerMode(true);
    } else {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
  };

  const selectSlashCommand = (cmd: SlashCommand) => {
    setShowSlashMenu(false);
    setSlashFilter("");
    if (!isOwnerMode) setIsOwnerMode(true);

    if (cmd.action === "download_backup") {
      setInput("");
      handleDownloadBackup();
      return;
    }
    if (cmd.action === "upload_backup") {
      setInput("");
      fileInputRef.current?.click();
      return;
    }

    setInput(cmd.fill);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu && filteredSlashCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSlashIndex(prev => Math.min(prev + 1, filteredSlashCommands.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSlashIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && showSlashMenu)) {
        e.preventDefault();
        selectSlashCommand(filteredSlashCommands[selectedSlashIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowSlashMenu(false);
        return;
      }
    }
  };

  const isOwnerCommand = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const ownerPatterns = [
      /^delete\b/,
      /^remove\s+(home|gym|day|log|supplement|reminder)/,
      /^(save|log)\s+day/,
      /^(add|update)\s+(supplement|reminder)/,
      /^(update|edit)\s+day/,
      /^mark\s+day/,
      /^(clear|wipe)\s+(ai\s+)?memory/,
      /^(create|download)\s+backup/,
      /^export\s+(home|gym)/,
      /^remember:/,
      /^(show|list|view)\s+(my\s+)?(stats|supplements|reminders|home|gym)/,
    ];
    return ownerPatterns.some(p => p.test(lower));
  };

  const sendMessage = async (text?: string, password?: string, pAction?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    setShowSlashMenu(false);

    let effectiveOwnerMode = isOwnerMode;
    if (!isOwnerMode && isOwnerCommand(msg)) {
      setIsOwnerMode(true);
      effectiveOwnerMode = true;
    }

    if (!text) {
      const userMsg: ChatMessage = { role: "user", content: msg };
      setMessages(prev => [...prev, userMsg]);
    }
    setInput("");
    setIsTyping(true);

    try {
      const body: any = {
        message: msg,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        isOwner: effectiveOwnerMode,
      };
      if (password) body.password = password;
      if (pAction) body.pendingAction = pAction;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const reply = data.response || data.message || "Sorry, something went wrong. Try again!";

      if (data.requiresPassword) {
        setPendingAction(data.pendingAction || null);
        setPendingMessage(msg);
        setShowPasswordDialog(true);
        setMessages(prev => [...prev, { role: "model", content: reply, isSystem: true }]);
      } else {
        setMessages(prev => [...prev, { role: "model", content: reply }]);
        if (data.actionPerformed || effectiveOwnerMode) {
          invalidateData();
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordInput.trim()) return;
    setShowPasswordDialog(false);
    const pw = passwordInput;
    setPasswordInput("");

    setMessages(prev => [...prev, { role: "user", content: "Password entered" }]);
    setIsTyping(true);

    try {
      const body: any = {
        message: pendingMessage || "proceed with the action",
        history: messages.map(m => ({ role: m.role, content: m.content })),
        isOwner: true,
        password: pw,
        pendingAction: pendingAction,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const reply = data.response || data.message || "Failed to verify password. Try again.";
      setMessages(prev => [...prev, { role: "model", content: reply }]);
      invalidateData();
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Failed to verify password. Try again." }]);
    } finally {
      setIsTyping(false);
      setPendingAction(null);
      setPendingMessage(null);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch("/api/backup/download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      a.download = disposition?.match(/filename="(.+)"/)?.[1] || "lockin_backup.json";
      a.click();
      URL.revokeObjectURL(url);
      setMessages(prev => [...prev, { role: "model", content: "Backup downloaded successfully!" }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Failed to download backup." }]);
    }
  };

  const handleUploadBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setMessages(prev => [...prev, { role: "user", content: `Uploading backup: ${file.name}` }]);
        setPendingAction(JSON.stringify({ uploadData: data }));
        setPendingMessage(`Restore backup from ${file.name}`);
        setShowPasswordDialog(true);
      } catch {
        setMessages(prev => [...prev, { role: "model", content: "Invalid JSON file. Please upload a valid backup." }]);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBackupUploadWithPassword = async () => {
    if (!passwordInput.trim() || !pendingAction) return;
    setShowPasswordDialog(false);
    const pw = passwordInput;
    setPasswordInput("");
    setIsTyping(true);

    try {
      let uploadData;
      try {
        const parsed = JSON.parse(pendingAction);
        uploadData = parsed.uploadData;
      } catch {
        uploadData = null;
      }

      if (uploadData) {
        const res = await fetch("/api/backup/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw, data: uploadData }),
        });
        const result = await res.json();
        if (res.ok) {
          setMessages(prev => [...prev, { role: "model", content: "Backup restored successfully! The page will refresh to show updated data." }]);
          invalidateData();
        } else {
          setMessages(prev => [...prev, { role: "model", content: result.message || "Failed to restore backup. Wrong password?" }]);
        }
      } else {
        await handlePasswordSubmit();
        return;
      }
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Failed to restore backup." }]);
    } finally {
      setIsTyping(false);
      setPendingAction(null);
      setPendingMessage(null);
    }
  };

  const handleExport = async (category: string) => {
    try {
      const res = await fetch(`/api/export/${category}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${category}_logs.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessages(prev => [...prev, { role: "model", content: `${category.charAt(0).toUpperCase() + category.slice(1)} logs exported!` }]);
    } catch {
      setMessages(prev => [...prev, { role: "model", content: "Failed to export logs." }]);
    }
  };

  const messageCount = messages.filter(m => m.role === "user").length;

  const categoryLabels: Record<string, string> = { view: "View", manage: "Manage", tools: "Tools" };
  const categoryColors: Record<string, string> = {
    view: "text-[#38bdf8]",
    manage: "text-[#22c55e]",
    tools: "text-[#f59e0b]",
  };

  return (
    <>
      <style>{`
        .chat-container {
          background: linear-gradient(160deg, rgba(13, 18, 30, 0.98), rgba(8, 11, 20, 0.99));
          border: 1px solid rgba(124, 92, 255, 0.2);
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.6),
            0 0 50px rgba(124, 92, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
        }

        .chat-header {
          background: linear-gradient(135deg, rgba(124, 92, 255, 0.18), rgba(56, 189, 248, 0.08));
          border-bottom: 1px solid rgba(124, 92, 255, 0.15);
        }

        .chat-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124, 92, 255, 0.4), rgba(56, 189, 248, 0.3), transparent);
        }

        .msg-user {
          background: linear-gradient(135deg, #7c5cff 0%, #6344e0 50%, #5535d4 100%);
          border-radius: 20px 20px 6px 20px;
          box-shadow: 0 4px 16px rgba(124, 92, 255, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .msg-user::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .msg-ai {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px 20px 20px 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .msg-ai::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
        }

        .msg-system {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05));
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 20px 20px 20px 6px;
        }

        .inline-code {
          background: rgba(124, 92, 255, 0.15);
          border: 1px solid rgba(124, 92, 255, 0.2);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          color: #c4b5fd;
        }

        .chat-input-wrapper {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .chat-input-wrapper:focus-within {
          border-color: rgba(124, 92, 255, 0.4);
          box-shadow: 0 0 20px rgba(124, 92, 255, 0.1), inset 0 0 20px rgba(124, 92, 255, 0.03);
        }

        .send-btn {
          background: linear-gradient(135deg, #7c5cff, #6344e0);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .send-btn:not(:disabled):hover {
          box-shadow: 0 0 20px rgba(124, 92, 255, 0.4);
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.25;
          background: rgba(124, 92, 255, 0.3);
        }

        .quick-prompt {
          background: rgba(124, 92, 255, 0.08);
          border: 1px solid rgba(124, 92, 255, 0.15);
          border-radius: 12px;
          transition: all 0.25s ease;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          padding: 5px 10px;
        }

        .quick-prompt:hover {
          background: rgba(124, 92, 255, 0.15);
          border-color: rgba(124, 92, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 92, 255, 0.15);
        }

        .ai-avatar {
          background: linear-gradient(135deg, #7c5cff, #38bdf8);
          box-shadow: 0 2px 8px rgba(124, 92, 255, 0.3);
        }

        .chat-messages-area::-webkit-scrollbar {
          width: 4px;
        }

        .chat-messages-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages-area::-webkit-scrollbar-thumb {
          background: rgba(124, 92, 255, 0.2);
          border-radius: 4px;
        }

        .chat-fab {
          background: linear-gradient(135deg, #7c5cff, #38bdf8);
          box-shadow: 0 6px 24px rgba(124, 92, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .chat-fab::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
          animation: fabShine 3s ease-in-out infinite;
        }

        @keyframes fabShine {
          0%, 100% { transform: translate(-30%, -30%); }
          50% { transform: translate(30%, 30%); }
        }

        .chat-fab:hover {
          box-shadow: 0 8px 32px rgba(124, 92, 255, 0.5), 0 0 40px rgba(124, 92, 255, 0.2);
        }

        .scroll-indicator {
          background: linear-gradient(135deg, rgba(124, 92, 255, 0.9), rgba(56, 189, 248, 0.8));
          box-shadow: 0 2px 12px rgba(124, 92, 255, 0.4);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .scroll-indicator:hover {
          transform: scale(1.1);
        }

        .message-counter {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
          border: 2px solid rgba(11, 15, 23, 0.9);
        }

        .owner-badge {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }

        .tool-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }

        .tool-btn:hover {
          background: rgba(124, 92, 255, 0.1);
          border-color: rgba(124, 92, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .password-overlay {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
        }

        .password-dialog {
          background: linear-gradient(160deg, #0f1624, #0b0f17);
          border: 1px solid rgba(124, 92, 255, 0.3);
          border-radius: 20px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 92, 255, 0.1);
        }

        .slash-menu {
          background: linear-gradient(160deg, rgba(15, 22, 36, 0.98), rgba(11, 15, 23, 0.99));
          border: 1px solid rgba(124, 92, 255, 0.25);
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(124, 92, 255, 0.08);
          backdrop-filter: blur(20px);
          max-height: 320px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .slash-menu::-webkit-scrollbar {
          width: 3px;
        }

        .slash-menu::-webkit-scrollbar-thumb {
          background: rgba(124, 92, 255, 0.2);
          border-radius: 3px;
        }

        .slash-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          border-radius: 10px;
          margin: 2px 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .slash-item:hover, .slash-item.selected {
          background: rgba(124, 92, 255, 0.12);
        }

        .slash-item .cmd-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .slash-category-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 8px 16px 4px;
          color: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleFileSelected}
        className="hidden"
        data-testid="input-file-upload"
      />

      <AnimatePresence>
        {showPrompt && !isOpen && (
          <ChatPromptPopup onDismiss={() => setShowPrompt(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="password-overlay fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 10001 }}
            onClick={() => { setShowPasswordDialog(false); setPasswordInput(""); }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="password-dialog p-6 w-[320px] max-w-[90vw]"
              onClick={e => e.stopPropagation()}
              data-testid="password-dialog"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b]/20 to-[#ef4444]/10 flex items-center justify-center border border-[#f59e0b]/20">
                  <Shield size={18} className="text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white m-0">Password Required</h3>
                  <p className="text-[10px] text-white/40 m-0">Enter password for destructive action</p>
                </div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); pendingAction?.includes("uploadData") ? handleBackupUploadWithPassword() : handlePasswordSubmit(); }}>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-[#7c5cff]/50 focus:ring-1 focus:ring-[#7c5cff]/30 mb-3 transition-all"
                  autoFocus
                  data-testid="input-password"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordDialog(false); setPasswordInput(""); }}
                    className="flex-1 py-2 rounded-xl text-sm text-white/50 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    data-testid="button-cancel-password"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!passwordInput.trim()}
                    className="flex-1 py-2 rounded-xl text-sm text-white font-semibold bg-gradient-to-r from-[#7c5cff] to-[#6344e0] hover:shadow-lg hover:shadow-[#7c5cff]/20 disabled:opacity-40 transition-all"
                    data-testid="button-submit-password"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.85 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`chat-container overflow-hidden flex flex-col ${isFullscreen ? "w-full h-full rounded-none" : "w-[400px] max-w-[calc(100vw-32px)] h-[580px] max-h-[80vh] rounded-3xl"}`}
            style={isFullscreen ? { position: "fixed", inset: "0", zIndex: 10002 } : { position: "fixed", bottom: "96px", right: "16px", left: "auto", zIndex: 9998 }}
            data-testid="chat-widget"
          >
            <div className="chat-header relative flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="ai-avatar w-9 h-9 rounded-full flex items-center justify-center relative">
                  <Bot size={17} className="text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0d121e]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white m-0 flex items-center gap-1.5">
                    John's AI
                    <Sparkles size={12} className="text-[#38bdf8]" />
                  </h4>
                  <span className="text-[10px] text-green-400/80 font-medium tracking-wide">
                    {isOwnerMode ? "Owner Mode" : "Always online"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOwnerMode(!isOwnerMode)}
                  className={`p-1.5 rounded-full transition-all duration-200 ${isOwnerMode ? "bg-green-500/20 text-green-400" : "hover:bg-white/10 text-white/40"}`}
                  title={isOwnerMode ? "Owner mode ON" : "Switch to owner mode"}
                  data-testid="button-toggle-owner"
                >
                  {isOwnerMode ? <Unlock size={15} /> : <Lock size={15} />}
                </button>
                {isOwnerMode && (
                  <button
                    onClick={() => setShowTools(!showTools)}
                    className={`p-1.5 rounded-full transition-all duration-200 ${showTools ? "bg-[#7c5cff]/20 text-[#7c5cff]" : "hover:bg-white/10 text-white/40"}`}
                    title="Quick tools"
                    data-testid="button-toggle-tools"
                  >
                    <Database size={15} />
                  </button>
                )}
                {messageCount > 0 && (
                  <span className="text-[10px] text-white/30 font-medium ml-1">
                    {messageCount}
                  </span>
                )}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-all duration-200"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  data-testid="button-toggle-fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={15} className="text-white/50" /> : <Maximize2 size={15} className="text-white/50" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-all duration-200 group"
                  data-testid="button-close-chat"
                >
                  <X size={18} className="text-white/50 group-hover:text-white/90 transition-colors" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isOwnerMode && showTools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-white/[0.06]"
                >
                  <div className="px-3 py-2 flex gap-1.5 flex-wrap">
                    <button className="tool-btn" onClick={handleDownloadBackup} data-testid="button-download-backup">
                      <Download size={12} /> Backup
                    </button>
                    <button className="tool-btn" onClick={handleUploadBackup} data-testid="button-upload-backup">
                      <Upload size={12} /> Restore
                    </button>
                    <button className="tool-btn" onClick={() => handleExport("home")} data-testid="button-export-home">
                      <FileText size={12} /> Home
                    </button>
                    <button className="tool-btn" onClick={() => handleExport("gym")} data-testid="button-export-gym">
                      <FileText size={12} /> Gym
                    </button>
                    <button className="tool-btn" onClick={() => { setMessages([]); }} data-testid="button-clear-chat">
                      <Trash2 size={12} /> Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="chat-messages-area flex-1 overflow-y-auto p-4 space-y-3 relative"
              style={{ scrollbarWidth: "thin" }}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cff]/15 to-[#38bdf8]/10 flex items-center justify-center mb-3 border border-white/[0.06]">
                    <Bot size={28} className="text-[#7c5cff]" />
                  </div>
                  <p className="text-white/80 text-sm font-semibold mb-1">
                    {isOwnerMode ? "Hey John! What would you like to do?" : "Ask me anything!"}
                  </p>
                  <p className="text-white/40 text-xs mb-2 max-w-[240px] leading-relaxed">
                    {isOwnerMode
                      ? "Full control: manage logs, supplements, reminders, backups, and more"
                      : "I know everything about John's workout journey"}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    <Command size={10} className="text-white/30" />
                    <span className="text-[10px] text-white/30">Type <span className="text-[#7c5cff] font-semibold">/</span> for commands</span>
                    <span className="text-[10px] text-white/20 ml-2">Ctrl+K</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {(isOwnerMode ? quickPromptsOwner : quickPromptsVisitor).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const text = typeof prompt === "string" ? prompt : prompt.text;
                          setMessages(prev => [...prev, { role: "user", content: text }]);
                          sendMessage(text);
                        }}
                        className="quick-prompt flex items-center gap-1"
                        data-testid={`quick-prompt-${i}`}
                      >
                        {"icon" in prompt && prompt.icon && <prompt.icon size={10} />}
                        {"label" in prompt ? prompt.label : (prompt as any).text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "model" && (
                    <div className="ai-avatar w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col" style={{ maxWidth: "80%" }}>
                    <div
                      className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "msg-user text-white"
                          : msg.isSystem
                          ? "msg-system text-[#fbbf24]/90"
                          : "msg-ai text-white/90"
                      }`}
                      dangerouslySetInnerHTML={
                        msg.role === "model"
                          ? { __html: formatAIText(msg.content) }
                          : undefined
                      }
                      data-testid={`chat-message-${i}`}
                    >
                      {msg.role === "user" ? msg.content : null}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="ai-avatar w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="msg-ai">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showScrollDown && (
              <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10">
                <button onClick={scrollToBottom} className="scroll-indicator">
                  <ChevronDown size={16} className="text-white" />
                </button>
              </div>
            )}

            <div className="px-3 py-2.5 relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              {isOwnerMode && (
                <div className="flex items-center gap-1 mb-2">
                  <span className="owner-badge text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield size={9} /> Owner Mode
                  </span>
                  <span className="text-[10px] text-white/25">Full CRUD access &middot; Type / for commands</span>
                </div>
              )}

              <AnimatePresence>
                {showSlashMenu && (
                  <motion.div
                    ref={slashMenuRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="slash-menu absolute bottom-full left-3 right-3 mb-2"
                    data-testid="slash-command-menu"
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-3 py-2 mb-1">
                        <Command size={12} className="text-[#7c5cff]" />
                        <span className="text-[11px] font-semibold text-white/60">Commands</span>
                        <span className="text-[9px] text-white/25 ml-auto">Tab or click to select</span>
                      </div>
                      {filteredSlashCommands.length === 0 ? (
                        <div className="px-4 py-3 text-center text-white/30 text-xs">No commands found</div>
                      ) : (
                        (() => {
                          let lastCategory = "";
                          return filteredSlashCommands.map((cmd, i) => {
                            const showCategoryLabel = cmd.category !== lastCategory;
                            lastCategory = cmd.category;
                            return (
                              <div key={cmd.command}>
                                {showCategoryLabel && (
                                  <div className={`slash-category-label ${categoryColors[cmd.category]}`}>
                                    {categoryLabels[cmd.category]}
                                  </div>
                                )}
                                <div
                                  className={`slash-item ${i === selectedSlashIndex ? "selected" : ""}`}
                                  onClick={() => selectSlashCommand(cmd)}
                                  data-testid={`slash-cmd-${cmd.command.slice(1)}`}
                                >
                                  <div
                                    className="cmd-icon"
                                    style={{
                                      background: cmd.category === "view"
                                        ? "rgba(56, 189, 248, 0.1)"
                                        : cmd.category === "manage"
                                        ? "rgba(34, 197, 94, 0.1)"
                                        : "rgba(245, 158, 11, 0.1)",
                                      border: `1px solid ${
                                        cmd.category === "view"
                                          ? "rgba(56, 189, 248, 0.2)"
                                          : cmd.category === "manage"
                                          ? "rgba(34, 197, 94, 0.2)"
                                          : "rgba(245, 158, 11, 0.2)"
                                      }`,
                                    }}
                                  >
                                    <cmd.icon
                                      size={13}
                                      className={
                                        cmd.category === "view"
                                          ? "text-[#38bdf8]"
                                          : cmd.category === "manage"
                                          ? "text-[#22c55e]"
                                          : "text-[#f59e0b]"
                                      }
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[12px] font-semibold text-white/80">{cmd.command}</div>
                                    <div className="text-[10px] text-white/35 truncate">{cmd.description}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={(e) => { e.preventDefault(); if (!showSlashMenu) sendMessage(); }}
                className="flex gap-2 items-center"
              >
                <div className="chat-input-wrapper flex-1 flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isOwnerMode ? "Type / for commands or ask anything..." : "Ask about John's workouts..."}
                    className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none"
                    disabled={isTyping}
                    data-testid="input-chat-message"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || showSlashMenu}
                  className="send-btn p-2.5 text-white flex items-center justify-center"
                  data-testid="button-send-chat"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFullscreen && (
        <motion.button
          onClick={() => { setIsOpen(!isOpen); setShowPrompt(false); }}
          className="chat-fab w-14 h-14 rounded-full flex items-center justify-center"
          style={{ position: "fixed", bottom: "24px", right: "16px", left: "auto", zIndex: 9999 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-testid="button-open-chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={24} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <MessageCircle size={24} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && messages.length > 0 && (
            <span className="message-counter">{messages.length}</span>
          )}
        </motion.button>
      )}
    </>
  );
}
