import { Request, Response } from 'express';
import { createSuccessResponse } from '../../response';
import { listFragments } from '../../model/data';

/**
 * Get a list of fragments for the current user.
 */
const getFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  await listFragments(req.user! as string, true).then((fragments) => {
    res.status(200).json(createSuccessResponse({
      fragments: fragments,
    }));
  })
};

export default getFragmentsHandler;
