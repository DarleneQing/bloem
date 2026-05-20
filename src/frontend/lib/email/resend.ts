import { Resend } from "resend";

// Lazy proxy so importing the module never throws — `new Resend(undefined)`
// raises synchronously, which would crash any test file that transitively
// pulls this in (e.g. via lib/email/audiences). The SDK is only constructed
// on first property access (e.g. `resend.contacts.create(...)`).
let cached: Resend | null = null;

function getClient(): Resend {
  if (cached) return cached;
  cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

