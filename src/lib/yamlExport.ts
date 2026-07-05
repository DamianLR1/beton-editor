import yaml from 'js-yaml';
import type { Conversation, NamedInstruction, QuestPackage } from '../types/betonquest';
import { buildInstructionString, findDefinition } from '../data/registry';

function instructionRaw(instr: NamedInstruction, kind: 'action' | 'condition' | 'objective'): string {
  if (instr.rawOverride != null) return instr.rawOverride;
  const def = findDefinition(kind, instr.definitionId);
  if (!def) return '';
  return buildInstructionString(def, instr.argValues, instr.negated);
}

function conversationToYaml(c: Conversation): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.quester) out['quester'] = c.quester;
  if (c.first.length > 0) out['first'] = c.first.join(',');
  out['stop'] = c.stop ? 'true' : 'false';
  if (c.blockItemTransfer) out['block_item_transfer'] = 'true';
  if (c.finalActions.length > 0) out['final_actions'] = c.finalActions.join(',');
  if (c.conversationIO) out['conversationIO'] = c.conversationIO;
  if (c.interceptor) out['interceptor'] = c.interceptor;
  if (c.interceptorDelay != null) out['interceptor_delay'] = c.interceptorDelay;

  const npcOpts: Record<string, unknown> = {};
  c.npcOptions.forEach((o) => {
    const opt: Record<string, unknown> = { text: o.text };
    if (o.actionNames.length > 0) opt['actions'] = o.actionNames.join(',');
    if (o.conditionNames.length > 0) opt['conditions'] = o.conditionNames.join(',');
    if (o.pointers.length > 0) opt['pointers'] = o.pointers.join(',');
    npcOpts[o.key || o.id] = opt;
  });
  if (Object.keys(npcOpts).length > 0) out['NPC_options'] = npcOpts;

  const playerOpts: Record<string, unknown> = {};
  c.playerOptions.forEach((o) => {
    const opt: Record<string, unknown> = { text: o.text };
    if (o.actionNames.length > 0) opt['actions'] = o.actionNames.join(',');
    if (o.conditionNames.length > 0) opt['conditions'] = o.conditionNames.join(',');
    if (o.pointers.length > 0) opt['pointers'] = o.pointers.join(',');
    playerOpts[o.key || o.id] = opt;
  });
  if (Object.keys(playerOpts).length > 0) out['player_options'] = playerOpts;

  return out;
}

/** Exporta un package completo a un único YAML combinado (BetonQuest normalmente
 * lo divide en varios archivos dentro de la carpeta del package — acá se concatenan
 * bajo las mismas claves de nivel superior para simplificar el manejo en el navegador;
 * al llevarlo al server, cada sección puede separarse en su propio archivo si preferís
 * la estructura de carpetas nativa). */
export function packageToYaml(pkg: QuestPackage): string {
  const root: Record<string, unknown> = {};

  if (pkg.actions.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.actions.forEach((a) => {
      sec[a.name] = instructionRaw(a, 'action');
    });
    root['actions'] = sec;
  }

  if (pkg.conditions.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.conditions.forEach((c) => {
      sec[c.name] = instructionRaw(c, 'condition');
    });
    root['conditions'] = sec;
  }

  if (pkg.objectives.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.objectives.forEach((o) => {
      sec[o.name] = instructionRaw(o, 'objective');
    });
    root['objectives'] = sec;
  }

  if (pkg.items.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.items.forEach((i) => {
      sec[i.name] = i.raw;
    });
    root['items'] = sec;
  }

  if (pkg.conversations.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.conversations.forEach((c) => {
      sec[c.name] = conversationToYaml(c);
    });
    root['conversations'] = sec;
  }

  if (pkg.npcConversations.length > 0) {
    const sec: Record<string, unknown> = {};
    pkg.npcConversations.forEach((b) => {
      if (b.npcName) sec[b.npcName] = b.conversationName;
    });
    root['npc_conversations'] = sec;
  }

  return yaml.dump(root, { lineWidth: -1, noRefs: true });
}

/** package.yml — metadata mínima del package (enabled + nombre como comentario). */
export function packageMetaToYaml(pkg: QuestPackage): string {
  return yaml.dump({ enabled: pkg.enabled }, { lineWidth: -1, noRefs: true });
}
