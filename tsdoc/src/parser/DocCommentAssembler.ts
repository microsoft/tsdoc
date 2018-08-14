import { ParserContext } from './ParserContext';
import {
  DocBlock,
  DocNodeKind,
  DocBlockTag,
  DocComment,
  DocNode,
  DocParamBlock,
  DocSection
} from '../nodes';
import {
  TSDocTagDefinition,
  TSDocParserConfiguration,
  TSDocTagSyntaxKind
} from './TSDocParserConfiguration';
import { ModifierTagSet } from '../details/ModifierTagSet';
import { CoreTags } from '../details/CoreTags';

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
    const blocks: DocBlock[] = this._collectBlocks();
    this._arrangeBlocks(blocks);
  }

  private _collectBlocks(): DocBlock[] {
    const modifierTagSet: ModifierTagSet = this._docComment.modifierTagSet;

    const summaryNodes: DocNode[] = [];

    const blocks: DocBlock[] = [];
    let currentBlock: DocBlock | undefined = undefined;

    for (const docNode of this._parserContext.verbatimSection.getChildNodes()) {

      let skipNode: boolean = false;

      switch (docNode.kind) {
        case DocNodeKind.BlockTag:
          const docBlockTag: DocBlockTag = docNode as DocBlockTag;
          // Do we have a definition for this tag?
          const tagDefinition: TSDocTagDefinition | undefined
            = this._configuration.tryGetTagDefinitionWithUpperCase(docBlockTag.tagNameWithUpperCase);
          if (tagDefinition) {
            switch (tagDefinition.syntaxKind) {
              case TSDocTagSyntaxKind.BlockTag:
                // This is a block tag, so start a new block
                currentBlock = new DocBlock({
                  blockTag: docBlockTag
                });
                skipNode = true;
                blocks.push(currentBlock);
                break;
              case TSDocTagSyntaxKind.ModifierTag:
                // The block tag was recognized as a modifier, so add it to the modifier tag set
                modifierTagSet.addModifierTag(docBlockTag);
                skipNode = true;
                break;
            }
          }
          break;
      }

      if (!skipNode) {
        if (currentBlock) {
          currentBlock.appendNode(docNode);
        } else {
          summaryNodes.push(docNode);
        }
      }
    }

    // TODO: If there is no "@remarks" block, then we could treat the first non-trivial DocParagraph
    // as the summary, and the rest as the remarks.
    this._docComment.summarySection.appendNodes(summaryNodes);
    return blocks;
  }

  private _arrangeBlocks(blocks: DocBlock[]): void {
    // Now sift the blocks into normal and "custom" blocks
    for (const block of blocks) {
      switch (block.blockTag.tagNameWithUpperCase) {
        case CoreTags.remarks.tagNameWithUpperCase:
          this._docComment.remarksBlock = block;
          break;
          case CoreTags.param.tagNameWithUpperCase:
          this._docComment.paramBlocks.push(this._constructParamBlock(block));
          break;
        case CoreTags.returns.tagNameWithUpperCase:
          this._docComment.returnsBlock = block;
          break;
        default:
          this._docComment.appendCustomBlock(block);
      }
    }
  }

  private _constructParamBlock(block: DocBlock): DocParamBlock {
    const paramBlock: DocParamBlock = new DocParamBlock({
      excerpt: block.excerpt,
      parameterName: block.blockTag.tagName
    });
    paramBlock.appendNodes(block.nodes);
    return paramBlock;
  }

}
