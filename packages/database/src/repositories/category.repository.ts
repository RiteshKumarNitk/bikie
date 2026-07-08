import { prisma } from "../client";

export async function findAllCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    type: category.type,
    iconUrl: category.iconUrl,
    imageUrl: category.imageUrl,
  }));
}
