import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchService } from "@/services/SearchService";
import { Button } from "../ui/button";
import { SearchResults } from "./SearchResults";
import { NoteSearchResult } from "@/types/FlexSearch";

export function SearchBar() {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NoteSearchResult[]>([]);

  useEffect(() => {
    if (query.length === 1) {
      return;
    }

    setSearching(true);

    searchService.searchNotes({ query }).then((results) => {
      setResults(results);
      setSearching(false);
    });

    return () => {
      setResults([]);
      setSearching(false);
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearching(false);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          className="pl-10 pr-16 bg-background/70 h-10 shadow-sm focus-visible:ring-primary/70 focus-visible:border-primary rounded-3xl"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {searching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
        {query.length > 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button variant="ghost" size="icon" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!searching && (
          <SearchResults
            searchTerm={query}
            results={results}
            onClear={handleClear}
          />
        )}
      </div>
    </div>
  );
}
