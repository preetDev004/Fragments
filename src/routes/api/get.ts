import { Request, Response } from 'express';
import { createSuccessResponse } from '../../response';
import { listFragments, readFragment } from '../../model/data';

/**
 * Get a list of fragments for the current user.
 */
export const getUserFragmentsHandler = async (req: Request, res: Response): Promise<void> => {
  await listFragments(req.user! as string, true).then((fragments) => {
    res.status(fragments.length > 0 ? 200 : 204).json(createSuccessResponse({
      fragments: [...fragments],
    }));
  })
};


/**
 * Get a fragment for the current user.
 */
export const getUserFragmentHandler = async (req: Request, res: Response): Promise<void> => {
  await readFragment(req.user! as string, req.params.id).then((fragment) => {
    res.status(!fragment ? 404 : 200).json(createSuccessResponse({
      fragment: fragment,
    }));
  })
};
