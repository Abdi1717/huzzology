/**
 * Logger utility for Huzzology
 * 
 * Provides consistent logging across the application.
 */

// Basic logger implementation - in a real app, use a library like Winston
class Logger {
  private moduleName: string;
  
  constructor(moduleName: string = 'app') {
    this.moduleName = moduleName;
  }
  
  /**
   * Create a scoped logger with a specific module name
   */
  scope(name: string): Logger {
    return new Logger(name);
  }
  
  /**
   * Log an info message
   */
  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }
  
  /**
   * Log an error message
   */
  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }
  
  /**
   * Log a verbose message
   */
  verbose(message: string, data?: any): void {
    this.log('VERBOSE', message, data);
  }
  
  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const formattedData = data ? JSON.stringify(data) : '';
    
    console.log(`[${timestamp}] [${level}] [${this.moduleName}] ${message} ${formattedData}`);
  }
}

// Export a singleton instance
export default new Logger(); 