import { Search } from "lucide-react";
import { Input } from "../ui/input";

export function SearchBar() {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search..."
          className="pl-10 pr-16 bg-background/70 h-10 shadow-sm focus-visible:ring-primary/70 focus-visible:border-primary"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        {/* <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary/20 bg-muted px-1.5 font-mono text-xs text-muted-foreground">
          <span className="text-sm">⌘</span>
          <span>K</span>
        </kbd> */}
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
