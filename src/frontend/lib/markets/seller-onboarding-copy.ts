export const SELLER_APPLICATION_REVIEW_DAYS = "3–5 business days";

export const SELLER_APPLICATION_REVIEW_MESSAGE = `Applications are reviewed within ${SELLER_APPLICATION_REVIEW_DAYS}.`;

export const SELLER_JOURNEY_STEPS = [
  {
    title: "Verify with Stripe",
    description:
      "Complete your bloem profile and verify your identity and bank details through Stripe so payouts can reach you.",
  },
  {
    title: "Apply to a market",
    description:
      "Choose a pop-up market and submit your seller application with style photos, brands, and how many items you plan to sell.",
  },
  {
    title: "Wait for review",
    description: `Our team reviews applications within ${SELLER_APPLICATION_REVIEW_DAYS}. You can edit your application while it is pending.`,
  },
  {
    title: "Reserve hangers",
    description:
      "Once approved, reserve the hangers you need for market day and pay the rental fee.",
  },
  {
    title: "Link items & sell",
    description:
      "Link your wardrobe items to QR codes, display them on the rack, and sell at the market.",
  },
  {
    title: "Receive payouts",
    description:
      "After sales, payouts are sent to your verified bank account through Stripe.",
  },
] as const;

export const SELLER_APPLICATION_EXPECTATIONS = [
  {
    title: "Style photos",
    description: "Upload 4–5 photos that show your personal style and the kinds of items you sell.",
  },
  {
    title: "Brands you sell",
    description: "Select the brands you typically list so buyers know what to expect from your rack.",
  },
  {
    title: "Item count",
    description: "Tell us roughly how many pieces you plan to bring to the market.",
  },
  {
    title: "Social consent",
    description:
      "Optionally allow bloem to feature your seller profile or items on social media.",
  },
  {
    title: "Volunteer option",
    description:
      "Volunteer at the market for a chance at commission-free sales on your items.",
  },
] as const;

export const SELLER_REQUIREMENTS = [
  {
    title: "A complete bloem profile",
    description: "Sign up and fill in your profile — your name, contact details, and address.",
  },
  {
    title: "Identity & bank verification",
    description:
      "Verify your identity and bank account through Stripe. Stripe securely collects your details so your payouts can reach you.",
  },
  {
    title: "Enrollment in a market",
    description:
      "Once verified, apply to a pop-up market and reserve the hangers you need to list your items.",
  },
] as const;

export const SELLER_BENEFITS = [
  "List items at pop-up markets",
  "Rent hangers at market locations",
  "Receive payouts to your bank account",
  "Optional volunteer perks for commission-free sales",
] as const;

export const SELLER_AFTER_APPROVAL = [
  "Reserve up to 20 hangers per market (default allocation)",
  "Link wardrobe items to QR codes before market day",
  "Display items on the rack and sell in person",
  "Track sales and payouts from your profile",
] as const;
