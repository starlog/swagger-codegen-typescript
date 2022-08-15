export const configFiles = [
  'Dockerfile',
  'gateway.json',
  'gitignore',
  '.gitlab-ci.yml',
  'tsconfig.json',
  '.eslintrc.json',
  'jest.config.js',
  'package.json',
  'index.ts',
];

export const sedFiles = [
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
