"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface SourceInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onUpload: () => void;
  isLoading?: boolean;
}

export function SourceInput({
  value,
  onChange,
  onSubmit,
  onUpload,
  isLoading,
}: SourceInputProps) {
  return (
    <div className="flex flex-col gap-4">
      <Textarea
        className="min-h-[360px] resize-none"
        placeholder="Paste your text here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-4">
        <Button className="flex-1" onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Processing..." : "Submit"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={onUpload}
        >
          <Upload className="h-4 w-4" />
          Upload PDF / Website Link
        </Button>
      </div>
    </div>
  );
}
