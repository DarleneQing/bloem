import Link from "next/link";
import { Mail, Instagram, Linkedin } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants/social-links";
import { DISCOVER_LINKS, COMPANY_LINKS, LEGAL_LINKS } from "@/lib/constants/navigation-links";

interface FooterProps {
  onContactClick?: () => void;
  variant?: "default" | "about";
}

export function Footer({ onContactClick, variant = "default" }: FooterProps) {
  const isAboutVariant = variant === "about";
  const paddingTop = isAboutVariant ? "pt-16" : "pt-12";
  const paddingBottom = isAboutVariant ? "pb-8" : "pb-6";
  const borderTop = isAboutVariant ? "border-t border-gray-100" : "";
  const gap = isAboutVariant ? "gap-10" : "gap-8";
  const pb = isAboutVariant ? "pb-12" : "pb-8";
  const mb = isAboutVariant ? "mb-6" : "mb-4";
  const textSize = isAboutVariant ? "text-3xl" : "text-2xl";
  const headingSize = isAboutVariant ? "text-lg" : "";
  const linkSpacing = isAboutVariant ? "space-y-4" : "space-y-3";
  const iconSize = isAboutVariant ? 22 : 20;
  const iconWrapperSize = isAboutVariant ? "w-12 h-12" : "w-10 h-10";
  const iconHoverClass = isAboutVariant
    ? "hover:bg-brand-lavender hover:text-white hover:-translate-y-1 transition-all duration-300"
    : "hover:bg-brand-lavender/40 transition-colors";
  const linkHoverClass = isAboutVariant
    ? "hover:text-primary transition-colors hover:pl-2 inline-block"
    : "hover:text-primary transition-colors";
  const legalSpacing = isAboutVariant ? "space-x-8" : "space-x-6";

  const renderContactLink = () => {
    if (onContactClick) {
      return (
        <button
          onClick={onContactClick}
          className={linkHoverClass}
        >
          Contact
        </button>
      );
    }
    return (
      <Link href="#" className={linkHoverClass}>
        Contact
      </Link>
    );
  };

  return (
    <footer className={`bg-gray-50 ${paddingTop} ${paddingBottom} ${borderTop}`}>
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-1 md:grid-cols-4 ${gap} ${pb}`}>
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className={`inline-block ${mb} group`}>
              <span className={`font-bold text-primary ${textSize} ${isAboutVariant ? "group-hover:text-brand-purple transition-colors" : ""}`}>
                bloem
              </span>
            </Link>
            <p className={`text-muted-foreground ${mb} max-w-md ${isAboutVariant ? "leading-relaxed" : ""}`}>
              Revolutionizing sustainable fashion through our innovative digital wardrobe and physical rack exchange system.
            </p>
            <div className="flex space-x-4">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconWrapperSize} rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary ${iconHoverClass}`}
              >
                <Instagram size={iconSize} />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconWrapperSize} rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary ${iconHoverClass}`}
              >
                <Linkedin size={iconSize} />
              </a>
              <a
                href={SOCIAL_LINKS.email}
                className={`${iconWrapperSize} rounded-full bg-brand-lavender/20 flex items-center justify-center text-primary ${iconHoverClass}`}
              >
                <Mail size={iconSize} />
              </a>
            </div>
          </div>

          {/* Discover Column */}
          <div>
            <h3 className={`font-semibold text-foreground ${mb} ${headingSize}`}>Discover</h3>
            <ul className={linkSpacing}>
              {DISCOVER_LINKS.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a href={link.href} className={linkHoverClass}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={linkHoverClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className={`font-semibold text-foreground ${mb} ${headingSize}`}>Company</h3>
            <ul className={linkSpacing}>
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  {link.label === "Contact" ? (
                    renderContactLink()
                  ) : (
                    <Link href={link.href} className={linkHoverClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} bloem. All rights reserved.
            </p>
            <div className={`flex ${legalSpacing} mt-4 md:mt-0`}>
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

