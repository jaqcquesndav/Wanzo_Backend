/**
 * Global type definitions for external modules
 * Used across all Wanzobe microservices
 */

// Hapi ecosystem types
declare module '@hapi/catbox';
declare module '@hapi/shot';

// Date utilities
declare module 'date-fns';

// Common Node.js utilities that might be missing types
declare module 'express-rate-limit';
declare module 'swagger-ui-express';

// Additional type augmentations can be added here as needed
