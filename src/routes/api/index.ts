/**
 * The main entry point for the v1 version of the fragments API.
 */
import * as contentType from 'content-type';
import express, { Router } from 'express';
import Fragment from '../../model/fragment';
import getFragmentsHandler from './get';
import postFragmentsHandler from './post';

// Create a router to mount our API endpoints
const router = Router();

// Define the GET /v1/fragments route
router.get('/fragments', getFragmentsHandler);

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
      return Fragment.isSupportedType(type);
    }
  });
router.post('/fragments', rawBody(), postFragmentsHandler);

// Other routes (POST, DELETE, etc.) can be added here later on...

export default router;
