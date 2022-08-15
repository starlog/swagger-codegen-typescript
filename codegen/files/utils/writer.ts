import * as config from 'washswat-engine/lib/config';

export interface iResponsePayLoad {
  code: any,
  payload: any
}

const ResponsePayload = function (code:any, payload:any) {
  this.code = code;
  this.payload = payload;
};

export function respondWithCode(code:any, payload:any) {
  return new ResponsePayload(code, payload);
}

export function writeJson(response:any, arg1: iResponsePayLoad, arg2:any) {
  let code;
  let payload;

  if (arg1 && arg1 instanceof ResponsePayload) {
    writeJson(response, arg1.payload, arg1.code);
    return;
  }

  if (arg2 && Number.isInteger(arg2)) {
    code = arg2;
  } else if (arg1 && Number.isInteger(arg1)) {
    code = arg1;
  }
  if (code && arg1) {
    payload = arg1;
  } else if (arg1) {
    payload = arg1;
  }

  if (!code) {
    // if no response code given, we default to 200
    code = 200;
  }
  if (typeof payload === 'object') {
    payload = JSON.stringify(payload, null, 2);
  }
  config.setHeader(response);
  response.writeHead(code, { 'Content-Type': 'application/json;charset=utf-8' });
  response.end(payload);
}
