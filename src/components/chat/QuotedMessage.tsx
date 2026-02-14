import { cn } from '@/lib/utils';
import { sanitizeText } from '@/utils/sanitize';

interface QuotedMessageProps {
  senderName: string;
  content: string;
  isOwnMessage: boolean;
}

export function QuotedMessage({ senderName, content, isOwnMessage }: QuotedMessageProps) {
  return (
    <div 
      className={cn(
        "flex gap-2 mb-1.5 px-2 py-1.5 rounded-lg text-xs",
        isOwnMessage 
          ? "bg-white/10" 
          : "bg-foreground/5"
      )}
    >
      <div className={cn(
        "w-0.5 rounded-full flex-shrink-0",
        isOwnMessage ? "bg-white/40" : "bg-primary"
      )} />
      <div className="min-w-0 flex-1">
        <p className={cn(
          "font-medium truncate",
          isOwnMessage ? "text-white/80" : "text-primary"
        )}>
          {sanitizeText(senderName)}
        </p>
        <p className={cn(
          "truncate",
          isOwnMessage ? "text-white/60" : "text-muted-foreground"
        )}>
          {sanitizeText(content)}
        </p>
      </div>
    </div>
  );
}
