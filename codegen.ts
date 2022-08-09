import { Command } from 'commander';
import * as YAML from 'yaml';
import * as fs from 'fs';
import pkg from 'shelljs';
import latestVersion from 'latest-version';
import pkg2 from 'lodash';
import * as log4js from 'log4js';
import { sedFiles, configFiles } from './data';

const logger = log4js.getLogger();
logger.level = 'DEBUG';
const program = new Command();
const {
  exec, cp, rm, find, mv, env,
} = pkg;
const { cloneDeep } = pkg2;

export interface PackageJsonI {
  dependencies: object
}

async function getLatestNPMVersions(packageJSON: PackageJsonI) {
  const myPackageJSON: PackageJsonI = cloneDeep(packageJSON);
  try {
    const keyList = Object.keys(myPackageJSON.dependencies);
    // eslint-disable-next-line no-restricted-syntax
    for (const element of keyList) {
      // eslint-disable-next-line no-await-in-loop
      myPackageJSON.dependencies[element] = `^${await latestVersion(element)}`;
    }
    return myPackageJSON;
  } catch (ex) {
    return ex;
  }
}

program
  .command('gen')
  .description('Generate node.js code from swagger specification')
  .argument('<filename>', 'file to generate')
  .argument('<destination>', 'Generate target location')
  .action(async (fileName, destination) => {
    try {
      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Generating basic swagger-based project');
      if (
        exec(
          `java -jar $CODEGEN/codegen/swagger-codegen-cli.jar generate -i ${
            fileName
          } -l nodejs-server -o ${
            destination}`,
        ).code !== 0
      ) {
        logger.error('Codegen error');
        process.exit(-1);
      }

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Copying config files..');
      const sourcePath = `${env.CODEGEN}/codegen/files`;
      configFiles.forEach((element) => {
        if (cp(`${sourcePath}/${element}`, destination).code !== 0) {
          logger.error(`Copy error of ${element}`);
          process.exit(-1);
        }
      });
      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Remove node_modules just in case.');
      rm('-rf', `${destination}/node_modules`);

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Rename all .js to .ts');
      const fileList = find(destination).filter((file) => file.match(/\.js$/));
      fileList.forEach((element) => {
        mv(element, element.replace(/.js$/, '.ts'));
      });

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Fix various code segments.');
      sedFiles.forEach((element) => {
        // logger.debug(element);
        exec(`${element.command} ${destination}/${element.file}`);
      });
      const fileList2 = find(`${destination}/service`).filter((file) => file.match(/\.ts$/));
      fileList2.forEach((element) => {
        exec(`sed -i 's/ resolve();/ resolve(null);/g' ${element}`);
      });

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Add washswat-engine.');

      exec(
        `jq '.dependencies |= . + {"washswat-engine" : "^0.0.5"}' ${
          destination
        }/package.json > ${
          destination
        }/xx.json`,
      );
      rm(`${destination}/package.json`);
      mv(`${destination}/xx.json`, `${destination}/package.json`);

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Updating gateway.json');
      const file = fs.readFileSync(`${destination}/api/openapi.yaml`, 'utf8');
      const result = YAML.parse(file);

      const pathList = [];
      const methodList = [];
      Object.keys(result.paths).forEach((element) => {
        if (element !== '/health-check') {
          pathList.push(element);
          Object.keys(result.paths[element]).forEach((subElement) => {
            if (!methodList.includes(subElement)) {
              methodList.push(subElement);
            }
          });
        }
      });
      const outputData = {
        type: 'external',
        paths: pathList,
        methods: methodList,
        regex_priority: 2,
      };
      const outString = JSON.stringify(outputData, null, 2);
      fs.writeFileSync(`${destination}/gateway.json`, outString);

      /// ////////////////////////////////////////////////////////////////////////////////////
      logger.debug('Updating npm versions to latest');
      const targetData = fs.readFileSync(`${destination}/package.json`, 'utf8');
      const targetJson = JSON.parse(targetData);
      const solvedTargetJSON = await getLatestNPMVersions(targetJson);
      const targetFileContent = JSON.stringify(solvedTargetJSON, null, 2);
      fs.writeFileSync(`${destination}/package.json`, targetFileContent);
    } catch (ex) {
      logger.debug(`Error during operation:${ex}`);
    }
  });

program.parse();
