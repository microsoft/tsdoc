import { ParserContext } from './ParserContext';
import {
  DocNodeKind,
  DocBlockTag,
  DocComment,
  DocNode
} from '../nodes';
import {
  TSDocTagDefinition,
  TSDocParserConfiguration,
  TSDocTagSyntaxKind
} from './TSDocParserConfiguration';
import { ModifierTagSet } from '../details/ModifierTagSet';

/**
 * After the NodeParser has constructed the  ParserContext.verbatimSection,
 * the DocCommentAssembler reorganizes these nodes into a DocComment object.
 */
export class DocCommentAssembler {
  private _configuration: TSDocParserConfiguration;
  private _parserContext: ParserContext;
  private _docComment: DocComment;

  public constructor(parserContext: ParserContext) {
    this._parserContext = parserContext;
    this._configuration = parserContext.configuration;
    this._docComment = parserContext.docComment;
  }

  public assemble(): void {

    const modifierTagSet: ModifierTagSet = this._docComment.modifierTagSet;

    // Scan all the top-level nodes and weed out the modifier tags
    const prunedDocNodes: DocNode[] = [];

    for (const docNode of this._parserContext.verbatimSection.getChildNodes()) {

      switch (docNode.kind) {
        case DocNodeKind.BlockTag:
          const docBlockTag: DocBlockTag = docNode as DocBlockTag;
          // Do we have a definition for this tag?
          const tagDefinition: TSDocTagDefinition | undefined
            = this._configuration.tryGetTagDefinitionUpperCase(docBlockTag.tagNameForComparisons);
          if (tagDefinition) {
            if (tagDefinition.syntaxKind === TSDocTagSyntaxKind.ModifierTag) {
              modifierTagSet.addModifierTag(docBlockTag);
            }
          }
          break;
        default:
          prunedDocNodes.push(docNode);
          break;
      }
    }

    this._docComment.remarks.appendNodes(prunedDocNodes);
  }
}
