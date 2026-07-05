import { useMemo, useState } from 'react';
import type { NamedInstruction } from '../types/betonquest';
import {
  buildInstructionString,
  findDefinition,
  registryByKind,
  searchRegistry,
  splitInstructionArgs,
  type InstructionDefinition,
  type InstructionKind,
} from '../data/registry';
import { Field, TextInput, TextArea, Toggle, Button } from '../components/ui';

/** Editor de una NamedInstruction: elegir el tipo (de los 152 del registry),
 * completar sus argumentos en un formulario generado desde la definición,
 * o cambiar a modo "raw" para escribir la instrucción a mano si algo no encaja
 * en el modelo estructurado (siempre queda esa vía de escape). */
export function InstructionEditor({
  kind,
  instruction,
  onChange,
}: {
  kind: InstructionKind;
  instruction: NamedInstruction;
  onChange: (i: NamedInstruction) => void;
}) {
  const [pickerQuery, setPickerQuery] = useState('');
  const [rawMode, setRawMode] = useState(instruction.rawOverride != null);

  const definition = findDefinition(kind, instruction.definitionId);
  const searchResults = useMemo(
    () => searchRegistry(kind, pickerQuery).slice(0, 40),
    [kind, pickerQuery],
  );

  function patch(p: Partial<NamedInstruction>) {
    onChange({ ...instruction, ...p });
  }

  function pickDefinition(def: InstructionDefinition) {
    patch({
      definitionId: def.id,
      argValues: def.args.map(() => ''),
      rawOverride: null,
    });
    setRawMode(false);
  }

  const previewRaw = definition
    ? buildInstructionString(definition, instruction.argValues, instruction.negated)
    : instruction.rawOverride ?? '';

  return (
    <div className="space-y-3">
      <Field label="Nombre" hint={`key bajo ${kind}s.<nombre>`}>
        <TextInput
          value={instruction.name}
          onChange={(e) => patch({ name: e.target.value.replace(/\s+/g, '_') })}
          className="font-mono text-xs"
        />
      </Field>

      {kind === 'condition' && (
        <Toggle
          checked={instruction.negated}
          onChange={(v) => patch({ negated: v })}
          label='Negada (antepone "!" — se cumple cuando la condición es falsa)'
        />
      )}

      {!definition && !rawMode && (
        <div className="border border-line-soft rounded-md p-3">
          <div className="text-xs text-ink-dim mb-2">
            Elegí el tipo de {kind === 'action' ? 'action' : kind === 'condition' ? 'condition' : 'objective'}{' '}
            ({registryByKind(kind).length} disponibles):
          </div>
          <input
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full mb-2 text-xs"
            autoFocus
          />
          <div className="max-h-72 overflow-y-auto space-y-1">
            {searchResults.map((def) => (
              <button
                key={def.id}
                type="button"
                onClick={() => pickDefinition(def)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-panel-raised border border-transparent hover:border-line transition-colors"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm text-copper">{def.name}</span>
                  <span className="text-[11px] text-ink-faint font-mono">{def.syntax}</span>
                </div>
                <div className="text-xs text-ink-faint line-clamp-1">{def.description}</div>
              </button>
            ))}
            {searchResults.length === 0 && (
              <div className="text-xs text-ink-faint italic px-3 py-4 text-center">Sin resultados.</div>
            )}
          </div>
          <div className="mt-2 text-right">
            <Button variant="ghost" type="button" onClick={() => setRawMode(true)}>
              Escribir instrucción cruda en su lugar →
            </Button>
          </div>
        </div>
      )}

      {definition && !rawMode && (
        <div className="border border-copper/30 rounded-md p-3 space-y-3 bg-copper/5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-sm text-copper">{definition.name}</span>
              <span className="text-[11px] text-ink-faint font-mono ml-2">{definition.syntax}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" type="button" onClick={() => patch({ definitionId: '', argValues: [] })}>
                Cambiar tipo
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  patch({ rawOverride: previewRaw });
                  setRawMode(true);
                }}
              >
                Editar como texto crudo
              </Button>
            </div>
          </div>
          <p className="text-xs text-ink-faint">{definition.description}</p>

          {definition.args.length > 0 ? (
            <div className="space-y-2">
              {definition.args.map((arg, i) => {
                const paramDoc = definition.params.find(
                  (p) => p.name.toLowerCase() === arg.raw.toLowerCase(),
                );
                return (
                  <Field
                    key={i}
                    label={`${arg.raw}${arg.required ? '' : ' (opcional)'}`}
                    hint={paramDoc?.default ? `default: ${paramDoc.default}` : undefined}
                  >
                    <TextInput
                      value={instruction.argValues[i] ?? ''}
                      onChange={(e) => {
                        const next = [...instruction.argValues];
                        next[i] = e.target.value;
                        patch({ argValues: next });
                      }}
                      placeholder={paramDoc?.explanation ?? arg.raw}
                      className="font-mono text-xs"
                    />
                    {paramDoc?.explanation && (
                      <div className="text-[11px] text-ink-faint mt-0.5">{paramDoc.explanation}</div>
                    )}
                  </Field>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-ink-faint italic">Esta instrucción no tiene argumentos.</p>
          )}

          <div className="border-t border-line-soft pt-2">
            <div className="text-[11px] text-ink-faint mb-1">Vista previa del instruction string:</div>
            <code className="block text-xs font-mono text-emerald bg-void/50 rounded px-2 py-1.5 break-all">
              {previewRaw || '(incompleto)'}
            </code>
          </div>

          {definition.example && (
            <details className="text-xs">
              <summary className="cursor-pointer text-ink-faint hover:text-ink-dim">Ver ejemplo de la documentación</summary>
              <pre className="mt-1.5 bg-void/50 rounded p-2 overflow-x-auto text-[11px] text-ink-dim">{definition.example}</pre>
            </details>
          )}
        </div>
      )}

      {rawMode && (
        <div className="border border-line-soft rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-dim">Instrucción cruda (texto libre)</span>
            {definition && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  patch({ rawOverride: null });
                  setRawMode(false);
                }}
              >
                Volver al formulario estructurado
              </Button>
            )}
          </div>
          <TextArea
            value={instruction.rawOverride ?? previewRaw}
            onChange={(e) => {
              const { negated, keyword } = splitInstructionArgs(e.target.value);
              patch({ rawOverride: e.target.value, negated: kind === 'condition' ? negated : instruction.negated });
              void keyword;
            }}
            className="font-mono text-xs"
            rows={3}
            placeholder={`ej. burn 30 unit:ticks`}
          />
          <p className="text-[11px] text-ink-faint">
            Se exporta tal cual está escrito acá, sin pasar por el formulario. Usalo si necesitás una
            sintaxis que el editor estructurado no cubre bien (instrucciones anidadas, variables, etc.).
          </p>
        </div>
      )}
    </div>
  );
}
