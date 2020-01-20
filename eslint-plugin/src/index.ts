
import {
  TSDocParser,
  TextRange,
  TSDocConfiguration,
  ParserContext
} from "@microsoft/tsdoc";
import {
  TSDocConfigFile
} from '@microsoft/tsdoc-config';
import * as eslint from "eslint";
import * as ESTree from "estree";
import * as path from 'path';

const tsdocMessageIds: {[x: string]: string} = {};

const defaultTSDocConfiguration: TSDocConfiguration = new TSDocConfiguration();
defaultTSDocConfiguration.allTsdocMessageIds.forEach((messageId: string) => {
  tsdocMessageIds[messageId] = `${messageId}: {{unformattedText}}`;
});

interface IPlugin {
  rules: {[x: string]: eslint.Rule.RuleModule};
}

// To debug the plugin, temporarily uncomment the body of this function
function debug(message: string): void {
  message = require("process").pid + ": " + message;
  console.log(message);
  require('fs').writeFileSync('C:\\Git\\log.txt', message + '\r\n', { flag: 'as' });
}

interface ICachedConfig {
  loadTimeMs: number;
  lastCheckTimeMs: number;
  configFile: TSDocConfigFile;
}

// How often to check for modified input files.  If a file's modification timestamp has changed, then we will
// evict the cache entry immediately.
const CACHE_CHECK_INTERVAL_MS: number = 15*1000;

// Evict old entries from the cache after this much time, regardless of whether the file was detected as being
// modified or not.
const CACHE_EXPIRE_MS: number = 30*1000;

// If this many objects accumulate in the cache, then it is cleared to avoid a memory leak.
const CACHE_MAX_SIZE: number = 100;

// findConfigPathForFolder() result --> loaded tsdoc.json configuration
const cachedConfigs: Map<string, ICachedConfig> = new Map<string, ICachedConfig>();

const plugin: IPlugin = {
  rules: {
    // NOTE: The actual ESLint rule name will be "tsdoc/syntax".  It is calculated by deleting "eslint-plugin-"
    // from the NPM package name, and then appending this string.
    "syntax": {
      meta: {
        messages: {
          "error-loading-config-file": "Error loading TSDoc config file:\n{{details}}",
          "error-applying-config": "Error applying TSDoc configuration: {{details}}",
          ...tsdocMessageIds
        },
        type: "problem",
        docs: {
          description: "Validates that TypeScript documentation comments conform to the TSDoc standard",
          category: "Stylistic Issues",
          // This package is experimental
          recommended: false,
          url: "https://github.com/microsoft/tsdoc"
        }
      },
      create: (context: eslint.Rule.RuleContext) => {
        const sourceFilePath: string = context.getFilename();

        debug(`Linting: "${sourceFilePath}"`);

        // First, determine the file to be loaded. If not found, the configFilePath will be an empty string.
        const configFilePath: string ='';// TSDocConfigFile.findConfigPathForFolder(sourceFilePath);

        // If configFilePath is an empty string, then we'll use the folder of sourceFilePath as our cache key
        // (instead of an empty string)
        const cacheKey: string = configFilePath || path.dirname(sourceFilePath);
        debug(`Cache key: "${cacheKey}"`);

        const nowMs: number = (new Date()).getTime();

        let cachedConfig: ICachedConfig | undefined = undefined;

        // Do we have a cached object?
        cachedConfig = cachedConfigs.get(cacheKey);

        if (cachedConfig) {
          debug('Cache hit');

          // Is the cached object still valid?
          const loadAgeMs: number = nowMs - cachedConfig.loadTimeMs;
          const lastCheckAgeMs: number = nowMs - cachedConfig.lastCheckTimeMs;

          if (loadAgeMs > CACHE_EXPIRE_MS || loadAgeMs < 0) {
            debug('Evicting because item is expired');
            cachedConfig = undefined;
            cachedConfigs.delete(cacheKey);
          } else if (lastCheckAgeMs > CACHE_CHECK_INTERVAL_MS || lastCheckAgeMs < 0) {
            debug('Checking for modifications');
            cachedConfig.lastCheckTimeMs = nowMs;
            if (cachedConfig.configFile.checkForModifiedFiles()) {
              // Invalidate the cache because it failed to load completely
              debug('Evicting because item was modified');
              cachedConfig = undefined;
              cachedConfigs.delete(cacheKey);
            }
          }
        }

        // Load the object
        if (!cachedConfig) {
          if (cachedConfigs.size > CACHE_MAX_SIZE) {
            debug('Clearing cache');
            cachedConfigs.clear(); // avoid a memory leak
          }

          debug(`LOADING CONFIG: ${configFilePath}`);
          cachedConfig = {
            configFile: TSDocConfigFile.loadFile(configFilePath),
            lastCheckTimeMs: nowMs,
            loadTimeMs: nowMs
          };

          cachedConfigs.set(cacheKey, cachedConfig);
        }

        const tsdocConfigFile: TSDocConfigFile = cachedConfig.configFile;
        const tsdocConfiguration: TSDocConfiguration = new TSDocConfiguration()

        if (!tsdocConfigFile.fileNotFound) {
          if (tsdocConfigFile.hasErrors) {
            context.report({
              loc: { line: 1, column: 1 },
              messageId: "error-loading-config-file",
              data: {
                details: tsdocConfigFile.getErrorSummary()
              }
            });
          }

          try {
            tsdocConfigFile.configureParser(tsdocConfiguration);
          } catch (e) {
            context.report({
              loc: { line: 1, column: 1 },
              messageId: "error-applying-config",
              data: {
                details: e.message
              }
            });
          }
        }

        const tsdocParser: TSDocParser = new TSDocParser(tsdocConfiguration);

        const sourceCode: eslint.SourceCode = context.getSourceCode();
        const checkCommentBlocks: (node: ESTree.Node) => void = function (node: ESTree.Node) {
          for (const comment of sourceCode.getAllComments()) {
            if (comment.type !== "Block") {
              continue;
            }
            if (!comment.range) {
              continue;
            }

            const textRange: TextRange = TextRange.fromStringRange(sourceCode.text, comment.range[0], comment.range[1]);

            // Smallest comment is "/***/"
            if (textRange.length < 5) {
              continue;
            }
            // Make sure it starts with "/**"
            if (textRange.buffer[textRange.pos + 2] !== '*') {
              continue;
            }

            const parserContext: ParserContext = tsdocParser.parseRange(textRange);
            for (const message of parserContext.log.messages) {
              context.report({
                loc: {
                  start: sourceCode.getLocFromIndex(message.textRange.pos),
                  end: sourceCode.getLocFromIndex(message.textRange.end)
                },
                messageId: message.messageId,
                data: {
                  unformattedText: message.unformattedText
                }
              });
            }
          }
        }

        return {
          Program: checkCommentBlocks
        };
      }
    }
  }
}

export = plugin;
