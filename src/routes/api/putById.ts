import { Request, Response } from 'express';
import * as contentType from 'content-type';
import Fragment from '../../model/fragment';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
import logger from '../../logger';
import { validateFragmentContent } from '../../utils/formatValidator';

export const putUserFragmentHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { body } = req;

    // Check if body is a Buffer
    if (!Buffer.isBuffer(body)) {
      logger.error('Unsupported content type');
      res.status(415).json(createErrorResponse(415, 'Unsupported content type'));
      return;
    }

    // Get the existing fragment
    const fragment = await Fragment.byId(req.user! as string, id);

    // Parse the incoming content type
    const { type: newType } = contentType.parse(req);
    const { type: existingType } = contentType.parse(fragment.type);

    // Check that the MIME type (without parameters) matches
    if (newType !== existingType) {
      throw new FragError(
        `Cannot update fragment with different MIME type. Expected: ${existingType}, Received: ${newType}`,
        400
      );
    }

    // Validate the content
    const inValid = await validateFragmentContent(req.headers['content-type'] as string, body);
    if (inValid) {
      throw new FragError(inValid, 400);
    }

    // Update the fragment data
    await fragment.setData(body);

    res.status(200).json(
      createSuccessResponse({
        fragment,
      })
    );
  } catch (error) {
    logger.error({ error }, 'Error updating fragment');
    res
      .status(error instanceof FragError ? error.statusCode : 500)
      .json(
        createErrorResponse(
          error instanceof FragError ? error.statusCode : 500,
          error instanceof FragError
            ? error.message
            : (error as Error).message || 'Failed to update fragment'
        )
      );
  }
};
