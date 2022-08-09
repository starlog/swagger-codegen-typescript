import {Command} from "commander";

const program = new Command();
import * as YAML from 'yaml';
import * as fs from 'fs';
import pkg from 'shelljs';
import {sedFiles, configFiles} from './data.js'

const {exec, cp, rm, find, mv, sed, env} = pkg;
import latestVersion from "latest-version";
import pkg2 from 'lodash';
const {cloneDeep} = pkg2;

program
    .command("gen")
    .description("Generate node.js code from swagger specification")
    .argument("<filename>", "file to generate")
    .argument("<destination>", "Generate target location")
    .action(async (fileName, destination) => {
        try {
            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Generating basic swagger-based project");
            if (
                exec(
                    "java -jar $CODEGEN/codegen/swagger-codegen-cli.jar generate -i " +
                    fileName +
                    " -l nodejs-server -o " +
                    destination
                ).code !== 0
            )
                throw "Codegen error";

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Copying config files..");
            let sourcePath = env["CODEGEN"] + "/codegen/files";
            configFiles.forEach((element) => {
                if (cp(sourcePath + "/" + element, destination).code !== 0) {
                    throw "Copy error of " + element;
                }
            });
            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Remove node_modules just in case.");
            rm("-rf", destination + "/node_modules");

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Rename all .js to .ts");
            let fileList = find(destination).filter(function (file) {
                return file.match(/\.js$/);
            });
            fileList.forEach((element) => {
                mv(element, element.replace(new RegExp(".js" + "$"), ".ts"));
            });

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Fix various code segments.");
            sedFiles.forEach((element) => {
                // console.log(element);
                exec(element.command + " " + destination + "/" + element.file);
            });
            let fileList2 = find(destination + "/service").filter(function (file) {
                return file.match(/\.ts$/);
            });
            fileList2.forEach((element) => {
                exec("sed -i 's/ resolve();/ resolve(null);/g' " + element);
            });

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Add washswat-engine.");

            exec(
                'jq \'.dependencies |= . + {"washswat-engine" : "^0.0.5"}\' ' +
                destination +
                "/package.json > " +
                destination +
                "/xx.json"
            );
            rm(destination + "/package.json");
            mv(destination + "/xx.json", destination + "/package.json");

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log("Updating gateway.json");
            const file = fs.readFileSync(destination + "/api/openapi.yaml", "utf8");
            let result = YAML.parse(file);

            let pathList = [];
            let methodList = [];
            Object.keys(result.paths).forEach((element) => {
                if (element !== "/health-check") {
                    pathList.push(element);
                    Object.keys(result.paths[element]).forEach((subElement) => {
                        if (!methodList.includes(subElement)) {
                            methodList.push(subElement);
                        }
                    });
                }
            });
            let outputData = {
                type: "external",
                paths: pathList,
                methods: methodList,
                regex_priority: 2,
            };
            let outString = JSON.stringify(outputData, null, 2);
            fs.writeFileSync(destination + "/gateway.json", outString);

            ///////////////////////////////////////////////////////////////////////////////////////
            console.log('Updating npm versions to latest');
            const targetData = fs.readFileSync(destination + "/package.json", "utf8");
            const targetJson = JSON.parse(targetData);
            const solvedTargetJSON = await getLatestNPMVersions(targetJson);
            const targetFileContent = JSON.stringify(solvedTargetJSON, null, 2);
            fs.writeFileSync(destination + "/package.json", targetFileContent);
        }
        catch (ex) {
            console.log("Error during operation:" + ex);
        }
    });

program.parse();


async function getLatestNPMVersions(packageJSON) {
    let _packageJSON = cloneDeep(packageJSON);
    return new Promise(async (resolve, reject) => {
        try {
            const keyList = Object.keys(_packageJSON.dependencies);
            for (const element of keyList) {
                _packageJSON.dependencies[element] = "^" + (await latestVersion(element));
            }
            resolve(_packageJSON);
        }
        catch (ex) {
            reject(ex);
        }
    });
}
