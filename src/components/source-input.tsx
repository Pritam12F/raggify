"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadDialog } from "@/components/upload-dialog";
import { Upload } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { SpinnerCustom } from "./custom-spinner";
import { LoadingContext } from "@/context/loading";

export function SourceInput() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const onChange = (text: string) => {
    setValue(text);
  };

  const onSubmit = () => {
    startTransition(async () => {
      if (value.length < 100) {
        toast.error("Input is too short");
        return;
      }

      try {
        const res = await axios.post("/api/v1/index/text", { value });

        if (res.status === 200) {
          toast.success("Text entry was added and indexed!");
        } else if (res.status === 201) {
          toast.success("Text was indexed!");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const serverMessage = error.response?.data?.error;
          toast.error(serverMessage ?? "Server error");
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  return (
    <LoadingContext>
      <div className="flex h-full flex-col">
        {/* Panel header */}
        <div className="flex items-center gap-2.5 border-b border-zinc-700/50 px-5 py-3.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20">
            <span className="text-xs font-bold text-violet-400">1</span>
          </div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Context Source
          </h2>
          {/* <SpinnerCustom isUploading={isPending || } /> */}
          <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
            Paste or upload
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Textarea
            className="flex-1 resize-none border-zinc-700/60 bg-zinc-800/60 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
            placeholder="Paste your document, article, or any text here…"
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
          />
          <div className="flex gap-2.5">
            <Button
              className="flex-1 border-0 bg-violet-600 text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500"
              onClick={onSubmit}
              disabled={isPending}
            >
              {isPending ? "Processing…" : "Process Source"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/80 hover:text-zinc-100"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload File / URL
            </Button>
          </div>
        </div>

        <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      </div>
    </LoadingContext>
  );
}
