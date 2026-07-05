import { useState } from 'react';
import type { QuestPackage, NpcConversationBinding } from '../types/betonquest';
import { emptyConversation } from '../types/betonquest';
import { Button, Field, TextInput, Section } from '../components/ui';
import { ConversationEditor } from '../editors/ConversationEditor';

function uid() {
  return crypto.randomUUID();
}

export function ConversationsPanel({
  pkg,
  onChangePackage,
}: {
  pkg: QuestPackage;
  onChangePackage: (p: QuestPackage) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(pkg.conversations[0]?.id ?? null);
  const selected = pkg.conversations.find((c) => c.id === selectedId) ?? null;

  function add() {
    const c = emptyConversation(`conversation_${pkg.conversations.length + 1}`);
    onChangePackage({ ...pkg, conversations: [...pkg.conversations, c] });
    setSelectedId(c.id);
  }
  function remove(id: string) {
    onChangePackage({ ...pkg, conversations: pkg.conversations.filter((c) => c.id !== id) });
    if (selectedId === id) setSelectedId(null);
  }
  function update(next: typeof pkg.conversations[number]) {
    onChangePackage({
      ...pkg,
      conversations: pkg.conversations.map((c) => (c.id === next.id ? next : c)),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 min-h-[420px]">
        <div className="w-56 shrink-0 border border-line rounded-lg bg-panel/60 flex flex-col">
          <div className="p-2 border-b border-line-soft">
            <Button variant="primary" className="w-full" type="button" onClick={add}>
              + Conversación
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {pkg.conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-sm ${
                  c.id === selectedId
                    ? 'bg-copper/10 border border-copper/40 text-ink'
                    : 'hover:bg-panel-raised border border-transparent text-ink-dim'
                }`}
              >
                <span className="truncate font-mono text-xs">{c.name || '(sin nombre)'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-redstone px-1 shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            {pkg.conversations.length === 0 && (
              <div className="text-xs text-ink-faint italic px-2 py-6 text-center">Sin conversaciones todavía.</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {!selected && (
            <div className="h-full flex items-center justify-center text-ink-faint text-sm italic border border-dashed border-line rounded-lg">
              Elegí una conversación de la izquierda o creá una nueva.
            </div>
          )}
          {selected && <ConversationEditor conversation={selected} onChange={update} pkg={pkg} />}
        </div>
      </div>

      <NpcBindingsSection pkg={pkg} onChangePackage={onChangePackage} />
    </div>
  );
}

function NpcBindingsSection({
  pkg,
  onChangePackage,
}: {
  pkg: QuestPackage;
  onChangePackage: (p: QuestPackage) => void;
}) {
  function update(id: string, patch: Partial<NpcConversationBinding>) {
    onChangePackage({
      ...pkg,
      npcConversations: pkg.npcConversations.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }
  function remove(id: string) {
    onChangePackage({ ...pkg, npcConversations: pkg.npcConversations.filter((b) => b.id !== id) });
  }
  function add() {
    onChangePackage({
      ...pkg,
      npcConversations: [...pkg.npcConversations, { id: uid(), npcName: '', conversationName: '' }],
    });
  }

  return (
    <Section title="Vínculos NPC → Conversación" eyebrow="npc_conversations" count={pkg.npcConversations.length} defaultOpen={pkg.npcConversations.length > 0}>
      <p className="text-xs text-ink-faint mb-3">
        Vincula el nombre de un NPC (Citizens) con la conversation que dispara al hablarle.
      </p>
      <div className="space-y-2">
        {pkg.npcConversations.map((b) => (
          <div key={b.id} className="flex gap-2 items-center">
            <Field label="NPC">
              <TextInput
                value={b.npcName}
                onChange={(e) => update(b.id, { npcName: e.target.value })}
                placeholder="Hans"
              />
            </Field>
            <Field label="Conversación">
              <select
                value={b.conversationName}
                onChange={(e) => update(b.id, { conversationName: e.target.value })}
                className="w-full"
              >
                <option value="">— elegir —</option>
                {pkg.conversations.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <button type="button" className="text-ink-faint hover:text-redstone px-1 mt-5" onClick={() => remove(b.id)}>
              ×
            </button>
          </div>
        ))}
        <Button variant="default" type="button" onClick={add}>
          + Binding
        </Button>
      </div>
    </Section>
  );
}
