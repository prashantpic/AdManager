export class AppCategoryDto {
  id: string;
  name: string;
  description?: string;
  slug: string; // Auto-generated from name
  parentCategoryId?: string;
  // childrenCategories?: AppCategoryDto[]; // If fetching hierarchy
  createdAt: Date;
  updatedAt: Date;
}