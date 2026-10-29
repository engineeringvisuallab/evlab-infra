import { serialize, parse } from '../core/project-serializer.js';
export function downloadProject(project) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([serialize(project)], { type: 'application/json' }));
  a.download = (project.meta.name.replace(/[^\w-]+/g, '_') || 'project') + '.evlab.json';
  a.click(); URL.revokeObjectURL(a.href);
}
export const readProjectFile = async file => parse(await file.text());
