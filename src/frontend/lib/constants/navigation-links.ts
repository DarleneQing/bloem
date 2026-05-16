/**
 * Navigation links for footer
 */

export interface NavigationLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export const DISCOVER_LINKS: NavigationLink[] = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Locations", href: "/markets" },
  { label: "Our Mission", href: "#together-we-bloem" },
  { label: "Sustainability", href: "#what-bloem-stands-for" },
];

export const COMPANY_LINKS: NavigationLink[] = [
  { label: "About Us", href: "/about" },
  { label: "Partners", href: "#" },
  { label: "Press", href: "#" },
  { label: "Contact", href: "#" },
];

export const LEGAL_LINKS: NavigationLink[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookies", href: "#" },
];

