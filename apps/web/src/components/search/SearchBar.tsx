import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { SearchService } from "@/lib/SearchService";
import { SearchResults } from "./SearchResults";
import { NoteSearchResult } from "@/types/FlexSearch";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NoteSearchResult[]>([]);

  useEffect(() => {
    if (query.length === 1) {
      return;
    }

    SearchService.searchNotes({ query }).then((results) => {
      setResults(results);
    });

    return () => {
      setResults([]);
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search..."
          className="pl-10 pr-16 bg-background/70 h-10 shadow-sm focus-visible:ring-primary/70 focus-visible:border-primary"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
        <SearchResults
          searchTerm={query}
          results={results}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}
