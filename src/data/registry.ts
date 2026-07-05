// Registry data-driven de los 152 tipos de instrucción de BetonQuest 3.0.1
// (61 actions, 54 conditions, 37 objectives), extraídos automáticamente de la
// documentación oficial (docs/Documentation/Reference/*.md del repo BetonQuest-main).
//
// En vez de armar 152 formularios a mano, cada tipo se describe acá como dato
// (sintaxis, argumentos requeridos/opcionales, parámetros documentados, ejemplo)
// y un único InstructionEditor genérico se alimenta de esto.

import raw from './registry.json';

export type InstructionKind = 'action' | 'condition' | 'objective';

export interface InstructionArg {
  raw: string; // nombre del argumento tal cual aparece en la sintaxis, ej. "duration"
  required: boolean;
}

export interface InstructionParam {
  name: string;
  required: boolean;
  default: string | null;
  explanation: string;
}

export interface InstructionDefinition {
  id: string; // slug único, ej. "burn"
  name: string; // nombre mostrado, ej. "Burn"
  kind: InstructionKind;
  keyword: string; // primer token de la instrucción, ej. "burn"
  syntax: string; // sintaxis completa documentada, ej. "burn <duration> [unit]"
  description: string;
  example: string;
  args: InstructionArg[];
  params: InstructionParam[];
}

export const REGISTRY: InstructionDefinition[] = raw as InstructionDefinition[];

export function registryByKind(kind: InstructionKind): InstructionDefinition[] {
  return REGISTRY.filter((d) => d.kind === kind);
}

export function findDefinition(kind: InstructionKind, id: string): InstructionDefinition | undefined {
  return REGISTRY.find((d) => d.kind === kind && d.id === id);
}

export function searchRegistry(kind: InstructionKind, query: string): InstructionDefinition[] {
  const q = query.trim().toLowerCase();
  const pool = registryByKind(kind);
  if (!q) return pool;
  return pool.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.keyword.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q),
  );
}

/** Dada una instrucción cruda ya escrita (ej. "burn 30 unit:ticks" o "!hasitem gold_ingot:5"),
 * detecta a qué definición del registry corresponde, mirando la primera palabra
 * (ignorando el "!" de negación que usan las conditions). */
export function detectDefinition(kind: InstructionKind, raw: string): InstructionDefinition | undefined {
  const trimmed = raw.trim().replace(/^!/, '');
  const keyword = trimmed.split(/\s+/)[0]?.toLowerCase();
  if (!keyword) return undefined;
  return registryByKind(kind).find((d) => d.keyword.toLowerCase() === keyword);
}

/** Arma el string de instrucción a partir del keyword + una lista de valores de argumento,
 * en el mismo orden que definition.args. Los argumentos vacíos se omiten si son opcionales. */
export function buildInstructionString(
  definition: InstructionDefinition,
  argValues: string[],
  negate = false,
): string {
  const parts = [definition.keyword];
  definition.args.forEach((arg, i) => {
    const v = (argValues[i] ?? '').trim();
    if (!v) return; // se omite (obligatorio vacío queda incompleto a propósito, se valida aparte)
    parts.push(v);
  });
  const instr = parts.join(' ');
  return negate ? `!${instr}` : instr;
}

/** Extrae, best-effort, los valores de argumento posicionales de una instrucción cruda
 * ya escrita, para poder editarla en el formulario estructurado. No es un parser completo
 * de la sintaxis de BetonQuest (que mezcla posicionales con keyword:valor) — separa por
 * espacios respetando que el primer token es el keyword. */
export function splitInstructionArgs(raw: string): { negated: boolean; keyword: string; rest: string[] } {
  const trimmed = raw.trim();
  const negated = trimmed.startsWith('!');
  const body = negated ? trimmed.slice(1) : trimmed;
  const tokens = body.split(/\s+/).filter(Boolean);
  const [keyword, ...rest] = tokens;
  return { negated, keyword: keyword ?? '', rest };
}
