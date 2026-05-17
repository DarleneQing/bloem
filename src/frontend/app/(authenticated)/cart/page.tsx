import { redirect } from "next/navigation";

/**
 * Cart route redirects to the unified checkout experience.
 */
export default function CartPage() {
  redirect("/checkout");
}
