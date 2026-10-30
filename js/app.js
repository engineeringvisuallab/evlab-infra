import { EventBus } from './core/event-bus.js';
import { Project } from './core/project.js';
import { History } from './core/history.js';
import { Selection } from './core/selection.js';
import { serialize, parse } from './core/project-serializer.js';
import { SceneManager } from './viewport/scene-manager.js';
import { initObjectSync } from './viewport/object-sync.js';
import { initDrawRoadTool } from './tools/draw-road-tool.js';
import { initDrawPipeTool } from './tools/draw-pipe-tool.js';
import { createWatercourse } from './models/watercourse.js';
import { initCrossingsPanel } from './ui/crossings-panel.js';
import { initMeasureTool } from './tools/measure-tool.js';
import { initValidationPanel } from './ui/validation-panel.js';
import { initPanelToggles } from './ui/panels.js';
import { initIoPanel } from './ui/io-panel.js';
import { initPicking } from './viewport/picking.js';
import { initToolbar } from './ui/toolbar.js';
import { initProjectTree } from './ui/project-tree.js';
import { initPropertiesPanel } from './ui/properties-panel.js';
import { initStatusBar } from './ui/status-bar.js';

const bus = new EventBus(), state = { units: 'm', snap: true, gridSize: 1, tool: 'select' };
const project = new Project(bus), history = new History(project, bus), selection = new Selection(bus);
const sm = new SceneManager(document.getElementById('viewport'), bus);
const setTool = t => { state.tool = t; bus.emit('tool', t); };
const ctx = { bus, state, project, history, selection, sm, setTool };
initObjectSync(ctx); initPicking(ctx); initMeasureTool(ctx); initDrawRoadTool(ctx); initDrawRoadTool(ctx, 'watercourse', createWatercourse); initDrawPipeTool(ctx); initToolbar(ctx);
initProjectTree(document.getElementById('tree'), ctx);
initPropertiesPanel(document.getElementById('properties'), ctx); initStatusBar(ctx); initCrossingsPanel(document.getElementById('crossings'), ctx); initIoPanel(document.getElementById('iopanel'), ctx); initValidationPanel(document.getElementById('valpanel'), ctx);

bus.on('model-changed', () => { if (selection.id && !project.get(selection.id)) selection.set(null); });

// Autosave to localStorage (this browser only; NOT a cloud backup)
const KEY = 'evlab-infra-autosave'; let timer;
bus.on('model-changed', () => { clearTimeout(timer); timer = setTimeout(() => {
  try { localStorage.setItem(KEY, serialize(project)); bus.emit('status', 'Autosaved in this browser only — not a backup. Use Save.'); }
  catch (e) { bus.emit('status', 'Autosave failed: ' + e.message); } }, 600); });
try { const t = localStorage.getItem(KEY); if (t) { project.load(parse(t)); bus.emit('status', 'Restored from browser autosave. Not a cloud backup.'); } }
catch (e) { console.warn('Autosave not restored:', e.message); bus.emit('status', 'Autosave could not be restored: ' + e.message); }
initPanelToggles();
window.evlab = ctx;
