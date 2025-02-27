import { Request, Response } from 'express';
import Fragment from '../../model/fragment';
import { createSuccessResponse } from '../../response';

/**
 * Get a list of fragments for the current user.
 */
export const getUserFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  const expand = req.query.expand === '1';
  await Fragment.byUser(req.user! as string, expand).then((fragments) => {
    res.status(fragments.length > 0 ? 200 : 204).json(
      createSuccessResponse({
        fragments: [...fragments],
      })
    );
  });
};
