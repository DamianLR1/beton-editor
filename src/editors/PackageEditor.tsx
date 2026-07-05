import { useState } from 'react';
import type { QuestPackage } from '../types/betonquest';
import { Toggle, TextInput, Field } from '../components/ui';
import { InstructionListPanel, type ListKey } from '../components/InstructionListPanel';
import { ConversationsPanel } from '../panels/ConversationsPanel';

type Tab = ListKey | 'conversations';

const TABS: { key: Tab; label: string }[] = [
  { key: 'actions', label: 'Acciones' },
  { key: 'conditions', label: 'Condiciones' },
  { key: 'objectives', label: 'Objetivos' },
  { key: 'items', label: 'Ítems' },
  { key: 'conversations', label: 'Conversaciones' },
];

export function PackageEditor({
  pkg,
  onChange,
}: {
  pkg: QuestPackage;
  onChange: (p: QuestPackage) => void;
}) {
  const [tab, setTab] = useState<Tab>('actions');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 border border-line rounded-lg bg-panel/60 px-4 py-3">
        <Field label="Nombre del package" hint="carpeta del package en BetonQuest">
          <TextInput
            value={pkg.name}
            onChange={(e) => onChange({ ...pkg, name: e.target.value.replace(/\s+/g, '_') })}
            className="font-mono text-xs"
          />
        </Field>
        <Toggle checked={pkg.enabled} onChange={(v) => onChange({ ...pkg, enabled: v })} label="enabled" />
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => {
          const count =
            t.key === 'conversations' ? pkg.conversations.length : (pkg[t.key] as unknown[]).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-mono border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-copper text-copper'
                  : 'border-transparent text-ink-dim hover:text-ink'
              }`}
            >
              {t.label} <span className="text-[11px] text-ink-faint">({count})</span>
            </button>
          );
        })}
      </div>

      <div>
        {tab === 'conversations' ? (
          <ConversationsPanel pkg={pkg} onChangePackage={onChange} />
        ) : (
          <InstructionListPanel pkg={pkg} listKey={tab} onChangePackage={onChange} />
        )}
      </div>
    </div>
  );
}
