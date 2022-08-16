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
    command: {
      type: 'sed',
      params: [
        '-i',
        '"oas3-tools',
        '"felix-oas3-tools',
      ],
    },
    file: 'package.json',
  },
  {
    command: {
      type: 'sed',
      params: [
        '-i',
        '8080',
        '3000',
      ],
    },
    file: 'README.md',
  },
];
