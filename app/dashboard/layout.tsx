import Navigation from "@/components/Navigation";
import ProductTour from "@/components/ui/ProductTour";
import AriaChatbot from "@/components/ui/AriaChatbot";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-gray-950 flex flex-col">
      {/* Desktop: sidebar | Mobile: bottom nav */}
      <div className="flex flex-1 overflow-hidden">
        <Navigation />
        <main className="flex-1 overflow-y-auto pb-28 md:pb-0 md:pl-0">
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
