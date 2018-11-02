import { DocNodeKind, DocNode, IDocNodeParsedParameters } from './DocNode';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Constructor parameters for {@link DocErrorText}.
 */
export interface IDocErrorTextParsedParameters extends IDocNodeParsedParameters {
  textExcerpt: TokenSequence;

  errorMessage: string;
  errorLocation: TokenSequence;
}

/**
 * Represents a span of text that contained invalid markup.
 * The characters should be rendered as plain text.
 */
export class DocErrorText extends DocNode {
  private _text: string | undefined;
  private readonly _textExcerpt: DocExcerpt;

  private readonly _errorMessage: string;
  private readonly _errorLocation: TokenSequence;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocErrorTextParsedParameters) {
    super(parameters);

    this._textExcerpt = new DocExcerpt({
      configuration: this.configuration,
      excerptKind: ExcerptKind.ErrorText,
      content: parameters.textExcerpt
    });

    this._errorMessage = parameters.errorMessage;
    this._errorLocation = parameters.errorLocation;
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.ErrorText;
  }

  /**
   * The characters that should be rendered as plain text because they
   * could not be parsed successfully.
   */
  public get text(): string {
    if (this._text === undefined) {
      this._text = this._textExcerpt.content.toString();
    }
    return  this._text;
  }

  public get textExcerpt(): TokenSequence | undefined {
    if (this._textExcerpt) {
      return this._textExcerpt.content;
    } else {
      return undefined;
    }
  }

  /**
   * A description of why the character could not be parsed.
   */
  public get errorMessage(): string {
    return this._errorMessage;
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
    return this._errorLocation;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [
      this._textExcerpt
    ];
  }
}
