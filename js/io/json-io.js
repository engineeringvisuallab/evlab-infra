import { serialize, parse } from '../core/project-serializer.js';
export function download(filename, data, mime = 'application/octet-stream') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const downloadProject = project => download((project.meta.name.replace(/[^\w-]+/g, '_') || 'project') + '.evlab.json', serialize(project), 'application/json');
export const readProjectFile = async file => parse(await file.text());
