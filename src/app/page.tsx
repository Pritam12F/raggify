import { SourceInput } from "@/components/source-input";
import { ChatWindow } from "@/components/chat-window";
import { LoadingContextProvider } from "@/context/loading";

export default function Home() {
  return (
    <main className="relative flex h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-zinc-950 px-6 py-5">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-125 w-125 rounded-full bg-violet-700/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-125 w-125 rounded-full bg-indigo-700/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-900/15 blur-3xl" />
      </div>

      <LoadingContextProvider>
        {/* Brand header */}
        <div className="relative flex w-full max-w-6xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Raggify
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-sm text-zinc-500">
            RAG-powered document chat
          </span>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-medium text-violet-300">Ready</span>
          </div>
        </div>

        {/* Main panel */}
        <div className="relative flex flex-1 w-full max-w-6xl overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/70 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {/* Left panel — Source */}
          <div className="flex w-1/2 flex-col border-r border-zinc-700/50">
            <SourceInput />
          </div>

          {/* Right panel — Chat */}
          <div className="flex w-1/2 flex-col">
            <ChatWindow />
          </div>
        </div>
      </LoadingContextProvider>
    </main>
  );
}
