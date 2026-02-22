"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent, type ClipboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "staff_authenticated";

interface StaffAuthGateProps {
  children: ReactNode;
  onLock?: () => void;
}

export function StaffAuthGate({ children, onLock }: StaffAuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setPin(["", "", "", ""]);
    setError(null);
    onLock?.();
  }, [onLock]);

  const verifyPin = useCallback(async (fullPin: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/staff/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: fullPin }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(STORAGE_KEY, "true");
        setIsAuthenticated(true);
        toast.success("Staff access granted");
      } else {
        setError(data.error ?? "Invalid PIN");
        setPin(["", "", "", ""]);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch {
      setError("Failed to verify PIN. Please try again.");
      setPin(["", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Only allow single digits
      const digit = value.replace(/\D/g, "").slice(-1);

      setPin((prev) => {
        const next = [...prev];
        next[index] = digit;

        // Auto-submit when all 4 digits entered
        if (digit && index === 3 && next.every((d) => d !== "")) {
          setTimeout(() => verifyPin(next.join("")), 50);
        }

        return next;
      });

      // Auto-focus next input
      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [verifyPin]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "Enter") {
        const fullPin = pin.join("");
        if (fullPin.length === 4) {
          verifyPin(fullPin);
        }
      }
    },
    [pin, verifyPin]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
      if (pasted.length === 4) {
        const digits = pasted.split("");
        setPin(digits);
        inputRefs.current[3]?.focus();
        setTimeout(() => verifyPin(pasted), 50);
      }
    },
    [verifyPin]
  );

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLock}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Lock className="h-4 w-4" />
            Lock
          </Button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Staff Access</CardTitle>
          <CardDescription>Enter staff PIN to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={pin[index] ?? ""}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isVerifying}
                className="w-14 h-14 text-center text-2xl font-bold border-2 focus:border-amber-500 focus:ring-amber-500"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center mb-3">{error}</p>
          )}

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StaffLockButton({ onLock }: { onLock: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onLock}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Lock className="h-4 w-4" />
      Lock
    </Button>
  );
}
