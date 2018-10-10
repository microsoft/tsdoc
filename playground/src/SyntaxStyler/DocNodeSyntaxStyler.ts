import * as tsdoc from '@microsoft/tsdoc';

import {
  vs,
  IDocNodeSyntaxStylerTheme,
  IThemeRule
} from './DocNodeSyntaxStylerTheme';
import { ISyntaxStyle } from './../CodeEditor';

import './syntaxStyles.css';

export interface IGetStylesForDocCommentOptions {
  docNode: tsdoc.DocNode;
  parserContext: tsdoc.ParserContext;
}

interface IGetStylesForDocCommentInternalOptions extends IGetStylesForDocCommentOptions, IAddTokenStylesOptions {
  parentNode?: tsdoc.DocNode;
}

interface IAddTokenStylesOptions {
  styleTokens: string[];
  theme: IDocNodeSyntaxStylerTheme;
}

interface IThemeClassNameMapping {
  [tokens: string]: string;
}

export class DocNodeSyntaxStyler {
  private static _classNameId: number = 0;
  private static _themeCache: { [hash: string]: IThemeClassNameMapping } = {};

  public static getStylesForDocComment(styles: ISyntaxStyle[], options: IGetStylesForDocCommentOptions): void {
    DocNodeSyntaxStyler._getStylesForDocCommentInternal(
      styles,
      {
        theme: vs,
        ...options,
        styleTokens: ['tsdoc']
      }
    );
  }

  public static _getStylesForDocCommentInternal(
    styles: ISyntaxStyle[],
    options: IGetStylesForDocCommentInternalOptions
  ): void {
    const {
      parentNode,
      docNode,
      parserContext,
      styleTokens,
      theme
    } = options;

    if (docNode instanceof tsdoc.DocParticle) {
      // Match the context against a color (i.e. tsdoc.link.url)

      switch (docNode.particleId) {
        case 'openingDelimiter':
        case 'closingDelimiter':
        case 'pipe':
        case 'colon':
        case 'hyphen':
        case 'equals':
        case 'leftParenthesis':
        case 'rightParenthesis':
        case 'leftBracket':
        case 'rightBracket':
        case 'dot': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'delimiter'] }
          );
          break;
        }

        case 'tagName': {
          if (parentNode instanceof tsdoc.DocInlineTag || parentNode instanceof tsdoc.DocBlockTag) {
            const tagDefinition: tsdoc.TSDocTagDefinition | undefined = parserContext.configuration.tryGetTagDefinition(
              parentNode.tagName
            );
            DocNodeSyntaxStyler._addStylesForTag(
              styles,
              docNode.excerpt,
              tagDefinition,
              { theme, styleTokens: [...styleTokens, 'tag'] }
            );
          } else {
            // Undefined tag
            DocNodeSyntaxStyler._addTokenStyles(
              styles,
              docNode.excerpt,
              { theme, styleTokens: [...styleTokens, 'tag', 'undefined'] }
            );
          }

          break;
        }

        case 'identifier': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'member', 'identifier'] }
          );
          break;
        }

        case 'urlDestination': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'url'] }
          );
          break;
        }

        case 'code': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'code'] }
          );
          break;
        }

        case 'language': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'language'] }
          );
          break;
        }

        case 'elementName': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'element', 'name'] }
          );
          break;
        }

        case 'attributeName': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'element', 'attribute', 'name'] }
          );
          break;
        }

        case 'attributeValue': {
          DocNodeSyntaxStyler._addTokenStyles(
            styles,
            docNode.excerpt,
            { theme, styleTokens: [...styleTokens, 'element', 'attribute', 'value'] }
          );
          break;
        }
      }
    } else if (docNode instanceof tsdoc.DocBlockTag) {
      const tagDefinition: tsdoc.TSDocTagDefinition | undefined = parserContext.configuration.tryGetTagDefinition(
        docNode.tagName
      );
      DocNodeSyntaxStyler._addStylesForTag(
        styles,
        docNode.excerpt,
        tagDefinition,
        { theme, styleTokens: [...styleTokens, 'tag'] }
      );
    } else if (docNode instanceof tsdoc.DocErrorText) {
      DocNodeSyntaxStyler._addTokenStyles(
        styles,
        docNode.excerpt,
        { theme, styleTokens: [...styleTokens, 'error'] }
      );
    } else if (docNode instanceof tsdoc.DocEscapedText && docNode.excerpt) {
      DocNodeSyntaxStyler._addTokenStyles(
        styles,
        docNode.excerpt,
        { theme, styleTokens: [...styleTokens, 'escaped'] }
      );
    } else if (docNode instanceof tsdoc.DocMemberSelector && docNode.excerpt) {
      DocNodeSyntaxStyler._addTokenStyles(
        styles,
        docNode.excerpt,
        { theme, styleTokens: [...styleTokens, 'member', 'selector'] }
      );
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
    styles: ISyntaxStyle[],
    excerpt: tsdoc.Excerpt | undefined,
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
    styles: ISyntaxStyle[],
    excerpt: tsdoc.Excerpt | undefined,
    options: IAddTokenStylesOptions
  ): void {
    if (excerpt) {
      const themeMapping: IThemeClassNameMapping = DocNodeSyntaxStyler._ensureStyleForTheme(options.theme);

      for (const token of excerpt.content.tokens) {
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
