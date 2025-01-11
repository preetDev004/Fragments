import { Request, Response } from 'express';

/**
 * Get a list of fragments for the current user.
 */
const getFragmentsHandler = (req: Request, res: Response): void => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  res.status(200).json({
    status: 'ok',
    // TODO: change me
    fragments: [],
  });
};

export default getFragmentsHandler;
