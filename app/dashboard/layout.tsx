import Navigation from "@/components/Navigation";
import ProductTour from "@/components/ui/ProductTour";
import AriaChatbot from "@/components/ui/AriaChatbot";
import NotificationScheduler from "@/components/NotificationScheduler";
import PageBackground from "@/components/ui/PageBackground";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--surface-1)" }}>
      <PageBackground />
      <NotificationScheduler />
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Navigation />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-28 md:pb-0 md:pl-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      <ProductTour />
      <AriaChatbot />
    </div>
  );
}
