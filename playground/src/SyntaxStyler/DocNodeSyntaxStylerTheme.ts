export interface IThemeRule {
  foreground?: string;
  background?: string;
  fontWeight?: string;
  className?: string;
}

export interface IDocNodeSyntaxStylerTheme {
  [styleTokens: string]: IThemeRule;
}

export namespace MonacoTSDocTheme {
  export const vs: IDocNodeSyntaxStylerTheme = {
    'tsdoc.delimiter': { foreground: 'a6a6a6' },
    'tsdoc.tag.block': { foreground: '003399', fontWeight: 'bold', className: 'tsdoc-blocktag' },
    'tsdoc.tag.inline': { foreground: '003399', fontWeight: 'bold' },
    'tsdoc.tag.modifier': { foreground: 'c55a11', fontWeight: 'bold' },
    'tsdoc.tag.undefined': { foreground: 'a6a6a6' },
    'tsdoc.member.selector': { foreground: 'c55a11' },
    'tsdoc.member.identifier': { foreground: '5b9bd5' },
    'tsdoc.element.name': { foreground: '003399' },
    'tsdoc.element.attribute.name': { foreground: '003399' },
    'tsdoc.element.attribute.value': { foreground: '000000' },
    'tsdoc.url': { foreground: '5b9bd5', className: 'tsdoc-underline' },
    'tsdoc.code': { foreground: '000000' },
    'tsdoc.language': { foreground: 'c55a11' },
    'tsdoc.error': { foreground: 'FFFFFF', background: 'c00000' },
    'tsdoc.escaped': { background: 'e0e0e0' }
  };

  export const vsDark: IDocNodeSyntaxStylerTheme = {
    'tsdoc.delimiter': { foreground: 'a6a6a6' },
    'tsdoc.tag.block': { foreground: '569cd6', fontWeight: 'bold', className: 'tsdoc-blocktag' },
    'tsdoc.tag.inline': { foreground: '569cd6', fontWeight: 'bold' },
    'tsdoc.tag.modifier': { foreground: 'b46695', fontWeight: 'bold' },
    'tsdoc.tag.undefined': { foreground: 'a6a6a6' },
    'tsdoc.member.selector': { foreground: 'b46695' },
    'tsdoc.member.identifier': { foreground: '5b9bd5' },
    'tsdoc.element.name': { foreground: '569cd6' },
    'tsdoc.element.attribute.name': { foreground: '569cd6' },
    'tsdoc.element.attribute.value': { foreground: 'd4d4d4' },
    'tsdoc.url': { foreground: '5b9bd5', className: 'tsdoc-underline' },
    'tsdoc.code': { foreground: 'd4d4d4' },
    'tsdoc.language': { foreground: 'b46695' },
    'tsdoc.error': { foreground: 'd4d4d4', background: 'c00000' },
    'tsdoc.escaped': { background: '333333' }
  };
}
