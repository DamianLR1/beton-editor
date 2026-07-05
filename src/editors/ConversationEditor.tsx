import type { Conversation, ConversationOption, QuestPackage } from '../types/betonquest';
import { emptyConversationOption } from '../types/betonquest';
import { Section, Field, TextInput, NumberInput, TextArea, Toggle, Button, TagListEditor } from '../components/ui';

function uid() {
  return crypto.randomUUID();
}

const IO_OPTIONS = ['', 'simple', 'chest', 'menu', 'combined', 'tellraw'] as const;
const INTERCEPTOR_OPTIONS = ['', 'none', 'simple', 'packet'] as const;

export function ConversationEditor({
  conversation,
  onChange,
  pkg,
}: {
  conversation: Conversation;
  onChange: (c: Conversation) => void;
  pkg: QuestPackage; // para ofrecer selects de actions/conditions ya definidas en el package
}) {
  function patch(p: Partial<Conversation>) {
    onChange({ ...conversation, ...p });
  }

  const actionNames = pkg.actions.map((a) => a.name).filter(Boolean);
  const conditionNames = pkg.conditions.map((c) => c.name).filter(Boolean);

  return (
    <div className="space-y-4">
      <Section title="General" eyebrow={`conversations.${conversation.name || '<nombre>'}`}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" hint="key bajo conversations.<nombre>">
            <TextInput
              value={conversation.name}
              onChange={(e) => patch({ name: e.target.value.replace(/\s+/g, '_') })}
              className="font-mono text-xs"
            />
          </Field>
          <Field label="quester" hint="nombre mostrado del NPC">
            <TextInput value={conversation.quester} onChange={(e) => patch({ quester: e.target.value })} />
          </Field>
        </div>

        <Field label="first" hint="keys de NPC_options iniciales, en orden de prioridad">
          <TagListEditor
            values={conversation.first}
            onChange={(v) => patch({ first: v })}
            placeholder="welcome"
          />
        </Field>

        <div className="grid grid-cols-2 gap-1">
          <Toggle checked={conversation.stop} onChange={(v) => patch({ stop: v })} label="stop (detiene al jugador durante la conversación)" />
          <Toggle checked={conversation.blockItemTransfer} onChange={(v) => patch({ blockItemTransfer: v })} label="block_item_transfer" />
        </div>

        <Field label="final_actions" hint="actions ejecutadas al terminar la conversación">
          <TagListEditor
            values={conversation.finalActions}
            onChange={(v) => patch({ finalActions: v })}
            placeholder="setCityState"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="conversationIO">
            <select
              value={conversation.conversationIO}
              onChange={(e) => patch({ conversationIO: e.target.value as Conversation['conversationIO'] })}
              className="w-full"
            >
              {IO_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o || '— default —'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="interceptor">
            <select
              value={conversation.interceptor}
              onChange={(e) => patch({ interceptor: e.target.value as Conversation['interceptor'] })}
              className="w-full"
            >
              {INTERCEPTOR_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o || '— default —'}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {conversation.interceptor && conversation.interceptor !== 'none' && (
          <Field label="interceptor_delay" hint="ticks">
            <NumberInput value={conversation.interceptorDelay} onChange={(v) => patch({ interceptorDelay: v })} />
          </Field>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-4">
        <OptionsColumn
          title="Opciones de NPC"
          eyebrow="NPC_options"
          options={conversation.npcOptions}
          otherSideOptions={conversation.playerOptions}
          onChange={(v) => patch({ npcOptions: v })}
          actionNames={actionNames}
          conditionNames={conditionNames}
        />
        <OptionsColumn
          title="Opciones del jugador"
          eyebrow="player_options"
          options={conversation.playerOptions}
          otherSideOptions={conversation.npcOptions}
          onChange={(v) => patch({ playerOptions: v })}
          actionNames={actionNames}
          conditionNames={conditionNames}
        />
      </div>
    </div>
  );
}

function OptionsColumn({
  title,
  eyebrow,
  options,
  otherSideOptions,
  onChange,
  actionNames,
  conditionNames,
}: {
  title: string;
  eyebrow: string;
  options: ConversationOption[];
  otherSideOptions: ConversationOption[];
  onChange: (v: ConversationOption[]) => void;
  actionNames: string[];
  conditionNames: string[];
}) {
  function update(id: string, patch: Partial<ConversationOption>) {
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function remove(id: string) {
    onChange(options.filter((o) => o.id !== id));
  }
  function add() {
    onChange([...options, emptyConversationOption(`option_${options.length + 1}`)]);
  }

  return (
    <Section title={title} eyebrow={eyebrow} count={options.length} defaultOpen>
      <div className="space-y-3">
        {options.map((opt) => (
          <div key={opt.id} className="border border-line-soft rounded-md p-3 space-y-2">
            <div className="flex gap-2 items-center">
              <input
                value={opt.key}
                onChange={(e) => update(opt.id, { key: e.target.value.replace(/\s+/g, '_') })}
                placeholder="key interna"
                className="w-32 font-mono text-xs"
              />
              <button type="button" className="ml-auto text-ink-faint hover:text-redstone px-1" onClick={() => remove(opt.id)}>
                ×
              </button>
            </div>
            <TextArea
              value={opt.text}
              onChange={(e) => update(opt.id, { text: e.target.value })}
              placeholder="Texto que dice…"
              rows={2}
              className="text-xs"
            />
            <Field label="actions" hint="se ejecutan al mostrar/elegir esta opción">
              <TagListEditor
                values={opt.actionNames}
                onChange={(v) => update(opt.id, { actionNames: v })}
                placeholder={actionNames[0] ?? 'nombre de action'}
              />
            </Field>
            <Field label="conditions" hint='usá "!" para negar, ej. !criminal'>
              <TagListEditor
                values={opt.conditionNames}
                onChange={(v) => update(opt.id, { conditionNames: v })}
                placeholder={conditionNames[0] ?? 'nombre de condition'}
              />
            </Field>
            <Field label="pointers" hint="keys del lado contrario a las que apunta esta opción">
              <PointerPicker
                selected={opt.pointers}
                options={otherSideOptions.map((o) => o.key).filter(Boolean)}
                onChange={(v) => update(opt.id, { pointers: v })}
              />
            </Field>
          </div>
        ))}
        <Button variant="default" type="button" onClick={add}>
          + Opción
        </Button>
      </div>
    </Section>
  );
}

function PointerPicker({
  selected,
  options,
  onChange,
}: {
  selected: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value && !selected.includes(e.target.value)) onChange([...selected, e.target.value]);
        }}
        className="w-full mb-2 text-xs"
      >
        <option value="">— agregar pointer —</option>
        {options.filter((o) => !selected.includes(o)).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 bg-panel-raised border border-line rounded-full px-2.5 py-1 text-xs font-mono text-ink-dim">
              {s}
              <button type="button" onClick={() => onChange(selected.filter((x) => x !== s))} className="text-ink-faint hover:text-redstone">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// silence unused
void uid;
