export interface ParsedAnnouncement {
  title: string;
  sourceUrl: string;
  category: string;
  publishedAt: string; // YYYY-MM-DD
}

export interface AnnouncementDTO {
  id: string;
  title: string;
  category: string;
  sourceUrl: string;
  publishedAt: string | null;
  createdAt: string;
}
