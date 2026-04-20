export interface ParsedEvent {
  title: string;
  category: string;
  organizer: string | null;
  location: string | null;
  eventDate: string; // YYYY-MM-DD
  sourceUrl: string | null;
}

export interface EventDTO {
  id: string;
  title: string;
  category: string;
  organizer: string | null;
  location: string | null;
  eventDate: string;
  sourceUrl: string | null;
  createdAt: string;
}
