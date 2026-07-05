import { useState } from 'react';
import type { QuestPackage, NamedInstruction, QuestItem } from '../types/betonquest';
import { emptyInstruction, emptyItem } from '../types/betonquest';
import type { InstructionKind } from '../data/registry';
import { Button, Field, TextArea, TextInput } from '../components/ui';
import { InstructionEditor } from '../editors/InstructionEditor';

export type ListKey = 'actions' | 'conditions' | 'objectives' | 'items';

const KIND_BY_LIST: Record<Exclude<ListKey, 'items'>, InstructionKind> = {
  actions: 'action',
  conditions: 'condition',
  objectives: 'objective',
};

const LABELS: Record<
  ListKey,
  { singular: string; plural: string; yamlKey: string; slug: string; unNuevo: string }
> = {
  actions: { singular: 'Acción', plural: 'Acciones', yamlKey: 'actions', slug: 'action', unNuevo: 'una nueva' },
  conditions: { singular: 'Condición', plural: 'Condiciones', yamlKey: 'conditions', slug: 'condition', unNuevo: 'una nueva' },
  objectives: { singular: 'Objetivo', plural: 'Objetivos', yamlKey: 'objectives', slug: 'objective', unNuevo: 'uno nuevo' },
  items: { singular: 'Ítem', plural: 'Ítems', yamlKey: 'items', slug: 'item', unNuevo: 'uno nuevo' },
};

function uid() {
  return crypto.randomUUID();
}

export function InstructionListPanel({
  pkg,
  listKey,
  onChangePackage,
}: {
  pkg: QuestPackage;
  listKey: ListKey;
  onChangePackage: (p: QuestPackage) => void;
}) {
  const labels = LABELS[listKey];
  const list = pkg[listKey] as (NamedInstruction | QuestItem)[];
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);

  const selected = list.find((x) => x.id === selectedId) ?? null;

  function setList(next: (NamedInstruction | QuestItem)[]) {
    onChangePackage({ ...pkg, [listKey]: next } as QuestPackage);
  }

  function add() {
    const entry: NamedInstruction | QuestItem =
      listKey === 'items'
        ? emptyItem(`item_${list.length + 1}`)
        : emptyInstruction(KIND_BY_LIST[listKey as Exclude<ListKey, 'items'>], '', `${labels.slug}_${list.length + 1}`);
    setList([...list, entry]);
    setSelectedId(entry.id);
  }

  function remove(id: string) {
    setList(list.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function update(next: NamedInstruction | QuestItem) {
    setList(list.map((x) => (x.id === next.id ? next : x)));
  }

  return (
    <div className="flex gap-4 min-h-[420px]">
      <div className="w-56 shrink-0 border border-line rounded-lg bg-panel/60 flex flex-col">
        <div className="p-2 border-b border-line-soft">
          <Button variant="primary" className="w-full" type="button" onClick={add}>
            + {labels.singular}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {list.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-sm ${
                item.id === selectedId
                  ? 'bg-copper/10 border border-copper/40 text-ink'
                  : 'hover:bg-panel-raised border border-transparent text-ink-dim'
              }`}
            >
              <span className="truncate font-mono text-xs">{item.name || '(sin nombre)'}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-redstone px-1 shrink-0"
              >
                ×
              </button>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-xs text-ink-faint italic px-2 py-6 text-center">
              Sin {labels.plural.toLowerCase()} todavía.
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {!selected && (
          <div className="h-full flex items-center justify-center text-ink-faint text-sm italic border border-dashed border-line rounded-lg">
            Elegí {labels.unNuevo === 'una nueva' ? 'una' : 'un'} {labels.singular.toLowerCase()} de la izquierda o creá {labels.unNuevo}.
          </div>
        )}
        {selected && listKey !== 'items' && (
          <InstructionEditor
            kind={KIND_BY_LIST[listKey as Exclude<ListKey, 'items'>]}
            instruction={selected as NamedInstruction}
            onChange={update}
          />
        )}
        {selected && listKey === 'items' && (
          <ItemEditor item={selected as QuestItem} onChange={update} />
        )}
      </div>
    </div>
  );
}

function ItemEditor({ item, onChange }: { item: QuestItem; onChange: (i: QuestItem) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Nombre" hint="key bajo items.<nombre>">
        <TextInput
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value.replace(/\s+/g, '_'), id: item.id })}
          className="font-mono text-xs"
        />
      </Field>
      <Field
        label="Instruction string del ítem"
        hint='ej. material:DIAMOND_SWORD name:"&cEspada" lore:"linea1|linea2" enchantments:sharpness:5'
      >
        <TextArea
          value={item.raw}
          onChange={(e) => onChange({ ...item, raw: e.target.value })}
          className="font-mono text-xs"
          rows={4}
        />
      </Field>
      <p className="text-[11px] text-ink-faint">
        BetonQuest describe los ítems con su propio formato de atributos (material, name, lore,
        enchantments, unbreakable, etc.) — se edita como texto libre acá; se exporta tal cual al
        YAML bajo <code>items.{'{nombre}'}</code>.
      </p>
    </div>
  );
}

// silence unused import (uid queda disponible para futuras extensiones del panel)
void uid;
