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
//  *
//  * {@link ./lib/controls/Button:Button | referencing a local *.d.ts file}
//  */
//
// The optional components to the left of the ":" simply follow the standard rules of
// a TypeScript "import" definition, so we don't discuss them further in this file.
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
 * Shortest name:  {@link ClassA1}
 * Full name:      {@link ClassA1[class]}
 */
export class ClassA1 {
  /**
   * Shortest name:  {@link ClassA1.memberA2[instance]}
   * Full name:      {@link ClassA1[class].memberA2[instance]}
   */
  public memberA2(): void {
  }

  /**
   * Shortest name:  {@link ClassA1.memberA2[static]}
   * Full name:      {@link ClassA1[class].memberA2[static]}
   */
  public static memberA2(): void {
  }

  /**
   * Shortest name:  {@link ClassA1[constructor]}
   * Full name:      {@link ClassA1[constructor]}
   *
   * NOTE: ClassA1.constructor is NOT correct, because the constructor is NOT
   * a member of ClassA1.
   */
  public constructor() {
    console.log('Constructed ClassA1');
  }

  /**
   * Shortest name:  {@link ClassA1[class].constructor}
   * Also valid:     {@link ClassA1[class]."constructor"}
   * Full name:      {@link ClassA1[class].constructor[instance]}
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
 * Shortest name:  {@link B1.B2.B3}
 * Full name:      {@link B1[namespace].B2[namespace].B3[namespace]}
 */
export namespace B1.B2.B3 {
  /**
   * Shortest name:  {@link B1.B2.B3.functionB4}
   * Full name:      {@link B1[namespace].B2[namespace].B3[namespace].functionB4[function]}
   */
  export function functionB4(): void {
  }
}

//---------------------------------------------------------
// Function overloads

/**
 * Shortest name:  {@link functionC1[1]}
 * Full name:      {@link functionC1[1]}
 */
export function functionC1(y: number): number;

/**
 * Shortest name:  {@link functionC1[2]}
 * Full name:      {@link functionC1[2]}
 */
export function functionC1(x: string): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function functionC1(xy: string | number): string | number {
  return '';
}

//---------------------------------------------------------
// Function overloads using labels

/**
 * Shortest name:  {@link functionD1[WITH_NUMBERS]}
 * Full name:      {@link functionD1[WITH_NUMBERS]}
 *
 * {@label WITH_NUMBERS}
 */
export function functionD1(y: number): number;

/**
 * Shortest name:  {@link functionD1[WITH_LETTERS]}
 * Full name:      {@link functionD1[WITH_LETTERS]}
 *
 * {@label WITH_LETTERS}
 */
export function functionD1(x: string): string;

/**
 * Shortest name:  {@link functionD1[3]}
 * Full name:      {@link functionD1[3]}
 *
 * NOTE: If one label is omitted, the numeric indexers can still be used.
 */
export function functionD1(): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function functionD1(xy?: string | number): string | number {
  return '';
}

//---------------------------------------------------------
// Merged declarations

/**
 * Shortest name:  {@link MergedE1[class]}
 * Full name:      {@link MergedE1[class]}
 */
export class MergedE1 {

  /**
   * Shortest name:  {@link MergedE1[constructor]}
   * Full name:      {@link MergedE1[constructor]}
   *
   * NOTE: MergedE1 is also a namespace, so it seems like we need
   * `MergedE1[class,constructor]` or `MergedE1[class][constructor]`.
   * But only one selector is necessary because namespaces conveniently cannot
   * have constructors.
   */
  public constructor() {
    console.log('Constructed MergedE1 class');
  }

  /**
   * Shortest name:  {@link MergedE1[class].memberE2}
   * Full name:      {@link MergedE1[class].memberE2[instance]}
   *
   * NOTES:
   *
   * - The "[instance]" selector is optional because "MergedE1[class]" already
   *   eliminates any ambiguity.
   *
   * - Although "MergedE1.memberE2[instance]" is theoretically also an unambiguous notation,
   *   the TSDoc standard discourages that, because resolving it might require
   *   unbounded backtracking.
   */
  public memberE2(): void {
  }
}

/**
 * Shortest name:  {@link MergedE1[namespace]}
 * Full name:      {@link MergedE1[namespace]}
 */
export namespace MergedE1 {
  /**
   * Shortest name:  {@link MergedE1[namespace].memberE2}
   * Full name:      {@link MergedE1[namespace].memberE2[function]}
   */
  export function memberE2(): void {
  }
}

//---------------------------------------------------------
// Merged declarations with function overloads

/**
 * Shortest name:  {@link MergedF1[WITH_NUMBERS]}
 * Full name:      {@link MergedF1[WITH_NUMBERS]}
 *
 * {@label WITH_NUMBERS}
 */
export function MergedF1(y: number): number;

/**
 * Shortest name:  {@link MergedF1[2]}
 * Full name:      {@link MergedF1[2]}
 */
export function MergedF1(x: string): string;

// (MUST NOT have TSDoc, because this is the overload implementation)
export function MergedF1(xy: string | number): string | number {
  return '';
}

/**
 * Shortest name:  {@link MergedF1[namespace]}
 * Full name:      {@link MergedF1[namespace]}
 */
export namespace MergedF1 {
}

//---------------------------------------------------------
// Merged declarations with extension of the same thing

/**
 * Shortest name:  {@link MergedG1[interface]}
 * Full name:      {@link MergedG1[interface]}
 */
export interface MergedG1 {
  /**
   * Shortest name:  {@link MergedG1[interface].mergedG2}
   * Full name:      {@link MergedG1[interface].mergedG2}
   */
  mergedG2: string;
}

// (MUST NOT have TSDoc, because this augments an already documented interface)
export interface MergedG1 {
  /**
   * Shortest name:  {@link MergedG1[interface].mergedG3}
   * Full name:      {@link MergedG1[interface].mergedG3}
   */
  mergedG3: string;
}

/**
 * Shortest name:  {@link MergedG1[namespace]}
 * Full name:      {@link MergedG1[namespace]}
 */
export namespace MergedG1 {
  /**
   * Shortest name:  {@link MergedG1[namespace].mergedG2}
   * Full name:      {@link MergedG1[namespace].mergedG2}
   */
  export let mergedG2: string = '';
}

// (MUST NOT have TSDoc, because this augments an already documented interface)
export namespace MergedG1 {
  /**
   * Shortest name:  {@link MergedG1[namespace].mergedG3}
   * Full name:      {@link MergedG1[namespace].mergedG3}
   */
  export let mergedG3: string = '';
}


//---------------------------------------------------------
// Enum members

/**
 * Shortest name:  {@link EnumH1}
 * Full name:      {@link EnumH1[enum]}
 */
export const enum EnumH1 {
  /**
   * Shortest name:  {@link EnumH1.memberH2}
   * Full name:      {@link EnumH1[enum].memberH2}
   */
  memberH2
}

// (MUST NOT have TSDoc, because this augments an already documented enum)
export const enum EnumH1 {
  /**
   * Shortest name:  {@link EnumH1.memberH3}
   * Full name:      {@link EnumH1[enum].memberH3}
   */
  memberH3 = 3
}


//---------------------------------------------------------
// Malformed names

/**
 * Shortest name:  {@link ClassI1}
 * Full name:      {@link ClassI1[class]}
 */
export class ClassI1 {
  /**
   * Shortest name:  {@link ClassI1."abc. def"}
   * Full name:      {@link ClassI1[class]."abc. def"[static]}
   */
  public static 'abc. def': string = 'static member with malformed characters';

  /**
   * Shortest name:  {@link ClassI1."abc. def"}
   * Full name:      {@link ClassI1[class]."abc. def"[instance]}
   */
  public 'abc. def': string = 'instance member with malformed characters';

  /**
   * Shortest name:  {@link ClassI1.static}
   * Also valid:     {@link ClassI1."static"}
   * Full name:      {@link ClassI1[class].static[static]}
   */
  public static static: string = 'static member using keyword as name';

  /**
   * Shortest name:  {@link ClassI1."\uD842\uDFB7"}
   * Full name:      {@link ClassI1[class]."\uD842\uDFB7"[instance]}
   *
   * NOTE: The string in double quotes is parsed using JSON.parse(), which converts
   * this surrogate pair expression to the corresponding Unicode character.
   */
  public '𠮷': string = 'instance member using JSON unicode escapes';

  /**
   * Shortest name:  {@link ClassI1."\\\""}
   * Full name:      {@link ClassI1[class]."\\\""[instance]}
   *
   * Again, the string `"\\\""` is passed to JSON.parse().
   */
  public '\\"': string = 'instance member using JSON escapes';

  /**
   * Shortest name:  {@link ClassI1.\{\}}
   * JSON approach:  {@link ClassI1."\u007B\u007D"}
   * Full name:      {@link ClassI1[class].\{\}[instance]}
   *
   * NOTE: The closing curly brace is problematic because it is a TSDoc inline tag delimiter.
   * The "shortest name" solves this problem using TSDoc backslash escapes.  The "JSON approach"
   * instead uses JSON unicode escapes.  Both are valid, although the JSON approach is more likely
   * to be compatible with documentation parsers that are not TSDoc compliant.
   */
  public '{}': string = 'instance member using TSDoc delimiters';

  /**
   * Shortest name:  {@link ClassI1."1.5"}
   * Full name:      {@link ClassI1[class]."1.5"[instance]}
   *
   * Note that the actual JavaScript object key will become a string, so "1.5" is a correct
   * way to reference this item.
   */
  public 1.5: string = "a number as the key";
}

//---------------------------------------------------------
// Generic parameters are not part of the notation

/**
 * Shortest name:  {@link TypeJ1}
 * Full name:      {@link TypeJ1[type]}
 *
 * Note that "<T>" is never part of the declaration reference notation.
 * In the TypeScript language, signatures cannot be distinguished by generic parameters.
 */
export type TypeJ1<T> = T | Error;

//---------------------------------------------------------
// Operators must be selected using explicit labels

/**
 * Shortest name:  {@link InterfaceK1}
 * Full name:      {@link InterfaceK1[interface]}
 */
export interface InterfaceK1 {
  /**
   * Shortest name:  {@link InterfaceK1.operator[STRING_INDEXER]}
   * Full name:      {@link InterfaceK1[interface].operator[STRING_INDEXER]}
   *
   * {@label STRING_INDEXER}
   */
  [key: string]: number;

  /**
   * Shortest name:  {@link InterfaceK1.operator[NUMBER_INDEXER]}
   * Full name:      {@link InterfaceK1[interface].operator[NUMBER_INDEXER]}
   *
   * {@label NUMBER_INDEXER}
   */
  [key: number]: number;

  /**
   * Shortest name:  {@link InterfaceK1.operator[FUNCTOR]}
   * Full name:      {@link InterfaceK1[interface].operator[FUNCTOR]}
   *
   * {@label FUNCTOR}
   */
  (source: string, subString: string): boolean;

  /**
   * Shortest name:  {@link InterfaceK1.operator[CONSTRUCTOR]}
   * Full name:      {@link InterfaceK1[interface].operator[CONSTRUCTOR]}
   *
   * {@label CONSTRUCTOR}
   */
  new (hour: number, minute: number);
}
