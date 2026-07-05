import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BetonForgeProject } from '../types/betonquest';

const STORAGE_KEY = 'betonforge-project-v1';

function loadInitial(): BetonForgeProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BetonForgeProject;
  } catch {
    // ignore malformed storage
  }
  return { packages: [] };
}

interface ProjectContextValue {
  project: BetonForgeProject;
  setProject: (updater: (p: BetonForgeProject) => BetonForgeProject) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<BetonForgeProject>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  function setProject(updater: (p: BetonForgeProject) => BetonForgeProject) {
    setProjectState((prev) => updater(prev));
  }

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject debe usarse dentro de ProjectProvider');
  return ctx;
}
