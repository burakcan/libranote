import { useNavigate } from "@tanstack/react-router";
import { Frown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { SearchResultItem } from "./SearchResultItem";
import { NoteSearchResult } from "@/types/FlexSearch";

interface SearchResultsProps {
  searchTerm: string;
  results: NoteSearchResult[];
  onClear: () => void;
}

export function SearchResults({
  searchTerm,
  results,
  onClear,
}: SearchResultsProps) {
  const [highlightedResult, setHighlightedResult] =
    useState<NoteSearchResult | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isVisible = results.length > 0;

  useEffect(() => {
    if (isVisible) {
      setHighlightedResult(results[0]);
    }
  }, [isVisible, results]);

  // keyboard navigation
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        const currentIndex = results.findIndex(
          (result) => result.id === highlightedResult?.id
        );
        const nextIndex = (currentIndex + 1) % results.length;
        setHighlightedResult(results[nextIndex]);
      }

      if (e.key === "ArrowUp") {
        const currentIndex = results.findIndex(
          (result) => result.id === highlightedResult?.id
        );
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setHighlightedResult(results[prevIndex]);
      }

      if (e.key === "Enter") {
        if (highlightedResult) {
          navigate({
            to: "/notes/$noteId",
            params: { noteId: highlightedResult.id },
          });
          onClear();
          setHighlightedResult(null);
        }
      }

      if (e.key === "Escape") {
        setHighlightedResult(null);
        onClear();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setHighlightedResult(null);
        onClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClear, results, highlightedResult, navigate]);

  const isEmpty = searchTerm.length > 3 && results.length === 0;

  return (
    <div
      className={cn(
        "absolute top-full w-full flex flex-col bg-background rounded-md border z-20 shadow max-h-[calc(100vh-10rem)] overflow-hidden",
        isVisible || isEmpty ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      ref={ref}
    >
      {isEmpty && (
        <div className="flex flex-col gap-2 items-center justify-center p-4">
          <Frown className="h-8 w-8 text-accent" />
          <p className="text-md font-semibold text-muted-foreground">
            No results found
          </p>
        </div>
      )}
      <ScrollArea className="flex-1 flex flex-col min-h-0">
        {results.map((result) => (
          <SearchResultItem
            key={result.id}
            result={result}
            onSelect={() => {
              navigate({
                to: "/notes/$noteId",
                params: { noteId: result.id },
              });
              onClear();
            }}
            isHighlighted={highlightedResult?.id === result.id}
          />
        ))}
      </ScrollArea>
    </div>
  );
}
