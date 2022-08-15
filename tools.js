"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncUpdatingLatestVersionOfNpms = exports.updatingGatewayJson = exports.fixVariousCodeSegment = exports.copyWriterTs = exports.generateDefaultTest = exports.processCodes = exports.renameJs2Ts = exports.removeNodeModules = exports.copyBasicConfigFiles = exports.generateCode = exports.fixUsingLint = exports.installNpm = exports.getLatestNPMVersions = void 0;
const YAML = __importStar(require("yaml"));
const fs = __importStar(require("fs"));
const shelljs_1 = __importDefault(require("shelljs"));
const lodash_1 = __importDefault(require("lodash"));
const log4js = __importStar(require("log4js"));
const data_1 = require("./data");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pj = require('package-json');
const logger = log4js.getLogger();
logger.level = 'DEBUG';
const { exec, cp, rm, find, mv, env, sed, cd, } = shelljs_1.default;
const { cloneDeep } = lodash_1.default;
function getLatestNPMVersions(packageJSON) {
    return __awaiter(this, void 0, void 0, function* () {
        const myPackageJSON = cloneDeep(packageJSON);
        try {
            const keyList = Object.keys(myPackageJSON.dependencies);
            // eslint-disable-next-line no-restricted-syntax
            for (const element of keyList) {
                // eslint-disable-next-line no-await-in-loop
                const { version } = yield pj(element);
                myPackageJSON.dependencies[element] = `^${version}`;
            }
            const keyList2 = Object.keys(myPackageJSON.devDependencies);
            // eslint-disable-next-line no-restricted-syntax
            for (const element of keyList2) {
                // eslint-disable-next-line no-await-in-loop
                const { version } = yield pj(element);
                myPackageJSON.devDependencies[element] = `^${version}`;
            }
            return myPackageJSON;
        }
        catch (ex) {
            return ex;
        }
    });
}
exports.getLatestNPMVersions = getLatestNPMVersions;
function installNpm(destination) {
    cd(destination);
    exec('npm install');
}
exports.installNpm = installNpm;
function fixUsingLint(destination) {
    cd(destination);
    exec('npx eslint --fix service/* > /dev/null');
}
exports.fixUsingLint = fixUsingLint;
function generateCode(fileName, destination) {
    if (exec(`java -jar $CODEGEN/codegen/swagger-codegen-cli.jar generate -i ${fileName} -l nodejs-server -o ${destination}`).code !== 0) {
        logger.error('Codegen error');
        process.exit(-1);
    }
}
exports.generateCode = generateCode;
function copyBasicConfigFiles(destination) {
    const sourcePath = `${env.CODEGEN}/codegen/files`;
    data_1.configFiles.forEach((element) => {
        if (cp(`${sourcePath}/${element}`, destination).code !== 0) {
            logger.error(`Copy error of ${element}`);
            process.exit(-1);
        }
    });
}
exports.copyBasicConfigFiles = copyBasicConfigFiles;
function removeNodeModules(destination) {
    rm('-rf', `${destination}/node_modules`);
}
exports.removeNodeModules = removeNodeModules;
function renameJs2Ts(destination) {
    const fileList = find(destination).filter((file) => file.match(/\.js$/));
    fileList.forEach((element) => {
        mv(element, element.replace(/.js$/, '.ts'));
    });
}
exports.renameJs2Ts = renameJs2Ts;
function processCodes(destination) {
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
exports.processCodes = processCodes;
function generateDefaultTest(destination) {
    exec(`mkdir ${destination}/__tests__`);
    const src = `${env.CODEGEN}/codegen/files/__tests__/Default.test.ts`;
    const dest = `${destination}/__tests__/Default.test.ts`;
    cp(src, dest);
}
exports.generateDefaultTest = generateDefaultTest;
function copyWriterTs(destination) {
    const src = `${env.CODEGEN}/codegen/files/utils/writer.ts`;
    const dest = `${destination}/utils/writer.ts`;
    cp(src, dest);
}
exports.copyWriterTs = copyWriterTs;
function fixVariousCodeSegment(destination) {
    data_1.sedFiles.forEach((element) => {
        // logger.debug(element);
        exec(`${element.command} ${destination}/${element.file}`);
    });
    const fileList2 = find(`${destination}/service`).filter((file) => file.match(/\.ts$/));
    fileList2.forEach((element) => {
        exec(`sed -i 's/ resolve();/ resolve(null);/g' ${element}`);
    });
}
exports.fixVariousCodeSegment = fixVariousCodeSegment;
function updatingGatewayJson(destination) {
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
exports.updatingGatewayJson = updatingGatewayJson;
function asyncUpdatingLatestVersionOfNpms(destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const targetData = fs.readFileSync(`${destination}/package.json`, 'utf8');
        const targetJson = JSON.parse(targetData);
        const solvedTargetJSON = yield getLatestNPMVersions(targetJson);
        const targetFileContent = JSON.stringify(solvedTargetJSON, null, 2);
        fs.writeFileSync(`${destination}/package.json`, targetFileContent);
    });
}
exports.asyncUpdatingLatestVersionOfNpms = asyncUpdatingLatestVersionOfNpms;
//# sourceMappingURL=tools.js.map