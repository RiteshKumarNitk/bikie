import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/shared/PageTransition";
import { SELECTED_ROLE_COOKIE, isSelectedRole } from "@/lib/role";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieValue = (await cookies()).get(SELECTED_ROLE_COOKIE)?.value;
  const role = isSelectedRole(cookieValue) ? cookieValue : null;

  return (
    <>
      <Navbar role={role} />
      <PageTransition>{children}</PageTransition>
      <Footer role={role} />
    </>
  );
}
