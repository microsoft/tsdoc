// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

export interface IThemeRule {
  foreground?: string;
  background?: string;
  fontWeight?: string;
  className?: string;
}

export interface IDocNodeSyntaxStylerTheme {
  [styleTokens: string]: IThemeRule;
}

export class MonacoTSDocTheme {
  public static readonly vs: IDocNodeSyntaxStylerTheme = {
    'tsdoc.delimiter': { foreground: 'a6a6a6' },
    'tsdoc.tag.block': { foreground: '003399', fontWeight: 'bold', className: 'tsdoc-blocktag' },
    'tsdoc.tag.inline': { foreground: '003399', fontWeight: 'bold' },
    'tsdoc.tag.modifier': { foreground: 'C55411', fontWeight: 'bold' },
    'tsdoc.tag.undefined': { foreground: 'a6a6a6' },
    'tsdoc.member.selector': { foreground: 'C55411' },
    'tsdoc.member.identifier': { foreground: '3D7CAA' },
    'tsdoc.packageName': { foreground: '003399' },
    'tsdoc.importPath': { foreground: '003399' },
    'tsdoc.element.name': { foreground: '003399' },
    'tsdoc.element.attribute.name': { foreground: '003399' },
    'tsdoc.element.attribute.value': { foreground: '000000' },
    'tsdoc.url': { foreground: '3D7CAA', className: 'tsdoc-underline' },
    'tsdoc.code': { foreground: '000000' },
    'tsdoc.language': { foreground: 'C55411' },
    'tsdoc.error': { foreground: 'FFFFFF', background: 'c00000' },
    'tsdoc.escaped': { background: 'e0e0e0' }
  };

  public static readonly vsDark: IDocNodeSyntaxStylerTheme = {
    'tsdoc.delimiter': { foreground: 'a6a6a6' },
    'tsdoc.tag.block': { foreground: '646fd1', fontWeight: 'bold', className: 'tsdoc-blocktag' },
    'tsdoc.tag.inline': { foreground: '646fd1', fontWeight: 'bold' },
    'tsdoc.tag.modifier': { foreground: 'b46695', fontWeight: 'bold' },
    'tsdoc.tag.undefined': { foreground: 'a6a6a6' },
    'tsdoc.member.selector': { foreground: 'b46695' },
    'tsdoc.member.identifier': { foreground: '64b0d2' },
    'tsdoc.packageName': { foreground: '646fd1' },
    'tsdoc.importPath': { foreground: '646fd1' },
    'tsdoc.element.name': { foreground: '646fd1' },
    'tsdoc.element.attribute.name': { foreground: '646fd1' },
    'tsdoc.element.attribute.value': { foreground: 'd4d4d4' },
    'tsdoc.url': { foreground: '64b0d2', className: 'tsdoc-underline' },
    'tsdoc.code': { foreground: 'd4d4d4' },
    'tsdoc.language': { foreground: 'b46695' },
    'tsdoc.error': { foreground: 'd4d4d4', background: 'c00000' },
    'tsdoc.escaped': { background: '333333' }
  };
}
