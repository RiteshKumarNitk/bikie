import { getCatalogModule } from "./modules/catalog/public";
import type { CategoryDTO } from "@bikie/types";

/** Compatibility facade — routes keep importing CategoryService. */
export const CategoryService = {
  async getAll(): Promise<CategoryDTO[]> {
    return getCatalogModule().categories.getAll();
  },
};
