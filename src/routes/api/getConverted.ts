import { Request, Response } from 'express';
import logger from '../../logger';
import Fragment, { VALID_FRAGMENT_CONVERSIONS } from '../../model/fragment';
import { createErrorResponse, FragError } from '../../response';
import {
  csvToJson,
  csvToText,
  extToMimeType,
  htmlToText,
  jsonToText,
  jsonToYaml,
  markdownToHtml,
  markdownToText,
  yamlToText,
  convertImage, // Add this import
} from '../../utils/converter';

export const getConvertedUserFragmentHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, ext } = req.params;
    const fragment = await Fragment.byId(req.user! as string, id);

    // Convert extension to target MIME type
    const targetType = extToMimeType(ext);
    const sourceType = fragment.mimeType;

    // Check if conversion is supported
    const supportedConversions =
      VALID_FRAGMENT_CONVERSIONS[sourceType as keyof typeof VALID_FRAGMENT_CONVERSIONS] || [];
    if (!supportedConversions.includes(targetType) && targetType !== sourceType) {
      throw new FragError(
        `Conversion not possible for ${sourceType} fragment to ${targetType}`,
        400
      );
    }

    // Get fragment data
    const data = await fragment.getData();
    let convertedContent: string | Buffer = data;

    // Handle conversions
    if (sourceType === targetType) {
      // No conversion needed
      convertedContent = data;
    } else if (sourceType.startsWith('image/') && targetType.startsWith('image/')) {
      // Handle image conversions
      convertedContent = await convertImage(data, sourceType, targetType);
    } else if (sourceType === 'text/markdown' && targetType === 'text/html') {
      convertedContent = markdownToHtml(data.toString());
    } else if (sourceType === 'text/markdown' && targetType === 'text/plain') {
      convertedContent = markdownToText(data.toString());
    } else if (sourceType === 'text/html' && targetType === 'text/plain') {
      convertedContent = htmlToText(data.toString());
    } else if (sourceType === 'text/csv' && targetType === 'text/plain') {
      convertedContent = csvToText(data.toString());
    } else if (sourceType === 'text/csv' && targetType === 'application/json') {
      convertedContent = csvToJson(data.toString());
    } else if (sourceType === 'application/json' && targetType === 'text/plain') {
      convertedContent = jsonToText(data.toString());
    } else if (sourceType === 'application/json' && targetType === 'text/yaml') {
      convertedContent = jsonToYaml(data.toString());
    } else if (sourceType === 'application/yaml' && targetType === 'text/plain') {
      convertedContent = yamlToText(data.toString());
    } else {
      throw new FragError(`Conversion from ${sourceType} to ${targetType} is not implemented`, 500);
    }

    logger.debug({ sourceType, targetType }, 'Conversion completed');

    // Set Content-Type header based on the target type
    res.setHeader('Content-Type', targetType);
    res.status(200).send(convertedContent);
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
