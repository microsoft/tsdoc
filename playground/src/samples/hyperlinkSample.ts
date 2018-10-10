/**
 * Let's learn about the `{@link}` tag.
 *
 * @remarks
 *
 * Links can point to a URL: {@link https://github.com/Microsoft/tsdoc}
 *
 * Links can point to an API item: {@link Button}
 *
 * You can optionally include custom link text: {@link Button | the Button class}
 *
 * Suppose the `Button` class is part of an external package.  In that case, we
 * can include the package name when referring to it:
 *
 * {@link my-control-library#Button | the Button class}
 *
 * The package name can include an NPM scope and import path:
 *
 * {@link @microsoft/my-control-library/lib/Button#Button | the Button class}
 *
 * The TSDoc standard calls this notation a "declaration reference".  The notation supports
 * references to many different kinds of TypeScript declarations.  This notation was originally
 * designed for use in `{@link}` and `{@inheritDoc}` tags, but you can also use it in your
 * own custom tags.
 *
 * For example, the `Button` can be part of a TypeScript namespace:
 *
 * {@link my-control-library#controls.Button | the Button class}
 *
 * We can refer to a member of the class:
 *
 * {@link controls.Button.render | the render() method}
 *
 * If a static and instance member have the same name, we can use a selector to distinguish them:
 *
 * {@link controls.Button.(render:instance) | the render() method}
 *
 * {@link controls.Button.(render:static) | the render() static member}
 *
 * This is also how we refer to the class's constructor:
 *
 * {@link controls.(Button:constructor) | the class constructor}
 *
 * Sometimes a name has special characters that are not a legal TypeScript identifier:
 *
 * {@link restProtocol.IServerResponse."first-name" | the first name property}
 *
 * Here is a fairly elaborate example where the function name is an ECMAScript 6 symbol,
 * and it's an overloaded function that uses a label selector (defined using the `{@label}`
 * TSDoc tag):
 *
 * {@link my-control-library#Button.([UISymbols.toNumberPrimitive]:OVERLOAD_1)
 * | the toNumberPrimitive() static member}
 *
 * See the TSDoc spec for more details about the "declaration reference" notation.
 */
