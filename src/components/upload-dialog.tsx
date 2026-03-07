"use client";

import { ChangeEvent, useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { isValidHttpUrl } from "@/lib/check-url";
import { LoadingContext } from "@/context/loading";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [tab, setTab] = useState<"pdf" | "url">("pdf");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const context = useContext(LoadingContext);

  const handleClose = () => {
    onOpenChange(false);
    setUrl("");
    setFile(null);
  };

  const uploadFile = () => {
    context?.startFileTransition(async () => {
      const formData = new FormData();

      formData.append("pdf", file!);

      try {
        await axios.post("/api/v1/index/pdf", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("PDF was indexed!");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const serverMessage = error.response?.data?.error;

          if (error.status === 402) {
            toast.error("This pdf already exists");
            return;
          }
          toast.error(serverMessage ?? "Server error");
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  const onFilePick = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setFile(file);
  };

  const uploadURL = () => {
    context?.startURLTransition(async () => {
      if (!isValidHttpUrl(url)) {
        toast.error("Invalid url");

        return;
      }

      try {
        await axios.post("/api/v1/index/url", { url });

        toast.success("Website was indexed");
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-zinc-700 bg-zinc-900 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Upload Source</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Upload a PDF file or paste a website URL to use as context.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-1">
          <button
            onClick={() => setTab("pdf")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "pdf"
                ? "bg-violet-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            PDF File
          </button>
          <button
            onClick={() => setTab("url")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "url"
                ? "bg-violet-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Link className="h-3.5 w-3.5" />
            Website URL
          </button>
        </div>

        <div className="py-1">
          {tab === "pdf" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-800/40 p-8 transition-colors hover:border-violet-500/50 hover:bg-violet-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-700/60">
                <Upload className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-200">
                  {file ? file.name : "Click to upload PDF"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  PDF files up to 10MB
                </p>
              </div>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={onFilePick}
              />
            </label>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">
                Website URL
              </label>
              <Input
                className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-violet-500/50 focus-visible:ring-violet-500/20"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="bg-violet-600 text-white hover:bg-violet-500"
            disabled={
              tab === "pdf"
                ? !file || context?.isFilePending
                : !url || context?.isURLPending
            }
            onClick={() => {
              if (tab === "pdf") {
                uploadFile();
                handleClose();
              } else {
                uploadURL();
                handleClose();
              }
            }}
          >
            {tab === "pdf"
              ? context?.isFilePending
                ? "Uploading..."
                : "Upload PDF"
              : context?.isURLPending
                ? "Uploading..."
                : "Index URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
