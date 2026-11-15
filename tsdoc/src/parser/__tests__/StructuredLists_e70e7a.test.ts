// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as tsdoc from '../../index';

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
const api: typeof tsdoc = tsdoc;

interface ITestList extends tsdoc.DocList {
  readonly nodes: ReadonlyArray<tsdoc.DocListItem>;
}
interface IListContext {
  docComment: tsdoc.DocComment;
  configuration: tsdoc.TSDocConfiguration;
}

function configuration(enabled: boolean = true): tsdoc.TSDocConfiguration {
  const config: tsdoc.TSDocConfiguration = new TSDocConfiguration();
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
function parse(body: string, enabled: boolean = true): tsdoc.ParserContext {
  return new TSDocParser(configuration(enabled)).parseString(comment(body));
}
function lists(section: tsdoc.DocSection): ITestList[] {
  return section.nodes.filter((node): node is ITestList => node.kind === DocNodeKind.List);
}
function text(node: tsdoc.DocNode): string {
  switch (node.kind) {
    case DocNodeKind.Excerpt:
      return '';
    case DocNodeKind.PlainText:
      return (node as tsdoc.DocPlainText).text;
    case DocNodeKind.SoftBreak:
      return '\n';
    case DocNodeKind.CodeSpan:
    case DocNodeKind.FencedCode:
      return (node as tsdoc.DocCodeSpan | tsdoc.DocFencedCode).code;
    case DocNodeKind.EscapedText:
      return (node as tsdoc.DocEscapedText).decodedText;
    default:
      return node.getChildNodes().map(text).join('');
  }
}
function shape(node: tsdoc.DocNode): unknown {
  if (node.kind === DocNodeKind.Excerpt) return undefined;
  if (node.kind === DocNodeKind.List) {
    const list: tsdoc.DocList = node as tsdoc.DocList;
    return {
      kind: 'List',
      ordered: list.ordered,
      start: list.start,
      items: list.nodes.map((item) => shape((item as tsdoc.DocListItem).content))
    };
  }
  if (node.kind === DocNodeKind.Paragraph) {
    const paragraph: tsdoc.DocParagraph = node as tsdoc.DocParagraph;
    const content: string = text(node).trim().replace(/\s+/g, ' ');
    const markup: unknown[] = paragraph.nodes
      .filter(
        (child) =>
          child.kind !== DocNodeKind.PlainText &&
          child.kind !== DocNodeKind.SoftBreak &&
          child.kind !== DocNodeKind.EscapedText
      )
      .map((child): unknown => {
        switch (child.kind) {
          case DocNodeKind.LinkTag: {
            const link: tsdoc.DocLinkTag = child as tsdoc.DocLinkTag;
            return [link.kind, link.codeDestination?.emitAsTsdoc(), link.urlDestination, link.linkText];
          }
          case DocNodeKind.HtmlStartTag: {
            const tag: tsdoc.DocHtmlStartTag = child as tsdoc.DocHtmlStartTag;
            return [
              tag.kind,
              tag.name,
              tag.selfClosingTag,
              tag.htmlAttributes.map((attribute) => [attribute.name, attribute.value])
            ];
          }
          case DocNodeKind.HtmlEndTag:
            return [child.kind, (child as tsdoc.DocHtmlEndTag).name];
          case DocNodeKind.CodeSpan:
            return [child.kind, (child as tsdoc.DocCodeSpan).code];
          default:
            return child.kind;
        }
      });
    return content || markup.length ? { kind: node.kind, content, markup } : undefined;
  }
  if (node.kind === DocNodeKind.FencedCode) {
    const fence: tsdoc.DocFencedCode = node as tsdoc.DocFencedCode;
    return { kind: node.kind, code: fence.code, language: fence.language };
  }
  return { kind: node.kind, children: node.getChildNodes().map(shape).filter(Boolean) };
}
function roundtrip(context: IListContext): void {
  const before: unknown = shape(context.docComment);
  const output: string = context.docComment.emitAsTsdoc();
  const reparsed: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(output);
  expect(reparsed.log.messages.map((message) => message.messageId)).toEqual([]);
  expect(shape(reparsed.docComment)).toEqual(before);
  expect(shape(context.docComment)).toEqual(before);
  const again: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    reparsed.docComment.emitAsTsdoc()
  );
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
  const context: tsdoc.ParserContext = parse(`${marker} first\n${marker} second`);
  const found: ITestList[] = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  expect(found[0].ordered).toBe(/\.$/.test(marker));
  expect(found[0].start).toBe(/\.$/.test(marker) ? Number(marker.slice(0, -1)) : 1);
  expect(found[0].nodes.map((n) => text(n).trim())).toEqual(['first', 'second']);
  expect(context.log.messages).toHaveLength(0);
  const emitted: string = context.docComment.emitAsTsdoc();
  const canonical: string = /\.$/.test(marker) ? `${Number(marker.slice(0, -1))}.` : '-';
  expect(emitted).toContain(` * ${canonical} first`);
  expect(emitted).toContain(` * ${/\.$/.test(marker) ? '1.' : '-'} second`);
  roundtrip(context);
});

test.each(['-', '+', '*', '2.'])('empty item with marker %s', (marker) => {
  const context: tsdoc.ParserContext = parse(`${marker}\n${marker} next`);
  const found: ITestList[] = lists(context.docComment.summarySection);
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
  const context: tsdoc.ParserContext = parse(prefix[section] + '- first\n- next');
  const doc: tsdoc.DocComment = context.docComment;
  const selected: Record<string, tsdoc.DocSection | undefined> = {
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
  expect(lists(selected[section]!)).toHaveLength(1);
  roundtrip(context);
});

test.each([
  '- root\n  - nested\n    4. leaf\n  - sibling\n- final',
  '12. root\n    - child\n      7. leaf\n1. final',
  '- root\n  0. zero\n  1. one\n  + child\n- final'
])('nested hierarchy: %s', (body) => {
  const context: tsdoc.ParserContext = parse(body);
  const roots: ITestList[] = lists(context.docComment.summarySection);
  expect(roots).toHaveLength(1);
  expect(roots[0].nodes).toHaveLength(2);
  expect(lists(roots[0].nodes[0].content).length).toBeGreaterThan(0);
  expect(lists(roots[0].nodes[1].content)).toHaveLength(0);
  expect(text(roots[0].nodes[1]).trim()).toBe('final');
  const child: ITestList = lists(roots[0].nodes[0].content)[0];
  expect(child.nodes.map((item) => text(item).trim().replace(/\s+/g, ' '))).toEqual(
    body.indexOf('- root\n  0.') === 0
      ? ['zero', 'one']
      : body.indexOf('12.') === 0
        ? ['child leaf']
        : ['nested leaf', 'sibling']
  );
  if (body.indexOf('- root\n  0.') !== 0) {
    const grandchild: ITestList[] = lists(child.nodes[0].content);
    expect(grandchild).toHaveLength(1);
    expect(grandchild[0].ordered).toBe(true);
    expect(grandchild[0].start).toBe(body.indexOf('12.') === 0 ? 7 : 4);
    expect(grandchild[0].nodes.map((item) => text(item).trim())).toEqual(['leaf']);
  }
  roundtrip(context);
});

test('marker padding does not change the nested content column', () => {
  const context: tsdoc.ParserContext = parse('-   parent\n  3. child\n- final');
  const root: ITestList[] = lists(context.docComment.summarySection);
  expect(root).toHaveLength(1);
  expect(root[0].nodes).toHaveLength(2);
  const child: ITestList[] = lists(root[0].nodes[0].content);
  expect(child).toHaveLength(1);
  expect(child[0].ordered).toBe(true);
  expect(child[0].start).toBe(3);
  expect(text(child[0].nodes[0]).trim()).toBe('child');
  roundtrip(context);
});

test('roundtrip preserves an indented marker in a separate item paragraph', () => {
  const context: tsdoc.ParserContext = parse('- parent\n\n   - literal');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(text(context.docComment)).toContain('literal');
  roundtrip(context);
});

test('roundtrip preserves an indented ordered marker inside a nested item paragraph', () => {
  const context: tsdoc.ParserContext = parse('12. parent\n    - child\n\n       3. literal\n1. final');
  const root: ITestList[] = lists(context.docComment.summarySection);
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
  const config: tsdoc.TSDocConfiguration = configuration();
  const paragraph: (texts: string[]) => tsdoc.DocParagraph = (texts: string[]) =>
    new DocParagraph(
      { configuration: config },
      texts.map((value) => new DocPlainText({ configuration: config, text: value }))
    );
  const item: tsdoc.DocListItem = new api.DocListItem({ configuration: config }, [
    paragraph(['parent']),
    paragraph(parts)
  ]);
  const list: tsdoc.DocList = new api.DocList({ configuration: config, ordered: false }, [item]);
  const docComment: tsdoc.DocComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
  const reparsed: tsdoc.ParserContext = new TSDocParser(config).parseString(docComment.emitAsTsdoc());
  const reparsedItems: readonly tsdoc.DocListItem[] = lists(reparsed.docComment.summarySection)[0].nodes;
  const reparsedParagraphs: tsdoc.DocNode[] = reparsedItems[0].content.nodes.filter(
    (node) => node.kind === 'Paragraph'
  );
  expect(reparsedParagraphs).toHaveLength(2);
  expect(text(reparsedParagraphs[1]).replace(/\n$/, '')).toBe(parts.join(''));
});

test.each([['- literal'], ['+', ' literal'], ['*', ' ', 'literal'], ['-']])(
  'constructed literal marker remains paragraph text: %j',
  (...parts) => {
    expect(typeof api.DocList).toBe('function');
    const config: tsdoc.TSDocConfiguration = configuration();
    const paragraph: (texts: string[]) => tsdoc.DocParagraph = (texts: string[]) =>
      new DocParagraph(
        { configuration: config },
        texts.map((value) => new DocPlainText({ configuration: config, text: value }))
      );
    const first: tsdoc.DocParagraph = paragraph(['parent']);
    const literal: tsdoc.DocParagraph = paragraph(parts);
    const originalNodes: tsdoc.DocNode[] = [...literal.nodes];
    const item: tsdoc.DocListItem = new api.DocListItem({ configuration: config }, [first, literal]);
    const list: tsdoc.DocList = new api.DocList({ configuration: config, ordered: false }, [item]);
    const docComment: tsdoc.DocComment = new DocComment({ configuration: config });
    docComment.summarySection.appendNode(list);
    roundtrip({ docComment, configuration: config });
    expect(literal.nodes).toHaveLength(originalNodes.length);
    literal.nodes.forEach((node, index) => {
      expect(node).toBe(originalNodes[index]);
      expect((node as tsdoc.DocPlainText).text).toBe(parts[index]);
    });
  }
);

test('constructed soft-break continuation preserves a literal unordered marker', () => {
  expect(typeof api.DocList).toBe('function');
  const config: tsdoc.TSDocConfiguration = configuration();
  const paragraph: tsdoc.DocParagraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'parent' }),
    new tsdoc.DocSoftBreak({ configuration: config }),
    new DocPlainText({ configuration: config, text: '-' }),
    new DocPlainText({ configuration: config, text: ' literal' })
  ]);
  const item: tsdoc.DocListItem = new api.DocListItem({ configuration: config }, [paragraph]);
  const list: tsdoc.DocList = new api.DocList({ configuration: config, ordered: false }, [item]);
  const docComment: tsdoc.DocComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
});

test('public list parameter types and constructors are usable by TypeScript consumers', () => {
  const config: tsdoc.TSDocConfiguration = new TSDocConfiguration();
  config.parseMarkdownLists = true;
  const parameters: tsdoc.IDocListParameters = { configuration: config, ordered: true, start: 3 };
  const itemParameters: tsdoc.IDocListItemParameters = { configuration: config };
  const item: tsdoc.DocListItem = new tsdoc.DocListItem(itemParameters, []);
  const body: tsdoc.DocSection = item.content;
  const list: tsdoc.DocList = new tsdoc.DocList(parameters, [item]);
  const kind: tsdoc.DocNodeKind = DocNodeKind.ListItem;
  const ordered: boolean = list.ordered;
  const start: number = list.start;
  // @ts-expect-error ordered is a required list parameter
  const incomplete: tsdoc.IDocListParameters = { configuration: config };
  expect(body).toBe(item.content);
  expect(kind).toBe(item.kind);
  expect(ordered).toBe(true);
  expect(start).toBe(3);
  expect(incomplete.configuration).toBe(config);
});

test('kind changes split lists and unordered marker changes do not', () => {
  const context: tsdoc.ParserContext = parse('- first\n+ second\n* third\n8. fourth\n1. fifth\n- sixth');
  const found: ITestList[] = lists(context.docComment.summarySection);
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
    const context: tsdoc.ParserContext = parse(`- real\n\n${literal}`);
    const found: ITestList[] = lists(context.docComment.summarySection);
    expect(found).toHaveLength(1);
    expect(found[0].nodes).toHaveLength(1);
    expect(text(context.docComment.summarySection)).toContain(literal.replace('\\-', '-'));
  }
);

test('a list cannot interrupt ordinary prose without a blank line', () => {
  const context: tsdoc.ParserContext = parse('intro\n- not an item\n\n- real\n- sibling');
  const section: tsdoc.DocSection = context.docComment.summarySection;
  expect(section.nodes[0].kind).toBe('Paragraph');
  expect(text(section.nodes[0])).toContain('- not an item');
  expect(lists(section)).toHaveLength(1);
  expect(lists(section)[0].nodes).toHaveLength(2);
  roundtrip(context);
});

test('escaped markers, inline code, links, and HTML retain their node types', () => {
  const context: tsdoc.ParserContext = parse(
    '- {@link Widget | label} {@link https://example.com | site} `- code` <b title="value">bold</b>\n  \\- literal\n- end'
  );
  const found: ITestList[] = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const kinds: string[] = (found[0].nodes[0].content.nodes[0] as tsdoc.DocParagraph).nodes.map((n) => n.kind);
  for (const kind of ['LinkTag', 'CodeSpan', 'HtmlStartTag', 'HtmlEndTag', 'EscapedText'])
    expect(kinds).toContain(kind);
  roundtrip(context);
});

test.each(['', 'const x = 1;\n', '- not an item\n@remarks not a tag\n', '  extra indentation\n'])(
  'fenced code is opaque and deindented: %j',
  (code) => {
    const body: string =
      '- item\n\n  ```ts\n' +
      code
        .split('\n')
        .slice(0, -1)
        .map((line) => '  ' + line + '\n')
        .join('') +
      '  ```\n- next';
    const context: tsdoc.ParserContext = parse(body);
    const found: ITestList[] = lists(context.docComment.summarySection);
    expect(found).toHaveLength(1);
    const fence: tsdoc.DocFencedCode = found[0].nodes[0].content.nodes.filter(
      (n): n is tsdoc.DocFencedCode => n.kind === 'FencedCode'
    )[0];
    expect(fence).toBeDefined();
    expect(fence.code).toBe(code);
    expect(context.log.messages).toHaveLength(0);
    expect(context.docComment.remarksBlock).toBeUndefined();
    roundtrip(context);
  }
);

test('nested ordered fence retains its code and returns to the parent list', () => {
  const context: tsdoc.ParserContext = parse(
    '5. root\n   - child\n\n     ```js\n     alpha\n       beta\n     ```\n   - next\n1. end'
  );
  const found: ITestList[] = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const child: ITestList = lists(found[0].nodes[0].content)[0];
  const fence: tsdoc.DocFencedCode = child.nodes[0].content.nodes.filter(
    (n): n is tsdoc.DocFencedCode => n.kind === 'FencedCode'
  )[0];
  expect(fence.code).toBe('alpha\n  beta\n');
  roundtrip(context);
});

test('source offsets, excerpts and diagnostics refer to the original buffer', () => {
  const source: string = 'prefix\n' + comment('- valid {@link Widget}\n  } invalid\n- final') + '\nsuffix';
  const range: tsdoc.TextRange = TextRange.fromStringRange(
    source,
    source.indexOf('/**'),
    source.indexOf('*/') + 2
  );
  const context: tsdoc.ParserContext = new TSDocParser(configuration()).parseRange(range);
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const excerpts: tsdoc.DocExcerpt[] = [];
  const visit: (node: tsdoc.DocNode) => void = (node: tsdoc.DocNode): void => {
    if (node.kind === DocNodeKind.Excerpt) excerpts.push(node as tsdoc.DocExcerpt);
    node.getChildNodes().forEach(visit);
  };
  visit(context.docComment);
  expect(excerpts.length).toBeGreaterThan(0);
  for (const excerpt of excerpts) {
    if (!excerpt.content.isEmpty()) {
      expect(excerpt.content.getContainingTextRange().buffer).toBe(source);
    }
  }
  const successfulExcerpt: tsdoc.DocExcerpt = excerpts.filter(
    (excerpt) => excerpt.content.toString() === 'Widget'
  )[0];
  expect(successfulExcerpt).toBeDefined();
  const successfulRange: tsdoc.TextRange = successfulExcerpt.content.getContainingTextRange();
  expect(successfulRange.pos).toBe(source.indexOf('Widget'));
  expect(successfulRange.end).toBe(successfulRange.pos + 'Widget'.length);
  expect(source.slice(successfulRange.pos, successfulRange.end)).toBe('Widget');
  const error: tsdoc.ParserMessage = context.log.messages.filter(
    (m) => m.messageId === 'tsdoc-escape-right-brace'
  )[0];
  expect(error).toBeDefined();
  expect(error!.textRange.pos).toBe(source.indexOf('} invalid'));
  expect(error!.textRange.buffer).toBe(source);
});

test('block tags exit lists and start independent sections', () => {
  const context: tsdoc.ParserContext = parse(
    '- summary\n@remarks\n- remark\n@param x - details\n\n- parameter'
  );
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(lists(context.docComment.remarksBlock!.content)).toHaveLength(1);
  expect(lists(context.docComment.params.blocks[0].content)).toHaveLength(1);
  roundtrip(context);
});

test('configuration defaults and clear reset parsing without changing disabled behavior', () => {
  const config: tsdoc.TSDocConfiguration = new TSDocConfiguration();
  expect(config.parseMarkdownLists).toBe(false);
  const original: tsdoc.ParserContext = new TSDocParser(config).parseString(comment('- a\n- b'));
  config.parseMarkdownLists = true;
  expect(
    lists(new TSDocParser(config).parseString(comment('- a\n- b')).docComment.summarySection)
  ).toHaveLength(1);
  config.clear();
  expect(config.parseMarkdownLists).toBe(false);
  const disabled: tsdoc.ParserContext = new TSDocParser(config).parseString(comment('- a\n- b'));
  expect(shape(disabled.docComment)).toEqual(shape(original.docComment));

  const hasList: (node: tsdoc.DocNode) => boolean = (node: tsdoc.DocNode): boolean =>
    node.kind === DocNodeKind.List || node.getChildNodes().some((child) => hasList(child));
  for (const body of [
    'hello\n{@link A}',
    '  leading  spaces\ncontinuation\ttext',
    'first paragraph\n\nsecond  paragraph',
    '```ts\n- literal\n```\n\n<div>html</div>',
    '\\- escaped marker and `- code`\n{@link A | label}',
    '@remarks\n  indented  text\n\nsecond',
    '@param value - first\n  continued\ttext'
  ]) {
    const legacy: tsdoc.ParserContext = parse(body, false);
    const enabled: tsdoc.ParserContext = parse(body, true);
    expect(legacy.log.messages).toHaveLength(0);
    expect(enabled.log.messages).toHaveLength(0);
    expect(hasList(legacy.docComment)).toBe(false);
    expect(hasList(enabled.docComment)).toBe(false);
    expect(enabled.docComment.emitAsTsdoc()).toBe(legacy.docComment.emitAsTsdoc());
  }
});

test('list whitespace handling stays local to surrounding paragraphs', () => {
  const before: string = 'before  value\ncontinued text';
  const after: string = 'after  value\n\\- literal';
  const context: tsdoc.ParserContext = parse(`${before}\n\n- item\n- next\n\n${after}`);
  const reparsed: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    context.docComment.emitAsTsdoc()
  );
  const standaloneBefore: tsdoc.ParserContext = parse(before);
  const standaloneAfter: tsdoc.ParserContext = parse(after);
  const expectedBefore: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    standaloneBefore.docComment.emitAsTsdoc()
  );
  const expectedAfter: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    standaloneAfter.docComment.emitAsTsdoc()
  );
  expect(reparsed.log.messages.map((message) => message.messageId)).toEqual(
    context.log.messages.map((message) => message.messageId)
  );
  expect(reparsed.docComment.summarySection.nodes.map((node) => node.kind)).toEqual([
    'Paragraph',
    'List',
    'Paragraph'
  ]);
  const withoutBoundaryBreaks: (value: string) => string = (value: string): string =>
    value.replace(/^\n+|\n+$/g, '');
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
  const config: tsdoc.TSDocConfiguration = configuration();
  const paragraph: tsdoc.DocParagraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'hello' })
  ]);
  const child: tsdoc.DocListItem = new api.DocListItem({ configuration: config }, [paragraph]);
  const list: tsdoc.DocList = new api.DocList({ configuration: config, ordered: true, start: 4 }, [child]);
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
  const list: tsdoc.DocList = new api.DocList({ configuration: configuration(), ordered: false, start: 42 });
  expect(list.start).toBe(42);
});

test.each([0, 1, 42, 999999999])('builder start %s roundtrips without mutation', (start) => {
  expect(typeof api.DocList).toBe('function');
  const config: tsdoc.TSDocConfiguration = configuration();
  const item: tsdoc.DocListItem = new api.DocListItem({ configuration: config }, [
    new DocParagraph({ configuration: config }, [new DocPlainText({ configuration: config, text: 'built' })])
  ]);
  const list: tsdoc.DocList = new api.DocList({ configuration: config, ordered: true, start }, [
    item,
    new api.DocListItem({ configuration: config })
  ]);
  const docComment: tsdoc.DocComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(list);
  roundtrip({ docComment, configuration: config });
  expect(list.nodes[0]).toBe(item);
  expect(list.start).toBe(start);
});

test('emitter can be reused after nested list rendering', () => {
  const context: tsdoc.ParserContext = parse('- item\n  - child');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const emitter: tsdoc.TSDocEmitter = new tsdoc.TSDocEmitter();
  const first: tsdoc.StringBuilder = new tsdoc.StringBuilder();
  emitter.renderComment(first, context.docComment);
  const second: tsdoc.StringBuilder = new tsdoc.StringBuilder();
  const plain: tsdoc.DocComment = parse('plain').docComment;
  emitter.renderComment(second, plain);
  expect(second.toString()).toBe(plain.emitAsTsdoc());
  roundtrip(context);
});

test('rendering preserves every parsed child identity and source excerpt', () => {
  const context: tsdoc.ParserContext = parse('- first\n  continuation\n\n  second paragraph\n- final');
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  const snapshots: { node: tsdoc.DocNode; children: ReadonlyArray<tsdoc.DocNode>; excerpt?: string }[] = [];
  function remember(node: tsdoc.DocNode): void {
    const children: tsdoc.DocNode[] = [...node.getChildNodes()];
    snapshots.push({
      node,
      children,
      excerpt: node.kind === 'Excerpt' ? (node as tsdoc.DocExcerpt).content.toString() : undefined
    });
    children.forEach(remember);
  }
  remember(context.docComment);
  context.docComment.emitAsTsdoc();
  context.docComment.emitAsTsdoc();
  for (const snapshot of snapshots) {
    const children: readonly tsdoc.DocNode[] = snapshot.node.getChildNodes();
    expect(children).toHaveLength(snapshot.children.length);
    children.forEach((child, index: number) => expect(child).toBe(snapshot.children[index]));
    if (snapshot.excerpt !== undefined)
      expect((snapshot.node as tsdoc.DocExcerpt).content.toString()).toBe(snapshot.excerpt);
  }
});

test('emission observes item edits, appended items and clearing after an earlier render', () => {
  const context: tsdoc.ParserContext = parse('- original');
  const found: ITestList[] = lists(context.docComment.summarySection);
  expect(found).toHaveLength(1);
  const list: ITestList = found[0];
  context.docComment.emitAsTsdoc();
  const paragraph: (value: string) => tsdoc.DocParagraph = (value: string) =>
    new DocParagraph({ configuration: context.configuration }, [
      new DocPlainText({ configuration: context.configuration, text: value })
    ]);
  (list.nodes[0] as tsdoc.DocListItem).content.clearNodes();
  (list.nodes[0] as tsdoc.DocListItem).content.appendNode(paragraph('replacement'));
  list.appendNode(new api.DocListItem({ configuration: context.configuration }, [paragraph('appended')]));
  const updated: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    context.docComment.emitAsTsdoc()
  );
  expect(lists(updated.docComment.summarySection)[0].nodes.map((item) => text(item).trim())).toEqual([
    'replacement',
    'appended'
  ]);
  list.clearNodes();
  const cleared: tsdoc.ParserContext = new TSDocParser(context.configuration).parseString(
    context.docComment.emitAsTsdoc()
  );
  expect(lists(cleared.docComment.summarySection)).toHaveLength(0);
  expect(text(cleared.docComment).trim()).toBe('');
});

test('reusing one parser keeps successive list comments independent', () => {
  const config: tsdoc.TSDocConfiguration = configuration();
  const parser: tsdoc.TSDocParser = new TSDocParser(config);
  const first: tsdoc.ParserContext = parser.parseString(comment('- first\n  - child'));
  expect(lists(first.docComment.summarySection)).toHaveLength(1);
  const before: unknown = shape(first.docComment);
  const source: string = 'prefix\n' + comment('9. second\n1. final') + '\nsuffix';
  const second: tsdoc.ParserContext = parser.parseRange(
    TextRange.fromStringRange(source, source.indexOf('/**'), source.indexOf('*/') + 2)
  );
  const found: ITestList[] = lists(second.docComment.summarySection);
  expect(found).toHaveLength(1);
  expect(found[0].ordered).toBe(true);
  expect(found[0].start).toBe(9);
  expect(found[0].nodes.map((item) => text(item).trim())).toEqual(['second', 'final']);
  expect(shape(first.docComment)).toEqual(before);
  expect(second.docComment).not.toBe(first.docComment);
  roundtrip(second);
});

test('empty lists emit nothing and omitted starts use one', () => {
  expect(typeof api.DocList).toBe('function');
  const config: tsdoc.TSDocConfiguration = configuration();
  const doc: tsdoc.DocComment = parse('ordinary').docComment;
  const before: string = doc.emitAsTsdoc();
  const empty: tsdoc.DocList = new api.DocList({ configuration: config, ordered: true });
  expect(empty.start).toBe(1);
  doc.summarySection.appendNode(empty);
  expect(doc.emitAsTsdoc()).toBe(before);
  expect(empty.nodes).toHaveLength(0);

  const itemList: tsdoc.DocList = new api.DocList({ configuration: config, ordered: false }, [
    new api.DocListItem({ configuration: config })
  ]);
  const itemDoc: tsdoc.DocComment = new DocComment({ configuration: config });
  itemDoc.summarySection.appendNode(itemList);
  const reparsed: tsdoc.ParserContext = new TSDocParser(config).parseString(itemDoc.emitAsTsdoc());
  const reparsedList: ITestList = lists(reparsed.docComment.summarySection)[0];
  expect(reparsedList.nodes[0].content.nodes).toEqual([]);
});

test('constructed nested lists roundtrip', () => {
  expect(typeof api.DocList).toBe('function');
  const config: tsdoc.TSDocConfiguration = configuration();
  const paragraph: tsdoc.DocParagraph = new DocParagraph({ configuration: config }, [
    new DocPlainText({ configuration: config, text: 'leaf' })
  ]);
  const child: tsdoc.DocList = new api.DocList({ configuration: config, ordered: true, start: 3 }, [
    new api.DocListItem({ configuration: config }, [paragraph])
  ]);
  const parent: tsdoc.DocList = new api.DocList({ configuration: config, ordered: false }, [
    new api.DocListItem({ configuration: config }, [child])
  ]);
  const docComment: tsdoc.DocComment = new DocComment({ configuration: config });
  docComment.summarySection.appendNode(parent);
  roundtrip({ docComment, configuration: config });
  const reparsed: tsdoc.ParserContext = new TSDocParser(config).parseString(docComment.emitAsTsdoc());
  const reparsedParent: ITestList = lists(reparsed.docComment.summarySection)[0];
  expect(reparsedParent.nodes[0].content.nodes.map((node) => node.kind)).toEqual([DocNodeKind.List]);
});

test('a malformed inline tag keeps its diagnostic inside a nested item', () => {
  const source: string = comment('- root\n  - {@link }\n- next');
  const context: tsdoc.ParserContext = new TSDocParser(configuration()).parseString(source);
  const outer: ITestList[] = lists(context.docComment.summarySection);
  expect(outer).toHaveLength(1);
  expect(outer[0].nodes).toHaveLength(2);
  const nested: ITestList = lists(outer[0].nodes[0].content)[0];
  expect(nested.nodes).toHaveLength(1);
  const plainSource: string = comment('{@link }');
  const plain: tsdoc.ParserContext = new TSDocParser().parseString(plainSource);
  expect(context.log.messages.map((m) => m.messageId)).toEqual(plain.log.messages.map((m) => m.messageId));
  expect(context.log.messages.length).toBeGreaterThan(0);
  context.log.messages.forEach((message, index: number) => {
    expect(message.textRange.buffer).toBe(source);
    const expected: tsdoc.TextRange = plain.log.messages[index].textRange;
    const offset: number = source.indexOf('{@link }') - plainSource.indexOf('{@link }');
    expect(message.textRange.pos).toBe(expected.pos + offset);
    expect(message.textRange.end).toBe(expected.end + offset);
  });
});

test('a malformed escape keeps its full diagnostic range inside a deeply nested item', () => {
  const fragment: string = 'bad \\q';
  const source: string = comment(`- root\n  - child\n    - ${fragment}\n- next`);
  const context: tsdoc.ParserContext = new TSDocParser(configuration()).parseString(source);
  const plainSource: string = comment(fragment);
  const plain: tsdoc.ParserContext = new TSDocParser().parseString(plainSource);
  expect(lists(context.docComment.summarySection)).toHaveLength(1);
  expect(context.log.messages.map((message) => message.messageId)).toEqual(
    plain.log.messages.map((message) => message.messageId)
  );
  expect(context.log.messages.length).toBeGreaterThan(0);
  const offset: number = source.indexOf(fragment) - plainSource.indexOf(fragment);
  context.log.messages.forEach((message, index: number) => {
    const expected: tsdoc.TextRange = plain.log.messages[index].textRange;
    expect(message.textRange.buffer).toBe(source);
    expect(message.textRange.pos).toBe(expected.pos + offset);
    expect(message.textRange.end).toBe(expected.end + offset);
  });
});
