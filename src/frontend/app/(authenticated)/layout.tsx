import { ProtectedRoute } from "@/components/auth/protected-route";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-16 md:pb-0">
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
            {children}
            <Analytics/>
            <SpeedInsights/>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}

