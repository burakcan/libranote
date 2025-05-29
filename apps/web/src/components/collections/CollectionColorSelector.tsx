import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const collectionColorPresets = [
  { label: "Rose", color: "var(--color-rose-500)" },
  { label: "Amber", color: "var(--color-amber-500)" },
  { label: "Yellow", color: "var(--color-yellow-300)" },
  { label: "Lime", color: "var(--color-lime-400)" },
  { label: "Emerald", color: "var(--color-emerald-500)" },
  { label: "Indigo", color: "var(--color-indigo-500)" },
  { label: "Purple", color: "var(--color-purple-500)" },
];

type CollectionColorSelectorProps = {
  currentColor: string | null;
  onColorChange: (color: string | null) => void;
};

export function CollectionColorSelector({
  currentColor,
  onColorChange,
}: CollectionColorSelectorProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <div
          className={cn(
            "size-3 ml-0.5 rounded-full border-1 border-white/50 mr-4.5",
            currentColor ? "bg-accent-foreground/50" : ""
          )}
          style={{
            backgroundColor: currentColor || "var(--color-transparent)",
          }}
        />
        {currentColor ? "Change color" : "No color"}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => onColorChange(null)}>
            <div
              className="size-3 rounded-full border-1 border-accent-foreground/50"
              style={{ backgroundColor: "var(--color-transparent)" }}
            />
            No color
          </DropdownMenuItem>
          {collectionColorPresets.map((color) => (
            <DropdownMenuItem
              key={color.label}
              onClick={() => onColorChange(color.color)}
            >
              <div
                className="size-3 rounded-full border-1 border-accent-foreground/50"
                style={{ backgroundColor: color.color }}
              />
              {color.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
