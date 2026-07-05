// Modelo interno de BetonForge — fiel a la estructura de paquetes de BetonQuest 3.0.1
// Un QuestPackage corresponde a una carpeta de package con su package.yml +
// actions.yml / conditions.yml / objectives.yml / items.yml / conversations/*.yml

export type InstructionKind = 'action' | 'condition' | 'objective';

/** Una instrucción con nombre dentro de un package, ej.
 * actions.yml -> burn: "burn 30 unit:ticks"
 * El "raw" es el string de instrucción completo tal cual va al YAML — se genera
 * y edita a través del InstructionEditor (que usa el registry para dar forma). */
export interface NamedInstruction {
  id: string; // id interno de BetonForge (no va al YAML)
  name: string; // key bajo actions./conditions./objectives.<name>
  definitionId: string; // id de InstructionDefinition en el registry (ej. "burn")
  negated: boolean; // solo aplica a conditions: "!keyword ..."
  argValues: string[]; // valores posicionales, alineados a definition.args
  rawOverride: string | null; // si el usuario edita el string crudo directamente, se usa esto en vez de reconstruirlo desde argValues
}

export function instructionToRaw(
  instr: NamedInstruction,
  buildFn: (definitionId: string, argValues: string[], negated: boolean) => string,
): string {
  if (instr.rawOverride != null) return instr.rawOverride;
  return buildFn(instr.definitionId, instr.argValues, instr.negated);
}

// ---------- Items ----------

/** Definición de ítem custom de BetonQuest (items.yml), formato instruction-string
 * similar a actions/conditions: "material:DIAMOND_SWORD name:'&cEspada' lore:'linea1|linea2' ..." */
export interface QuestItem {
  id: string;
  name: string; // key bajo items.<name>
  raw: string; // instruction string completo del ítem (material + atributos)
}

// ---------- Conversations ----------

export interface ConversationAction {
  id: string;
  text: string; // nombre de una action ya definida en el package (o "package.action")
}
export interface ConversationCondition {
  id: string;
  text: string; // nombre de una condition ya definida, puede empezar con "!"
}

export interface ConversationOption {
  id: string;
  key: string; // key interna dentro de NPC_options / player_options
  text: string; // texto que dice el NPC o el jugador
  actionNames: string[]; // referencias a actions.<name> del package (se ejecutan al elegir/mostrar la opción)
  conditionNames: string[]; // referencias a conditions.<name>, pueden llevar "!" de negación
  pointers: string[]; // keys de opciones a las que apunta (del lado contrario: NPC->player, player->NPC)
}

export type ConversationIO = 'simple' | 'chest' | 'menu' | 'combined' | 'tellraw';
export type InterceptorType = 'none' | 'simple' | 'packet';

export interface Conversation {
  id: string;
  name: string; // key bajo conversations.<name>
  quester: string; // nombre mostrado del NPC
  first: string[]; // keys de NPC_options iniciales (lista, se unen con coma en YAML)
  stop: boolean;
  blockItemTransfer: boolean;
  finalActions: string[]; // actions ejecutadas al terminar la conversación
  conversationIO: ConversationIO | '';
  interceptor: InterceptorType | '';
  interceptorDelay: number | null;
  npcOptions: ConversationOption[];
  playerOptions: ConversationOption[];
}

/** Binding npc_conversations: <NpcName>: <conversationName> — vincula un NPC (Citizens)
 * con la conversación que dispara. Es una sección aparte, a nivel de package. */
export interface NpcConversationBinding {
  id: string;
  npcName: string;
  conversationName: string;
}

// ---------- Package completo ----------

export interface QuestPackage {
  id: string;
  name: string; // nombre/carpeta del package
  enabled: boolean; // package.yml -> enabled: true/false (si no existe, se asume true)
  actions: NamedInstruction[];
  conditions: NamedInstruction[];
  objectives: NamedInstruction[];
  items: QuestItem[];
  conversations: Conversation[];
  npcConversations: NpcConversationBinding[];
}

export interface BetonForgeProject {
  packages: QuestPackage[];
}

// ---------- Constructores vacíos ----------

function uid() {
  return crypto.randomUUID();
}

export function emptyInstruction(kind: InstructionKind, definitionId: string, name = ''): NamedInstruction {
  return {
    id: uid(),
    name,
    definitionId,
    negated: false,
    argValues: [],
    rawOverride: null,
  };
}

export function emptyItem(name = ''): QuestItem {
  return {
    id: uid(),
    name,
    raw: 'material:PAPER',
  };
}

export function emptyConversationOption(key = ''): ConversationOption {
  return {
    id: uid(),
    key,
    text: '',
    actionNames: [],
    conditionNames: [],
    pointers: [],
  };
}

export function emptyConversation(name = ''): Conversation {
  return {
    id: uid(),
    name,
    quester: '',
    first: [],
    stop: true,
    blockItemTransfer: false,
    finalActions: [],
    conversationIO: '',
    interceptor: '',
    interceptorDelay: null,
    npcOptions: [],
    playerOptions: [],
  };
}

export function emptyPackage(name = ''): QuestPackage {
  return {
    id: uid(),
    name,
    enabled: true,
    actions: [],
    conditions: [],
    objectives: [],
    items: [],
    conversations: [],
    npcConversations: [],
  };
}
