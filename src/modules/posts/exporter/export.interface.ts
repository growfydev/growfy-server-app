export interface Exporter {
  export(posts: any[]): Promise<{ fileBuffer: any; header: any }>;
}
