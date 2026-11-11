import { LIMIT_REACHED_REPLY, type HistoryTurn, type SafetyPipeline } from '@childgpt/safety';
import type { MessageDTO } from '@childgpt/shared';
import type { Config } from '../config';
import { conflict } from '../http/errors';
import type { Logger } from '../logger';
import { Conversation, Message, Parent, SafetyEvent, type ChildDoc } from '../models';
import type { Notifier } from './notify';
import { ageFromBirthYear, messageDTO } from './serializers';
import { dayKey } from './time';

export interface ChatService {
  todayMessages(child: ChildDoc): Promise<MessageDTO[]>;
  send(child: ChildDoc, text: string): Promise<{ message: MessageDTO; limited: boolean }>;
}

export function createChatService(deps: { config: Config; pipeline: SafetyPipeline; notifier: Notifier; logger: Logger }): ChatService {
  const { config, pipeline, notifier, logger } = deps;
  // Одно сообщение ребёнка обрабатывается за раз — защита от «спама» и гонок в истории.
  const inFlight = new Set<string>();

  async function todayConversation(child: ChildDoc) {
    return Conversation.findOneAndUpdate(
      { childId: child._id, day: dayKey(config.APP_TIMEZONE) },
      { $setOnInsert: { parentId: child.parentId } },
      { upsert: true, new: true },
    );
  }

  async function todayMessages(child: ChildDoc): Promise<MessageDTO[]> {
    const conv = await Conversation.findOne({ childId: child._id, day: dayKey(config.APP_TIMEZONE) });
    if (!conv) return [];
    const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(200);
    return messages.map((m) => messageDTO(m, 'kid'));
  }

  async function send(child: ChildDoc, text: string) {
    const childId = String(child._id);
    if (inFlight.has(childId)) throw conflict('Луми ещё думает над прошлым вопросом', 'busy');
    inFlight.add(childId);
    try {
      const conv = await todayConversation(child);

      if (conv.childMessageCount >= child.dailyMessageLimit) {
        const now = new Date();
        return {
          limited: true,
          message: { id: `limit-${now.getTime()}`, role: 'lumi' as const, text: LIMIT_REACHED_REPLY, createdAt: now.toISOString() },
        };
      }

      const recent = await Message.find({ conversationId: conv._id }).sort({ createdAt: -1 }).limit(pipeline.options.historyTurns);
      const history: HistoryTurn[] = recent.reverse().map((m) => ({ role: m.role, text: m.role === 'child' ? (m.sentText ?? m.text) : m.text }));

      const result = await pipeline.process({
        child: { name: child.name, age: ageFromBirthYear(child.birthYear), gender: child.gender, strictMode: child.strictMode },
        text,
        history,
      });

      const safety = { action: result.action, categories: result.categories, redactedPersonalData: result.personalDataRedacted };
      const childMsg = await Message.create({
        conversationId: conv._id,
        parentId: child.parentId,
        childId: child._id,
        role: 'child',
        text,
        sentText: result.sanitizedInput,
        safety,
      });
      const lumiMsg = await Message.create({
        conversationId: conv._id,
        parentId: child.parentId,
        childId: child._id,
        role: 'lumi',
        text: result.reply,
        safety,
      });

      const flagged = result.events.some((e) => e.severity !== 'info');
      await Conversation.updateOne(
        { _id: conv._id },
        { $inc: { messageCount: 2, childMessageCount: 1 }, $set: { lastMessageAt: new Date(), ...(flagged ? { flagged: true } : {}) } },
      );

      if (result.events.length) {
        await SafetyEvent.insertMany(
          result.events.map((e) => ({
            parentId: child.parentId,
            childId: child._id,
            conversationId: conv._id,
            messageId: childMsg._id,
            severity: e.severity,
            category: e.category,
            stage: e.stage,
            note: e.note,
            excerpt: text.slice(0, 200),
          })),
        );
      }

      const critical = result.events.find((e) => e.severity === 'critical');
      if (critical) {
        const parent = await Parent.findById(child.parentId);
        if (parent?.notifyByEmail) {
          notifier.criticalEvent({ to: parent.email, parentName: parent.name, childName: child.name, childId, category: critical.category });
        }
      }

      logger.info(
        { childId, action: result.action, categories: result.categories, ms: result.timings.totalMs },
        'kid message processed',
      );
      return { limited: false, message: messageDTO(lumiMsg, 'kid') };
    } finally {
      inFlight.delete(childId);
    }
  }

  return { todayMessages, send };
}
