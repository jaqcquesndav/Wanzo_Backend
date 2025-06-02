import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

// Define a more specific type for operation types for better type safety and autocompletion
export enum OperationType {
  // User/Auth Operations
  USER_LOGIN = 'USER_LOGIN',
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_PROFILE_UPDATE = 'USER_PROFILE_UPDATE',
  USER_PASSWORD_RESET_REQUEST = 'USER_PASSWORD_RESET_REQUEST',
  USER_PASSWORD_RESET_SUCCESS = 'USER_PASSWORD_RESET_SUCCESS',
  TOKEN_REFRESH = 'TOKEN_REFRESH',

  // Product Operations
  CREATE_PRODUCT = 'CREATE_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  VIEW_PRODUCT_LIST = 'VIEW_PRODUCT_LIST',
  VIEW_PRODUCT_DETAIL = 'VIEW_PRODUCT_DETAIL',

  // Customer Operations
  CREATE_CUSTOMER = 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER = 'DELETE_CUSTOMER',
  VIEW_CUSTOMER_LIST = 'VIEW_CUSTOMER_LIST',
  VIEW_CUSTOMER_DETAIL = 'VIEW_CUSTOMER_DETAIL',

  // Sales Operations
  CREATE_SALE = 'CREATE_SALE',
  UPDATE_SALE = 'UPDATE_SALE',
  DELETE_SALE = 'DELETE_SALE',
  VIEW_SALE_LIST = 'VIEW_SALE_LIST',
  VIEW_SALE_DETAIL = 'VIEW_SALE_DETAIL',

  // Subscription Operations
  SUBSCRIPTION_TIER_CHANGE = 'SUBSCRIPTION_TIER_CHANGE',
  SUBSCRIPTION_TOKEN_TOPUP = 'SUBSCRIPTION_TOKEN_TOPUP',
  SUBSCRIPTION_PAYMENT_PROOF_UPLOAD = 'SUBSCRIPTION_PAYMENT_PROOF_UPLOAD',
  VIEW_SUBSCRIPTION_DETAILS = 'VIEW_SUBSCRIPTION_DETAILS',

  // Company Operations
  UPDATE_COMPANY_PROFILE = 'UPDATE_COMPANY_PROFILE',
  VIEW_COMPANY_PROFILE = 'VIEW_COMPANY_PROFILE',

  // Supplier Operations
  CREATE_SUPPLIER = 'CREATE_SUPPLIER',
  UPDATE_SUPPLIER = 'UPDATE_SUPPLIER',
  DELETE_SUPPLIER = 'DELETE_SUPPLIER',
  VIEW_SUPPLIER_LIST = 'VIEW_SUPPLIER_LIST',
  VIEW_SUPPLIER_DETAIL = 'VIEW_SUPPLIER_DETAIL',

  // Adha (AI Chat) Operations
  ADHA_SEND_MESSAGE = 'ADHA_SEND_MESSAGE',
  ADHA_LIST_CONVERSATIONS = 'ADHA_LIST_CONVERSATIONS',
  ADHA_GET_CONVERSATION_HISTORY = 'ADHA_GET_CONVERSATION_HISTORY',

  // Expense Operations
  CREATE_EXPENSE = 'CREATE_EXPENSE',
  UPDATE_EXPENSE = 'UPDATE_EXPENSE',
  DELETE_EXPENSE = 'DELETE_EXPENSE',
  VIEW_EXPENSE_LIST = 'VIEW_EXPENSE_LIST',
  VIEW_EXPENSE_DETAIL = 'VIEW_EXPENSE_DETAIL',
  CREATE_EXPENSE_CATEGORY = 'CREATE_EXPENSE_CATEGORY',
  UPDATE_EXPENSE_CATEGORY = 'UPDATE_EXPENSE_CATEGORY',
  DELETE_EXPENSE_CATEGORY = 'DELETE_EXPENSE_CATEGORY',

  // Financing Operations
  CREATE_FINANCING_RECORD = 'CREATE_FINANCING_RECORD',
  UPDATE_FINANCING_RECORD = 'UPDATE_FINANCING_RECORD',
  DELETE_FINANCING_RECORD = 'DELETE_FINANCING_RECORD',
  VIEW_FINANCING_RECORD_LIST = 'VIEW_FINANCING_RECORD_LIST',
  VIEW_FINANCING_RECORD_DETAIL = 'VIEW_FINANCING_RECORD_DETAIL',
  
  // Notification Operations (e.g., viewing, marking as read)
  VIEW_NOTIFICATIONS = 'VIEW_NOTIFICATIONS',
  NOTIFICATION_MARKED_AS_READ = 'NOTIFICATION_MARKED_AS_READ',
  NOTIFICATIONS_MARKED_ALL_READ = 'NOTIFICATIONS_MARKED_ALL_READ',

  // Settings Operations
  UPDATE_USER_SETTINGS = 'UPDATE_USER_SETTINGS',
  VIEW_USER_SETTINGS = 'VIEW_USER_SETTINGS',

  // Document Management (Placeholder)
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  VIEW_DOCUMENT_LIST = 'VIEW_DOCUMENT_LIST',

  // Inventory Management (Placeholder)
  UPDATE_INVENTORY_STOCK = 'UPDATE_INVENTORY_STOCK',
  VIEW_INVENTORY_LEVELS = 'VIEW_INVENTORY_LEVELS',

  // General/System Operations
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  ADMIN_ACTION = 'ADMIN_ACTION', // For generic admin actions not covered elsewhere
  UNKNOWN_OPERATION = 'UNKNOWN_OPERATION',
}

// Define a more specific type for resource types
export enum ResourceAffected {
  USER = 'User',
  PRODUCT = 'Product',
  CUSTOMER = 'Customer',
  SALE = 'Sale',
  SUBSCRIPTION = 'Subscription',
  COMPANY = 'Company',
  SUPPLIER = 'Supplier',
  ADHA_CONVERSATION = 'AdhaConversation',
  ADHA_MESSAGE = 'AdhaMessage',
  EXPENSE = 'Expense',
  EXPENSE_CATEGORY = 'ExpenseCategory',
  FINANCING_RECORD = 'FinancingRecord',
  NOTIFICATION = 'Notification',
  SETTINGS = 'Settings',
  DOCUMENT = 'Document',
  INVENTORY = 'Inventory',
  SYSTEM = 'System',
  OTHER = 'Other',
}

export interface JournalEntryDetails {
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  [key: string]: any; // For additional custom details
}

@Entity('operation_journal_entries')
@Index(['userId', 'timestamp'])
@Index(['operationType'])
@Index(['resourceAffected', 'resourceId'])
export class OperationJournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  timestamp: Date;

  @Column({ nullable: true }) // userId can be null for system-generated events not tied to a specific user
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) // If user is deleted, keep the log but set userId to null
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ nullable: true })
  userName: string | null; // Denormalized for easier display, can be set when userId is known

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.UNKNOWN_OPERATION
  })
  operationType: OperationType;

  @Column({ 
    type: 'enum',
    enum: ResourceAffected,
    nullable: true 
  })
  resourceAffected: ResourceAffected | null;

  @Column({ nullable: true })
  resourceId: string | null; // ID of the affected entity (e.g., product ID, sale ID)

  @Column('text')
  description: string; // Human-readable summary of the action

  @Column({ type: 'jsonb', nullable: true })
  details: JournalEntryDetails | null; // Structured data about the change (e.g., old/new values)

  @Column({ nullable: true })
  ipAddress: string | null;

  @Column({ nullable: true })
  userAgent: string | null;
}
