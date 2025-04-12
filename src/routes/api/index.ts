/**
 * The main entry point for the v1 version of the fragments API.
 */
import * as contentType from 'content-type';
import express, { Router } from 'express';
import Fragment from '../../model/fragment';
import { getUserFragmentsHandler } from './get';
import { getUserFragmentByIdHandler } from './getById';
import postFragmentsHandler from './post';
import { getUserFragmentInfoHandler } from './getByIdInfo';
import { getConvertedUserFragmentHandler } from './getConverted';
import logger from '../../logger';
import { deleteUserFragmentHandler } from './deleteById';
import { deleteUserFragmentsHandler } from './deleteMany';
import { putUserFragmentHandler } from './putById';

// Create a router to mount our API endpoints
const router = Router();

// Define the rawBody middleware
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      logger.debug({ type }, 'Received fragment TYPE');
      return Fragment.isSupportedType(type);
    },
  });
// Define routes
router.get('/fragments', getUserFragmentsHandler);
router.get('/fragments/:id.:ext', getConvertedUserFragmentHandler);
router.get('/fragments/:id', getUserFragmentByIdHandler);
router.get('/fragments/:id/info', getUserFragmentInfoHandler);
router.delete('/fragments/:id', deleteUserFragmentHandler);
router.delete('/fragments', deleteUserFragmentsHandler);
router.put('/fragments/:id', rawBody(), putUserFragmentHandler);
router.post('/fragments', rawBody(), postFragmentsHandler);

export default router;
