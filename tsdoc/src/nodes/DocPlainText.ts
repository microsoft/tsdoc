import { DocNodeKind } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';

/**
 * Constructor parameters for {@link DocPlainText}.
 */
export interface IDocPlainTextParameters extends IDocNodeLeafParameters {
  text: string;
}

/**
 * Represents a span of comment text that is considered by the parser
 * to contain no special symbols or meaning.
 *
 * @remarks
 * The text content must not contain newline characters.
 * Use DocSoftBreak to represent manual line splitting.
 */
export class DocPlainText extends DocNodeLeaf {
  // TODO: We should also prohibit "\r", but this requires updating LineExtractor
  // to interpret a lone "\r" as a newline
  private static readonly _newlineCharacterRegExp: RegExp = /[\n]/;

  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.PlainText;

  /**
   * The text content.
   */
  public readonly text: string;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocPlainTextParameters) {
    super(parameters);
    if (DocPlainText._newlineCharacterRegExp.test(parameters.text)) {
      // Use DocSoftBreak to represent manual line splitting
      throw new Error('The DocPlainText content must not contain newline characters');
    }
    this.text = parameters.text;
  }
}
