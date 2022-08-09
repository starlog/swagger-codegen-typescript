import * as YAML from 'yaml';
import * as fs from 'fs';
import pkg from 'shelljs';
import latestVersion from 'latest-version';
import pkg2 from 'lodash';
import * as log4js from 'log4js';
import { sedFiles, configFiles } from './data';

const logger = log4js.getLogger();
logger.level = 'DEBUG';
const {
  exec, cp, rm, find, mv, env,
} = pkg;
const { cloneDeep } = pkg2;

export interface PackageJsonI {
  dependencies: object;
}

export async function getLatestNPMVersions(packageJSON: PackageJsonI) {
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

export function generateCode(fileName: string, destination: string) {
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
}

export function copyBasicConfigFiles(destination) {
  const sourcePath = `${env.CODEGEN}/codegen/files`;
  configFiles.forEach((element) => {
    if (cp(`${sourcePath}/${element}`, destination).code !== 0) {
      logger.error(`Copy error of ${element}`);
      process.exit(-1);
    }
  });
}

export function removeNodeModules(destination) {
  rm('-rf', `${destination}/node_modules`);
}

export function renameJs2Ts(destination) {
  const fileList = find(destination).filter((file) => file.match(/\.js$/));
  fileList.forEach((element) => {
    mv(element, element.replace(/.js$/, '.ts'));
  });
}

export function fixVariousCodeSegment(destination) {
  sedFiles.forEach((element) => {
    // logger.debug(element);
    exec(`${element.command} ${destination}/${element.file}`);
  });
  const fileList2 = find(`${destination}/service`).filter((file) => file.match(/\.ts$/));
  fileList2.forEach((element) => {
    exec(`sed -i 's/ resolve();/ resolve(null);/g' ${element}`);
  });
}

export function addWashswatEngine(destination) {
  exec(
    `jq '.dependencies |= . + {"washswat-engine" : "^0.0.5"}' ${
      destination
    }/package.json > ${
      destination
    }/xx.json`,
  );
  rm(`${destination}/package.json`);
  mv(`${destination}/xx.json`, `${destination}/package.json`);
}

export function updatingGatewayJson(destination) {
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
}

export async function asyncUpdatingLatestVersionOfNpms(destination) {
  const targetData = fs.readFileSync(`${destination}/package.json`, 'utf8');
  const targetJson = JSON.parse(targetData);
  const solvedTargetJSON = await getLatestNPMVersions(targetJson);
  const targetFileContent = JSON.stringify(solvedTargetJSON, null, 2);
  fs.writeFileSync(`${destination}/package.json`, targetFileContent);
}
