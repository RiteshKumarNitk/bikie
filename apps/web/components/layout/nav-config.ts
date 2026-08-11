import type { SelectedRole } from "@/lib/role";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  heading: string;
  links: NavLink[];
}

export const riderPrimaryLinks: NavLink[] = [
  { label: "Rent a Bike", href: "/explore-bikes" },
  { label: "Rides", href: "/trips" },
];

export const partnerPrimaryLinks: NavLink[] = [
  { label: "Services", href: "/partners/services" },
  { label: "Pricing", href: "/partners/pricing" },
];

// Shared between the mega-menu and the footer where both render the exact same set of
// links, so the two surfaces can't silently drift apart (audit finding L5).
const exploreLinks: NavLink[] = [
  { label: "Rent a Bike", href: "/explore-bikes" },
  { label: "Destinations", href: "/destinations" },
  { label: "Rides", href: "/trips" },
  { label: "Community", href: "/community" },
  { label: "Clubs", href: "/clubs" },
  { label: "Events", href: "/events" },
  { label: "Roadside Assistance", href: "/roadside-assistance" },
];

const growWithBikieLinks: NavLink[] = [
  { label: "Services", href: "/partners/services" },
  { label: "Benefits", href: "/partners/benefits" },
  { label: "Pricing", href: "/partners/pricing" },
  { label: "Success Stories", href: "/partners/success-stories" },
];

export const riderMegaMenuColumns: NavColumn[] = [
  {
    heading: "Explore",
    links: exploreLinks,
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Safety Center", href: "/safety-center" },
      { label: "Contact Us", href: "/contact" },
      { label: "Membership", href: "/membership" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
];

export const partnerMegaMenuColumns: NavColumn[] = [
  {
    heading: "Grow with BIKIE",
    links: growWithBikieLinks,
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export const riderFooterColumns: NavColumn[] = [
  {
    heading: "Explore",
    links: exploreLinks,
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Safety Center", href: "/safety-center" },
      { label: "Contact", href: "/contact" },
      { label: "Membership", href: "/membership" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
];

export const partnerFooterColumns: NavColumn[] = [
  {
    heading: "Grow with BIKIE",
    links: growWithBikieLinks,
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export const legalFooterColumn: NavColumn = {
  heading: "Legal",
  links: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

export function otherRole(role: SelectedRole): SelectedRole {
  return role === "SERVICE_PROVIDER" ? "RIDER" : "SERVICE_PROVIDER";
}

export function switchRoleLabel(role: SelectedRole): string {
  return role === "SERVICE_PROVIDER" ? "Switch to Rider" : "Switch to Service Provider";
}
