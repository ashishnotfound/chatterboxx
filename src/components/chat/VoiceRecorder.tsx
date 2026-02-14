import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

/**
 * Voice recorder component with hold-to-record functionality
 * Supports cancel by sliding finger (mobile) or cancel button
 */
export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [canSend, setCanSend] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Update audio level for waveform
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyser.fftSize);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/ogg')
          ? 'audio/ogg'
          : 'audio/mp4'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const durationSeconds = duration;
        
        if (durationSeconds >= 0.5 && canSend) {
          onRecordingComplete(audioBlob, durationSeconds);
        }
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setCanSend(false);
      setDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 0.1;
          // Enable send after 0.5 seconds
          if (newDuration >= 0.5) {
            setCanSend(true);
          }
          return newDuration;
        });
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording && !isSliding && canSend) {
      stopRecording();
    } else if (isRecording) {
      stopRecording();
      onCancel();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setCurrentY(touch.clientY);
    setIsSliding(false);
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    setCurrentY(touch.clientY);
    
    // If sliding up more than 50px, show cancel state
    if (deltaY < -50) {
      setIsSliding(true);
    } else {
      setIsSliding(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isRecording) return;
    
    const deltaY = currentY - startY;
    
    // If slid up (cancel), don't send
    if (deltaY < -50 || !canSend) {
      stopRecording();
      onCancel();
    } else {
      stopRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-x-0 bottom-0 z-50 p-4 bg-background/95 backdrop-blur-lg border-t border-border"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto">
          {/* Cancel indicator */}
          {isSliding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Slide up to cancel
            </motion.div>
          )}

          {/* Recording UI */}
          <div className="flex items-center gap-4">
            {/* Waveform visualization */}
            <div className="flex-1 flex items-center gap-1 h-12">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{
                    height: isRecording 
                      ? `${20 + audioLevel * 30 + Math.sin(i * 0.5 + duration * 2) * 10}px`
                      : '4px',
                    opacity: isRecording ? 0.8 : 0.3
                  }}
                  transition={{ duration: 0.1 }}
                />
              ))}
            </div>

            {/* Duration */}
            <div className="text-sm font-medium text-foreground min-w-[3rem] text-center">
              {formatDuration(duration)}
            </div>

            {/* Record button */}
            <motion.button
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center transition-all
                ${isRecording 
                  ? 'bg-destructive scale-110' 
                  : isSliding
                  ? 'bg-destructive/50'
                  : 'bg-primary'
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? (
                <motion.div
                  className="w-6 h-6 rounded bg-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Send button (shown after recording stops) */}
            {!isRecording && canSend && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => {
                  // Recording already stopped, trigger completion
                  if (mediaRecorderRef.current) {
                    stopRecording();
                  }
                }}
                className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            )}

            {/* Cancel button */}
            {!isRecording && (
              <button
                onClick={onCancel}
                className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-center text-muted-foreground mt-2">
            {isRecording 
              ? isSliding 
                ? 'Release to cancel'
                : 'Release to send, slide up to cancel'
              : 'Hold to record voice message'
            }
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
