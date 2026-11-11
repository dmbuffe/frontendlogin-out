"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Bar */}
        <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Parking Management System
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dashboard Overview
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
          >
            Logout
          </Button>
        </header>
+
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Account Overview
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              User authentication status & active session details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Authenticated</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your active JWT session is securely stored in LocalStorage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}