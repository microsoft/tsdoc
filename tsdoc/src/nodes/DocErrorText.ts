import { DocNodeKind } from './DocNode';
import { DocNodeLeaf, IDocNodeLeafParameters } from './DocNodeLeaf';
import { TokenSequence } from '../parser/TokenSequence';

/**
 * Constructor parameters for {@link DocErrorText}.
 */
export interface IDocErrorTextParameters extends IDocNodeLeafParameters {
  text: string;
  errorMessage: string;
  errorLocation: TokenSequence;
}

/**
 * Represents a span of text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
export class DocErrorText extends DocNodeLeaf {
  /** {@inheritdoc} */
  public readonly kind: DocNodeKind = DocNodeKind.ErrorText;

  private _text: string | undefined;                  // never undefined after updateParameters()
  private _errorMessage: string | undefined;          // never undefined after updateParameters()
  private _errorLocation: TokenSequence | undefined;  // never undefined after updateParameters()

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocErrorTextParameters) {
    super(parameters);
  }

  /**
   * The characters that should be rendered as plain text because they
   * could not be parsed successfully.
   */
  public get text(): string {
    return this._text!;
  }

  /**
   * A description of why the character could not be parsed.
   */
  public get errorMessage(): string {
    return this._errorMessage!;
  }

  /**
   * The range of characters that caused the error.  In general these may be
   * somewhat farther ahead in the input stream from the DocErrorText node itself.
   *
   * @remarks
   * For example, for the malformed HTML tag `<a href="123" @ /a>`, the DocErrorText node
   * will correspond to the `<` character that looked like an HTML tag, whereas the
   * error location might be the `@` character that caused the trouble.
   */
  public get errorLocation(): TokenSequence {
    return this._errorLocation!;
  }

  /** @override */
  public updateParameters(parameters: IDocErrorTextParameters): void {
    super.updateParameters(parameters);

    this._text = parameters.text;
    this._errorMessage = parameters.errorMessage;
    this._errorLocation = parameters.errorLocation;
  }
}
