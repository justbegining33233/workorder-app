const logger = {
  info: (message: string, ...args: any[]) => {
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
  },
  debug: (message: string, ...args: any[]) => {
  },
};

export default logger;
