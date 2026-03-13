import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
<<<<<<< HEAD
import { Send, Mic, Smile, Image as ImageIcon, X, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
=======
import { Send, Mic, Smile, Image as ImageIcon, X, Timer, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)

interface PremiumChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onEmojiToggle: () => void;
  onMediaToggle: () => void;
<<<<<<< HEAD
=======
  onVoiceRecordingComplete?: (audioBlob: Blob, duration: number) => void;
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  showEmojiPicker: boolean;
  showMediaUpload: boolean;
  placeholder?: string;
  disabled?: boolean;
  uploading?: boolean;
  replyPreview?: React.ReactNode;
  className?: string;
  isEphemeral?: boolean;
  onToggleEphemeral?: () => void;
}

<<<<<<< HEAD
=======
// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' = 'light') => {
  if ('vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : 20);
  }
};

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
export function PremiumChatInput({
  value,
  onChange,
  onSend,
  onEmojiToggle,
  onMediaToggle,
<<<<<<< HEAD
  showEmojiPicker,
  showMediaUpload,
  placeholder = "Type a message...",
=======
  onVoiceRecordingComplete,
  showEmojiPicker,
  showMediaUpload,
  placeholder,
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  disabled = false,
  uploading = false,
  replyPreview,
  className,
  isEphemeral = false,
  onToggleEphemeral
}: PremiumChatInputProps) {
<<<<<<< HEAD
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

=======
  const { t } = useTranslation();
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  // Keep reference to latest recording duration for onstop callback
  const recordingDurationRef = useRef(0);
  useEffect(() => {
    recordingDurationRef.current = recordingDuration;
  }, [recordingDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      triggerHaptic('medium');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Audio analysis for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Waveform animation
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder setup
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg')
            ? 'audio/ogg'
            : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const dur = recordingDurationRef.current;

        if (dur >= 1 && onVoiceRecordingComplete) {
          onVoiceRecordingComplete(audioBlob, dur);
        } else if (dur < 1) {
          toast.info(t('hold_to_record', 'Hold longer to record'));
        }

        stopRecordingCleanup();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);

    } catch (err) {
      const error = err as Error;
      console.error('Microphone access error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please enable it in your device settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found on this device.');
      } else {
        toast.error('Failed to access microphone.');
      }
    }
  };

  // Stop recording and send
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  // Cancel recording
  const cancelRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    stopRecordingCleanup();
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioLevel(0);
    toast.info(t('recording_cancelled', 'Recording cancelled'));
  };

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
<<<<<<< HEAD

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (max 120px for desktop, 80px for mobile)
    const maxHeight = isMobile ? 80 : 120;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  }, [isMobile]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

=======
    textarea.style.height = 'auto';
    const maxHeight = isMobile ? 100 : 140;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [isMobile]);

  // Handle input change with proper UTF-8 handling
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const normalizedValue = e.target.value
      .normalize('NFC')
      .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    onChange(normalizedValue);
    adjustHeight();
  };

  // Handle key press — Enter to send, Shift+Enter for new line
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFocus();
    }
  };

  // CRITICAL: Send message and immediately re-focus the input
  // This prevents the keyboard from closing on mobile after each send
  const handleSendWithFocus = useCallback(() => {
    if (disabled || uploading) return;
    triggerHaptic('light');
    onSend();

    // Re-focus input immediately after send to keep keyboard open
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Reset height after clearing
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    });
  }, [onSend, disabled, uploading]);

>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
  // Auto-focus and adjust height on mount
  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

<<<<<<< HEAD
  // Focus input when reply preview is shown
  useEffect(() => {
    if (replyPreview && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyPreview]);

  const hasText = value.trim().length > 0;
  const showSendButton = hasText || uploading;

  return (
    <div className={cn(
      "bg-background/95 backdrop-blur-sm border-t border-border/20",
      "px-4 py-3 safe-area-bottom",
      className
    )}>
      {/* Reply Preview */}
      <AnimatePresence>
        {replyPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            {replyPreview}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* Left Side Buttons */}
        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEmojiToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              showEmojiPicker
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "hover:bg-secondary/50"
            )}
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          {/* Media Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMediaToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              showMediaUpload
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "hover:bg-secondary/50"
            )}
            aria-label="Attach media"
          >
            <ImageIcon className="w-5 h-5" />
          </motion.button>

          {/* Ephemeral (24h) Toggle */}
          {onToggleEphemeral && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleEphemeral}
              className={cn(
                "px-2 py-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all duration-200",
                isEphemeral
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/50"
                  : "text-muted-foreground hover:bg-secondary/50"
              )}
              aria-label="Toggle disappearing messages"
            >
              <span className="hidden sm:inline">24h</span>
              <Timer className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full px-4 py-3 rounded-2xl resize-none",
              "bg-secondary/50 backdrop-blur-sm border border-transparent",
              "text-foreground placeholder:text-muted-foreground",
              "outline-none transition-all duration-200",
              "focus:ring-2 focus:ring-primary/30 focus:border-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isFocused && "shadow-sm"
            )}
            style={{
              minHeight: '48px',
              maxHeight: isMobile ? '80px' : '120px',
            }}
          />
          
          {/* Character Counter (optional) */}
          {value.length > 500 && (
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground/60">
              {value.length}
            </div>
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-2">
          {/* Send / Mic Button */}
          <AnimatePresence mode="wait">
            {showSendButton ? (
=======
  // Prevent keyboard dismissal on mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling that could dismiss keyboard
      if (document.activeElement === inputRef.current) {
        e.preventDefault();
      }
    };

    if (isMobile && inputRef.current) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [isMobile]);

  // Focus input when reply preview is shown
  useEffect(() => {
    if (replyPreview && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [replyPreview]);

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show send button when there's text or media upload is shown
  const showSendButton = value.trim().length > 0 || showMediaUpload;

  return (
    <div className={cn(
      "bg-background/20 backdrop-blur-xl border-t border-border/10",
      "px-4 pt-3 pb-[env(safe-area-inset-bottom,16px)]",
      "w-full",
      className
    )}>
      <div className="w-full px-4 sm:px-8">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2"
            >
              {replyPreview}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Recording UI */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2"
            >
              <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-2xl">
                {/* Pulsing red dot */}
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Waveform bars */}
                <div className="flex-1 flex items-center gap-0.5 h-8">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive/60 rounded-full"
                      animate={{
                        height: `${6 + audioLevel * 20 + Math.sin(i * 0.5 + recordingDuration * 3) * 8}px`,
                      }}
                      transition={{ duration: 0.08 }}
                    />
                  ))}
                </div>

                {/* Duration */}
                <span className="text-sm font-mono font-medium text-destructive min-w-[3rem] text-right tabular-nums">
                  {formatDuration(recordingDuration)}
                </span>

                {/* Cancel button */}
                <button
                  onClick={cancelRecording}
                  className="p-2 rounded-xl hover:bg-destructive/20 transition-colors active:scale-90"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Container */}
      <div className="flex items-end gap-2 sm:gap-4 w-full px-4 sm:px-8">
        {/* Left Side Buttons */}
        {!isRecording && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Emoji Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { triggerHaptic(); onEmojiToggle(); }}
              className={cn(
                "p-2 rounded-xl transition-all duration-150",
                showEmojiPicker
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 active:bg-secondary/70"
              )}
              aria-label="Toggle emoji picker"
            >
              <Smile className="w-5 h-5" />
            </motion.button>

            {/* Media Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic();
                if (isMobile) {
                  const fileInput = document.getElementById('mobile-media-input') as HTMLInputElement;
                  if (fileInput) fileInput.click();
                } else {
                  onMediaToggle();
                }
              }}
              className={cn(
                "p-2 rounded-xl transition-all duration-150",
                showMediaUpload
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/50 active:bg-secondary/70"
              )}
              aria-label="Attach media"
            >
              <ImageIcon className="w-5 h-5" />
            </motion.button>

            {/* Ephemeral (24h) Toggle */}
            {onToggleEphemeral && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(); onToggleEphemeral(); }}
                className={cn(
                  "p-2 rounded-xl text-xs font-medium flex items-center gap-0.5 transition-all duration-150",
                  isEphemeral
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-muted-foreground hover:bg-secondary/50"
                )}
                aria-label="Toggle disappearing messages"
              >
                <Timer className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        )}

        {/* Text Input */}
        {!isRecording && (
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || t('type_message', 'Type a message...')}
              disabled={disabled}
              rows={1}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              className={cn(
                "w-full px-4 py-2.5 rounded-2xl resize-none",
                "bg-secondary/40 border border-transparent",
                "text-foreground placeholder:text-muted-foreground/60",
                "outline-none transition-all duration-150",
                "focus:bg-secondary/60 focus:border-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-[15px] leading-[1.4]"
              )}
              style={{
                minHeight: '42px',
                maxHeight: isMobile ? '100px' : '140px',
              }}
            />

            {/* Character Counter */}
            {value.length > 500 && (
              <div className="absolute bottom-1 right-3 text-[10px] text-muted-foreground/50 tabular-nums">
                {value.length}
              </div>
            )}
          </div>
        )}

        {/* Recording spacer */}
        {isRecording && <div className="flex-1" />}

        {/* Right Side Buttons */}
        <div className="flex items-center flex-shrink-0">
          <AnimatePresence mode="wait">
            {isRecording ? (
              /* Stop Recording & Send Button */
              <motion.button
                key="stop"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic('medium'); stopRecording(); }}
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-destructive text-destructive-foreground",
                  "shadow-lg shadow-destructive/25 active:shadow-destructive/15"
                )}
                aria-label="Stop recording and send"
              >
                <Square className="w-5 h-5" fill="currentColor" />
              </motion.button>
            ) : showSendButton ? (
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              <motion.button
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
<<<<<<< HEAD
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSend}
                disabled={disabled || uploading}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-200",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25 hover:shadow-primary/35",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "disabled:hover:scale-100"
=======
                whileTap={{ scale: 0.9 }}
                onClick={handleSendWithFocus}
                disabled={disabled || uploading}
                className={cn(
                  "p-2.5 rounded-xl",
                  "bg-primary text-primary-foreground",
                  "shadow-lg shadow-primary/25 active:shadow-primary/15",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-shadow duration-150"
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
                )}
                aria-label="Send message"
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
<<<<<<< HEAD
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 rounded-xl hover:bg-secondary/50 transition-all duration-200"
                aria-label="Record voice message"
              >
                <Mic className="w-5 h-5 text-muted-foreground" />
=======
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic(); startRecording(); }}
                className="p-2.5 rounded-xl text-muted-foreground hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
                aria-label="Record voice message"
              >
                <Mic className="w-5 h-5" />
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
<<<<<<< HEAD
=======

      {/* Hidden Mobile File Input */}
      {isMobile && (
        <input
          id="mobile-media-input"
          type="file"
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onMediaToggle();
              window.__selectedMobileFile = file;
            }
            e.target.value = '';
          }}
          className="hidden"
          capture="environment"
        />
      )}
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
    </div>
  );
}

// Reply Preview Component
export function ReplyPreview({
  username,
  content,
  onCancel,
  className
}: {
  username: string;
  content: string;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
<<<<<<< HEAD
      "flex items-center justify-between p-3 bg-secondary/50 rounded-xl border-l-4 border-primary",
      className
    )}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-primary mb-1">
=======
      "flex items-center justify-between p-2.5 bg-secondary/40 rounded-xl border-l-3 border-primary",
      className
    )}>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-primary mb-0.5">
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
          Replying to {username}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {content}
        </div>
      </div>
      <button
        onClick={onCancel}
<<<<<<< HEAD
        className="ml-2 p-1 rounded-lg hover:bg-secondary/70 transition-colors"
=======
        className="ml-2 p-1.5 rounded-lg hover:bg-secondary/60 transition-colors active:scale-90"
>>>>>>> 8c583bf (feat: implement reply system, performance optimizations, and premium README)
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
