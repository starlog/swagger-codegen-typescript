import * as path from 'path';
import * as http from 'http';
import * as oas3Tools from 'felix-oas3-tools';
import { Oas3AppOptions } from 'felix-oas3-tools/dist/middleware/oas3.options';
import * as log4js from 'log4js';
import * as init from './service/REPLACE_WITH_SERVICE';

log4js.configure({
  appenders: { index: { type: 'stdout', style: 'basic' } },
  categories: { default: { appenders: ['index'], level: 'info' } },
});
const logger = log4js.getLogger('index');
const serverPort = 3000;

// swaggerRouter configuration
const options: Oas3AppOptions = {
  app: undefined,
  cors: undefined,
  logging: undefined,
  openApiValidator: undefined,
  swaggerUI: undefined,
  routing: {
    controllers: path.join(__dirname, './controllers'),
  },
};

const expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, '../api/openapi.yaml'), options);
const app = expressAppConfig.getApp();

init.init().then(() => {
// Initialize the Swagger middleware
  http.createServer(app).listen(serverPort, () => {
    logger.info('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    logger.info('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
}).catch((err) => {
  logger.error(`error init${err}`);
  process.exit(-1);
});
