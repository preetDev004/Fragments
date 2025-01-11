/**
 * The main entry point for the v1 version of the fragments API.
 */
import { Router } from 'express';
import getFragmentsHandler from './get'

// Create a router to mount our API endpoints
const router = Router();

// Define the GET /v1/fragments route

router.get('/fragments', getFragmentsHandler);

// Other routes (POST, DELETE, etc.) can be added here later on...

export default router;
