"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sedFiles = exports.configFiles = void 0;
exports.configFiles = [
    'Dockerfile',
    'gateway.json',
    '.gitignore',
    '.gitlab-ci.yml',
    'tsconfig.json',
    '.eslintrc.json',
    'jest.config.js',
    'package.json',
    'index.ts',
];
exports.sedFiles = [
    {
        command: "sed -i 's/\"oas3-tools/\"felix-oas3-tools/g'",
        file: 'package.json',
    },
    {
        command: "sed -i 's/\\^2.2.3/\\^0.1.5/g'",
        file: 'package.json',
    },
    {
        command: "sed -i 's/8080/3000/g'",
        file: 'README.md',
    },
];
//# sourceMappingURL=data.js.map