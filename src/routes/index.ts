import { Router, Request, Response } from 'express';

// Import version and author from package.json
import { version, author } from '../../package.json';

// Import the API routes
import apiRoutes from './api';
import authModule from '../auth/index';
import { createSuccessResponse } from '../response';

// Create a router to mount our API
const router = Router();

/**
 * Expose all of our API routes on /v1/* to include an API version.
 */
router.use('/v1', authModule.authenticate(), apiRoutes);

/**
 * Define a simple health check route. If the server is running,
 * we'll respond with a 200 OK. If not, the server isn't healthy.
 */
router.get('/', (req: Request, res: Response) => {
  // Clients shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');

  // Send a 200 'OK' response
  res.status(200).json(
    createSuccessResponse({
      author,
      // Use your own GitHub URL
      githubUrl: 'https://github.com/preetDev004/Fragments',
      version,
    })
  );
});

export default router;
