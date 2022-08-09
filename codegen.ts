import { Command } from 'commander';
import * as log4js from 'log4js';
import {
  generateCode,
  copyBasicConfigFiles,
  removeNodeModules,
  renameJs2Ts,
  fixVariousCodeSegment,
  addWashswatEngine,
  updatingGatewayJson,
  asyncUpdatingLatestVersionOfNpms,
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

      logger.debug('Copying config files..');
      copyBasicConfigFiles(destination);

      logger.debug('Remove node_modules just in case.');
      removeNodeModules(destination);

      logger.debug('Rename all .js to .ts');
      renameJs2Ts(destination);

      logger.debug('Fix various code segments.');
      fixVariousCodeSegment(destination);

      logger.debug('Add washswat-engine.');
      addWashswatEngine(destination);

      logger.debug('Updating gateway.json');
      updatingGatewayJson(destination);

      logger.debug('Updating npm versions to latest');
      await asyncUpdatingLatestVersionOfNpms(destination);
    } catch (ex) {
      logger.debug(`Error during operation:${ex}`);
    }
  });

program.parse();
