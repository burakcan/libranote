import { ChevronRight } from "lucide-react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteSearchResult } from "@/types/FlexSearch";

interface SearchResultItemProps {
  result: NoteSearchResult;
  onSelect: () => void;
  isHighlighted: boolean;
}

export function SearchResultItem({
  result,
  onSelect,
  isHighlighted,
}: SearchResultItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-3 hover:bg-muted/50 cursor-default transition-colors sm:rounded-md border border-transparent hover:border-border/50 group",
        isHighlighted && "bg-muted/50 border-border/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 p-2 rounded-md text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors",
            isHighlighted && "text-primary bg-primary/10"
          )}
        >
          <FileText className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium truncate group-hover:text-primary transition-colors",
                isHighlighted && "text-primary"
              )}
            >
              {result.titleHighlight ? (
                <span
                  className="[&>mark]:bg-primary/10 [&>mark]:text-primary"
                  dangerouslySetInnerHTML={{
                    __html: result.titleHighlight,
                  }}
                />
              ) : (
                result.doc.title || "Untitled Note"
              )}
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground whitespace-nowrap">
                {Math.min(result.totalMatches, 99)}
                {result.totalMatches > 99 && "+"}{" "}
                {result.totalMatches === 1 ? "match" : "matches"}
              </span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                  isHighlighted && "opacity-100"
                )}
              />
            </div>
          </div>

          <p className={"text-sm text-muted-foreground mt-1 line-clamp-2"}>
            {result.contentHighlight ? (
              <span
                className="[&>mark]:bg-primary/10 [&>mark]:text-primary"
                dangerouslySetInnerHTML={{
                  __html: result.contentHighlight,
                }}
              />
            ) : (
              result.doc.content || "Empty note"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
