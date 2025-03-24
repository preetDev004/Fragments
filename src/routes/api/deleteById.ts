import { Request, Response } from 'express';
import logger from '../../logger';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
import Fragment from '../../model/fragment';

/**
 * Get a list of fragments for the current user.
 */
export const deleteUserFragmentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fragment = await Fragment.byId(req.user! as string, id);
    await Fragment.delete(fragment.ownerId, fragment.id);
    res.status(200).json(createSuccessResponse());
  } catch (error) {
    logger.error({ error }, 'Error deleting fragment');
    res
      .status(error instanceof FragError ? error.statusCode : 500)
      .json(
        createErrorResponse(
          error instanceof FragError ? error.statusCode : 500,
          error instanceof FragError
            ? error.message
            : (error as Error).message
              ? (error as Error).message
              : 'Did delete fragment!'
        )
      );
  }
};
