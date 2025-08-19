// Global type declarations for external modules with missing types
declare module '@hapi/catbox';
declare module '@hapi/shot';
declare module 'date-fns';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        stream: NodeJS.ReadableStream;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
