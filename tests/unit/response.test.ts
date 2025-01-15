import { createErrorResponse, createSuccessResponse } from '../../src/response';

describe('API Responses', () => {
  test('createErrorResponse() should create proper error response object', () => {
    const errorResponse = createErrorResponse(404, 'not found');
    expect(errorResponse).toEqual({
      status: 'error',
      error: {
        code: 404,
        message: 'not found',
      },
    });
  });

  test('createSuccessResponse() should create basic success response when no data provided', () => {
    const successResponse = createSuccessResponse();
    expect(successResponse).toEqual({
      status: 'ok',
    });
  });

  test('createSuccessResponse() should include data in response when provided', () => {
    const data = { a: 1, b: 2 };
    const successResponse = createSuccessResponse(data);
    expect(successResponse).toEqual({
      status: 'ok',
      data: { a: 1, b: 2 }
    });
  });
});
