import { Request, Response } from 'express';
import Fragment from '../../model/fragment';
import { createErrorResponse, createSuccessResponse, FragError } from '../../response';
import logger from '../../logger';
import { validateFragmentContent } from '../../utils/formatValidator';

const postFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = req;
    if (!Buffer.isBuffer(body)) {
      logger.error('Unsupported content type');
      res.status(415).json(createErrorResponse(415, 'Unsupported content type'));
      return;
    }
    const inValid = validateFragmentContent(req.headers['content-type']! as string, body.toString())
    if(!inValid){
      throw new FragError("Invalid Content, Failed to parse!", 400)
    }

    logger.debug({ body }, 'Received fragment');
    const fragment = new Fragment({
      ownerId: req.user! as string,
      type: req.headers['content-type']! as string,
      size: Buffer.byteLength(body),
    });

    await fragment.setData(body);
    await fragment.save();
    logger.debug({ fragment }, 'Fragment saved');

    const apiUrl = process.env.API_URL || `${req.protocol}://${req.headers.host}`;

    res.header('location', `${apiUrl}/v1/fragments`);
    res.status(201).json(
      createSuccessResponse({
        fragments: [fragment],
      })
    );
  } catch (error: unknown) {
    logger.error({ error }, 'Unable to add the fragment');
    res
      .status(error instanceof FragError ? error.statusCode : 500)
      .json(
        createErrorResponse(
          error instanceof FragError ? error.statusCode : 500,
          error instanceof FragError ? error.message : (error as Error).message ? (error as Error).message : 'Unable to add the fragment'
        )
      );
  }
};

export default postFragmentsHandler;
