/**
 * Interface representing a file uploaded via Multer
 * Used for handling file uploads throughout the application
 */
export interface MulterFile {
  /** The field name in the form */
  fieldname: string;
  /** The original filename */
  originalname: string;
  /** The MIME type of the file */
  mimetype: string;
  /** The size of the file in bytes */
  size: number;
  /** The buffer containing the file data */
  buffer: Buffer;
  /** Optional encoding type */
  encoding?: string;
}
