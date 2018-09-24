# @microsoft/tsdoc

This library is the reference implementation of a parser for the TSDoc syntax.  Using this library is an easy way to ensure that your tool is 100% compatible with the standard.

###  What is TSDoc?

**TSDoc** is a proposal to standardize the doc comments used in [TypeScript](http://www.typescriptlang.org/) source files.  It allows different tools to extract content from comments without getting confused by each other's syntax.   The **TSDoc** notation looks pretty familiar:

```typescript
export class Statistics {
  /**
   * Returns the average of two numbers.
   *
   * @remarks
   * This method is part of the {@link core-library#Statistics | Statistics subsystem}.
   *
   * @param x - The first input number
   * @param y - The second input number
   * @returns The arithmetic mean of `x` and `y`
   *
   * @beta
   */
  public static getAverage(x: number, y: number): number {
    return (x + y) / 2.0;
  }
}
```

## Get involved

The **TSDoc** project is under active development and evolving.  For up to date documentation and other background, please visit the project site:

https://github.com/Microsoft/tsdoc
