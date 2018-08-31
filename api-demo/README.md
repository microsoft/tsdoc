# api-demo

This is a simple code sample that illustrates how to invoke the API for the
**@microsoft/tsdoc** library.

1. Before building the **api-demo** project, first you need to build the **@microsoft/tsdoc**
library project, which is in your [../tsdoc/](../tsdoc) folder.  (This is necessary because
the [api-demo/package.json](./package.json#L8) links directly to the latest files in that folder,
rather than installing them from the NPM registry.)  See [Contributing.md](../Contributing.md)
for details about building the library.

2. Install the other NPM package dependencies for the **api-demo** project:

   ```
   $ cd ./api-demo
   $ npm install
   ```

3. Build the **api-demo** project like this:

   ```
   $ npm run build
   ```

4. Run the **api-demo** project:

   The simple demo does not rely on the TypeScript compiler.
   It uses the default parser configuration.
   ```
   $ npm run start simple
   ```

   The advanced demo uses the TypeScript compiler API to locate the comment text.
   It also illustrates how to define custom TSDoc tags using TSDocParserConfiguration.
   ```
   $ npm run start advanced
   ```
