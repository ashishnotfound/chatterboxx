import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onSubmit: (data: { reason: string; details: string }) => Promise<void> | void;
}

const REASONS = [
  'Harassment or abuse',
  'Spam or scams',
  'Hate speech or threats',
  'Inappropriate content',
  'Other',
];

export function ReportUserModal({
  open,
  onOpenChange,
  username,
  onSubmit,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ reason, details: details.trim() });
      setDetails('');
      setReason(REASONS[0]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {username}</DialogTitle>
          <DialogDescription>
            Let us know what’s happening so we can review this conversation. Your report is sent securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Reason</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm border transition-colors text-left',
                    reason === r
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border hover:bg-secondary/60 text-foreground'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Details (optional)</p>
              <span className="text-[11px] text-muted-foreground">
                {details.length}/400
              </span>
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 400))}
              placeholder="Add any context, specific messages, or timestamps that will help our team review this."
              className="w-full px-3 py-2 border border-border rounded-lg resize-none h-28 focus:outline-none focus:ring-2 focus:ring-destructive/60 focus:border-transparent text-sm bg-secondary/40"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary/60 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors',
              submitting && 'opacity-70 cursor-not-allowed'
            )}
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Send report'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

