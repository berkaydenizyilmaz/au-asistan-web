export type NotificationType = "announcement" | "event" | "calendar";
export type SubscriptionType = "announcement" | "event";

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceId: string | null;
  isRead: boolean;
  metadata: { lead_days?: number };
  createdAt: string;
}

export interface SubscriptionDTO {
  id: string;
  type: SubscriptionType;
  category: string;
  createdAt: string;
}
