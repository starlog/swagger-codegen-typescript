import * as oas3Tools from 'felix-oas3-tools';
import { Oas3AppOptions } from 'felix-oas3-tools/dist/middleware/oas3.options';

const path = require('path');
const http = require('http');

const serverPort = 3000;

// swaggerRouter configuration
const options:Oas3AppOptions = {
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

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, () => {
  console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
  console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
