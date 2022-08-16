import * as YAML from 'yaml';
import * as fs from 'fs';
import pkg from 'shelljs';
import pkg2 from 'lodash';
import * as log4js from 'log4js';
import pj from 'package-json';
import { sedFiles, configFiles } from './data';

const logger = log4js.getLogger();
logger.level = 'DEBUG';
const {
  exec, cp, rm, find, mv, env, sed, cd, mkdir,
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
    const result = [];
    keyList.forEach((element) => {
      result.push(pj(element));
    });
    const myResult = await Promise.all(result);

    myPackageJSON.dependencies = {};
    myResult.forEach((element) => {
      myPackageJSON.dependencies[element.name] = `^${element.version}`;
    });

    const keyListDev = Object.keys(myPackageJSON.devDependencies);
    const resultDev = [];
    keyListDev.forEach((element) => {
      resultDev.push(pj(element));
    });
    const myResultDev = await Promise.all(resultDev);

    myPackageJSON.devDependencies = {};
    myResultDev.forEach((element) => {
      myPackageJSON.devDependencies[element.name] = `^${element.version}`;
    });

    return myPackageJSON;
  } catch (ex) {
    return ex;
  }
}

export function getCodegenLocation() {
  return env.CODEGEN;
}

export function installNpm(destination: string) {
  cd(destination);
  exec('npm install');
}

export function fixUsingLint(destination: string) {
  cd(destination);
  exec('npx eslint --fix service/* > /dev/null');
}

export function generateCode(fileName: string, destination: string) {
  if (
    exec(`java -jar $CODEGEN/codegen/swagger-codegen-cli.jar generate -i ${
      fileName
    } -l nodejs-server -o ${
      destination}`).code !== 0
  ) {
    logger.error('Codegen error');
    process.exit(-1);
  }
}

export function copyBasicConfigFiles(destination) {
  const sourcePath = `${env.CODEGEN}/codegen/files`;
  configFiles.forEach((element) => {
    if (element === 'gitignore') {
      if (cp(`${sourcePath}/${element}`, `${destination}/.gitignore`).code !== 0) {
        logger.error(`Copy error of ${element}`);
        process.exit(-1);
      }
    } else if (cp(`${sourcePath}/${element}`, destination).code !== 0) {
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
    sed('-i', '= function', '', element);
    sed('-i', 'exports.', 'export async function ', element);
    sed('-i', '\'use strict\';', '', element);
    sed('-i', '(\\s+([a-zA-Z]+\\s+)+)Promise\\(function\\(resolve, reject\\) \\{', '', element);
    sed('-i', '  \\}\\);', '', element);
    sed('-i', 'resolve\\(', 'return(', element);
    sed('-i', 'return\\(\\)', 'return(null)', element);
  });
}

export function generateDefaultTest(destination) {
  mkdir(`${destination}/__tests__`);
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
    if (element.command.type === 'sed') {
      sed(
        element.command.params[0],
        element.command.params[1],
        element.command.params[2],
        element.file,
      );
    }
  });
  const fileList2 = find(`${destination}/service`).filter((file) => file.match(/\.ts$/));
  fileList2.forEach((element) => {
    sed('-i', ' resolve();', ' resolve(null);', element);
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
