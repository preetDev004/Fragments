import { Request, Response } from 'express';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
import Fragment from '../../model/fragment';

/**
 * Get a list of fragments for the current user.
 */
export const getUserFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  await Fragment.byUser(req.user! as string).then((fragments) => {
    res.status(fragments.length > 0 ? 200 : 204).json(
      createSuccessResponse({
        fragments: [...fragments],
      })
    );
  });
};

/**
 * Get a fragment for the current user.
 */
export const getUserFragmentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    await Fragment.byId(req.user! as string, req.params.id).then((fragment) => {
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
          (error as Error).message ? (error as Error).message : 'Did not find fragment!'
        )
      );
  }
};
