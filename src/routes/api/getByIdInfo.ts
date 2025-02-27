import Fragment from '../../model/fragment';
import { Request, Response } from 'express';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
/**
 * Get a fragment metadata for the current user.
 */
export const getUserFragmentByIdInfoHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await Fragment.byId(req.user! as string, req.params.id).then(async (fragment) => {
      res.status(200).json(
        createSuccessResponse({
          fragment: fragment,
        })
      );
    });
  } catch (error: unknown) {
    res
      .status(error instanceof FragError ? error.statusCode : 500)
      .json(
        createErrorResponse(
          error instanceof FragError ? error.statusCode : 500,
          error instanceof FragError
            ? error.message
            : (error as Error).message
              ? (error as Error).message
              : 'Did not find fragment!'
        )
      );
  }
};
