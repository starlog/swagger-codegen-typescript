#!/usr/bin/env node
import { Command } from 'commander';
import * as log4js from 'log4js';
import {
  generateCode,
  copyBasicConfigFiles,
  removeNodeModules,
  renameJs2Ts,
  fixVariousCodeSegment,
  updatingGatewayJson,
  asyncUpdatingLatestVersionOfNpms,
  processCodes,
  generateDefaultTest,
  copyWriterTs,
  installNpm,
  fixUsingLint,
  setFileLocation, setIndexTsAndServiceCode, setPackageName,
} from './tools';

log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: { type: 'messagePassThrough' } },
  },
  categories: {
    default: { appenders: ['out'], level: 'info' },
  },
});
const logger = log4js.getLogger('out');
logger.level = 'DEBUG';
const program = new Command();

program
  .command('gen')
  .description('Generate node.js code from swagger specification')
  .argument('<filename>', 'file to generate')
  .argument('<destination>', 'Generate target location')
  .action(async (fileName, destination) => {
    try {
      logger.info(`Using source location as: ${__dirname}`);
      setFileLocation(__dirname);

      logger.info('Generating basic swagger-based project');
      generateCode(fileName, destination);

      logger.info('Remove node_modules just in case.');
      removeNodeModules(destination);

      logger.info('Rename all .js to .ts');
      renameJs2Ts(destination);

      logger.info('Copying config files..');
      copyBasicConfigFiles(destination);

      logger.info('Setting index.ts with correct service name');
      setIndexTsAndServiceCode(destination);

      logger.info('Copying writer.ts..');
      copyWriterTs(destination);

      logger.info('Fix various code segments.');
      fixVariousCodeSegment(destination);

      logger.info('Copy default test');
      generateDefaultTest(destination);

      logger.info('Updating gateway.json');
      updatingGatewayJson(destination);

      logger.info('Set package.json name');
      setPackageName(fileName, destination);

      logger.info('Change code style');
      processCodes(`${destination}/service`);
      // processCodes(`${destination}/controllers`);

      logger.info('Updating npm versions to latest');
      await asyncUpdatingLatestVersionOfNpms(destination);

      logger.info('Installing npms');
      await installNpm(destination);

      logger.info('cleanup server/*.ts using lint');
      fixUsingLint(destination);
    } catch (ex) {
      logger.info(`Error during operation:${ex}`);
    }
  });

program.parse();
