# api-demo

This is a simple code sample that illustrates how to invoke the API for the
**@microsoft/tsdoc** library.  There are two options for installing.  Option 1
is easiest.  Option 2 is for contributors.


### Option 1: Building and running the demo using NPM

> 👉 IF YOU ARE CONTRIBUTING A FIX, PLEASE USE OPTION 2 INSTEAD.

Here's quick instructions to try out the **api-demo**.  Option 1 will use the **latest official release** of
the **@microsoft/tsdoc** library.  It will NOT symlink to your local build of the library.

1. Install the NPM dependencies for the **api-demo** project:

   ```shell
   $ cd ./api-demo
   # Note: Be sure to specify "--no-package-lock" to avoid conflicts with Rush
   $ npm install --no-package-lock
   ```

2. Build the **api-demo** project like this:

   ```shell
   $ npm run build
   ```

3. Run the **api-demo** project:

   The simple demo does not rely on the TypeScript compiler API; instead, it parses the
   source file directly.  It uses the default parser configuration.

   ```shell
   $ npm run simple
   ```

   The advanced demo invokes the TypeScript compiler and extracts the comment from the AST.
   It also illustrates how to define custom TSDoc tags using `TSDocParserConfiguration`.

   ```shell
   $ npm run advanced
   ```


### Option 2: Building and running the demo using Rush

If you're going to submit a pull request for TSDoc, you will need to use the Rush monorepo
manager tool.  See [Contributing.md](../Contributing.md) for more information.

Option 2 will link **api-demo** to use your local build of the **@microsoft/tsdoc** library,
for easy testing/validation.

1. Install the [Rush](https://rushjs.io/pages/developer/new_developer/) software:

   ```shell
   $ npm install -g @microsoft/rush
   ```

   *NOTE: If this command fails because your user account does not have permissions to
   access NPM's global folder, you may need to
   [fix your NPM configuration](https://docs.npmjs.com/getting-started/fixing-npm-permissions).*

2. Install dependencies for all projects in the monorepo:

   ```shell
   # Run this command in the folder where you cloned the TSDoc repo from GitHub
   $ rush install
   ```

3. Build all the projects in the monorepo:

   ```shell
   $ rush build
   ```

   You can also build just the **api-demo** project like this:

   ```shell
   $ cd ./api-demo
   $ npm run build
   ```

4. Run the **api-demo** project (see above notes for more details):

   ```shell
   $ npm run simple
   $ npm run advanced
   ```

*IMPORTANT: After you run `rush install`, your repo will be in a "Rush-linked" state,
with special symlinks in the node_modules folders.  DO NOT run `npm install` in this state.
If you want to go back to working in standalone mode, first run `rush unlink && rush purge`.*
