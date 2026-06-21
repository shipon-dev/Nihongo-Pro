"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Lock } from "lucide-react";

export function AdminAuth({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem("admin_auth") === "true");
  }, []);

  if (authenticated) return <>{children}</>;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <CardContent className="space-y-6 p-0">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black">Admin Authentication</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Enter your admin credentials to access this page.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Email
              </label>
              <Input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Password
              </label>
              <Input
                type="password"
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="••••••••"
                className="h-12 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document.getElementById("admin-login-btn")?.click();
                  }
                }}
              />
            </div>
            <Button
              id="admin-login-btn"
              onClick={() => {
                if (
                  authEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
                  authPass === process.env.NEXT_PUBLIC_ADMIN_PASS
                ) {
                  sessionStorage.setItem("admin_auth", "true");
                  setAuthenticated(true);
                  toast({
                    variant: "success",
                    title: "Access Granted",
                    description: "Welcome to the Admin Control Deck.",
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Invalid email or password.",
                  });
                }
              }}
              variant="premium"
              className="w-full h-12 text-base font-bold rounded-xl"
            >
              <Lock className="h-4 w-4" /> Unlock Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}