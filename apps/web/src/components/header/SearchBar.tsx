import { SearchIcon } from "lucide-react";
import { Input } from "../ui/input";

export function SearchBar() {
  return (
    <div className="flex items-center gap-2 w-96">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search..."
          className="pl-9 bg-background/50"
        />
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
