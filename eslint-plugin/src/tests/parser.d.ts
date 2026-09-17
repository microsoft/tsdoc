// The `@typescript-eslint/parser` package ships its types via a `package.json` "exports"
// map, which this project's "classic" module resolution cannot follow.  It is only used at
// runtime by the RuleTester, so an ambient declaration is sufficient here.
declare module '@typescript-eslint/parser' {
  import type { Linter } from 'eslint';
  const parser: Linter.Parser;
  export = parser;
}
