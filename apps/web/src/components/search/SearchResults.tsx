import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchResultItem } from "./SearchResultItem";
import { NoteSearchResult } from "@/types/FlexSearch";

interface SearchResultsProps {
  results: NoteSearchResult[];
  onClear: () => void;
}

export function SearchResults({ results, onClear }: SearchResultsProps) {
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
        const nextIndex =
          results.findIndex((result) => result.id === highlightedResult?.id) +
          1;
        setHighlightedResult(results[nextIndex]);
      }

      if (e.key === "ArrowUp") {
        const prevIndex =
          results.findIndex((result) => result.id === highlightedResult?.id) -
          1;
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

  return (
    <div
      className={cn(
        "absolute top-full w-full bg-background rounded-md border z-20 shadow max-h-[calc(100vh-10rem)] overflow-y-auto",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      ref={ref}
    >
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
    </div>
  );
}
