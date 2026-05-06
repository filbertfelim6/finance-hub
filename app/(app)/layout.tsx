"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { DisplayCurrencyProvider } from "@/lib/context/display-currency-context";
import { PrivacyProvider } from "@/lib/context/privacy-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DisplayCurrencyProvider>
      <PrivacyProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <Toaster />
      </PrivacyProvider>
      </DisplayCurrencyProvider>
    </QueryClientProvider>
  );
}
