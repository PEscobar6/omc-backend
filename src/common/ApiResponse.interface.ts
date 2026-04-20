export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, any>;
}

export function ok<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponse<T> {
  return { success: true, data, message, meta };
}

export function created<T>(data: T, message = 'Resource created successfully'): ApiResponse<T> {
  return { success: true, data, message };
}