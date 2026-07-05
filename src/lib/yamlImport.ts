import yaml from 'js-yaml';
import {
  emptyConversation,
  emptyConversationOption,
  emptyInstruction,
  emptyItem,
  emptyPackage,
  type Conversation,
  type ConversationOption,
  type NamedInstruction,
  type QuestPackage,
} from '../types/betonquest';
import { detectDefinition, type InstructionKind } from '../data/registry';

function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}
function num(v: unknown): number | null {
  return v == null || v === '' ? null : Number(v);
}
function bool(v: unknown, fallback = false): boolean {
  if (v == null) return fallback;
  if (typeof v === 'boolean') return v;
  return String(v).toLowerCase() === 'true';
}
function csv(v: unknown): string[] {
  if (v == null) return [];
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseInstruction(kind: InstructionKind, name: string, raw: string): NamedInstruction {
  const trimmed = raw.trim();
  const negated = kind === 'condition' && trimmed.startsWith('!');
  const def = detectDefinition(kind, trimmed);
  const instr = emptyInstruction(kind, def?.id ?? '', name);
  instr.negated = negated;
  instr.rawOverride = raw; // por defecto se conserva el string crudo tal cual vino
  if (def) {
    // best-effort: intentamos separar los valores posicionales para poblar el
    // formulario estructurado, pero rawOverride queda seteado igual como fuente
    // de verdad hasta que el usuario edite algo en el formulario.
    const body = negated ? trimmed.slice(1) : trimmed;
    const tokens = body.split(/\s+/).slice(1); // sin el keyword
    instr.argValues = def.args.map((_, i) => tokens[i] ?? '');
  }
  return instr;
}

function parseConversationOptions(sec: Record<string, unknown> | undefined): ConversationOption[] {
  if (!sec) return [];
  return Object.entries(sec).map(([key, raw]) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const opt = emptyConversationOption(key);
    opt.text = str(r.text);
    opt.actionNames = csv(r.actions);
    opt.conditionNames = csv(r.conditions);
    opt.pointers = csv(r.pointers);
    return opt;
  });
}

function parseConversation(name: string, raw: Record<string, unknown>): Conversation {
  const c = emptyConversation(name);
  c.quester = str(raw.quester);
  c.first = csv(raw.first);
  c.stop = bool(raw.stop, true);
  c.blockItemTransfer = bool(raw['block_item_transfer']);
  c.finalActions = csv(raw['final_actions']);
  c.conversationIO = (str(raw.conversationIO) as Conversation['conversationIO']) || '';
  c.interceptor = (str(raw.interceptor) as Conversation['interceptor']) || '';
  c.interceptorDelay = num(raw['interceptor_delay']);
  c.npcOptions = parseConversationOptions(raw['NPC_options'] as Record<string, unknown>);
  c.playerOptions = parseConversationOptions(raw['player_options'] as Record<string, unknown>);
  return c;
}

/** Parsea un YAML combinado (mismo formato que produce packageToYaml) a un QuestPackage.
 * También acepta YAML de un solo archivo real de BetonQuest (ej. solo conversations.yml
 * o solo actions.yml) — las secciones ausentes simplemente quedan vacías. */
export function yamlToPackage(name: string, text: string): QuestPackage {
  const doc = (yaml.load(text) as Record<string, unknown>) ?? {};
  const pkg = emptyPackage(name);

  const actionsSec = (doc.actions as Record<string, unknown>) ?? {};
  pkg.actions = Object.entries(actionsSec).map(([n, raw]) => parseInstruction('action', n, str(raw)));

  const conditionsSec = (doc.conditions as Record<string, unknown>) ?? {};
  pkg.conditions = Object.entries(conditionsSec).map(([n, raw]) => parseInstruction('condition', n, str(raw)));

  const objectivesSec = (doc.objectives as Record<string, unknown>) ?? {};
  pkg.objectives = Object.entries(objectivesSec).map(([n, raw]) => parseInstruction('objective', n, str(raw)));

  const itemsSec = (doc.items as Record<string, unknown>) ?? {};
  pkg.items = Object.entries(itemsSec).map(([n, raw]) => {
    const item = emptyItem(n);
    item.raw = str(raw);
    return item;
  });

  const conversationsSec = (doc.conversations as Record<string, unknown>) ?? {};
  pkg.conversations = Object.entries(conversationsSec).map(([n, raw]) =>
    parseConversation(n, raw as Record<string, unknown>),
  );

  const npcConvSec = (doc.npc_conversations as Record<string, unknown>) ?? {};
  pkg.npcConversations = Object.entries(npcConvSec).map(([npcName, conversationName]) => ({
    id: crypto.randomUUID(),
    npcName,
    conversationName: str(conversationName),
  }));

  return pkg;
}
