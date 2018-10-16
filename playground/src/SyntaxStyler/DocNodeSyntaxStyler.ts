import * as tsdoc from '@microsoft/tsdoc';

import {
  MonacoTSDocTheme,
  IDocNodeSyntaxStylerTheme,
  IThemeRule
} from './DocNodeSyntaxStylerTheme';
import { IStyledRange } from './../CodeEditor';

import './syntaxStyles.css';

export interface IGetStylesForDocCommentOptions {
  docNode: tsdoc.DocNode;
  parserContext: tsdoc.ParserContext;
  themeName: string;
}

interface IAddTokenStylesOptions {
  styleTokens: string[];
  theme: IDocNodeSyntaxStylerTheme;
}

interface IGetStylesForDocCommentInternalOptions extends IGetStylesForDocCommentOptions, IAddTokenStylesOptions {
  parentNode?: tsdoc.DocNode;
}

interface IThemeClassNameMapping {
  [tokens: string]: string;
}

export class DocNodeSyntaxStyler {
  private static _classNameId: number = 0;
  private static _themeCache: { [hash: string]: IThemeClassNameMapping } = {};

  public static getStylesForDocComment(styles: IStyledRange[], options: IGetStylesForDocCommentOptions): void {
    let theme: IDocNodeSyntaxStylerTheme;
    switch (options.themeName) {
      default:
      case 'vs': {
        theme = MonacoTSDocTheme.vs;
        break;
      }

      case 'vs-dark': {
        theme = MonacoTSDocTheme.vsDark;
        break;
      }
    }

    DocNodeSyntaxStyler._getStylesForDocCommentInternal(
      styles,
      {
        ...options,
        theme,
        styleTokens: ['tsdoc']
      }
    );
  }

  public static _getStylesForDocCommentInternal(
    styles: IStyledRange[],
    options: IGetStylesForDocCommentInternalOptions
  ): void {
    const {
      docNode,
      parserContext,
      styleTokens,
      theme
    } = options;

    if (docNode instanceof tsdoc.DocExcerpt) {
      // Match the context against a color (i.e. tsdoc.link.url)

      switch (docNode.excerptKind) {
        case 'CodeSpan_ClosingDelimiter':
        case 'CodeSpan_OpeningDelimiter':
        case 'DeclarationReference_ImportHash':
        case 'DocMemberSymbol_LeftBracket':
        case 'DocMemberSymbol_RightBracket':
        case 'FencedCode_ClosingFence':
        case 'FencedCode_OpeningFence':
        case 'HtmlAttribute_Equals':
        case 'HtmlEndTag_ClosingDelimiter':
        case 'HtmlEndTag_OpeningDelimiter':
        case 'HtmlStartTag_ClosingDelimiter':
        case 'HtmlStartTag_OpeningDelimiter':
        case 'InlineTag_ClosingDelimiter':
        case 'InlineTag_OpeningDelimiter':
        case 'LinkTag_Pipe':
        case 'MemberIdentifier_LeftQuote':
        case 'MemberIdentifier_RightQuote':
        case 'MemberReference_Colon':
        case 'MemberReference_Dot':
        case 'MemberReference_LeftParenthesis':
        case 'MemberReference_RightParenthesis':
        case 'ParamBlock_Hyphen': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'delimiter'] }
          );
          break;
        }

        case 'InlineTag_TagName':
        case 'BlockTag': {
          const tagDefinition: tsdoc.TSDocTagDefinition | undefined = parserContext.configuration.tryGetTagDefinition(
            docNode.content.toString()
          );
          DocNodeSyntaxStyler._addStylesForTag(
            styles,
            docNode.content,
            tagDefinition,
            { theme, styleTokens: [...styleTokens, 'tag'] }
          );
          break;
        }

        case 'MemberIdentifier_Identifier': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'member', 'identifier'] }
        );
          break;
        }

        case 'DeclarationReference_PackageName': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'packageName'] }
          );
          break;
        }

        case 'DeclarationReference_ImportPath': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'importPath'] }
          );
          break;
        }

        case 'LinkTag_UrlDestination': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'url'] }
          );
          break;
        }

        case 'CodeSpan_Code':
        case 'FencedCode_Code': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'code'] }
          );
          break;
        }

        case 'FencedCode_Language': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'language'] }
          );
          break;
        }

        case 'HtmlEndTag_Name':
        case 'HtmlStartTag_Name': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'element', 'name'] }
          );
          break;
        }

        case 'HtmlAttribute_Name': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'element', 'attribute', 'name'] }
          );
          break;
        }

        case 'HtmlAttribute_Value': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'element', 'attribute', 'value'] }
          );
          break;
        }

        case 'ErrorText': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'error'] }
          );
          break;
        }

        case 'EscapedText': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'escaped'] }
          );
          break;
        }

        case 'MemberSelector': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.content,
            { theme, styleTokens: [...styleTokens, 'member', 'selector'] }
          );
          break;
        }
      }
    }

    for (const child of docNode.getChildNodes()) {
      DocNodeSyntaxStyler._getStylesForDocCommentInternal(
        styles,
        {
          ...options,
          parentNode: docNode,
          docNode: child
        }
      );
    }
  }

  private static _addStylesForTag(
    styles: IStyledRange[],
    excerpt: tsdoc.TokenSequence | undefined,
    tagDefinition: tsdoc.TSDocTagDefinition | undefined,
    options: IAddTokenStylesOptions
  ): void {
    const {
      theme,
      styleTokens
    } = options;
    if (tagDefinition) {
      switch (tagDefinition.syntaxKind) {
        case tsdoc.TSDocTagSyntaxKind.BlockTag: {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            excerpt,
            { theme, styleTokens: [...styleTokens, 'block'] }
          );
          break;
        }

        case tsdoc.TSDocTagSyntaxKind.InlineTag: {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            excerpt,
            { theme, styleTokens: [...styleTokens, 'inline'] }
          );
          break;
        }

        case tsdoc.TSDocTagSyntaxKind.ModifierTag: {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            excerpt,
            { theme, styleTokens: [...styleTokens, 'modifier'] }
          );
          break;
        }
      }
    } else {
      // Undefined tag
      DocNodeSyntaxStyler._addTokenStyles(
        styles,
        excerpt,
        { theme, styleTokens: [...styleTokens, 'undefined'] }
      );
    }
  }

  private static _addTokenStyles(
    styles: IStyledRange[],
    excerpt: tsdoc.TokenSequence | undefined,
    options: IAddTokenStylesOptions
  ): void {
    if (excerpt) {
      const themeMapping: IThemeClassNameMapping = DocNodeSyntaxStyler._ensureStyleForTheme(options.theme);

      for (const token of excerpt.tokens) {
        styles.push({
          pos: token.range.pos,
          end: token.range.end,
          className: themeMapping[options.styleTokens.join('.')]
        });
      }
    }
  }

  private static _ensureStyleForTheme(theme: IDocNodeSyntaxStylerTheme): IThemeClassNameMapping {
    const hash: string = JSON.stringify(theme);
    if (!DocNodeSyntaxStyler._themeCache[hash]) {
      const classNameMapping: IThemeClassNameMapping = {};
      DocNodeSyntaxStyler._themeCache[hash] = classNameMapping;

      const styleLines: string[] = [];

      for (const styleTokens in theme) {
        if (theme.hasOwnProperty(styleTokens)) {
          const themeStyle: IThemeRule = theme[styleTokens];

          const cssRules: string[] = [];
          if (themeStyle.foreground) {
            cssRules.push(`color: #${themeStyle.foreground} !important;`);
          }

          if (themeStyle.background) {
            cssRules.push(`background-color: #${themeStyle.background} !important;`);
          }

          if (themeStyle.fontWeight) {
            cssRules.push(`font-weight: ${themeStyle.fontWeight} !important;`);
          }

          let classNameToUse: string = themeStyle.className ? `${themeStyle.className} ` : '';
          if (cssRules.length > 0) {
            const className: string = `tsdoc-playground-codestyle-${DocNodeSyntaxStyler._classNameId++}`;
            styleLines.push(`.${className} { ${cssRules.join(' ')} } /* ${styleTokens} */`);
            classNameToUse += className;
          }

          classNameMapping[styleTokens] = classNameToUse;
        }
      }

      DocNodeSyntaxStyler._appendStyle(styleLines);
    }

    return DocNodeSyntaxStyler._themeCache[hash];
  }

  private static _appendStyle(styleLines: string[]): void {
    const styleElement: HTMLStyleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = styleLines.join('\n');

    const styleRegion: HTMLHeadElement = document.head || document.body;
    styleRegion.appendChild(styleElement);
  }
}
