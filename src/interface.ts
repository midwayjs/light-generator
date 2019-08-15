export type CopyRule = (currentFile: string) => void;

export interface CopyWalker {
  copy(srcDir, destDir, options?);
}
