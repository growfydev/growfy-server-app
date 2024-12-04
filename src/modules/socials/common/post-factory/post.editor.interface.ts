export interface PostEditor {
  edit(fields: any): Promise<void>;
}
