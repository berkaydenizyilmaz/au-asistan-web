export type MealCategory = "soup" | "main" | "side" | "dessert";

export interface MealItem {
  name: string;
  category: MealCategory;
}

export interface ParsedMeal {
  date: string;
  items: MealItem[];
  calories: number | null;
}

export interface MealDTO {
  id: string;
  date: string;
  items: MealItem[];
  calories: number | null;
}

export interface RatingSummary {
  likes: number;
  dislikes: number;
  userRating: "like" | "dislike" | null;
}
