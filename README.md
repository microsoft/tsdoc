# TSDoc

> A doc comment standard for TypeScript


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

We are developing a library package [@microsoft/tsdoc](https://www.npmjs.com/package/@microsoft/tsdoc) that provides an open source reference implementation of a parser.  Using this library is an easy way to ensure that your tool is 100% compatible with the standard.

▶ ***Give it a try!**  The <a target="_blank" href="https://microsoft.github.io/tsdoc/">TSDoc Playground</a> provides an interactive showcase of our parser!*

###  Why do we need TSDoc?

This scenario originally arose from projects at Microsoft that are processed by multiple tools:

- [Visual Studio Code](https://code.visualstudio.com): an editor that supports syntax highlighting and interactive refactoring for TypeScript doc comments
- [TypeDoc](https://github.com/TypeStrong/typedoc): an API reference website generator that extracts its content from doc comments
- [DocFX](https://dotnet.github.io/docfx/):  an integrated pipeline that ingests API reference content for many different programming languages, but then applies its own Markdown renderer and custom tag parsing
- [API Extractor](https://aka.ms/extractor): a build tool that tracks TypeScript API review workflows and generates *.d.ts rollups for third-party SDKs

These are just examples.  Many other tools in today's web developer community want to interact with TypeScript doc comments.  Each of these tools accepts a syntax that is loosely based on [JSDoc](http://usejsdoc.org), but encounters frustrating incompatibilities when attempting to coexist with other parsers.

*Why can't JSDoc be the standard?*  Unfortunately the JSDoc grammar is not rigorously specified, but rather inferred from the behavior of a particular implementation.  The majority of the standard JSDoc tags are preoccupied with providing type annotations for plain JavaScript, which is an irrelevant concern for a strongly-typed language such as TypeScript.  **TSDoc** addresses these limitations while also tackling a more sophisticated set of goals.


### What are the goals?

The TSDoc specification aims to meet these requirements:

- **Designed for TypeScript**: ...while aligning as closely as possible with the familiar JSDoc notations we know and love.
- **Markdown integration**: Doc comments may incorporate [CommonMark](http://commonmark.org) notations for rich text elements such as boldface, code fences, headings, tables, etc.  (This turned out to be the toughest requirement, since the Markdown grammar is very irregular and very dependent on context.) TSDoc makes special accommodations for entrenched pipelines (e.g. GitHub Pages) that expect to bring their own Markdown renderer to the party.
- **Common core**: Common  tags such as `@param` and `@returns` will have consistent behavior across all tools.
- **Extensible**: Each tool can supplement the core tags with custom tags for specialized scenarios.
- **Interoperable**: The TSDoc standard guarantees that unsupported custom tags won't interfere with parsing of other content. TSDoc also eliminates Markdown ambiguities.  (Are backticks allowed inside a `{@link}` tag?  What happens if there is only one backtick? etc.)
- **Multi-package support**:  Many teams ship a collection of NPM packages that work together and are documented as a set.  The cross-referencing syntax (e.g. `{@link}` or `{@inheritdoc}`) needs a portable way to reference API items imported from other packages.  We also define  *package.json* metadata that enables tooling to detect whether a dependency's *.d.ts doc comments should be parsed as TSDoc or not.
- **Open standard**: TSDoc is an open source, community-driven standard.  You are encouraged to contribute your own ideas and pull requests.

The **@microsoft/tsdoc** library package brings in some additional goals:

- **"Strict" and "Lax" modes**: Many projects don’t have the time/desire to change their existing code, so they want a "*lax*" mode that makes a best attempt to render their doc comments as-is.  Other projects want a "*strict*" mode that ensures consistent syntax everywhere and catches typos that might result in rendering errors.  Some projects want to be "*strict*" eventually, but they can't migrate everything overnight; they need a "*transitional*" mode similar to tslint suppressions.
- **Comment-emitter for roundtripping**:  The parser reads doc comments as input and produces an abstract syntax tree (AST) as output.  This should be reversible:  given an AST input (possibly with modifications), the library can regenerate the corresponding doc comment.
- **Self-contained**: The implementation will be small, fast, and self-contained.  It will not have a dependency on the TypeScript compiler API.  Doc comments will be received as a plain text string, and the AST will be a simple JavaScript tree object.  This makes it easier for tools to accept **@microsoft/tsdoc** as a dependency.


### How do I get started with TSDoc?

NOTE: The **@microsoft/tsdoc** library is intended to be incorporated into other build tools that analyze TypeScript source code, such as the projects linked below.  (By itself, the TSDoc library is not a documentation tool that you can use directly.)

- Check out the [TSDoc Playground](https://microsoft.github.io/tsdoc/) for a cool interactive demo of TSDoc!  :-)
- The library [@microsoft/tsdoc](https://www.npmjs.com/package/@microsoft/tsdoc) provides a TSDoc parser that you can use in your own projects.  The source code for this library can be found in the [/tsdoc](./tsdoc/) folder.
- The [/api-demo](./api-demo/) folder has a small demo project illustrating how to invoke the **@microsoft/tsdoc** library.
- See [Contributing.md](./Contributing.md) for instructions for building, debugging, and contributing to TSDoc.
- We're using [GitHub issues](https://github.com/Microsoft/tsdoc/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) to discuss the TSDoc specification, library design, and project roadmap.


### Who's involved?

The collaborators currently driving the TSDoc standard are:

- [TypeScript](http://www.typescriptlang.org) compiler group at Microsoft
- [API Extractor](https://aka.ms/extractor) project owners
- [TypeDoc](http://typedoc.org) maintainers
- [DocFX](https://dotnet.github.io/docfx/) pipeline owners
- [SimplrJS](https://simplrjs.com/) developers, who maintain the [ts-docs-gen](https://github.com/SimplrJS/ts-docs-gen) tool
- [Tom Dale](https://github.com/tomdale), who's working on the documentation engine for [Ember.js](https://www.emberjs.com), [Glimmer.js](https://glimmerjs.com), and other projects
- [Rob Eisenberg](https://github.com/EisenbergEffect), who's working on the documentation engine for [Aurelia](http://aurelia.io/).


### Where are we on the roadmap?

**Already completed:**

- Write up all the interesting design questions as "RFC" GitHub issues to collect community feedback
- Arrive at an initial consensus on the basic approach and strategy for TSDoc
- Develop an initial feature-complete prototype of the **@microsoft/tsdoc** library and publish the NPM package
- Convert Microsoft's API Extractor tool to use **@microsoft/tsdoc** (replacing its proprietary AEDoc engine); this demonstrates that TSDoc can meet the needs of [a large production documentation web site](https://docs.microsoft.com/en-us/javascript/api/sp-core-library?view=sp-typescript-latest)

**What's next:**

- Write up an initial draft of the TSDoc spec document, which outlines the proposed standard
- Collect community feedback and integrate it into the draft, then publish the first "official" 1.0 spec
- Review the **@microsoft/tsdoc** API with various integrators, including TypeScript and VS Code
- Publish the first "1.0.0" stable release of the **@microsoft/tsdoc** package
- Help onboard various partners


##  Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
