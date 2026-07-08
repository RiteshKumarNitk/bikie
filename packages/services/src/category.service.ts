import { categoryRepository } from "@bikie/database";
import type { CategoryDTO } from "@bikie/types";

export const CategoryService = {
  async getAll(): Promise<CategoryDTO[]> {
    return categoryRepository.findAllCategories();
  },
};
