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
    const content = data.toString();
    let convertedContent: string;

    // Handle conversions
    if (sourceType === targetType) {
      // No conversion needed
      convertedContent = content;
    } else if (sourceType === 'text/markdown' && targetType === 'text/html') {
      convertedContent = markdownToHtml(content);
    } else if (sourceType === 'text/markdown' && targetType === 'text/plain') {
      convertedContent = markdownToText(content);
    } else if (sourceType === 'text/html' && targetType === 'text/plain') {
      convertedContent = htmlToText(content);
    } else if (sourceType === 'text/csv' && targetType === 'text/plain') {
      convertedContent = csvToText(content);
    } else if (sourceType === 'text/csv' && targetType === 'application/json') {
      convertedContent = csvToJson(content);
    } else if (sourceType === 'application/json' && targetType === 'text/plain') {
      convertedContent = jsonToText(content);
    } else if (sourceType === 'application/json' && targetType === 'text/yaml') {
      convertedContent = jsonToYaml(content);
    } else if (sourceType === 'application/yaml' && targetType === 'text/plain') {
      convertedContent = yamlToText(content);
    } else {
      throw new FragError(`Conversion from ${sourceType} to ${targetType} is not implemented`, 500);
    }

    logger.debug({ sourceType, targetType, convertedContent }, 'Conversion completed');

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
