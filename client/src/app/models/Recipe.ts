export interface Recipe {
  _id: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  imageUrl: string;
  ingredients: string[];
  steps: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  recipes: Recipe[];
}