export type MealCategory = "soup" | "main" | "side" | "dessert";

export interface MealItem {
  name: string;
  category: MealCategory;
}

export interface ParsedMeal {
  date: string; // YYYY-MM-DD
  items: MealItem[];
  calories: number | null;
}

export interface MealDTO {
  id: string;
  date: string;
  items: MealItem[];
  calories: number | null;
}
