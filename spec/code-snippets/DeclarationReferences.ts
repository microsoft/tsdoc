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
// The optional components to the left of the ":" most follow the standard rules of
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
// efficiently and without access to a compiler analysis.  (And for this document, it means
// we only need to give examples of simple self-references, since cross-references would
// use identical notation.)
//
// The most interesting feature of this syntax is the "[]" selector, which has these properties:
//
// - It is used in the absence of a TypeScript name, or to choose between things that have
//   the same name.
//
// - The value in brackets is never a TypeScript identifier.  In particular we always write
//   MyClass."member with spaces" instead of MyClass["member with spaces"].
//
// - For members of classes, the system-defined selectors are "[instance]" and "[static]"
//
// - For members of interfaces and enums, there are no system-defined selectors.
//
// - For merged declarations, the system-defined selectors are "[class]", "[enum]", "[function]",
//   "[interface]", "[namespace]", "[type]", or "[variable]"
//
// - Class constructors use a special "[constructor]" selector that applies to the class itself.
//
// - User-defined selectors are created using the {@label} tag.  The label must be all capitals
//   (e.g. "[WITH_NUMBERS]") to avoid conflicts with system-defined selectors.


//---------------------------------------------------------
// Static vs instance members

/**
 * Shortest name:  {@link ClassA1}
 * Full name:      {@link ClassA1[class]}
 */
export class ClassA1 {
  /**
   * Shortest name:  {@link ClassA1.memberA2}
   * Full name:      {@link ClassA1[class].memberA2[instance]}
   */
  public memberA2(): void {
  }

  /**
   * Shortest name:  {@link ClassA1.memberA3[instance]}
   * Full name:      {@link ClassA1[class].memberA3[instance]}
   *
   * NOTE: Here we cannot omit "[instance]" because there is a static member
   * with the same name.
   */
  public memberA3(): void {
  }

  /**
   * Shortest name:  {@link ClassA1.memberA3[static]}
   * Full name:      {@link ClassA1[class].memberA3[static]}
   */
  public static memberA3(): void {
  }

  /**
   * Shortest name:  {@link ClassA1[constructor]}
   * Full name:      {@link ClassA1[constructor]}
   *
   * NOTE: "ClassA1.constructor" is NOT correct.  That would refer to a regular
   * member whose name is "constructor".
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
// Function overloads using indexes (NOT RECOMMENDED)
//
// Generally we recommend to define labels, as shown with functionD1() below.
// Numeric indexes should only be used e.g. if you are consuming a library that
// doesn't define labels, and you cannot easily fix that library.

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
   *
   * NOTE: The full name doesn't have an additional selector, because interface
   * members are unambiguous (except for operators and function overloads, which
   * use labels).
   */
  mergedG2: string;
}

// (MUST NOT have TSDoc, because this is part of an interface that was already
// documented above.)
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

// (MUST NOT have TSDoc, because this is part of a namespace that was already
// documented above.)
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

// (MUST NOT have TSDoc, because this is part of an enum that was already
// documented above.)
export const enum EnumH1 {
  /**
   * Shortest name:  {@link EnumH1.memberH3}
   * Full name:      {@link EnumH1[enum].memberH3}
   */
  memberH3 = 3
}

//---------------------------------------------------------
// Property getters/setters

/**
 * Shortest name:  {@link ClassI1}
 * Full name:      {@link ClassI1[class]}
 */
export class ClassI1 {
  private _title: string;

  /**
   * Shortest name:  {@link ClassI1.title}
   * Full name:      {@link ClassI1[class].title[instance]}
   */
  public get title(): string {
    return this._title;
  }

  // (MUST NOT have TSDoc, because this is part of a property that was already
  // documented above.)
  public set title(value: string) {
    this._title = value;
  }
}


//---------------------------------------------------------
// Malformed names
//
// These cases seem exotic, but they often arise when declaring a TypeScript interface
// that describes a REST response.

/**
 * Shortest name:  {@link InterfaceJ1}
 * Full name:      {@link InterfaceJ1[interface]}
 */
export interface InterfaceJ1 {
  /**
   * Shortest name:  {@link InterfaceJ1."abc. def"}
   * Full name:      {@link InterfaceJ1[interface]."abc. def"[static]}
   */
  'abc. def': string;

  /**
   * Shortest name:  {@link InterfaceJ1."\"'"}
   * Full name:      {@link InterfaceJ1[interface]."\"'"}
   *
   * Here the declaration references use double quotes, whereas the TypeScript uses
   * single quotes, so the backslash gets swapped.
   */
  '"\'': string;

  /**
   * Shortest name:  {@link InterfaceJ1."&lbrace;\\&rbrace;"}
   * Full name:      {@link InterfaceJ1[interface]."\"&lbrace;\\&rbrace;"}
   *
   * This example has problematic characters that affect two different encoding layers.
   * The original string is `{\}`.  Declaration reference notation uses double quotes and
   * backslash escaping, so the quoted string becomes `"{\\}"`.  The declaration reference
   * itself is thus `InterfaceJ1."{\\}"`.  But then we embed it in a `{@link}` tag,
   * which uses `}` as a delimiter and HTML character entities for escaping.  This changes
   * the curly braces to `&lbrace;` and `&rbrace;`.
   */
  '{\\}': string;

  /**
   * Shortest name:  {@link InterfaceJ1."&amp;copy;"}
   * Full name:      {@link InterfaceJ1[interface]."&amp;copy;"}
   *
   * Markdown supports HTML character entities, so TSDoc also supports them.  In this example
   * we need to escape the ampersand to avoid misinterpreting the string as a copyright symbol.
   */
  '&copy;': string;


  /**
   * Shortest name:  {@link InterfaceJ1."1.5"}
   * Full name:      {@link InterfaceJ1[interface]."1.5"}
   *
   * Note that the actual JavaScript object key will become a string, so "1.5" is a correct
   * way to reference this item.  This is a bad practice that nobody should be using, but
   * our notation handles it just fine.
   */
  1.5: string; //a number as the key
}

/**
 * Shortest name:  {@link ClassJ2}
 * Full name:      {@link ClassJ2[class]}
 */
export class ClassJ2 {
  /**
   * Shortest name:  {@link ClassJ2.static}
   * Also valid:     {@link ClassJ2."static"}
   * Full name:      {@link ClassJ2[class].static}
   */
  public static static: string = 'static member using keyword as name';

  /**
   * Shortest name:  {@link InterfaceJ1."𠮷"}
   * Full name:      {@link InterfaceJ1[interface]."𠮷"}
   *
   * NOTE: In TypeScript some characters require quotes, some do not.
   * TSDoc should follow the same rules as TypeScript in this regard.
   */
  public '𠮷': string = 'instance member using a Unicode surrogate pair';

  /**
   * Shortest name:  {@link InterfaceJ1.spaß}
   * Full name:      {@link InterfaceJ1[interface].spaß}
   */
  public spaß: string = 'international characters that do not require quotes';
}

//---------------------------------------------------------
// Generic parameters are ignored by the notation.

/**
 * Shortest name:  {@link TypeK1}
 * Full name:      {@link TypeK1[type]}
 *
 * Note that "<T>" is never part of the declaration reference notation.
 * In the TypeScript language, signatures cannot be distinguished by generic parameters.
 */
export type TypeK1<T> = T | Error;

//---------------------------------------------------------
// Operators must always be selected using user-defined labels.

/**
 * Shortest name:  {@link InterfaceL1}
 * Full name:      {@link InterfaceL1[interface]}
 */
export interface InterfaceL1 {
  /**
   * Shortest name:  {@link InterfaceL1.operator[STRING_INDEXER]}
   * Full name:      {@link InterfaceL1[interface].operator[STRING_INDEXER]}
   *
   * {@label STRING_INDEXER}
   */
  [key: string]: number;

  /**
   * Shortest name:  {@link InterfaceL1.operator[NUMBER_INDEXER]}
   * Full name:      {@link InterfaceL1[interface].operator[NUMBER_INDEXER]}
   *
   * {@label NUMBER_INDEXER}
   */
  [key: number]: number;

  /**
   * Shortest name:  {@link InterfaceL1.operator[FUNCTOR]}
   * Full name:      {@link InterfaceL1[interface].operator[FUNCTOR]}
   *
   * {@label FUNCTOR}
   */
  (source: string, subString: string): boolean;

  /**
   * Shortest name:  {@link InterfaceL1.operator[CONSTRUCTOR]}
   * Full name:      {@link InterfaceL1[interface].operator[CONSTRUCTOR]}
   *
   * {@label CONSTRUCTOR}
   */
  new (hour: number, minute: number);
}
