import { Error } from 'mongoose';

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: any;
}

/**
 * Handle and format API errors with better error messages
 */
export function handleApiError(error: unknown): { error: string; status: number } {
  // MongoDB/Mongoose validation errors
  if (error instanceof Error.ValidationError) {
    const firstError = Object.values(error.errors)[0];
    return {
      error: firstError?.message || 'خطأ في التحقق من البيانات',
      status: 400,
    };
  }

  // MongoDB duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern || {})[0];
    return {
      error: `هذا ${field === 'name' ? 'الاسم' : field} موجود بالفعل`,
      status: 400,
    };
  }

  // MongoDB CastError (invalid ObjectId)
  if (error instanceof Error.CastError) {
    return {
      error: `معرف غير صالح: ${error.path}`,
      status: 400,
    };
  }

  // Error with message
  if (error instanceof Error) {
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      error: isDevelopment ? error.message : 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى',
      status: 500,
    };
  }

  // Unknown error
  return {
    error: 'حدث خطأ غير متوقع',
    status: 500,
  };
}

