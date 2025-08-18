/**
 * @file Type definitions for external dependencies used across the Wanzobe ecosystem
 * @description This file provides type declarations for third-party packages that don't ship with their own types
 */

// Date manipulation library types
declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function addMonths(date: Date | number, amount: number): Date;
  export function subMonths(date: Date | number, amount: number): Date;
  export function addYears(date: Date | number, amount: number): Date;
  export function subYears(date: Date | number, amount: number): Date;
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
  export function isEqual(date: Date | number, dateToCompare: Date | number): boolean;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInMonths(dateLeft: Date | number, dateRight: Date | number): number;
  export function differenceInYears(dateLeft: Date | number, dateRight: Date | number): number;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
}

// Hapi.js ecosystem types
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

// Global augmentations for Node.js
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
    }
  }
}
