import * as tsdoc from '@microsoft/tsdoc';

import { ISyntaxStyle } from './CodeEditor';

import './syntaxStyles.css';

export class DocNodeSyntaxStyler {
  public static getStylesForDocComment(styles: ISyntaxStyle[], docNode: tsdoc.DocNode): void {
    switch (docNode.kind) {
      case 'BlockTag':
        if (docNode instanceof tsdoc.DocNodeLeaf && docNode.excerpt) {
            switch (docNode.excerpt.content.toString()) {
              case '@beta':
              case '@alpha':
              case '@public':
              case '@internal':
                {
                  DocNodeSyntaxStyler._addTokenStyles(styles, docNode.excerpt.content.tokens, 'tsdoc-modifierTagSyntax');
                  break;
                }

              case '@remarks':
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, docNode.excerpt.content.tokens, 'tsdoc-remarksTagSyntax');
                break;
              }

              case '@returns':
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, docNode.excerpt.content.tokens, 'tsdoc-returnsTagSyntax');
                break;
              }

              default:
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, docNode.excerpt.content.tokens, 'tsdoc-blockTagSyntax');
                break;
              }
            }
          }
          break;

        case 'InheritDocTag':
        case 'LinkTag':
          {
            DocNodeSyntaxStyler._addDecorationsForInlineTag(styles, docNode as tsdoc.DocInlineTag);
            break;
          }

        case 'ParamBlock':
          {
            DocNodeSyntaxStyler._addDecorationsForParamTag(styles, docNode as tsdoc.DocParamBlock);
            break;
          }
      }

    for (const child of docNode.getChildNodes()) {
      DocNodeSyntaxStyler.getStylesForDocComment(styles, child);
    }
  }

  private static _addDecorationsForParamTag(
    styles: ISyntaxStyle[],
    paramTag: tsdoc.DocParamBlock
  ): void {
    for (const child of paramTag.getChildNodes()) {
      if (child instanceof tsdoc.DocParticle) {
        if (child.excerpt) {
          switch (child.particleId) {
            case 'hyphen':
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-inlineDelimiterSyntax');
                break;
              }

            case 'parameterName': {
              DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-paramNameSyntax');
              break;
            }
          }
        }
      } else if (child instanceof tsdoc.DocBlockTag && child.excerpt) {
        DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-paramTagNameSyntax');
      }
    }
  }

  private static _addDecorationsForInlineTag(
    styles: ISyntaxStyle[],
    inlineTag: tsdoc.DocInlineTag
  ): void {
    for (const child of inlineTag.getChildNodes()) {
      if (child instanceof tsdoc.DocParticle) {
        if (child.excerpt) {
          switch (child.particleId) {
            case 'openingDelimiter':
            case 'closingDelimiter':
            case 'pipe':
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-inlineDelimiterSyntax');
                break;
              }

            case 'tagName': {
              DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-inlineTagNameSyntax');
              break;
            }

            case 'linkText': {
              DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-linkTextSyntax');
              break;
            }
          }
        }
      } else if (child instanceof tsdoc.DocDeclarationReference) {
        DocNodeSyntaxStyler._addDecorationsForDeclarationReference(styles, child);
      }
    }
  }

  private static _addDecorationsForDeclarationReference(
    styles: ISyntaxStyle[],
    inlineTag: tsdoc.DocDeclarationReference
  ): void {
    for (const child of inlineTag.getChildNodes()) {
      if (child instanceof tsdoc.DocParticle) {
        if (child.excerpt) {
          switch (child.particleId) {
            case 'packageName':
              {
                DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-packageNameSyntax');
                break;
              }

            case 'importHash': {
              DocNodeSyntaxStyler._addTokenStyles(styles, child.excerpt.content.tokens, 'tsdoc-inlineDelimiterSyntax');
              break;
            }
          }
        }
      } else if (child instanceof tsdoc.DocMemberReference) {
        // TODO: Colorize doc member reference
      }
    }
  }

  private static _addTokenStyles(
    decorations: ISyntaxStyle[],
    tokens: ReadonlyArray<tsdoc.Token>,
    className: string
  ): void {
    for (const token of tokens) {
      decorations.push({
        pos: token.range.pos,
        end: token.range.end,
        className: className
      });
    }
  }
}
