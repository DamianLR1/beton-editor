import { useMemo, useState } from 'react';
import type { QuestPackage } from '../types/betonquest';
import { packageToYaml } from '../lib/yamlExport';
import { yamlToPackage } from '../lib/yamlImport';
import { downloadTextFile, pickTextFile } from '../io/fileIO';
import { Button, Section, TextArea } from '../components/ui';

export function ExportPanel({
  pkg,
  onImport,
}: {
  pkg: QuestPackage | null;
  onImport: (p: QuestPackage) => void;
}) {
  const [importText, setImportText] = useState('');
  const [importName, setImportName] = useState('package_importado');
  const [importError, setImportError] = useState('');

  const yamlPreview = useMemo(() => (pkg ? packageToYaml(pkg) : ''), [pkg]);

  function doExportDownload() {
    if (!pkg) return;
    downloadTextFile(`${pkg.name || 'package'}.yml`, yamlPreview);
  }

  async function doExportFromFile() {
    const file = await pickTextFile();
    if (!file) return;
    setImportText(file.text);
    setImportName(file.name.replace(/\.ya?ml$/, ''));
  }

  function doImport() {
    try {
      const parsed = yamlToPackage(importName || 'package_importado', importText);
      onImport(parsed);
      setImportText('');
      setImportError('');
    } catch (e) {
      setImportError('Error parseando el YAML: ' + (e as Error).message);
    }
  }

  function copyToClipboard() {
    if (!yamlPreview) return;
    navigator.clipboard.writeText(yamlPreview).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <Section title="Exportar package actual" eyebrow={pkg ? pkg.name : undefined} defaultOpen>
        {!pkg ? (
          <p className="text-sm text-ink-faint italic">Elegí un package primero.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="primary" type="button" onClick={doExportDownload}>
                Descargar {pkg.name || 'package'}.yml
              </Button>
              <Button variant="default" type="button" onClick={copyToClipboard}>
                Copiar YAML
              </Button>
            </div>
            <pre className="bg-void/50 border border-line-soft rounded-md p-3 text-xs font-mono text-ink-dim overflow-auto max-h-96">
              {yamlPreview || '(vacío)'}
            </pre>
            <p className="text-[11px] text-ink-faint">
              Este YAML combina actions/conditions/objectives/items/conversations bajo las mismas
              claves de nivel superior que usa BetonQuest. En el server, cada sección puede vivir en
              su propio archivo dentro de la carpeta del package (actions.yml, conditions.yml, etc.)
              — BetonQuest las mergea igual al cargar, así que podés pegarlo entero en un solo
              archivo o separarlo vos mismo.
            </p>
          </div>
        )}
      </Section>

      <Section title="Importar package desde YAML" defaultOpen>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              value={importName}
              onChange={(e) => setImportName(e.target.value.replace(/\s+/g, '_'))}
              placeholder="nombre del package"
              className="flex-1 font-mono text-xs"
            />
            <Button variant="default" type="button" onClick={doExportFromFile}>
              Elegir archivo .yml
            </Button>
          </div>
          <TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder="Pegá acá el contenido de actions.yml, conditions.yml, conversations.yml, o un combinado…"
            className="font-mono text-xs"
          />
          {importError && <p className="text-xs text-redstone">{importError}</p>}
          <Button variant="primary" type="button" onClick={doImport} disabled={!importText.trim()}>
            Importar como nuevo package
          </Button>
        </div>
      </Section>
    </div>
  );
}
