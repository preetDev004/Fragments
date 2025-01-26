export interface SuccessResponse {
  status: 'ok';
  data?: unknown;
}

export interface ErrorResponse {
  status: 'error';
  error: {
    code: number;
    message: string;
  };
}

export const createSuccessResponse = (data?: object): SuccessResponse => {
  return {
    status: 'ok',
    ...data,
  };
};

export const createErrorResponse = (code: number, message: string): ErrorResponse => {
  return {
    status: 'error',
    error: {
      code: code,
      message: message,
    },
  };
};
