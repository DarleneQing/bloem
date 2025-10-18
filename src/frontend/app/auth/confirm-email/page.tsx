import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConfirmEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ve sent you a confirmation link to verify your email address.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-left">
          <h2 className="font-semibold mb-2">What&apos;s next?</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 font-medium text-foreground">1.</span>
              <span>Open the email we sent you</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 font-medium text-foreground">2.</span>
              <span>Click the confirmation link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 font-medium text-foreground">3.</span>
              <span>You&apos;ll be automatically signed in</span>
            </li>
          </ol>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder.
          </p>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link href="/auth/sign-in">Back to Sign In</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-4 text-xs text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> The confirmation link will expire in 24 hours. If it
            expires, you&apos;ll need to sign up again or request a new confirmation email.
          </p>
        </div>
      </div>
    </div>
  );
}

