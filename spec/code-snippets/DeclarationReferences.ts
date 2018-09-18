// TSDoc "declaration references" provide a straightforward and unambiguous notation
// for referencing other API declarations such as classes, member functions, enum values,
// etc.  It is used with standard TSDoc tags such as {@link} and {@inheritDoc}.
//
// The full declaration reference syntax supports declarations that are imported from
// another NPM package, optionally with an NPM scope, optionally with an explicit
// import path.
//
// For example:
//
// /**
//  * {@link @my-scope/my-package/path1/path2:namespace1.namespace2.MyClass.myMember
//  * | a complex example}
//  */
//
// The optional components to the left of the ":" simply follow the standard rules of
// a TypeScript "import" definition, so we don't discuss them further here.
//
// TSDoc declaration references are always resolved relative to a specific entry point
// (NOT relative to the current source file or declaration scope).  Thus, their syntax
// is independent of where the reference occurs within a given package.  For example,
// when referring to "MyClass.methodA" below, we may want to shorten it to "methodA"
// (since the meaning seems clear from context), but TSDoc standard does not allow that.
// "MyClass.methodA" is the shortest allowable name:
//
// export class MyClass {
//   public methodA(): void {
//   }
//
//   /**
//    * CORRECT:     {@link MyClass.methodA}
//    * NOT CORRECT: {@link methodA}
//    */
//   public methodB(): void {
//   }
// }
//
// Requiring fully scoped names ensures that documentation processors can resolve links
// efficiently and without access to a compiler analysis.  (For this document, it means
// all our examples can be simple self-references, since cross-references would look the same.)
//
// The most interesting feature of this syntax is the "[]" selector, which has these properties:
//
// - It is used to disambiguate an already traversed node (e.g. choosing a function overload)
//
// - It is NEVER used to traverse into a new node (e.g. we write MyClass."member with spaces"
//   instead of MyClass["member with spaces"]
//
// - For classes, the supported selectors are "[instance]", "[static]", or "[constructor]"
//
// - For merged declarations, the supported selectors are "[class]", "[enum]", "[function]",
//   "[interface]", "[namespace]", "[type]", or "[variable]"
//
// - When selecting a user-defined label (e.g. "[WITH_NUMBERS]") the label must be
//   all capitals, which ensures that it cannot conflict with a TSDoc reserved name such
//   as "class".


//---------------------------------------------------------
// Static vs instance members

/**
 * Shortest name:  {@link Class00}
 * Full name:      {@link Class00[class]}
 */
export class Class00 {
  /**
   * Shortest name:  {@link Class00.member01[instance]}
   * Full name:      {@link Class00[class].member01[instance]}
   */
  public member01(): void {
  }

  /**
   * Shortest name:  {@link Class00.member01[static]}
   * Full name:      {@link Class00[class].member01[static]}
   */
  public static member01(): void {
  }

  /**
   * Shortest name:  {@link Class00[constructor]}
   * Full name:      {@link Class00[constructor]}
   *
   * NOTE: Class00.constructor is NOT correct, because the constructor is NOT
   * a member of Class00.
   */
  public constructor() {
    console.log('Constructed Class00');
  }

  /**
   * Shortest name:  {@link Class00[class].constructor}
   * Also valid:     {@link Class15."constructor"}
   * Full name:      {@link Class00[class].constructor[instance]}
   *
   * NOTE: This is NOT the class constructor, but rather a property
   * whose name confusingly uses a keyword.
   */
  public get constructor(): string {
    return 'hello';
  }
}

//---------------------------------------------------------
// Nesting namespaces

/**
 * Shortest name:  {@link N02.N03.N04}
 * Full name:      {@link N02[namespace].N03[namespace].N04[namespace]}
 */
export namespace N02.N03.N04 {
  /**
   * Shortest name:  {@link N02.N03.N04.function05}
   * Full name:      {@link N02[namespace].N03[namespace].N04[namespace].function05[function]}
   */
  export function function05(): void {
  }
}

//---------------------------------------------------------
// Function overloads

/**
 * Shortest name:  {@link function06[1]}
 * Full name:      {@link function06[1]}
 */
export function function06(y: number): number;

/**
 * Shortest name:  {@link function06[2]}
 * Full name:      {@link function06[2]}
 */
export function function06(x: string): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function function06(xy: string | number): string | number {
  return '';
}

//---------------------------------------------------------
// Function overloads using labels

/**
 * Shortest name:  {@link function07[WITH_NUMBERS]}
 * Full name:      {@link function07[WITH_NUMBERS]}
 *
 * {@label WITH_NUMBERS}
 */
export function function07(y: number): number;

/**
 * Shortest name:  {@link function07[WITH_LETTERS]}
 * Full name:      {@link function07[WITH_LETTERS]}
 *
 * {@label WITH_LETTERS}
 */
export function function07(x: string): string;

/**
 * Shortest name:  {@link function07[3]}
 * Full name:      {@link function07[3]}
 *
 * NOTE: If one label is omitted, the numeric indexers can still be used.
 */
export function function07(): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function function07(xy?: string | number): string | number {
  return '';
}

//---------------------------------------------------------
// Merged declarations

/**
 * Shortest name:  {@link Merged08[class]}
 * Full name:      {@link Merged08[class]}
 */
export class Merged08 {

  /**
   * Shortest name:  {@link Merged08[constructor]}
   * Full name:      {@link Merged08[constructor]}
   *
   * NOTE: Merged08 is also a namespace, so it seems like we need
   * `Merged08[class,constructor]` or `Merged08[class][constructor]`.
   * But only one selector is necessary because namespaces conveniently cannot
   * have constructors.
   */
  public constructor() {
    console.log('Constructed Merged08 class');
  }

  /**
   * Shortest name:  {@link Merged08[class].member09}
   * Full name:      {@link Merged08[class].member09[instance]}
   *
   * NOTES:
   *
   * - The "[instance]" selector is optional because "Merged08[class]" already
   *   eliminates any ambiguity.
   *
   * - Although "Merged08.member09[instance]" is theoretically also an unambiguous notation,
   *   the TSDoc standard discourages that, because resolving it might require
   *   unbounded backtracking.
   */
  public member09(): void {
  }
}

/**
 * Shortest name:  {@link Merged08[namespace]}
 * Full name:      {@link Merged08[namespace]}
 */
export namespace Merged08 {
  /**
   * Shortest name:  {@link Merged08[namespace].member09}
   * Full name:      {@link Merged08[namespace].member09[function]}
   */
  export function member09(): void {
  }
}

//---------------------------------------------------------
// Merged declarations with function overloads

/**
 * Shortest name:  {@link Merged10[WITH_NUMBERS]}
 * Full name:      {@link Merged10[WITH_NUMBERS]}
 *
 * {@label WITH_NUMBERS}
 */
export function Merged10(y: number): number;

/**
 * Shortest name:  {@link Merged10[2]}
 * Full name:      {@link Merged10[2]}
 */
export function Merged10(x: string): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function Merged10(xy: string | number): string | number {
  return '';
}

/**
 * Shortest name:  {@link Merged10[namespace]}
 * Full name:      {@link Merged10[namespace]}
 */
export namespace Merged10 {
}

//---------------------------------------------------------
// Merged declarations with extension of the same thing

/**
 * Shortest name:  {@link Merged11[interface]}
 * Full name:      {@link Merged11[interface]}
 */
export interface Merged11 {
  /**
   * Shortest name:  {@link Merged11[interface].x}
   * Full name:      {@link Merged11[interface].x}
   */
  x: string;
}

// (MUST NOT have TSDoc, because this augments an already documented interface)
export interface Merged11 {
  /**
   * Shortest name:  {@link Merged11[interface].y}
   * Full name:      {@link Merged11[interface].y}
   */
  y: string;
}

/**
 * Shortest name:  {@link Merged11[namespace]}
 * Full name:      {@link Merged11[namespace]}
 */
export namespace Merged11 {
  /**
   * Shortest name:  {@link Merged11[namespace].x}
   * Full name:      {@link Merged11[namespace].x}
   */
  export let x: string = '';
}

// (MUST NOT have TSDoc, because this augments an already documented interface)
export namespace Merged11 {
  /**
   * Shortest name:  {@link Merged11[namespace].y}
   * Full name:      {@link Merged11[namespace].y}
   */
  export let y: string = '';
}


//---------------------------------------------------------
// Enum members

/**
 * Shortest name:  {@link Enum12}
 * Full name:      {@link Enum12[enum]}
 */
export const enum Enum12 {
  /**
   * Shortest name:  {@link Enum12.member13}
   * Full name:      {@link Enum12[enum].member13}
   */
  member13
}

// (MUST NOT have TSDoc, because this augments an already documented enum)
export const enum Enum12 {
  /**
   * Shortest name:  {@link Enum12.member14}
   * Full name:      {@link Enum12[enum].member14}
   */
  member14 = 14
}


//---------------------------------------------------------
// Malformed names

/**
 * Shortest name:  {@link Class15}
 * Full name:      {@link Class15[class]}
 */
export class Class15 {
  /**
   * Shortest name:  {@link Class15."abc. def"}
   * Full name:      {@link Class15[class]."abc. def"[static]}
   */
  public static 'abc. def': string = 'static member with malformed characters';

  /**
   * Shortest name:  {@link Class15."abc. def"}
   * Full name:      {@link Class15[class]."abc. def"[instance]}
   */
  public 'abc. def': string = 'instance member with malformed characters';

  /**
   * Shortest name:  {@link Class15.static}
   * Also valid:     {@link Class15."static"}
   * Full name:      {@link Class15[class].static[static]}
   */
  public static static: string = 'static member using keyword as name';

  /**
   * Shortest name:  {@link Class15."\uD842\uDFB7"}
   * Full name:      {@link Class15[class]."\uD842\uDFB7"[instance]}
   *
   * NOTE: The string in double quotes is parsed using JSON.parse(), which converts
   * this surrogate pair expression to the corresponding Unicode character.
   */
  public '𠮷': string = 'instance member using JSON unicode escapes';

  /**
   * Shortest name:  {@link Class15."\\\""}
   * Full name:      {@link Class15[class]."\\\""[instance]}
   *
   * Again, the string `"\\\""` is passed to JSON.parse().
   */
  public '\\"': string = 'instance member using JSON escapes';

  /**
   * Shortest name:  {@link Class15.\{\}}
   * JSON approach:  {@link Class15."\u007B\u007D"}
   * Full name:      {@link Class15[class].\{\}[instance]}
   *
   * NOTE: The closing curly brace is problematic because it is a TSDoc inline tag delimiter.
   * The "shortest name" solves this problem using TSDoc backslash escapes.  The "JSON approach"
   * instead uses JSON unicode escapes.  Both are valid, although the JSON approach is more likely
   * to be compatible with documentation parsers that are not TSDoc compliant.
   */
  public '{}': string = 'instance member using TSDoc delimiters';

  /**
   * Shortest name:  {@link Class15."1.5"}
   * Full name:      {@link Class15[class]."1.5"[instance]}
   *
   * Note that the actual JavaScript object key will become a string, so "1.5" is a correct
   * way to reference this item.
   */
  public 1.5: string = "a number as the key";
}

//---------------------------------------------------------
// Generic parameters are not part of the notation

/**
 * Shortest name:  {@link Type16}
 * Full name:      {@link Type16[type]}
 *
 * Note that "<T>" is never part of the declaration reference notation.
 * In the TypeScript language, signatures cannot be distinguished by generic parameters.
 */
export type Type16<T> = T | Error;

//---------------------------------------------------------
// Operators must be selected using explicit labels

/**
 * Shortest name:  {@link Interface17}
 * Full name:      {@link Interface17[interface]}
 */
export interface Interface17 {
  /**
   * Shortest name:  {@link Interface17.operator[STRING_INDEXER]}
   * Full name:      {@link Interface17[interface].operator[STRING_INDEXER]}
   *
   * {@label STRING_INDEXER}
   */
  [key: string]: number;

  /**
   * Shortest name:  {@link Interface17.operator[NUMBER_INDEXER]}
   * Full name:      {@link Interface17[interface].operator[NUMBER_INDEXER]}
   *
   * {@label NUMBER_INDEXER}
   */
  [key: number]: number;

  /**
   * Shortest name:  {@link Interface17.operator[FUNCTOR]}
   * Full name:      {@link Interface17[interface].operator[FUNCTOR]}
   *
   * {@label FUNCTOR}
   */
  (source: string, subString: string): boolean;

  /**
   * Shortest name:  {@link Interface17.operator[CONSTRUCTOR]}
   * Full name:      {@link Interface17[interface].operator[CONSTRUCTOR]}
   *
   * {@label CONSTRUCTOR}
   */
  new (hour: number, minute: number);
}

