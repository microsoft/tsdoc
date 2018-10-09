import * as tsdoc from '@microsoft/tsdoc';
import { ISyntaxDecoration } from './MonacoWrapper';

export function assembleDecorations(decorations: ISyntaxDecoration[], docNode: tsdoc.DocNode): void {
  switch (docNode.kind) {
    case 'BlockTag':
      if (docNode instanceof tsdoc.DocNodeLeaf && docNode.excerpt) {
          switch (docNode.excerpt.content.toString()) {
            case '@beta':
            case '@alpha':
            case '@public':
            case '@internal':
              {
                _addTokensToDecorations(decorations, docNode.excerpt.content.tokens, 'tsdoc-modifierTagSyntax');
                break;
              }

            case '@remarks':
            {
              _addTokensToDecorations(decorations, docNode.excerpt.content.tokens, 'tsdoc-remarksTagSyntax');
              break;
            }

            case '@returns':
            {
              _addTokensToDecorations(decorations, docNode.excerpt.content.tokens, 'tsdoc-returnsTagSyntax');
              break;
            }

            default:
            {
              _addTokensToDecorations(decorations, docNode.excerpt.content.tokens, 'tsdoc-blockTagSyntax');
              break;
            }
          }
        }
        break;

      case 'InheritDocTag':
      case 'LinkTag':
        {
          _addDecorationsForInlineTag(decorations, docNode as tsdoc.DocInlineTag);
          break;
        }

      case 'ParamBlock':
        {
          _addDecorationsForParamTag(decorations, docNode as tsdoc.DocParamBlock);
          break;
        }
    }

  for (const child of docNode.getChildNodes()) {
    assembleDecorations(decorations, child);
  }
}

function _addDecorationsForParamTag(
  decorations: ISyntaxDecoration[],
  paramTag: tsdoc.DocParamBlock
): void {
  for (const child of paramTag.getChildNodes()) {
    if (child instanceof tsdoc.DocParticle) {
      if (child.excerpt) {
        switch (child.particleId) {
          case 'hyphen':
            {
              _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-inlineDelimeterSyntax');
              break;
            }

          case 'parameterName': {
            _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-paramNameSyntax');
            break;
          }
        }
      }
    } else if (child instanceof tsdoc.DocBlockTag && child.excerpt) {
      _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-paramTagNameSyntax');
    }
  }
}

function _addDecorationsForInlineTag(
  decorations: ISyntaxDecoration[],
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
              _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-inlineDelimeterSyntax');
              break;
            }

          case 'tagName': {
            _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-inlineTagNameSyntax');
            break;
          }

          case 'linkText': {
            _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-linkTextSyntax');
            break;
          }
        }
      }
    } else if (child instanceof tsdoc.DocDeclarationReference) {
      _addDecorationsForDeclarationReference(decorations, child);
    }
  }
}

function _addDecorationsForDeclarationReference(
  decorations: ISyntaxDecoration[],
  inlineTag: tsdoc.DocDeclarationReference
): void {
  for (const child of inlineTag.getChildNodes()) {
    if (child instanceof tsdoc.DocParticle) {
      if (child.excerpt) {
        switch (child.particleId) {
          case 'packageName':
            {
              _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-packageNameSyntax');
              break;
            }

          case 'importHash': {
            _addTokensToDecorations(decorations, child.excerpt.content.tokens, 'tsdoc-inlineDelimeterSyntax');
            break;
          }
        }
      }
    } else if (child instanceof tsdoc.DocMemberReference) {
      // TODO: Colorize doc member reference
    }
  }
}

function _addTokensToDecorations(
  decorations: ISyntaxDecoration[],
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
