"""Optional browser smoke test (needs Python + Playwright). Run:  python3 tests/e2e-smoke.py
Serves the PARENT folder, so the app runs from a GitHub Pages-style subdirectory (/evlab-infra/). Fails on any console error."""
import functools, http.server, json, os, threading, tempfile, sys
from playwright.sync_api import sync_playwright

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PARENT, NAME = os.path.dirname(REPO), os.path.basename(REPO)
H = functools.partial(type('Q', (http.server.SimpleHTTPRequestHandler,), {'log_message': lambda *a: None}), directory=PARENT)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_address[1]}/{NAME}/'
fails, errors = [], []
def ok(c, m): print(('PASS ' if c else 'FAIL ') + m); (not c) and fails.append(m)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    page = b.new_context(accept_downloads=True, viewport={'width': 1400, 'height': 850}).new_page()
    page.on('console', lambda m: m.type == 'error' and errors.append(m.text)); page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL); page.wait_for_selector('#viewport canvas')
    ev = lambda js: page.evaluate(js)
    box = page.locator('#viewport canvas').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    objs = lambda: ev('evlab.project.objects.length')
    ok(objs() == 0 and 'Objects: 0' in page.inner_text('#st-count'), 'app loads empty, status bar shows 0 objects')
    # M2: block, select, edit, validation, undo/redo, delete
    page.click('[data-action=add]'); ok(objs() == 1, 'Add block creates an object')
    page.mouse.click(cx, cy); ok(ev('evlab.selection.id') == 'OBJ-0001', 'clicking the block selects it')
    w = page.locator('#properties label.row', has_text='Width (m)').locator('input')
    w.fill('-5'); w.press('Tab'); ok('between' in page.inner_text('#properties'), 'invalid width shows a validation error')
    w = page.locator('#properties label.row', has_text='Width (m)').locator('input'); w.fill('20'); w.press('Tab')
    ok(ev('evlab.project.get("OBJ-0001").width') == 20, 'valid width is applied')
    page.click('[data-action=undo]'); ok(ev('evlab.project.get("OBJ-0001").width') == 10, 'undo reverts the edit')
    page.click('[data-action=redo]'); ok(ev('evlab.project.get("OBJ-0001").width') == 20, 'redo re-applies it')
    page.mouse.click(5, 5)  # focus away from inputs
    page.keyboard.press('Delete'); ok(objs() == 0, 'Delete key removes the selected object')
    page.click('[data-action=undo]'); ok(objs() == 1, 'undo restores the deleted object')
    # M3: road and pipe
    page.click('[data-tool=road]'); [page.mouse.click(cx + dx, cy + dy) for dx, dy in ((-200, 120), (0, 60), (200, 120))]; page.keyboard.press('Enter')
    ok(ev('evlab.project.objects.filter(o=>o.type==="road").length') == 1, 'Draw road creates a road')
    # drag a road control point with its handle
    road = ev('evlab.project.objects.find(o=>o.type==="road")'); pt = road['points'][1]; sc = ev(f'evlab.sm.toScreen({pt["x"]},{pt["y"]},{pt["z"]}+0.3)')
    page.mouse.move(sc['x'], sc['y']); page.mouse.down(); page.mouse.move(sc['x'] + 50, sc['y'] + 40, steps=6); page.mouse.up()
    moved = ev('evlab.project.objects.find(o=>o.type==="road")')['points']
    ok(moved[1]['x'] != pt['x'] or moved[1]['y'] != pt['y'], 'dragging a handle moves the control point')
    ok(moved[0] == road['points'][0] and moved[2] == road['points'][2] and moved[1]['z'] == pt['z'], 'other points and the elevation are unchanged')
    page.click('[data-action=undo]'); ok(ev('evlab.project.objects.find(o=>o.type==="road")')['points'][1] == pt, 'undo restores the dragged point')
    # double-click a road segment to insert a control point
    p0, p1 = road['points'][0], road['points'][1]; mid = ev(f'evlab.sm.toScreen({(p0["x"] + p1["x"]) / 2},{(p0["y"] + p1["y"]) / 2},{(p0["z"] + p1["z"]) / 2})')
    page.mouse.dblclick(mid['x'], mid['y']); ok(len(ev('evlab.project.objects.find(o=>o.type==="road")')['points']) == 4, 'double-click on a road segment inserts a control point')
    page.click('[data-action=undo]'); ok(len(ev('evlab.project.objects.find(o=>o.type==="road")')['points']) == 3, 'undo removes the inserted point')
    # horizontal curve on an interior point
    r2 = page.locator('#properties .pt').nth(1).locator('input').nth(3); r2.fill('12'); r2.press('Tab')
    ok(ev('evlab.project.objects.find(o=>o.type==="road").points[1].r') == 12 and 'Curve at point 2' in page.inner_text('#properties'), 'curve radius can be set on an interior point')
    ok(page.locator('#properties canvas').count() == 2, 'profile and cross-section canvases are shown')
    page.click('[data-tool=pipe]'); [page.mouse.click(cx + dx, cy + dy) for dx, dy in ((-150, 180), (0, 150), (150, 190))]; page.keyboard.press('Enter')
    ok(ev('evlab.project.objects.filter(o=>o.type==="pipe").length') == 2 and ev('evlab.project.objects.filter(o=>o.type==="node").length') == 3, 'Draw pipe creates 3 nodes and 2 pipes')
    # M4: watercourse, bridge, culvert, crossings panel
    page.click('[data-tool=watercourse]'); [page.mouse.click(cx + dx, cy + dy) for dx, dy in ((-60, 20), (-40, 220))]; page.keyboard.press('Enter')
    page.click('[data-action=addBridge]'); page.click('[data-action=addCulvert]')
    ok(ev('evlab.project.objects.some(o=>o.type==="bridge")') and ev('evlab.project.objects.some(o=>o.type==="culvert")'), 'bridge and culvert can be added')
    page.click('[data-action=crossings]'); ok(page.is_visible('#crossings'), 'Crossings panel opens')
    page.click('[data-action=validate]'); ok(page.is_visible('#valpanel') and not page.is_visible('#crossings'), 'Validate panel opens and replaces the other panel')
    page.click('[data-action=validate]')
    # M5: measure
    page.click('[data-tool=measure]'); page.mouse.click(cx - 100, cy + 100); page.mouse.click(cx + 100, cy + 100)
    ok('Distance' in page.inner_text('#st-measure'), 'Measure tool reports a distance')
    page.keyboard.press('Escape')
    # save / open
    with page.expect_download() as d: page.click('[data-action=save]')
    saved = d.value.path(); data = json.load(open(saved)); ok(data['format'] == 'evlab-infra-project' and len(data['objects']) == objs(), 'Save downloads a valid project JSON')
    n = objs(); ev('evlab.project.reset(); evlab.history.clear()'); ok(objs() == 0, 'project reset')
    page.set_input_files('#file-open', saved); page.wait_for_function('evlab.project.objects.length>0'); ok(objs() == n, 'Open restores the saved project')
    bad = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False); bad.write('{nope'); bad.close()
    msgs = []; page.once('dialog', lambda dlg: (msgs.append(dlg.message), dlg.dismiss())); page.set_input_files('#file-open', bad.name); page.wait_for_timeout(300)
    ok(msgs and 'not valid JSON' in msgs[0] and objs() == n, 'malformed JSON gives an error and keeps the project')
    # export panel
    page.click('[data-action=io]'); ok(page.is_visible('#iopanel'), 'Import / Export panel opens')
    for label, ext in (('Export inventory CSV', '.csv'), ('Quantity report (CSV)', '.csv'), ('Download report (.html)', '.html'), ('Export GeoJSON', '.geojson'), ('Export DXF (plan view)', '.dxf')):
        with page.expect_download() as d: page.click(f'#iopanel button:has-text("{label}")')
        ok(d.value.suggested_filename.endswith(ext) and os.path.getsize(d.value.path()) > 50, f'{label} downloads a file')
    ev('evlab.selection.set(evlab.project.objects.find(o=>o.type==="road").id)')
    with page.expect_download() as d: page.click('#iopanel button:has-text("Export selected as STL")')
    ok(os.path.getsize(d.value.path()) > 84, 'STL export of the selected road has triangles')
    page.click('#iopanel button:has-text("Close")')
    # terrain
    csvp = os.path.join(tempfile.gettempdir(), 'evlab-terrain.csv'); open(csvp, 'w').write('x,y,z\n' + '\n'.join(f'{x},{y},{5 + 0.05 * x + 0.02 * y}' for x in range(-100, 101, 25) for y in range(-100, 101, 25)))
    page.click('[data-action=io]')
    with page.expect_file_chooser() as fc: page.click('#iopanel button:has-text("Import terrain")')
    fc.value.set_files(csvp); page.wait_for_function('evlab.project.objects.some(o=>o.type==="terrain")'); ok(ev('evlab.project.objects.find(o=>o.type==="terrain").points.length') == 81, 'terrain CSV imports 81 points')
    page.click('#iopanel button:has-text("Close")'); page.mouse.move(cx, cy); page.wait_for_timeout(200); ok('terrain Z' in page.inner_text('#st-cursor'), 'status bar shows terrain elevation under the cursor')
    page.locator('#properties button', has_text='Set road control-point elevations').click(); page.wait_for_timeout(200)
    ok(all(abs(q['z']) > 0.5 for q in ev('evlab.project.objects.find(o=>o.type==="road")')['points']), 'road elevations are set from terrain')
    page.locator('#properties button', has_text='Set node ground levels').click(); page.wait_for_timeout(200); ok(ev('evlab.project.objects.filter(o=>o.type==="node").every(n=>n.groundLevel!==null)'), 'node ground levels are set from terrain')
    ev('evlab.selection.set(evlab.project.objects.find(o=>o.type==="road").id)'); page.wait_for_timeout(200)
    ok('ground at centerline' in page.inner_text('#properties'), 'cross-section reports ground at the centerline from terrain')
    # LandXML export and import
    page.click('[data-action=io]')
    with page.expect_download() as d: page.click('#iopanel button:has-text("Export LandXML")')
    lxp = d.value.path(); ok(d.value.suggested_filename.endswith('.xml') and '<LandXML' in open(lxp).read(), 'Export LandXML downloads a LandXML file')
    before = objs(); with_fc = page.expect_file_chooser()
    with with_fc as fc: page.click('#iopanel button:has-text("Import LandXML")')
    fc.value.set_files(lxp); page.wait_for_function(f'evlab.project.objects.length>{before}'); ok(objs() == before + 3, 'Import LandXML adds the terrain and two alignments')
    page.click('#iopanel button:has-text("Close")')
    # display units: feet
    ev('evlab.selection.set(null)'); page.select_option('#properties select', 'ft'); page.wait_for_timeout(200)
    ok(ev('evlab.project.meta.units') == 'ft' and 'Units: ft' in page.inner_text('#st-units') and 'ft' in page.inner_text('#st-tool'), 'switching to feet updates units and snap label')
    ev('evlab.selection.set("OBJ-0001")'); page.wait_for_timeout(150); wi = page.locator('#properties label.row', has_text='Width').locator('input'); w_m = ev('evlab.project.get("OBJ-0001").width')
    ok(abs(float(wi.input_value()) - w_m / 0.3048) < 1e-3, 'width is shown in feet')
    wi.fill('100'); wi.press('Tab'); ok(abs(ev('evlab.project.get("OBJ-0001").width') - 30.48) < 1e-6, 'typing 100 ft stores 30.48 m')
    ev('evlab.selection.set(null)'); page.select_option('#properties select', 'm'); page.wait_for_timeout(150); ok(ev('evlab.project.meta.units') == 'm', 'switching back to metres works')
    ev('evlab.selection.set(null)'); n = objs()
    # geographic origin + autosave + reload
    ev('evlab.selection.set(null)'); lon = page.locator('#properties label.row', has_text='Origin longitude').locator('input'); lon.fill('90.4'); lon.press('Tab')
    lat = page.locator('#properties label.row', has_text='Origin latitude').locator('input'); lat.fill('23.8'); lat.press('Tab')
    ok(ev('evlab.project.meta.geo.originLat') == 23.8, 'geographic origin is stored in the project')
    page.mouse.move(cx, cy); page.wait_for_timeout(200); ok('lon' in page.inner_text('#st-cursor'), 'cursor shows lon/lat once an origin is set')
    page.wait_for_timeout(1000); page.reload(); page.wait_for_selector('#viewport canvas'); page.wait_for_timeout(500)
    ok(objs() == n, 'autosave restores the project after reload')
    page.click('[data-action=camera]'); page.click('[data-action=fit]'); page.click('[data-action=reset]'); ok('Orthographic' in page.inner_text('#btn-camera'), 'camera mode toggle works')
    # panels hide/show
    vw = lambda: page.locator('#viewport').bounding_box()['width']; w0 = vw()
    page.click('[data-panel=explorer]'); page.wait_for_timeout(200); ok(not page.is_visible('#explorer') and vw() > w0, 'Explorer hides and the viewport grows')
    page.click('[data-panel=properties]'); page.click('[data-panel=status]'); ok(not page.is_visible('#properties') and not page.is_visible('#status'), 'Properties and status bar hide')
    page.reload(); page.wait_for_selector('#viewport canvas'); ok(not page.is_visible('#explorer'), 'hidden panels are remembered after reload')
    page.click('#btn-full'); page.wait_for_timeout(200); ok(page.is_visible('#explorer') and page.is_visible('#properties') and page.is_visible('#status'), 'Full view toggle shows everything again')
    page.click('#btn-full'); ok(not page.is_visible('#explorer') and page.is_visible('#toolbar'), 'Full view hides side panels and keeps the toolbar')
    page.click('[data-panel=toolbar]'); ok(not page.is_visible('#toolbar') and page.is_visible('#tb-restore'), 'Toolbar hides and a restore button appears')
    page.click('#tb-restore'); page.keyboard.press('f'); ok(page.is_visible('#explorer') and page.is_visible('#toolbar') and abs(vw() - w0) < 2, 'restore button and F key bring everything back')
    # edge tabs, keyboard shortcuts and resizable panels
    page.click('#tab-explorer'); ok(not page.is_visible('#explorer') and page.is_visible('#tab-explorer'), 'edge tab hides the explorer and stays visible to reopen it')
    page.click('#tab-explorer'); ok(page.is_visible('#explorer'), 'edge tab shows the explorer again')
    page.click('#tab-status'); ok(not page.is_visible('#status'), 'bottom tab hides the status bar'); page.click('#tab-status'); ok(page.is_visible('#status'), 'bottom tab shows it again')
    page.mouse.click(5, 5); page.keyboard.press(']'); ok(not page.is_visible('#properties'), 'key ] hides the properties panel'); page.keyboard.press(']'); ok(page.is_visible('#properties'), 'key ] shows it again')
    pw = page.locator('#properties').bounding_box()['width']; sp = page.locator('#split-properties').bounding_box()
    page.mouse.move(sp['x'] + 3, sp['y'] + 200); page.mouse.down(); page.mouse.move(sp['x'] - 97, sp['y'] + 200, steps=5); page.mouse.up()
    pw2 = page.locator('#properties').bounding_box()['width']; ok(pw2 > pw + 80, f'dragging the splitter widens the properties panel ({pw:.0f} -> {pw2:.0f})')
    page.locator('#split-properties').dblclick(); ok(abs(page.locator('#properties').bounding_box()['width'] - 310) < 2, 'double-click resets the panel width')
    page.reload(); page.wait_for_selector('#viewport canvas'); ok(abs(page.locator('#properties').bounding_box()['width'] - 310) < 2, 'panel width is remembered')
    page.screenshot(path=os.path.join(tempfile.gettempdir(), 'evlab-smoke.png')); b.close()
ok(not errors, 'no browser console errors' + ('' if not errors else ': ' + ' | '.join(errors[:3])))
print(f'\n{len(fails)} failure(s)'); sys.exit(1 if fails else 0)
