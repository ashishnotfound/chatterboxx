// Production-ready logger utility
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  userId?: string;
}

class Logger {
  private isProduction = import.meta.env.PROD;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private createLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.getUserId(),
    };
  }

  private getUserId(): string | undefined {
    // Try to get user ID from auth context or localStorage
    try {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private log(entry: LogEntry) {
    // Store in memory for debugging
    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, only log errors and warnings
    if (this.isProduction) {
      if (entry.level === 'error') {
        // Send to error reporting service
        this.reportError(entry);
      } else if (entry.level === 'warn') {
        console.warn(entry.message, entry.context);
      }
    } else {
      // Development: log everything
      const logMethod = entry.level === 'error' ? 'error' : 
                       entry.level === 'warn' ? 'warn' : 
                       entry.level === 'debug' ? 'debug' : 'log';
      
      console[logMethod](entry.message, entry.context);
    }
  }

  private reportError(entry: LogEntry) {
    // In production, send to error reporting service
    // This is where you'd integrate with Sentry, LogRocket, etc.
    console.error('PRODUCTION ERROR:', entry);
    
    // You could also send to your own endpoint
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
  }

  info(message: string, context?: any) {
    this.log(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: any) {
    this.log(this.createLogEntry('warn', message, context));
  }

  error(message: string, context?: any) {
    this.log(this.createLogEntry('error', message, context));
  }

  debug(message: string, context?: any) {
    if (!this.isProduction) {
      this.log(this.createLogEntry('debug', message, context));
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Replace console methods in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}
