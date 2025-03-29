import { Request, Response } from 'express';
import logger from '../../logger';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
import Fragment from '../../model/fragment';

/**
 * delete many fragments for the current user.
 */
export const deleteUserFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const idsParam = req.query.ids;

    if (!idsParam) {
      res.status(400).json(createErrorResponse(400, 'No fragment IDs provided'));
      return;
    }

    const idArray: string[] = Array.isArray(idsParam)
      ? idsParam.map((id) => String(id)) // Ensure everything is a string
      : [String(idsParam)];

    console.log('Received IDs to delete:', idArray);

    await Fragment.deleteMany(req.user! as string, idArray);
    res.status(200).json(createSuccessResponse());
  } catch (error) {
    logger.error({ error }, 'Error deleting fragments');
    res
      .status(error instanceof FragError ? error.statusCode : 500)
      .json(
        createErrorResponse(
          error instanceof FragError ? error.statusCode : 500,
          error instanceof FragError
            ? error.message
            : (error as Error).message || 'Failed to delete fragments'
        )
      );
  }
};
