import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { Document } from './document.entity'; // Import Document

@Entity('document_folders')
export class DocumentFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  companyId: string;

  @Column({ nullable: true })
  parentFolderId: string;

  @ManyToOne(() => DocumentFolder, folder => folder.subFolders, { nullable: true })
  @JoinColumn({ name: 'parentFolderId' })
  parentFolder: DocumentFolder;

  @OneToMany(() => DocumentFolder, folder => folder.parentFolder)
  subFolders: DocumentFolder[];

  @OneToMany(() => Document, document => document.folder)
  documents: Document[];

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
