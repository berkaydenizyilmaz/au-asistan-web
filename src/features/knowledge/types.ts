export interface ScrapedContent {
  url: string;
  title: string;
  text: string;
  sourceType: "html" | "pdf";
  contentHash: string;
}

export interface ChunkWithContext {
  content: string;
  metadata: {
    documentTitle: string;
    sectionPath?: string;
    chunkIndex: number;
  };
}

export interface DocumentDTO {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: "html" | "pdf";
  domain: string;
  unit: string | null;
  isWatched: boolean;
  checkFrequency: string | null;
  autoIngest: boolean;
  contentHash: string | null;
  lastScrapedAt: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  content: string;
  similarity: number;
  documentTitle: string;
  sourceUrl: string;
  unit: string | null;
  sectionPath?: string;
}

export interface CrawlDiscovery {
  url: string;
  depth: number;
  title?: string;
}

export interface MetadataSuggestion {
  title: string;
  unit?: string;
  shouldIndex: boolean;
  skipReason?: string;
}
