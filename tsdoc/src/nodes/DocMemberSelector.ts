import { DocNodeKind, DocNode, IDocNodeParsedParameters, IDocNodeParameters } from './DocNode';
import { StringChecks } from '../parser/StringChecks';
import { TokenSequence } from '../parser/TokenSequence';
import { DocExcerpt, ExcerptKind } from './DocExcerpt';

/**
 * Kinds of TSDoc selectors.
 */
export enum SelectorKind {
  /**
   * Used in cases where the parser encounters a string that is incorrect but
   * valid enough that a DocMemberSelector node was created.
   */
  Error = 'error',

  /**
   * System selectors are always all lower-case and belong to a set of predefined label names.
   */
  System = 'system',

  /**
   * Index selectors are integer numbers.  They provide an alternative way of referencing
   * overloaded functions, based on the order in which the declarations appear in
   * a source file.
   *
   * @remarks
   * Warning:  Index selectors are not recommended; they are intended to provide a temporary
   * workaround for situations where an external library neglected to declare a `{@label}` tag
   * and cannot be easily fixed.
   */
  Index = 'index',

  /**
   * Label selectors refer to labels created using the `{@label}` TSDoc tag.
   * The labels are always comprised of upper-case letters or numbers separated by underscores,
   * and the first character cannot be a number.
   */
  Label = 'label'
}

/**
 * Constructor parameters for {@link DocMemberSelector}.
 */
export interface IDocMemberSelectorParameters extends IDocNodeParameters {
  selector: string;
}

/**
 * Constructor parameters for {@link DocMemberSelector}.
 */
export interface IDocMemberSelectorParsedParameters extends IDocNodeParsedParameters {
  selectorExcerpt: TokenSequence;
}

/**
 */
export class DocMemberSelector extends DocNode {
  private static readonly _likeIndexSelectorRegExp: RegExp = /^[0-9]/;

  private static readonly _indexSelectorRegExp: RegExp = /^(0|[1-9][0-9]*)$/;

  private static readonly _likeLabelSelectorRegExp: RegExp = /^[A-Z_]/u;

  private static readonly _labelSelectorRegExp: RegExp = /^[A-Z_][A-Z0-9_]+$/;

  private static readonly _likeSystemSelectorRegExp: RegExp = /^[a-z]+$/u;

  private readonly _selector: string;
  private _selectorExcerpt: DocExcerpt | undefined;

  private readonly _selectorKind: SelectorKind;

  private readonly _errorMessage: string | undefined;

  /**
   * Don't call this directly.  Instead use {@link TSDocParser}
   * @internal
   */
  public constructor(parameters: IDocMemberSelectorParameters | IDocMemberSelectorParsedParameters) {
    super(parameters);

    if (DocNode.isParsedParameters(parameters)) {
      this._selectorExcerpt = new DocExcerpt({
        configuration: this.configuration,
        excerptKind: ExcerptKind.MemberSelector,
        content: parameters.selectorExcerpt
      });

      this._selector = parameters.selectorExcerpt.toString();
    } else {
      this._selector = parameters.selector;
    }

    this._selectorKind = SelectorKind.Error;
    this._errorMessage = undefined;

    // The logic below will always either (1) assign selectorKind or (2) else assign an errorMessage

    if (this._selector.length === 0) {
      this._errorMessage = 'The selector cannot be an empty string';
    } else if (DocMemberSelector._likeIndexSelectorRegExp.test(this._selector)) {
      // It looks like an index selector

      if (DocMemberSelector._indexSelectorRegExp.test(this._selector)) {
        this._selectorKind = SelectorKind.Index;
      } else {
        this._errorMessage = 'If the selector begins with a number, it must be a positive integer value';
      }
    } else if (DocMemberSelector._likeLabelSelectorRegExp.test(this._selector)) {
      // It looks like a label selector

      if (DocMemberSelector._labelSelectorRegExp.test(this._selector)) {
        this._selectorKind = SelectorKind.Label;
      } else {
        this._errorMessage =
          'A label selector must be comprised of upper case letters, numbers,' +
          ' and underscores and must not start with a number';
      }
    } else {
      if (StringChecks.isSystemSelector(this._selector)) {
        this._selectorKind = SelectorKind.System;
      } else if (DocMemberSelector._likeSystemSelectorRegExp.test(this._selector)) {
        // It looks like a system selector, but is not
        this._errorMessage =
          `The selector ${JSON.stringify(this._selector)}` +
          ` is not a recognized TSDoc system selector name`;
      } else {
        // It doesn't look like anything we recognize
        this._errorMessage = 'Invalid syntax for selector';
      }
    }
  }

  /** @override */
  public get kind(): DocNodeKind | string {
    return DocNodeKind.MemberSelector;
  }

  /**
   * The text representation of the selector.
   *
   * @remarks
   * For system selectors, it will be a predefined lower case name.
   * For label selectors, it will be an upper case name defined using the `{@label}` tag.
   * For index selectors, it will be a positive integer.
   */
  public get selector(): string {
    return this._selector;
  }

  /**
   * Indicates the kind of selector.
   */
  public get selectorKind(): SelectorKind {
    return this._selectorKind;
  }

  /**
   * If the `selectorKind` is `SelectorKind.Error`, this string will be defined and provide
   * more detail about why the string was not valid.
   */
  public get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  /** @override */
  protected onGetChildNodes(): ReadonlyArray<DocNode | undefined> {
    return [this._selectorExcerpt];
  }
}
