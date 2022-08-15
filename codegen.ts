import { Command } from 'commander';
import * as log4js from 'log4js';
import {
  generateCode,
  copyBasicConfigFiles,
  removeNodeModules,
  renameJs2Ts,
  fixVariousCodeSegment,
  updatingGatewayJson,
  asyncUpdatingLatestVersionOfNpms, processCodes, generateDefaultTest, copyWriterTs, installNpm, fixUsingLint,
} from './tools';

const logger = log4js.getLogger();
logger.level = 'DEBUG';
const program = new Command();

program
  .command('gen')
  .description('Generate node.js code from swagger specification')
  .argument('<filename>', 'file to generate')
  .argument('<destination>', 'Generate target location')
  .action(async (fileName, destination) => {
    try {
      logger.debug('Generating basic swagger-based project');
      generateCode(fileName, destination);

      logger.debug('Remove node_modules just in case.');
      removeNodeModules(destination);

      logger.debug('Rename all .js to .ts');
      renameJs2Ts(destination);

      logger.debug('Copying config files..');
      copyBasicConfigFiles(destination);

      logger.debug('Copying writer.ts..');
      copyWriterTs(destination);

      logger.debug('Fix various code segments.');
      fixVariousCodeSegment(destination);

      logger.debug('Change code style');
      processCodes(`${destination}/service`);
      // processCodes(`${destination}/controllers`);

      logger.debug('Copy default test');
      generateDefaultTest(destination);

      logger.debug('Updating gateway.json');
      updatingGatewayJson(destination);

      logger.debug('Updating npm versions to latest');
      await asyncUpdatingLatestVersionOfNpms(destination);

      logger.debug('Installing npms');
      installNpm(destination);

      logger.debug('cleanup server/*.ts using lint');
      fixUsingLint(destination);
    } catch (ex) {
      logger.debug(`Error during operation:${ex}`);
    }
  });

program.parse();
