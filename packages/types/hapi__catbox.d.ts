declare module '@hapi/catbox' {
  export interface ClientOptions {
    host?: string;
    port?: number;
    partition?: string;
  }
  
  export interface Client {
    start(): Promise<void>;
    stop(): Promise<void>;
    isReady(): boolean;
    validateSegmentName(name: string): void;
  }
  
  export interface Policy {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    drop(key: string): Promise<void>;
  }
  
  export class Client {
    constructor(options?: ClientOptions);
  }
}
