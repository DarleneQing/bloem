import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_SLOT_CLASS = "h-8 w-8 shrink-0";

interface ProfileInfoRowProps {
  label: string;
  value: string;
  onEdit?: () => void;
  editLabel?: string;
}

export function ProfileInfoRow({ label, value, onEdit, editLabel }: ProfileInfoRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span className="w-[4.75rem] shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-right text-sm font-medium text-foreground">
        {value}
      </span>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            ACTION_SLOT_CLASS,
            "flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
          )}
          aria-label={editLabel ?? `Edit ${label.toLowerCase()}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
