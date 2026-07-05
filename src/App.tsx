import { useState } from 'react';
import { ProjectProvider, useProject } from './state/ProjectContext';
import type { QuestPackage } from './types/betonquest';
import { emptyPackage } from './types/betonquest';
import { Button } from './components/ui';
import { PackageEditor } from './editors/PackageEditor';
import { ExportPanel } from './panels/ExportPanel';
import { REGISTRY } from './data/registry';

type Tab = 'package' | 'export';

function AppInner() {
  const { project, setProject } = useProject();
  const [tab, setTab] = useState<Tab>('package');
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(project.packages[0]?.id ?? null);

  const selectedPkg = project.packages.find((p) => p.id === selectedPkgId) ?? null;

  function addPackage() {
    const p = emptyPackage(`package_${project.packages.length + 1}`);
    setProject((proj) => ({ ...proj, packages: [...proj.packages, p] }));
    setSelectedPkgId(p.id);
    setTab('package');
  }

  function updatePackage(next: QuestPackage) {
    setProject((proj) => ({
      ...proj,
      packages: proj.packages.map((p) => (p.id === next.id ? next : p)),
    }));
  }

  function removePackage(id: string) {
    setProject((proj) => ({ ...proj, packages: proj.packages.filter((p) => p.id !== id) }));
    if (selectedPkgId === id) setSelectedPkgId(null);
  }

  function importPackage(p: QuestPackage) {
    setProject((proj) => ({ ...proj, packages: [...proj.packages, p] }));
    setSelectedPkgId(p.id);
    setTab('package');
  }

  const actionCount = REGISTRY.filter((d) => d.kind === 'action').length;
  const conditionCount = REGISTRY.filter((d) => d.kind === 'condition').length;
  const objectiveCount = REGISTRY.filter((d) => d.kind === 'objective').length;

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-line px-4 py-3 flex items-center justify-between bg-panel">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-copper">BetonForge</span>
          <span className="text-xs text-ink-faint">
            editor visual — BetonQuest · {actionCount} actions · {conditionCount} conditions · {objectiveCount} objectives
          </span>
        </div>
        <nav className="flex gap-1">
          {(['package', 'export'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize border ${
                tab === t
                  ? 'border-copper text-copper bg-copper/10'
                  : 'border-transparent text-ink-dim hover:border-line'
              }`}
            >
              {t === 'package' ? 'Editor' : 'Importar / Exportar'}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-line bg-panel/60 flex flex-col">
          <div className="p-3 border-b border-line-soft">
            <Button variant="primary" className="w-full" onClick={addPackage}>
              + Package
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {project.packages.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedPkgId(p.id);
                  setTab('package');
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm ${
                  p.id === selectedPkgId
                    ? 'bg-copper/10 border border-copper/40 text-ink'
                    : 'hover:bg-panel-raised border border-transparent text-ink-dim'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs">{p.name || '(sin nombre)'}</div>
                  <div className="text-[10px] text-ink-faint">
                    {p.actions.length}A · {p.conditions.length}C · {p.objectives.length}O ·{' '}
                    {p.conversations.length}conv
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePackage(p.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-ink-faint hover:text-redstone px-1 shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            {project.packages.length === 0 && (
              <div className="text-xs text-ink-faint italic px-2 py-6 text-center">
                Sin packages todavía.
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {tab === 'package' &&
            (selectedPkg ? (
              <PackageEditor pkg={selectedPkg} onChange={updatePackage} />
            ) : (
              <div className="h-full flex items-center justify-center text-ink-faint text-sm italic">
                Elegí un package de la izquierda o creá uno nuevo.
              </div>
            ))}
          {tab === 'export' && <ExportPanel pkg={selectedPkg} onImport={importPackage} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  );
}
