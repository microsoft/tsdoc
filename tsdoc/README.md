# @microsoft/tsdoc

This library is the reference implementation of a parser for the TSDoc syntax.  Using this library is an easy way to ensure that your tool is 100% compatible with the standard.

###  What is TSDoc?

**TSDoc** is a proposal to standardize the doc comments used in [TypeScript](http://www.typescriptlang.org/) source files.  It allows different tools to extract content from comments without getting confused by each other's syntax.   The **TSDoc** notation looks pretty familiar:

```typescript
/**
 * Adds two numbers together.
 *
 * @remarks
 * This method is part of the {@link core-libary/Math | Math subsystem}.
 *
 * @param x - The first number to add
 * @param y - The second number to add
 * @returns The sum of `x` and `y`
 *
 * @beta
 */
function add(x: number, y: number): number;
```

## Get involved

The **TSDoc** project is under active development and evolving.  For up to date documentation and other background, please visit the project site:

https://github.com/Microsoft/tsdoc

