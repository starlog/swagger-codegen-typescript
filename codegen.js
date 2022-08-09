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
const commander_1 = require("commander");
const YAML = __importStar(require("yaml"));
const fs = __importStar(require("fs"));
const shelljs_1 = __importDefault(require("shelljs"));
const latest_version_1 = __importDefault(require("latest-version"));
const lodash_1 = __importDefault(require("lodash"));
const log4js = __importStar(require("log4js"));
const data_1 = require("./data");
const logger = log4js.getLogger();
logger.level = 'DEBUG';
const program = new commander_1.Command();
const { exec, cp, rm, find, mv, env, } = shelljs_1.default;
const { cloneDeep } = lodash_1.default;
function getLatestNPMVersions(packageJSON) {
    return __awaiter(this, void 0, void 0, function* () {
        const myPackageJSON = cloneDeep(packageJSON);
        try {
            const keyList = Object.keys(myPackageJSON.dependencies);
            // eslint-disable-next-line no-restricted-syntax
            for (const element of keyList) {
                // eslint-disable-next-line no-await-in-loop
                myPackageJSON.dependencies[element] = `^${yield (0, latest_version_1.default)(element)}`;
            }
            return myPackageJSON;
        }
        catch (ex) {
            return ex;
        }
    });
}
program
    .command('gen')
    .description('Generate node.js code from swagger specification')
    .argument('<filename>', 'file to generate')
    .argument('<destination>', 'Generate target location')
    .action((fileName, destination) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /// ////////////////////////////////////////////////////////////////////////////////////
        logger.debug('Generating basic swagger-based project');
        if (exec(`java -jar $CODEGEN/codegen/swagger-codegen-cli.jar generate -i ${fileName} -l nodejs-server -o ${destination}`).code !== 0) {
            logger.error('Codegen error');
            process.exit(-1);
        }
        /// ////////////////////////////////////////////////////////////////////////////////////
        logger.debug('Copying config files..');
        const sourcePath = `${env.CODEGEN}/codegen/files`;
        data_1.configFiles.forEach((element) => {
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
        data_1.sedFiles.forEach((element) => {
            // logger.debug(element);
            exec(`${element.command} ${destination}/${element.file}`);
        });
        const fileList2 = find(`${destination}/service`).filter((file) => file.match(/\.ts$/));
        fileList2.forEach((element) => {
            exec(`sed -i 's/ resolve();/ resolve(null);/g' ${element}`);
        });
        /// ////////////////////////////////////////////////////////////////////////////////////
        logger.debug('Add washswat-engine.');
        exec(`jq '.dependencies |= . + {"washswat-engine" : "^0.0.5"}' ${destination}/package.json > ${destination}/xx.json`);
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
        const solvedTargetJSON = yield getLatestNPMVersions(targetJson);
        const targetFileContent = JSON.stringify(solvedTargetJSON, null, 2);
        fs.writeFileSync(`${destination}/package.json`, targetFileContent);
    }
    catch (ex) {
        logger.debug(`Error during operation:${ex}`);
    }
}));
program.parse();
//# sourceMappingURL=codegen.js.map