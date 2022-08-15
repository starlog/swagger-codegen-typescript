import * as YAML from 'yaml';
import * as fs from 'fs';
import pkg from 'shelljs';
import pkg2 from 'lodash';
import * as log4js from 'log4js';
import { sedFiles, configFiles } from './data';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pj = require('package-json');

const logger = log4js.getLogger();
logger.level = 'DEBUG';
const {
  exec, cp, rm, find, mv, env, sed, cd,
} = pkg;
const { cloneDeep } = pkg2;

export interface PackageJsonI {
  dependencies: object;
  devDependencies: object;
}

export async function getLatestNPMVersions(packageJSON: PackageJsonI) {
  const myPackageJSON: PackageJsonI = cloneDeep(packageJSON);
  try {
    const keyList = Object.keys(myPackageJSON.dependencies);
    // eslint-disable-next-line no-restricted-syntax
    for (const element of keyList) {
      // eslint-disable-next-line no-await-in-loop
      const { version } = await pj(element);
      myPackageJSON.dependencies[element] = `^${version}`;
    }

    const keyList2 = Object.keys(myPackageJSON.devDependencies);
    // eslint-disable-next-line no-restricted-syntax
    for (const element of keyList2) {
      // eslint-disable-next-line no-await-in-loop
      const { version } = await pj(element);
      myPackageJSON.devDependencies[element] = `^${version}`;
    }

    return myPackageJSON;
  } catch (ex) {
    return ex;
  }
}

export function installNpm(destination:string) {
  cd(destination);
  exec('npm install');
}

export function fixUsingLint(destination:string) {
  cd(destination);
  exec('npx eslint --fix service/* > /dev/null');
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

export function processCodes(destination) {
  const fileList = find(destination).filter((file) => file.match(/\.ts$/));
  fileList.forEach((element) => {
    exec(`sed -i 's/= function//g' ${element}`);
    exec(`sed -i 's/exports./export async function /g' ${element}`);
    sed('-i', "'use strict';", '', element);
    sed('-i', '(\\s+([a-zA-Z]+\\s+)+)Promise\\(function\\(resolve, reject\\) \\{', '', element);
    sed('-i', '  \\}\\);', '', element);
    sed('-i', 'resolve\\(', 'return(', element);
  });
}

export function generateDefaultTest(destination) {
  exec(`mkdir ${destination}/__tests__`);
  const src = `${env.CODEGEN}/codegen/files/__tests__/Default.test.ts`;
  const dest = `${destination}/__tests__/Default.test.ts`;
  cp(src, dest);
}

export function copyWriterTs(destination) {
  const src = `${env.CODEGEN}/codegen/files/utils/writer.ts`;
  const dest = `${destination}/utils/writer.ts`;
  cp(src, dest);
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
