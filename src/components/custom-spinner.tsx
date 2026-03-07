import { Spinner } from "@/components/ui/spinner";

export function SpinnerCustom({ isUploading }: { isUploading: boolean }) {
  if (!isUploading) return null;

  return (
    <div className="flex items-center gap-6 translate-x-60">
      <Spinner className="size-6 text-white" />
    </div>
  );
}
