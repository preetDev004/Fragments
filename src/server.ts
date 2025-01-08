import app from './app';
import logger from './logger';
import stoppable from 'stoppable';

const port = parseInt(process.env.PORT || '8080', 10);

const server = stoppable(
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  })
);

export default server;
