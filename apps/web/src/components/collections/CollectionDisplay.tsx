type CollectionDisplayProps = {
  title: string;
  color: string | null;
  totalNotes: number;
  isSpecialCollection: boolean;
};

export function CollectionDisplay({
  title,
  color,
  totalNotes,
  isSpecialCollection,
}: CollectionDisplayProps) {
  return (
    <div className="flex items-center min-w-0">
      <div
        className="size-3 rounded-full ml-1 mr-3 border-1 border-white/50 flex-shrink-0"
        style={{
          backgroundColor: isSpecialCollection
            ? "var(--color-transparent)"
            : color || "var(--color-transparent)",
        }}
      />
      <span className="text-sm font-medium truncate flex-shrink min-w-0">
        {title}
      </span>
      <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
        {totalNotes} {totalNotes === 1 ? "note" : "notes"}
      </span>
    </div>
  );
}
