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

// Create a router to mount our API endpoints
const router = Router();

// Define the GET /v1/fragments route
router.get('/fragments', getUserFragmentsHandler);

// Define the GET /v1/fragments/:id.:ext route
router.get('/fragments/:id.:ext', getConvertedUserFragmentHandler);

// Define the GET /v1/fragments/:id route
router.get('/fragments/:id', getUserFragmentByIdHandler);

// Define the GET /v1/fragments/:id/info route
router.get('/fragments/:id/info', getUserFragmentInfoHandler);

// Define the DELETE /v1/fragments/:id route
router.delete('/fragments/:id', deleteUserFragmentHandler);

// Define the POST /v1/fragments route
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      logger.debug({ type }, 'Received fragment TYPE');
      return Fragment.isSupportedType(type);
    },
  });
router.post('/fragments', rawBody(), postFragmentsHandler);

// Other routes (POST, DELETE, etc.) can be added here later on...

export default router;
