export interface HistoryEntry {
  undo(): void;
  redo(): void;
}
