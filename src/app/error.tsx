"use client";

import { AlertCircle, Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  const copyToClipboard = () => {
    const errorText = `Error: ${error.message}\nStack: ${error.stack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      setHasCopied(true);
      toast.success("Error details copied to clipboard");
      setTimeout(() => setHasCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="pt-9 pb-8 px-8 flex flex-col items-center">
          <div className="rounded-full bg-primary/10 p-4 mb-6">
            <AlertCircle className="h-10 w-10 text-primary" />
          </div>

          <h2 className="text-2xl font-medium mb-2">Oops, something went wrong</h2>

          <p className="text-muted-foreground text-center mb-8">
            {process.env.NODE_ENV === "production"
              ? "Try editing the app and ask the AI to fix it."
              : "Try asking the AI to fix it."}
          </p>

          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mb-6 border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex w-full justify-between p-4 rounded-none hover:bg-muted">
                <span className="font-medium">Error Details</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 bg-muted/50 space-y-2 text-sm font-mono overflow-auto max-h-[200px]">
                <div>
                  <span className="font-semibold">Message:</span> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <span className="font-semibold">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-xs">{error.stack}</pre>
                  </div>
                )}
              </div>
              <div className="p-3 border-t flex justify-end">
                <Button variant="outline" size="sm" className="text-xs" onClick={copyToClipboard}>
                  {hasCopied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy to clipboard
                    </>
                  )}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-4 w-full justify-center">
            <Button variant="secondary" className="min-w-[120px]" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button className="min-w-[120px]" onClick={() => reset()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
