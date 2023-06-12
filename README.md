<table><tr><td>
<a href="https://tsdoc.org"><img src="https://tsdoc.org/images/site/tsdoc-open.svg" width="300px" /></a>
<p align="center"><a href="https://tsdoc.org/">https://tsdoc.org/</a></p>
</td></tr></table>

[![#tsdoc chat room](https://img.shields.io/badge/zulip-join_chat-brightgreen.svg)](https://rushstack.zulipchat.com/#narrow/stream/266672-tsdoc) &nbsp; [![Build Status](https://dev.azure.com/RushStack/Gearbox%20GitHub%20Projects/_apis/build/status/tsdoc/TSDoc%20CI%20Build?branchName=main)](https://dev.azure.com/RushStack/Gearbox%20GitHub%20Projects/_build/latest?definitionId=5&branchName=main)


## Documentation Links

- [What is TSDoc?](https://tsdoc.org/) - project overview and roadmap
- [Zulip chat room](https://rushstack.zulipchat.com/#narrow/stream/266672-tsdoc) - live help from other developers
- [TSDoc tag reference](https://tsdoc.org/pages/tags/alpha/) - learn about syntax elements such as `@param`, `@remarks`, etc.
- [TSDoc Playground](https://tsdoc.org/play) - interactive demo of the parser engine
- [Contributing: Building the projects](https://tsdoc.org/pages/contributing/building/) - how to build and debug the projects in this repo
- [Contributing: Submitting a PR](https://tsdoc.org/pages/contributing/pr_checklist/) - instructions for making a pull request


## Projects in this monorepo

| Folder | Version | Changelog | Description |
| ------ | ------- | --------- | ------- |
| [/api-demo](./api-demo/) | (local project) |  | Code samples illustrating how to use the **@microsoft/tsdoc** parser |
| [/eslint-plugin](./eslint-plugin/) | [![npm version](https://badge.fury.io/js/eslint-plugin-tsdoc.svg)](https://badge.fury.io/js/eslint-plugin-tsdoc) | [changelog](./eslint-plugin/CHANGELOG.md) | [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc) plugin for ESLint|
| [/playground](./playground/) | (local project) |  | Source code for the [TSDoc Playground](https://tsdoc.org/play) web app |
| [/tsdoc](./tsdoc/) | [![npm version](https://badge.fury.io/js/%40microsoft%2Ftsdoc.svg)](https://badge.fury.io/js/%40microsoft%2Ftsdoc) | [changelog](./tsdoc/CHANGELOG.md) | [@microsoft/tsdoc](https://www.npmjs.com/package/@microsoft/tsdoc) parser library |
| [/tsdoc-config](./tsdoc/) | [![npm version](https://badge.fury.io/js/%40microsoft%2Ftsdoc-config.svg)](https://badge.fury.io/js/%40microsoft%2Ftsdoc-config) | [changelog](./tsdoc-config/CHANGELOG.md) | [@microsoft/tsdoc-config](https://www.npmjs.com/package/@microsoft/tsdoc-config) loader for **tsdoc.json** |


##  Contributor Notice

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
