export class AppProcessingError extends Error {
  public code: string;
  public step: string;
  public details?: unknown;

  constructor(message: string, code = 'PROCESSING_ERROR', step = 'general', details?: unknown) {
    super(message);
    this.name = 'AppProcessingError';
    this.code = code;
    this.step = step;
    this.details = details;
  }
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof AppProcessingError) {
    return `[${err.step.toUpperCase()}] ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err || 'An unexpected error occurred during processing.');
}
