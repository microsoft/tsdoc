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

  /** {@inheritDoc} */
  public readonly kind: DocNodeKind = DocNodeKind.PlainText;

  private _text: string | undefined;  // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocPlainTextParameters) {
    super(parameters);
  }

  /**
   * The text content.
   */
  public get text(): string {
    return this._text!;
  }

  /** @override */
  public updateParameters(parameters: IDocPlainTextParameters): void {
    if (DocPlainText._newlineCharacterRegExp.test(parameters.text)) {
      // Use DocSoftBreak to represent manual line splitting
      throw new Error('The DocPlainText content must not contain newline characters');
    }

    super.updateParameters(parameters);

    this._text = parameters.text;
  }
}
