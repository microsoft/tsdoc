import * as tsdoc from '../../index';
import * as typescript from 'typescript';
import * as path from 'node:path';

const {
  TSDocConfiguration,
  TSDocParser,
  DocNodeKind,
  DocParagraph,
  DocPlainText,
  DocComment,
  DocSection,
  PlainTextEmitter,
  TextRange
} = tsdoc;
const api = tsdoc as any;

function configuration(enabled = true): any {
  const config: any = new TSDocConfiguration();
  config.parseMarkdownLists = enabled;
  return config;
}

function comment(body: string): string {
  return (
    '/**\n' +
    body
      .split('\n')
      .map((line) => ' * ' + line)
      .join('\n') +
    '\n */'
  );
}

function parse(body: string, enabled = true): any {
  return new TSDocParser(configuration(enabled)).parseString(comment(body));
}

function lists(section: any): any[] {
  return section.nodes.filter((node: any) => node.kind === 'List');
}

function text(node: any): string {
  if (node.kind === 'Excerpt') return '';
  if (node.kind === 'PlainText') return node.text;
  if (node.kind === 'SoftBreak') return '\n';
  if (node.kind === 'CodeSpan' || node.kind === 'FencedCode') return node.code;
  if (node.kind === 'EscapedText') return node.decodedText;
  return node.getChildNodes().map(text).join('');
}

function shape(node: any): any {
  if (node.kind === 'Excerpt') return undefined;
  if (node.kind === 'List')
    return {
      kind: 'List',
      ordered: node.ordered,
      start: node.start,
      items: node.nodes.map((item: any) => shape(item.content))
    };
  if (node.kind === 'Paragraph') {
    const content = text(node).trim().replace(/\s+/g, ' ');
    const markup = node.nodes
      .filter((n: any) => !['PlainText', 'SoftBreak', 'EscapedText'].includes(n.kind))
      .map((n: any) => {
        if (n.kind === 'LinkTag')
          return [n.kind, n.codeDestination?.emitAsTsdoc(), n.urlDestination, n.linkText];
        if (n.kind === 'HtmlStartTag')
          return [n.kind, n.name, n.selfClosingTag, n.htmlAttributes.map((a: any) => [a.name, a.value])];
        if (n.kind === 'HtmlEndTag') return [n.kind, n.name];
        if (n.kind === 'CodeSpan') return [n.kind, n.code];
        return n.kind;
      });
    return content || markup.length ? { kind: node.kind, content, markup } : undefined;
  }
  if (node.kind === 'FencedCode') return { kind: node.kind, code: node.code, language: node.language };
  return { kind: node.kind, children: node.getChildNodes().map(shape).filter(Boolean) };
}

function roundtrip(context: any): void {
  const before = shape(context.docComment);
  const output = context.docComment.emitAsTsdoc();
  const reparsed = new TSDocParser(context.configuration).parseString(output);
  expect(reparsed.log.messages.map((m: any) => m.messageId)).toEqual([]);
  expect(shape(reparsed.docComment)).toEqual(before);
  expect(shape(context.docComment)).toEqual(before);
  const again = new TSDocParser(context.configuration).parseString(reparsed.docComment.emitAsTsdoc());
  expect(shape(again.docComment)).toEqual(before);
}

test.each([
  '-',
  '+',
  '*',
  '0.',
  '1.',
  '007.',
  '12.',
  '1234.',
  '12345.',
  '123456.',
  '1234567.',
  '12345678.',
  '123456789.'
])('parses marker %s', (marker) => {
  const context = parse(`${marker} first\n${marker} second`);
  const found = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  expect(found[0].ordered).toBe(marker.endsWith('.'));
  expect(found[0].start).toBe(marker.endsWith('.') ? Number(marker.slice(0, -1)) : 1);
  expect(found[0].nodes.map((n: any) => text(n).trim())).toEqual(['first', 'second']);
  expect(context.log.messages).toHaveLength(0);
  const emitted = context.docComment.emitAsTsdoc();
  const canonical = marker.endsWith('.') ? `${Number(marker.slice(0, -1))}.` : '-';
  expect(emitted).toContain(` * ${canonical} first`);
  expect(emitted).toContain(` * ${marker.endsWith('.') ? '1.' : '-'} second`);
  roundtrip(context);
});

test.each(['-', '+', '*', '2.'])('empty item with marker %s', (marker) => {
  const context = parse(`${marker}\n${marker} next`);
  const found = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  expect(found[0].nodes).toHaveLength(2);
  expect(found[0].nodes[0].content.nodes).toEqual([]);
  expect(text(found[0].nodes[0]).trim()).toBe('');
  roundtrip(context);
});

test.each([
  'summary',
  'remarks',
  'privateRemarks',
  'deprecated',
  'param',
  'typeParam',
  'returns',
  'custom',
  'see'
])('lists in %s section', (section) => {
  const prefix: Record<string, string> = {
    summary: '',
    remarks: '@remarks\n',
    privateRemarks: '@privateRemarks\n',
    deprecated: '@deprecated\n',
    param: '@param x -\n',
    typeParam: '@typeParam T -\n',
    returns: '@returns\n',
    custom: '@example\n',
    see: '@see\n'
  };
  const context = parse(prefix[section] + '- first\n- next');
  const doc = context.docComment;
  const selected: Record<string, any> = {
    summary: doc.summarySection,
    remarks: doc.remarksBlock?.content,
    privateRemarks: doc.privateRemarks?.content,
    deprecated: doc.deprecatedBlock?.content,
    param: doc.params.blocks[0]?.content,
    typeParam: doc.typeParams.blocks[0]?.content,
    returns: doc.returnsBlock?.content,
    custom: doc.customBlocks[0]?.content,
    see: doc.seeBlocks[0]?.content
  };
  expect(lists(selected[section])).toHaveLength(1);
  roundtrip(context);
});

test.each([
  '- root\n  - nested\n    4. leaf\n  - sibling\n- final',
  '12. root\n    - child\n      7. leaf\n1. final',
  '- root\n  0. zero\n  1. one\n  + child\n- final'
])('nested hierarchy: %s', (body) => {
  const context = parse(body);
  const roots = lists(context.docComment.summarySection);
  expect(roots).toHaveLength(1);
  expect(roots[0].nodes).toHaveLength(2);
  expect(lists(roots[0].nodes[0].content).length).toBeGreaterThan(0);
  expect(lists(roots[0].nodes[1].content)).toHaveLength(0);
  expect(text(roots[0].nodes[1]).trim()).toBe('final');
  const child = lists(roots[0].nodes[0].content)[0];
  expect(child.nodes.map((item: any) => text(item).trim().replace(/\s+/g, ' '))).toEqual(
    body.startsWith('- root\n  0.')
      ? ['zero', 'one']
      : body.startsWith('12.')
        ? ['child leaf']
        : ['nested leaf', 'sibling']
  );
  if (!body.startsWith('- root\n  0.')) {
    const grandchild = lists(child.nodes[0].content);
    expect(grandchild).toHaveLength(1);
    expect(grandchild[0].ordered).toBe(true);
    expect(grandchild[0].start).toBe(body.startsWith('12.') ? 7 : 4);
    expect(grandchild[0].nodes.map((item: any) => text(item).trim())).toEqual(['leaf']);
  }
  roundtrip(context);
});

test('marker padding does not change the nested content column', () => {
  const context = parse('-   parent\n  3. child\n- final');
  const root = lists(context.docComment.summarySection);
  expect(root).toHaveLength(1);
  expect(root[0].nodes).toHaveLength(2);
  const child = lists(root[0].nodes[0].content);
  expect(child).toHaveLength(1);
  expect(child[0].ordered).toBe(true);
  expect(child[0].start).toBe(3);
  expect(text(child[0].nodes[0]).trim()).toBe('child');
  roundtrip(context);
});

test('roundtrip preserves an indented marker in a separate item paragraph', () => {
  const context = parse('- parent\n\n   - literal');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(text(context.docComment)).toContain('literal');
  roundtrip(context);
});

test('roundtrip preserves an indented ordered marker inside a nested item paragraph', () => {
  const context = parse('12. parent\n    - child\n\n       3. literal\n1. final');
  const root = lists(context.docComment.summarySection);
  expect(root).toHaveLength(1);
  expect(lists(root[0].nodes[0].content)).toHaveLength(1);
  roundtrip(context);
});

test.each([
  [' - literal'],
  [' ', '- literal'],
  ['  - literal'],
  [' ', ' - literal'],
  [' ', ' ', '- literal']
])('constructed paragraph retains significant leading spacing: %j', (...parts) => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const paragraph = (texts: string[]) =>
    new DocParagraph(
      { configuration: config },
      texts.map((value) => new DocPlainText({ configuration: config, text: value }))
    );
  const item = new api.DocListItem({ configuration: config }, [paragraph(['parent']), paragraph(parts)]);
  const list = new api.DocList({ configuration: config, ordered: false }, [item]);
  const docComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
  const reparsed = new TSDocParser(config).parseString(docComment.emitAsTsdoc());
  const reparsedItems = lists(reparsed.docComment.summarySection)[0].nodes;
  const reparsedParagraphs = reparsedItems[0].content.nodes.filter((node: any) => node.kind === 'Paragraph');
  expect(reparsedParagraphs).toHaveLength(2);
  expect(text(reparsedParagraphs[1]).replace(/\n$/, '')).toBe(parts.join(''));
});

test.each([
  ['- literal'],
  ['+', ' literal'],
  ['*', ' ', 'literal'],
  ['-']
])('constructed literal marker remains paragraph text: %j', (...parts) => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const paragraph = (texts: string[]) =>
    new DocParagraph(
      { configuration: config },
      texts.map((value) => new DocPlainText({ configuration: config, text: value }))
    );
  const first = paragraph(['parent']);
  const literal = paragraph(parts);
  const originalNodes = [...literal.nodes];
  const item = new api.DocListItem({ configuration: config }, [first, literal]);
  const list = new api.DocList({ configuration: config, ordered: false }, [item]);
  const docComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
  expect(literal.nodes).toHaveLength(originalNodes.length);
  literal.nodes.forEach((node, index) => {
    expect(node).toBe(originalNodes[index]);
    expect((node as any).text).toBe(parts[index]);
  });
});

test('constructed soft-break continuation preserves a literal unordered marker', () => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const paragraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'parent' }),
    new tsdoc.DocSoftBreak({ configuration: config }),
    new DocPlainText({ configuration: config, text: '-' }),
    new DocPlainText({ configuration: config, text: ' literal' })
  ]);
  const item = new api.DocListItem({ configuration: config }, [paragraph]);
  const list = new api.DocList({ configuration: config, ordered: false }, [item]);
  const docComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
});

test('public list parameter types and constructors are usable by TypeScript consumers', () => {
  const file = path.resolve(__dirname, 'list-consumer.ts');
  const source = `
    import { TSDocConfiguration, DocList, DocListItem, DocSection,
      DocNodeKind, IDocListParameters, IDocListItemParameters } from '../../index';
    const configuration = new TSDocConfiguration();
    configuration.parseMarkdownLists = true;
    const parameters: IDocListParameters = { configuration, ordered: true, start: 3 };
    const itemParameters: IDocListItemParameters = { configuration };
    const item = new DocListItem(itemParameters, []);
    const body: DocSection = item.content;
    const list = new DocList(parameters, [item]);
    const kind: DocNodeKind = DocNodeKind.ListItem;
    const ordered: boolean = list.ordered;
    const start: number = list.start;
    // @ts-expect-error ordered is a required list parameter
    const incomplete: IDocListParameters = { configuration };
  `;
  const options: typescript.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: typescript.ScriptTarget.ES2018,
    module: typescript.ModuleKind.CommonJS,
    types: []
  };
  const host = typescript.createCompilerHost(options);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    path.resolve(name) === file
      ? typescript.createSourceFile(file, source, languageVersion, true)
      : read(name, languageVersion, onError, shouldCreateNewSourceFile);
  const program = typescript.createProgram([file], options, host);
  const diagnostics = typescript.getPreEmitDiagnostics(program);
  expect(diagnostics.map((d) => typescript.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
});

test('kind changes split lists and unordered marker changes do not', () => {
  const context = parse('- first\n+ second\n* third\n8. fourth\n1. fifth\n- sixth');
  const found = lists(context.docComment.summarySection);
  expect(found.map((n) => [n.ordered, n.start, n.nodes.length])).toEqual([
    [false, 1, 3],
    [true, 8, 2],
    [false, 1, 1]
  ]);
  roundtrip(context);
});

test.each(['-text', '1234567890. text', '1) text', '\\- text', '---'])(
  'literal marker %s does not become a list',
  (literal) => {
    const context = parse(`- real\n\n${literal}`);
    const found = lists(context.docComment.summarySection);
    expect(found).toHaveLength(1);
    expect(found[0].nodes).toHaveLength(1);
    expect(text(context.docComment.summarySection)).toContain(literal.replace('\\-', '-'));
  }
);

test('a list cannot interrupt ordinary prose without a blank line', () => {
  const context = parse('intro\n- not an item\n\n- real\n- sibling');
  const section = context.docComment.summarySection;
  expect(section.nodes[0].kind).toBe('Paragraph');
  expect(text(section.nodes[0])).toContain('- not an item');
  expect(lists(section)).toHaveLength(1);
  expect(lists(section)[0].nodes).toHaveLength(2);
  roundtrip(context);
});

test('escaped markers, inline code, links, and HTML retain their node types', () => {
  const context = parse(
    '- {@link Widget | label} {@link https://example.com | site} `- code` <b title="value">bold</b>\n  \\- literal\n- end'
  );
  const found = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const kinds = found[0].nodes[0].content.nodes[0].nodes.map((n: any) => n.kind);
  for (const kind of ['LinkTag', 'CodeSpan', 'HtmlStartTag', 'HtmlEndTag', 'EscapedText'])
    expect(kinds).toContain(kind);
  roundtrip(context);
});

test.each(['', 'const x = 1;\n', '- not an item\n@remarks not a tag\n', '  extra indentation\n'])(
  'fenced code is opaque and deindented: %j',
  (code) => {
    const body =
      '- item\n\n  ```ts\n' +
      code
        .split('\n')
        .slice(0, -1)
        .map((line) => '  ' + line + '\n')
        .join('') +
      '  ```\n- next';
    const context = parse(body);
    const found = lists(context.docComment.summarySection);
    expect(found).toHaveLength(1);
    const fence = found[0].nodes[0].content.nodes.find((n: any) => n.kind === 'FencedCode');
    expect(fence).toBeDefined();
    expect(fence.code).toBe(code);
    expect(context.log.messages).toHaveLength(0);
    expect(context.docComment.remarksBlock).toBeUndefined();
    roundtrip(context);
  }
);

test('nested ordered fence retains its code and returns to the parent list', () => {
  const context = parse(
    '5. root\n   - child\n\n     ```js\n     alpha\n       beta\n     ```\n   - next\n1. end'
  );
  const found = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const child = lists(found[0].nodes[0].content)[0];
  const fence = child.nodes[0].content.nodes.find((n: any) => n.kind === 'FencedCode');
  expect(fence.code).toBe('alpha\n  beta\n');
  roundtrip(context);
});

test('source offsets, excerpts and diagnostics refer to the original buffer', () => {
  const source = 'prefix\n' + comment('- valid {@link Widget}\n  } invalid\n- final') + '\nsuffix';
  const range = TextRange.fromStringRange(source, source.indexOf('/**'), source.indexOf('*/') + 2);
  const context = new TSDocParser(configuration()).parseRange(range);
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const excerpts: any[] = [];
  const visit = (node: any): void => {
    if (node.kind === DocNodeKind.Excerpt) excerpts.push(node);
    node.getChildNodes().forEach(visit);
  };
  visit(context.docComment);
  expect(excerpts.length).toBeGreaterThan(0);
  for (const excerpt of excerpts) {
    if (!excerpt.content.isEmpty()) {
      expect(excerpt.content.getContainingTextRange().buffer).toBe(source);
    }
  }
  const successfulExcerpt = excerpts.find((excerpt) => excerpt.content.toString() === 'Widget');
  expect(successfulExcerpt).toBeDefined();
  const successfulRange = successfulExcerpt.content.getContainingTextRange();
  expect(successfulRange.pos).toBe(source.indexOf('Widget'));
  expect(successfulRange.end).toBe(successfulRange.pos + 'Widget'.length);
  expect(source.slice(successfulRange.pos, successfulRange.end)).toBe('Widget');
  const error = context.log.messages.find((m: any) => m.messageId === 'tsdoc-escape-right-brace');
  expect(error).toBeDefined();
  expect(error!.textRange.pos).toBe(source.indexOf('} invalid'));
  expect(error!.textRange.buffer).toBe(source);
});

test('block tags exit lists and start independent sections', () => {
  const context = parse('- summary\n@remarks\n- remark\n@param x - details\n\n- parameter');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(lists(context.docComment.remarksBlock.content)).toHaveLength(1);
  expect(lists(context.docComment.params.blocks[0].content)).toHaveLength(1);
  roundtrip(context);
});

test('configuration defaults and clear reset parsing without changing disabled behavior', () => {
  const config: any = new TSDocConfiguration();
  expect(config.parseMarkdownLists).toBe(false);
  const original = new TSDocParser(config).parseString(comment('- a\n- b'));
  config.parseMarkdownLists = true;
  expect(
    lists(new TSDocParser(config).parseString(comment('- a\n- b')).docComment.summarySection)
  ).toHaveLength(1);
  config.clear();
  expect(config.parseMarkdownLists).toBe(false);
  const disabled = new TSDocParser(config).parseString(comment('- a\n- b'));
  expect(shape(disabled.docComment)).toEqual(shape(original.docComment));

  const hasList = (node: any): boolean =>
    node.kind === DocNodeKind.List || node.getChildNodes().some((child: any) => hasList(child));
  for (const body of [
    'hello\n{@link A}',
    '  leading  spaces\ncontinuation\ttext',
    'first paragraph\n\nsecond  paragraph',
    '```ts\n- literal\n```\n\n<div>html</div>',
    '\\- escaped marker and `- code`\n{@link A | label}',
    '@remarks\n  indented  text\n\nsecond',
    '@param value - first\n  continued\ttext'
  ]) {
    const legacy = parse(body, false);
    const enabled = parse(body, true);
    expect(legacy.log.messages).toHaveLength(0);
    expect(enabled.log.messages).toHaveLength(0);
    expect(hasList(legacy.docComment)).toBe(false);
    expect(hasList(enabled.docComment)).toBe(false);
    expect(enabled.docComment.emitAsTsdoc()).toBe(legacy.docComment.emitAsTsdoc());
  }
});

test('list whitespace handling stays local to surrounding paragraphs', () => {
  const before = 'before  value\ncontinued text';
  const after = 'after  value\n\\- literal';
  const context = parse(`${before}\n\n- item\n- next\n\n${after}`);
  const reparsed = new TSDocParser(context.configuration).parseString(context.docComment.emitAsTsdoc());
  const standaloneBefore = parse(before);
  const standaloneAfter = parse(after);
  const expectedBefore = new TSDocParser(context.configuration).parseString(
    standaloneBefore.docComment.emitAsTsdoc()
  );
  const expectedAfter = new TSDocParser(context.configuration).parseString(
    standaloneAfter.docComment.emitAsTsdoc()
  );
  expect(reparsed.log.messages.map((message: any) => message.messageId)).toEqual(
    context.log.messages.map((message: any) => message.messageId)
  );
  expect(reparsed.docComment.summarySection.nodes.map((node: any) => node.kind)).toEqual([
    'Paragraph',
    'List',
    'Paragraph'
  ]);
  const withoutBoundaryBreaks = (value: string): string => value.replace(/^\n+|\n+$/g, '');
  expect(withoutBoundaryBreaks(text(reparsed.docComment.summarySection.nodes[0]))).toBe(
    withoutBoundaryBreaks(text(expectedBefore.docComment.summarySection.nodes[0]))
  );
  expect(withoutBoundaryBreaks(text(reparsed.docComment.summarySection.nodes[2]))).toBe(
    withoutBoundaryBreaks(text(expectedAfter.docComment.summarySection.nodes[0]))
  );
});

test('builder lists expose normal containers, traversal and text discovery', () => {
  expect(typeof api.DocList).toBe('function');
  expect(typeof api.DocListItem).toBe('function');
  const config = configuration();
  const paragraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'hello' })
  ]);
  const child = new api.DocListItem({ configuration: config }, [paragraph]);
  const list = new api.DocList({ configuration: config, ordered: true, start: 4 }, [child]);
  expect(list.kind).toBe(api.DocNodeKind.List);
  expect(child.kind).toBe(api.DocNodeKind.ListItem);
  expect(child.content).toBeInstanceOf(DocSection);
  expect(list.nodes).toEqual([child]);
  expect(list.getChildNodes()).toEqual([child]);
  expect(child.getChildNodes()).toContain(child.content);
  expect(PlainTextEmitter.hasAnyTextContent(list)).toBe(true);
  list.clearNodes();
  expect(list.nodes).toHaveLength(0);
  list.appendNode(child);
  list.appendNodes([new api.DocListItem({ configuration: config })]);
  expect(list.nodes).toHaveLength(2);
  expect(() => list.appendNode(paragraph)).toThrow();
  expect(() => new api.DocList({ configuration: config, ordered: false }, [paragraph])).toThrow();
});

test.each([-1, 1.5, NaN, Infinity, 1000000000])('builder rejects invalid start %s', (start) => {
  expect(typeof api.DocList).toBe('function');
  expect(() => new api.DocList({ configuration: configuration(), ordered: true, start })).toThrow();
});

test('unordered builders also reject an invalid explicit start', () => {
  expect(typeof api.DocList).toBe('function');
  expect(() => new api.DocList({ configuration: configuration(), ordered: false, start: -1 })).toThrow();
});

test('unordered builders preserve a valid explicit start', () => {
  expect(typeof api.DocList).toBe('function');
  const list = new api.DocList({ configuration: configuration(), ordered: false, start: 42 });
  expect(list.start).toBe(42);
});

test.each([0, 1, 42, 999999999])('builder start %s roundtrips without mutation', (start) => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const item = new api.DocListItem({ configuration: config }, [
    new DocParagraph({ configuration: config }, [new DocPlainText({ configuration: config, text: 'built' })])
  ]);
  const list = new api.DocList({ configuration: config, ordered: true, start }, [
    item,
    new api.DocListItem({ configuration: config })
  ]);
  const docComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
  expect(list.nodes[0]).toBe(item);
  expect(list.start).toBe(start);
});

test('emitter can be reused after nested list rendering', () => {
  const context = parse('- item\n  - child');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const emitter = new tsdoc.TSDocEmitter();
  const first = new tsdoc.StringBuilder();
  emitter.renderComment(first, context.docComment);
  const second = new tsdoc.StringBuilder();
  const plain = parse('plain').docComment;
  emitter.renderComment(second, plain);
  expect(second.toString()).toBe(plain.emitAsTsdoc());
  roundtrip(context);
});

test('rendering preserves every parsed child identity and source excerpt', () => {
  const context = parse('- first\n  continuation\n\n  second paragraph\n- final');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const snapshots: { node: any; children: any[]; excerpt?: string }[] = [];
  function remember(node: any): void {
    const children = [...node.getChildNodes()];
    snapshots.push({
      node,
      children,
      excerpt: node.kind === 'Excerpt' ? node.content.toString() : undefined
    });
    children.forEach(remember);
  }
  remember(context.docComment);
  context.docComment.emitAsTsdoc();
  context.docComment.emitAsTsdoc();
  for (const snapshot of snapshots) {
    const children = snapshot.node.getChildNodes();
    expect(children).toHaveLength(snapshot.children.length);
    children.forEach((child: any, index: number) => expect(child).toBe(snapshot.children[index]));
    if (snapshot.excerpt !== undefined) expect(snapshot.node.content.toString()).toBe(snapshot.excerpt);
  }
});

test('emission observes item edits, appended items and clearing after an earlier render', () => {
  const context = parse('- original');
  const found = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const list = found[0];
  context.docComment.emitAsTsdoc();
  const paragraph = (value: string) =>
    new DocParagraph({ configuration: context.configuration }, [
      new DocPlainText({ configuration: context.configuration, text: value })
    ]);
  list.nodes[0].content.clearNodes();
  list.nodes[0].content.appendNode(paragraph('replacement'));
  list.appendNode(new api.DocListItem({ configuration: context.configuration }, [paragraph('appended')]));
  const updated = new TSDocParser(context.configuration).parseString(context.docComment.emitAsTsdoc());
  expect(lists(updated.docComment.summarySection)[0].nodes.map((item: any) => text(item).trim())).toEqual([
    'replacement',
    'appended'
  ]);
  list.clearNodes();
  const cleared = new TSDocParser(context.configuration).parseString(context.docComment.emitAsTsdoc());
  expect(lists(cleared.docComment.summarySection)).toHaveLength(0);
  expect(text(cleared.docComment).trim()).toBe('');
});

test('reusing one parser keeps successive list comments independent', () => {
  const config = configuration();
  const parser = new TSDocParser(config);
  const first = parser.parseString(comment('- first\n  - child'));
  expect(lists(first.docComment.summarySection)).toHaveLength(1);
  const before = shape(first.docComment);
  const source = 'prefix\n' + comment('9. second\n1. final') + '\nsuffix';
  const second = parser.parseRange(
    TextRange.fromStringRange(source, source.indexOf('/**'), source.indexOf('*/') + 2)
  );
  const found = lists(second.docComment.summarySection);
  expect(found).toHaveLength(1);
  expect(found[0].ordered).toBe(true);
  expect(found[0].start).toBe(9);
  expect(found[0].nodes.map((item: any) => text(item).trim())).toEqual(['second', 'final']);
  expect(shape(first.docComment)).toEqual(before);
  expect(second.docComment).not.toBe(first.docComment);
  roundtrip(second);
});

test('empty lists emit nothing and omitted starts use one', () => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const doc = parse('ordinary').docComment;
  const before = doc.emitAsTsdoc();
  const empty = new api.DocList({ configuration: config, ordered: true });
  expect(empty.start).toBe(1);
  doc.summarySection.appendNode(empty);
  expect(doc.emitAsTsdoc()).toBe(before);
  expect(empty.nodes).toHaveLength(0);

  const itemList = new api.DocList({ configuration: config, ordered: false }, [
    new api.DocListItem({ configuration: config })
  ]);
  const itemDoc = new DocComment({ configuration: config });
  itemDoc.summarySection.appendNode(itemList);
  const reparsed = new TSDocParser(config).parseString(itemDoc.emitAsTsdoc());
  const reparsedList = lists(reparsed.docComment.summarySection)[0];
  expect(reparsedList.nodes[0].content.nodes).toEqual([]);
});

test('constructed nested lists roundtrip', () => {
  expect(typeof api.DocList).toBe('function');
  const config = configuration();
  const paragraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'leaf' })
  ]);
  const child = new api.DocList({ configuration: config, ordered: true, start: 3 }, [
    new api.DocListItem({ configuration: config }, [paragraph])
  ]);
  const parent = new api.DocList({ configuration: config, ordered: false }, [
    new api.DocListItem({ configuration: config }, [child])
  ]);
  const docComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(parent);
  roundtrip({ docComment, configuration: config });
  const reparsed = new TSDocParser(config).parseString(docComment.emitAsTsdoc());
  const reparsedParent = lists(reparsed.docComment.summarySection)[0];
  expect(reparsedParent.nodes[0].content.nodes.map((node: any) => node.kind)).toEqual([DocNodeKind.List]);
});

test('a malformed inline tag keeps its diagnostic inside a nested item', () => {
  const source = comment('- root\n  - {@link }\n- next');
  const context = new TSDocParser(configuration()).parseString(source);
  const outer = lists(context.docComment.summarySection);
  expect(outer).toHaveLength(1);
  expect(outer[0].nodes).toHaveLength(2);
  const nested = lists(outer[0].nodes[0].content)[0];
  expect(nested.nodes).toHaveLength(1);
  const plainSource = comment('{@link }');
  const plain = new TSDocParser().parseString(plainSource);
  expect(context.log.messages.map((m) => m.messageId)).toEqual(plain.log.messages.map((m) => m.messageId));
  expect(context.log.messages.length).toBeGreaterThan(0);
  context.log.messages.forEach((message, index) => {
    expect(message.textRange.buffer).toBe(source);
    const expected = plain.log.messages[index].textRange;
    const offset = source.indexOf('{@link }') - plainSource.indexOf('{@link }');
    expect(message.textRange.pos).toBe(expected.pos + offset);
    expect(message.textRange.end).toBe(expected.end + offset);
  });
});

test('a malformed escape keeps its full diagnostic range inside a deeply nested item', () => {
  const fragment = 'bad \\q';
  const source = comment(`- root\n  - child\n    - ${fragment}\n- next`);
  const context = new TSDocParser(configuration()).parseString(source);
  const plainSource = comment(fragment);
  const plain = new TSDocParser().parseString(plainSource);
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(context.log.messages.map((message: any) => message.messageId)).toEqual(
    plain.log.messages.map((message: any) => message.messageId)
  );
  expect(context.log.messages.length).toBeGreaterThan(0);
  const offset = source.indexOf(fragment) - plainSource.indexOf(fragment);
  context.log.messages.forEach((message: any, index: number) => {
    const expected = plain.log.messages[index].textRange;
    expect(message.textRange.buffer).toBe(source);
    expect(message.textRange.pos).toBe(expected.pos + offset);
    expect(message.textRange.end).toBe(expected.end + offset);
  });
});
