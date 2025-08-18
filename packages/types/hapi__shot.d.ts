declare module '@hapi/shot' {
  import { IncomingMessage, ServerResponse } from 'http';
  
  export interface InjectOptions {
    method?: string;
    url: string;
    headers?: { [key: string]: string };
    payload?: string | object | Buffer;
    credentials?: any;
    authority?: string;
    remoteAddress?: string;
    validate?: boolean;
  }
  
  export interface InjectResponse {
    statusCode: number;
    statusMessage: string;
    headers: { [key: string]: string };
    payload: string;
    rawPayload: Buffer;
    result: any;
    request: any;
  }
  
  export function inject(
    dispatchFunc: (req: IncomingMessage, res: ServerResponse) => void,
    options: string | InjectOptions
  ): Promise<InjectResponse>;
}
