import { prisma } from "./src/client";

async function main() {
  const plans = await prisma.partnerMembershipPlan.findMany();
  if (plans.length === 0) {
    console.log("Seeding default Service Provider membership plans...");
    await prisma.partnerMembershipPlan.create({
      data: {
        name: "Basic Partner",
        description: "Get started on the platform and accept bookings.",
        price: 0, // Free plan
        durationDays: 365,
        benefits: [
          "List up to 5 bikes",
          "Standard discovery ranking",
          "Basic analytics dashboard",
        ],
        sortOrder: 1,
        isActive: true,
      },
    });

    await prisma.partnerMembershipPlan.create({
      data: {
        name: "Pro Partner",
        description: "Maximize your business with premium features.",
        price: 999, // Paid plan
        durationDays: 30,
        benefits: [
          "Unlimited bike listings",
          "Priority discovery ranking",
          "Advanced analytics & insights",
          "Premium support",
        ],
        sortOrder: 2,
        isActive: true,
      },
    });
    console.log("Successfully seeded Partner Membership Plans!");
  } else {
    console.log("Partner membership plans already exist. Skipping seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
