import { cookies } from "next/headers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
      {children}
      <Footer role={role} />
    </>
  );
}
