import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete your profile",
  description: "A few optional details to help partners and fellow riders reach you.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
