import { Schema, Types, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { DEFAULT_DAILY_MESSAGE_LIMIT } from '@childgpt/shared';

// Срок хранения переписки. Указан в политике конфиденциальности — менять синхронно.
export const MESSAGE_RETENTION_DAYS = 180;
const RETENTION_SECONDS = MESSAGE_RETENTION_DAYS * 24 * 60 * 60;

const parentSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    pinHash: { type: String, default: null },
    pinFailures: { type: Number, default: 0 },
    pinLockedUntil: { type: Date, default: null },
    notifyByEmail: { type: Boolean, default: true },
    // Увеличивается при смене пароля / «выйти везде» — старые токены перестают работать.
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const childSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 30 },
    birthYear: { type: Number, required: true },
    gender: { type: String, enum: ['boy', 'girl'], required: true },
    theme: { type: String, enum: ['boy', 'girl'], required: true },
    dailyMessageLimit: { type: Number, default: DEFAULT_DAILY_MESSAGE_LIMIT },
    strictMode: { type: Boolean, default: false },
    // Увеличивается, чтобы разлогинить ребёнка на всех устройствах.
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const consentSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    kind: { type: String, enum: ['terms', 'privacy', 'child_data'], required: true },
    version: { type: String, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: 'acceptedAt', updatedAt: false } },
);

const conversationSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true, index: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    day: { type: String, required: true },
    messageCount: { type: Number, default: 0 },
    childMessageCount: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);
conversationSchema.index({ childId: 1, day: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    role: { type: String, enum: ['child', 'lumi'], required: true },
    // Для ребёнка: исходный текст (виден только родителю) и то, что ушло в модель.
    text: { type: String, required: true },
    sentText: { type: String, default: null },
    safety: {
      action: { type: String, enum: ['allowed', 'redirected', 'crisis', 'fallback'], required: true },
      categories: { type: [String], default: [] },
      redactedPersonalData: { type: Boolean, default: false },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ childId: 1, createdAt: -1 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

const safetyEventSchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    severity: { type: String, enum: ['info', 'warning', 'critical'], required: true },
    category: { type: String, required: true },
    stage: { type: String, required: true },
    // Техническая причина (правило/вердикт судьи) — для разбора, родителю не показывается.
    note: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
safetyEventSchema.index({ parentId: 1, createdAt: -1 });
safetyEventSchema.index({ childId: 1, createdAt: -1 });

export type ParentDoc = HydratedDocument<InferSchemaType<typeof parentSchema>>;
export type ChildDoc = HydratedDocument<InferSchemaType<typeof childSchema>>;
export type ConversationDoc = HydratedDocument<InferSchemaType<typeof conversationSchema>>;
export type MessageDoc = HydratedDocument<InferSchemaType<typeof messageSchema>>;
export type SafetyEventDoc = HydratedDocument<InferSchemaType<typeof safetyEventSchema>>;

export const Parent = model('Parent', parentSchema);
export const Child = model('Child', childSchema);
export const Consent = model('Consent', consentSchema);
export const Conversation = model('Conversation', conversationSchema);
export const Message = model('Message', messageSchema);
export const SafetyEvent = model('SafetyEvent', safetyEventSchema);

export const isObjectId = (id: unknown): id is string => typeof id === 'string' && Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);
