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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const log4js = __importStar(require("log4js"));
const tools_1 = require("./tools");
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
const program = new commander_1.Command();
program
    .command('gen')
    .description('Generate node.js code from swagger specification')
    .argument('<filename>', 'file to generate')
    .argument('<destination>', 'Generate target location')
    .action((fileName, destination) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger.info('Generating basic swagger-based project');
        (0, tools_1.generateCode)(fileName, destination);
        logger.info('Remove node_modules just in case.');
        (0, tools_1.removeNodeModules)(destination);
        logger.info('Rename all .js to .ts');
        (0, tools_1.renameJs2Ts)(destination);
        logger.info('Copying config files..');
        (0, tools_1.copyBasicConfigFiles)(destination);
        logger.info('Copying writer.ts..');
        (0, tools_1.copyWriterTs)(destination);
        logger.info('Fix various code segments.');
        (0, tools_1.fixVariousCodeSegment)(destination);
        logger.info('Change code style');
        (0, tools_1.processCodes)(`${destination}/service`);
        // processCodes(`${destination}/controllers`);
        logger.info('Copy default test');
        (0, tools_1.generateDefaultTest)(destination);
        logger.info('Updating gateway.json');
        (0, tools_1.updatingGatewayJson)(destination);
        logger.info('Updating npm versions to latest');
        yield (0, tools_1.asyncUpdatingLatestVersionOfNpms)(destination);
        logger.info('Installing npms');
        yield (0, tools_1.installNpm)(destination);
        logger.info('cleanup server/*.ts using lint');
        (0, tools_1.fixUsingLint)(destination);
    }
    catch (ex) {
        logger.info(`Error during operation:${ex}`);
    }
}));
program.parse();
//# sourceMappingURL=codegen.js.map