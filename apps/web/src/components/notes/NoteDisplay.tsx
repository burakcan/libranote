type NoteDisplayProps = {
  title: string;
  description: string | null;
  collectionColor: string | null;
};

export function NoteDisplay({
  title,
  description,
  collectionColor,
}: NoteDisplayProps) {
  return (
    <>
      <div className="flex flex-shrink-0 flex-grow-0 mr-3 h-9">
        <div
          className="w-1 h-1 rounded-full mt-2 outline-1 outline-white/50"
          style={{
            backgroundColor: collectionColor || "var(--color-transparent)",
          }}
        />
      </div>
      <div className="flex flex-auto flex-col min-w-0 mr-2">
        <div className="text-sm font-medium truncate flex-shrink min-w-0">
          {title || "Untitled Note"}
        </div>
        <div className="text-xs text-muted-foreground truncate flex-shrink min-w-0">
          {description || "empty note"}
        </div>
      </div>
    </>
  );
}
