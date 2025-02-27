import { Request, Response } from 'express';
import logger from '../../logger';
import Fragment from '../../model/fragment';
import MarkdownIt from 'markdown-it';
import { createErrorResponse, FragError } from '../../response';

export const getConvertedUserFragmentHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, ext } = req.params;
    const fragment = await Fragment.byId(req.user! as string, id);

    if (!(fragment.type === 'text/markdown' && ext === 'html')) {
      throw new FragError(`Conversion not possible for ${fragment.type} fragment to ${ext}`, 400);
    }
    const data = await fragment.getData();

    const md = new MarkdownIt();
    const htmlContent = md.render(data.toString());
    logger.debug({ htmlContent }, 'HTML Content');

    // Set headers before sending the response
    res.setHeader('Content-Type', 'text/html');

    res.status(200).send(htmlContent);
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
              : 'Conversion Failed!'
        )
      );
  }
};
