import { Download, File as FileIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageData } from '@/hooks/useChats';

interface MessageFileProps {
  message: MessageData;
  isOwnMessage: boolean;
}

export default function MessageFile({ message, isOwnMessage }: MessageFileProps) {
  if (!message.file_url) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(message.file_url!);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = message.file_metadata?.name || 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    // You could add more file type icons here
    return <FileIcon className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="relative group">
      <div 
        className={`
          rounded-lg border border-border bg-secondary/50 p-4 cursor-pointer
          hover:bg-secondary transition-colors
          ${isOwnMessage ? 'max-w-[300px]' : 'max-w-[250px]'}
        `}
        onClick={handleDownload}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-muted-foreground">
            {getFileIcon(message.file_metadata?.name || 'file')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {message.file_metadata?.name || 'File'}
            </div>
            {message.file_metadata?.size && (
              <div className="text-xs text-muted-foreground">
                {formatFileSize(message.file_metadata.size)}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="flex-shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
