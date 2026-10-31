// Small XML reader for LandXML: elements, attributes, text. Namespace prefixes are dropped. DOCTYPE (entity tricks) is rejected.
export function parseXml(src) {
  const root = { name: '#root', attrs: {}, children: [], text: '' }, stack = [root], n = src.length;
  const ent = s => s.replace(/&(lt|gt|amp|quot|apos);/g, (m, k) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[k]));
  let i = 0;
  while (i < n) {
    const lt = src.indexOf('<', i), top = stack[stack.length - 1];
    if (lt < 0) { top.text += ent(src.slice(i)); break; }
    if (lt > i) top.text += ent(src.slice(i, lt));
    if (src.startsWith('<!--', lt)) { const e = src.indexOf('-->', lt); if (e < 0) throw new Error('XML comment is not closed.'); i = e + 3; }
    else if (src.startsWith('<![CDATA[', lt)) { const e = src.indexOf(']]>', lt); if (e < 0) throw new Error('CDATA section is not closed.'); top.text += src.slice(lt + 9, e); i = e + 3; }
    else if (src.startsWith('<?', lt)) { const e = src.indexOf('?>', lt); if (e < 0) throw new Error('XML declaration is not closed.'); i = e + 2; }
    else if (src.startsWith('<!', lt)) throw new Error('DOCTYPE declarations are not supported.');
    else if (src[lt + 1] === '/') {
      const e = src.indexOf('>', lt); if (e < 0) throw new Error('Closing tag is not finished.'); const name = src.slice(lt + 2, e).trim().split(':').pop();
      if (stack.length < 2 || top.name !== name) throw new Error(`Unexpected closing tag </${name}>.`); stack.pop(); i = e + 1;
    } else {
      let e = lt + 1, q = null; while (e < n) { const c = src[e]; if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === '>') break; e++; }
      if (e >= n) throw new Error('Tag is not finished.');
      const body = src.slice(lt + 1, e), self = body.endsWith('/'), m = /^[^\s/>]+/.exec(body); if (!m) throw new Error('Empty tag name.');
      const node = { name: m[0].split(':').pop(), attrs: {}, children: [], text: '' }, re = /([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g; let a;
      while ((a = re.exec(body))) node.attrs[a[1].split(':').pop()] = ent(a[2] ?? a[3]);
      top.children.push(node); if (!self) stack.push(node); i = e + 1;
    }
  }
  if (stack.length > 1) throw new Error(`Tag <${stack[stack.length - 1].name}> is not closed.`);
  if (!root.children.length) throw new Error('No XML element found.');
  return root.children[0];
}
export const kids = (n, name) => n ? n.children.filter(c => c.name === name) : [];
export const kid = (n, name) => kids(n, name)[0];
export const nums = t => (t || '').trim().split(/\s+/).filter(Boolean).map(Number);
