export const configFiles = [
  'Dockerfile',
  'gateway.json',
  '.gitignore',
  '.gitlab-ci.yml',
  'tsconfig.json',
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
    command: "sed -i 's/'oas3-tools/'felix-oas3-tools/g'",
    file: 'index.ts',
  },
  {
    command: "sed -i 's/8080/3000/g'",
    file: 'index.ts',
  },
  {
    command: "sed -i 's/var/let/g'",
    file: 'index.ts',
  },
  {
    command: "sed -i 's/var/let/g'",
    file: 'utils/writer.ts',
  },
  {
    command: "sed -i 's/this\\.payload/this\\[\"payload\"\\]/g'",
    file: 'utils/writer.ts',
  },
  {
    command: "sed -i 's/arg1\\.payload/arg1\\[\"payload\"\\]/g'",
    file: 'utils/writer.ts',
  },
  {
    command: "sed -i 's/arg1\\.code/arg1\\[\"code\"\\]/g'",
    file: 'utils/writer.ts',
  },
  {
    command: "sed -i 's/api\\/openapi.yaml/..\\/api\\/openapi.yaml/g'",
    file: 'index.ts',
  },
  {
    command:
            "sed -i 's/response.writeHead(/let washswat = require(\"washswat-engine\");washswat.config.setHeader(response);response.writeHead(/g'",
    file: 'utils/writer.ts',
  },
];
