export interface SuccessResponse {
  status: 'ok';
  data?: unknown;
}

export interface ErrorResponse {
  status: 'error';
  error: {
    code: number;
    message: string;
  }
}

/**
 * A successful response looks like:
 *
 * {
 *   "status": "ok",
 *   ...
 * }
 */
export const createSuccessResponse = (data?: unknown) : SuccessResponse => {
  console.log('createSuccessResponse', data);
  return {
    status: 'ok',
    data,
  };
};

/**
 * An error response looks like:
 *
 * {
 *   "status": "error",
 *   "error": {
 *     "code": 400,
 *     "message": "invalid request, missing ...",
 *   }
 * }
 */
export const createErrorResponse = (code: number, message: string) : ErrorResponse => {
  return {
    status: 'error',
    error : {
      code: code,
      message: message
    }
  };
};
