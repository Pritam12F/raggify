import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function SpinnerCustom({ isUploading }: { isUploading: boolean }) {
  return (
    <div
      className={cn(
        `flex items-center gap-6`,
        `${isUploading ? "hidden" : ""}}`,
      )}
    >
      <Spinner className="size-6" />
    </div>
  );
}
