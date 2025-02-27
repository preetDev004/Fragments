import { Request, Response } from 'express';
import Fragment from '../../model/fragment';
import { createErrorResponse, FragError } from '../../response';
/**
 * Get a fragment for the current user.
 */
export const getUserFragmentByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the fragment first
    const fragment = await Fragment.byId(req.user! as string, req.params.id);
    // Get the data
    const data = await fragment.getData();

    // Set headers before sending the response
    res.setHeader('Content-Length', fragment.size);
    res.setHeader('Content-Type', fragment.type);

    // Send the response
    res.status(200).send(data);
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
