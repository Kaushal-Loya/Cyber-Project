import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface HashDisplayProps {
  hash: string;
  label?: string;
  algorithm?: string;
  className?: string;
  truncate?: boolean;
}

export function HashDisplay({ hash, label, algorithm, className, truncate = true }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayHash = truncate && hash.length > 32 
    ? `${hash.slice(0, 16)}...${hash.slice(-16)}`
    : hash;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-1", className)}>
      {(label || algorithm) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {algorithm && (
            <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono uppercase">
              {algorithm}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <code className="flex-1 font-mono text-xs bg-muted/50 px-3 py-2 rounded border border-border text-muted-foreground break-all">
          {displayHash}
        </code>
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-muted rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
