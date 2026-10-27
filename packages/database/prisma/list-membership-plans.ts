// Read-only diagnostic — lists every MembershipPlan row (Rider plans) so production's actual
// name/active-flag/price can be confirmed before patch-rider-membership-price.ts is retried.
// Delete this file once no longer needed; it writes nothing.
import { prisma } from "../src/client";

async function main() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: { createdAt: "asc" },
  });
  if (plans.length === 0) {
    console.log("No MembershipPlan rows exist at all.");
    return;
  }
  for (const p of plans) {
    console.log(
      `id=${p.id} name=${JSON.stringify(p.name)} isActive=${p.isActive} price=${p.price.toString()} durationDays=${p.durationDays}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
