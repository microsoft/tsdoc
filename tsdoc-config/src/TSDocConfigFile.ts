import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  TSDocConfiguration,
  ParserMessageLog,
  TSDocMessageId,
  ParserMessage,
  TextRange,
  IParserMessageParameters
} from '@microsoft/tsdoc';
import * as fs from 'fs';
import * as resolve from 'resolve';
import * as path from 'path';
import * as Ajv from 'ajv';
import * as jju from 'jju';

const ajv: Ajv.Ajv = new Ajv({ verbose: true });

function initializeSchemaValidator(): Ajv.ValidateFunction {
  const jsonSchemaPath: string = resolve.sync('@microsoft/tsdoc/schemas/tsdoc.schema.json', { basedir: __dirname });
  const jsonSchemaContent: string = fs.readFileSync(jsonSchemaPath).toString();
  const jsonSchema: object = jju.parse(jsonSchemaContent, { mode: 'cjson' });
  return ajv.compile(jsonSchema);
}

// Warning: AJV has a fairly strange API.  Each time this function is called, the function  object's
// properties get overwritten with the results of the latest validation.  Thus we need to be careful
// to read the properties before a subsequent call may occur.
const tsdocSchemaValidator: Ajv.ValidateFunction = initializeSchemaValidator();

interface ITagConfigJson {
  tagName: string;
  syntaxKind: 'inline' | 'block' | 'modifier';
  allowMultiple?: boolean;
  synonyms?: string[];
}

interface ISynonymConfigJson {
  add?: ISynonymSetJson;
  remove?: ISynonymSetJson;
}

interface ISynonymSetJson {
  [tagName: string]: string[];
}

interface IConfigJson {
  $schema: string;
  tsdocVersion: string;
  extends?: string[];
  tagDefinitions: ITagConfigJson[];
  synonyms?: ISynonymConfigJson;
}

/**
 * Represents an individual `tsdoc.json` file.
 *
 * @public
 */
export class TSDocConfigFile {
  public static readonly FILENAME: string = 'tsdoc.json';
  public static readonly CURRENT_SCHEMA_URL: string
    = 'https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json';

  /**
   * A queryable log that reports warnings and error messages that occurred during parsing.
   */
  public readonly log: ParserMessageLog;

  private readonly _extendsFiles: TSDocConfigFile[];
  private _filePath: string;
  private _fileNotFound: boolean;
  private _fileMTime: number;
  private _hasErrors: boolean;
  private _tsdocSchema: string;
  private readonly _extendsPaths: string[];
  private readonly _tagDefinitions: TSDocTagDefinition[];
  private readonly _synonymAdditions: Map<string, string[]>;
  private readonly _synonymDeletions: Map<string, string[]>;

  private constructor() {
    this.log = new ParserMessageLog();

    this._extendsFiles = [];
    this._filePath = '';
    this._fileNotFound = true;
    this._hasErrors = false;
    this._fileMTime = 0;
    this._tsdocSchema = '';
    this._extendsPaths = [];
    this._tagDefinitions = [];
    this._synonymAdditions = new Map<string, string[]>();
    this._synonymDeletions = new Map<string, string[]>();
  }

  /**
   * Other config files that this file extends from.
   */
  public get extendsFiles(): ReadonlyArray<TSDocConfigFile> {
    return this._extendsFiles;
  }

  /**
   * The full path of the file that was attempted to load.
   */
  public get filePath(): string {
    return this._filePath;
  }

  /**
   * If true, then the TSDocConfigFile object contains an empty state, because the `tsdoc.json` file could
   * not be found by the loader.
   */
  public get fileNotFound(): boolean {
    return this._fileNotFound;
  }

  /**
   * If true, then at least one error was encountered while loading this file or one of its "extends" files.
   *
   * @remarks
   * You can use {@link TSDocConfigFile.getErrorSummary} to report these errors.
   *
   * The individual messages can be retrieved from the {@link TSDocConfigFile.log} property of each `TSDocConfigFile`
   * object (including the {@link TSDocConfigFile.extendsFiles} tree).
   */
  public get hasErrors(): boolean {
    return this._hasErrors;
  }

  /**
   * The `$schema` field from the `tsdoc.json` file.
   */
  public get tsdocSchema(): string {
    return this._tsdocSchema;
  }

  /**
   * The `extends` field from the `tsdoc.json` file.  For the parsed file contents,
   * use the `extendsFiles` property instead.
   */
  public get extendsPaths(): ReadonlyArray<string> {
    return this._extendsPaths;
  }

  public get tagDefinitions(): ReadonlyArray<TSDocTagDefinition> {
    return this._tagDefinitions;
  }

  public get synonymAdditions(): ReadonlyMap<string, ReadonlyArray<string>> {
    return this._synonymAdditions;
  }

  public get synonymDeletions(): ReadonlyMap<string, ReadonlyArray<string>> {
    return this._synonymDeletions;
  }

  /**
   * This can be used for cache eviction.  It returns true if the modification timestamp has changed for
   * any of the files that were read when loading this `TSDocConfigFile`, which indicates that the file should be
   * reloaded.  It does not consider cases where `TSDocConfigFile.fileNotFound` was `true`.
   *
   * @remarks
   * This can be used for cache eviction.  An example eviction strategy might be like this:
   *
   * - call `checkForModifiedFiles()` once per second, and reload the configuration if it returns true
   *
   * - otherwise, reload the configuration when it is more than 10 seconds old (to handle less common cases such
   *   as creation of a missing file, or creation of a file at an earlier location in the search path).
   */
  public checkForModifiedFiles(): boolean {
    if (this._checkForModifiedFile()) {
      return true;
    }
    for (const extendsFile of this.extendsFiles) {
      if (extendsFile.checkForModifiedFiles()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks the last modification time for `TSDocConfigFile.filePath` and returns `true` if it has changed
   * since the file was loaded.  If the file is missing, this returns `false`.  If the timestamp cannot be read,
   * then this returns `true`.
   */
  private _checkForModifiedFile(): boolean {
    if (this._fileNotFound || !this._filePath) {
      return false;
    }

    try {
      const mtimeMs: number = fs.statSync(this._filePath).mtimeMs;
      return mtimeMs !== this._fileMTime;
    } catch (error) {
      return true;
    }
  }

  private _reportError(parserMessageParameters: IParserMessageParameters): void {
    this.log.addMessage(new ParserMessage(parserMessageParameters));
    this._hasErrors = true;
  }

  private _loadJsonFile(): void {
    const configJsonContent: string = fs.readFileSync(this._filePath).toString();
    this._fileMTime = fs.statSync(this._filePath).mtimeMs;
    this._fileNotFound = false;

    const configJson: IConfigJson = jju.parse(configJsonContent, { mode: 'cjson' });

    if (configJson.$schema !== TSDocConfigFile.CURRENT_SCHEMA_URL) {
      this._reportError({
        messageId: TSDocMessageId.ConfigFileUnsupportedSchema,
        messageText: `Unsupported JSON "$schema" value; expecting "${TSDocConfigFile.CURRENT_SCHEMA_URL}"`,
        textRange: TextRange.empty
      });
      return;
    }

    const success: boolean = tsdocSchemaValidator(configJson) as boolean;

    if (!success) {
      const description: string = ajv.errorsText(tsdocSchemaValidator.errors);

      this._reportError({
        messageId: TSDocMessageId.ConfigFileSchemaError,
        messageText: 'Error loading config file: ' + description,
        textRange: TextRange.empty
      });
      return;
    }

    this._tsdocSchema = configJson.$schema;
    if (configJson.extends) {
      this._extendsPaths.push(...configJson.extends);
    }

    for (const jsonTagDefinition of configJson.tagDefinitions || []) {
      let syntaxKind: TSDocTagSyntaxKind;
      switch (jsonTagDefinition.syntaxKind) {
        case 'inline': syntaxKind = TSDocTagSyntaxKind.InlineTag; break;
        case 'block': syntaxKind = TSDocTagSyntaxKind.BlockTag; break;
        case 'modifier': syntaxKind = TSDocTagSyntaxKind.ModifierTag; break;
        default:
          // The JSON schema should have caught this error
          throw new Error('Unexpected tag kind');
      }
      this._tagDefinitions.push(new TSDocTagDefinition({
        tagName: jsonTagDefinition.tagName,
        syntaxKind: syntaxKind,
        synonyms: jsonTagDefinition.synonyms,
        allowMultiple: jsonTagDefinition.allowMultiple
      }));
    }
    if (configJson.synonyms) {
      if (configJson.synonyms.add) {
        for (const tagName of Object.keys(configJson.synonyms.add)) {
          this._synonymAdditions.set(tagName, configJson.synonyms.add[tagName]);
        }
      }
      if (configJson.synonyms.remove) {
        for (const tagName of Object.keys(configJson.synonyms.remove)) {
          this._synonymDeletions.set(tagName, configJson.synonyms.remove[tagName]);
        }
      }
    }
  }

  private _loadWithExtends(configFilePath: string, referencingConfigFile: TSDocConfigFile | undefined,
    alreadyVisitedPaths: Set<string>): void {

    if (!configFilePath) {
      this._reportError({
        messageId: TSDocMessageId.ConfigFileNotFound,
        messageText: 'File not found',
        textRange: TextRange.empty
      });
      return;
    }

    this._filePath = path.resolve(configFilePath);

    if (!fs.existsSync(this._filePath)) {
      this._reportError({
        messageId: TSDocMessageId.ConfigFileNotFound,
        messageText: 'File not found',
        textRange: TextRange.empty
      });
      return;
    }

    const hashKey: string = fs.realpathSync(this._filePath);
    if (referencingConfigFile && alreadyVisitedPaths.has(hashKey)) {
      this._reportError({
        messageId: TSDocMessageId.ConfigFileCyclicExtends,
        messageText: `Circular reference encountered for "extends" field of "${referencingConfigFile.filePath}"`,
        textRange: TextRange.empty
      });
      return;
    }
    alreadyVisitedPaths.add(hashKey);

    this._loadJsonFile();

    const configFileFolder: string = path.dirname(this.filePath);

    for (const extendsField of this.extendsPaths) {
      const resolvedExtendsPath: string = resolve.sync(extendsField, { basedir: configFileFolder });

      const baseConfigFile: TSDocConfigFile = new TSDocConfigFile();

      baseConfigFile._loadWithExtends(resolvedExtendsPath, this, alreadyVisitedPaths);

      if (baseConfigFile.fileNotFound) {
        this._reportError({
          messageId: TSDocMessageId.ConfigFileUnresolvedExtends,
          messageText: `Unable to resolve "extends" reference to "${extendsField}"`,
          textRange: TextRange.empty
        });
      }

      this._extendsFiles.push(baseConfigFile);

      if (baseConfigFile.hasErrors) {
        this._hasErrors = true;
      }
    }
  }

  /**
   * For the given folder, look for the relevant tsdoc.json file (if any), and return its path.
   *
   * @param folderPath - the path to a folder where the search should start
   * @returns the (possibly relative) path to tsdoc.json, or an empty string if not found
   */
  public static findConfigPathForFolder(folderPath: string): string {
    if (folderPath) {
      let foundFolder: string = folderPath;
      for (;;) {
        const tsconfigJsonPath: string = path.join(foundFolder, 'tsconfig.json');
        if (fs.existsSync(tsconfigJsonPath)) {
          // Stop when we reach a folder containing tsconfig.json
          return path.join(foundFolder, TSDocConfigFile.FILENAME);
        }
        const packageJsonPath: string = path.join(foundFolder, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          // Stop when we reach a folder containing package.json; this avoids crawling out of the current package
          return path.join(foundFolder, TSDocConfigFile.FILENAME);
        }

        const previousFolder: string = foundFolder;
        foundFolder = path.dirname(foundFolder);

        if (!foundFolder || foundFolder === previousFolder) {
          // Give up if we reach the filesystem root directory
          break;
        }
      }
    }
    return '';
  }

  /**
   * Calls `TSDocConfigFile.findConfigPathForFolder()` to find the relevant tsdoc.json config file, if one exists.
   * Then calls `TSDocConfigFile.findConfigPathForFolder()` to return the loaded result.
   * @param folderPath - the path to a folder where the search should start
   */
  public static loadForFolder(folderPath: string): TSDocConfigFile {
    const rootConfigPath: string = TSDocConfigFile.findConfigPathForFolder(folderPath);
    return TSDocConfigFile.loadFile(rootConfigPath);
  }

  /**
   * Loads the specified tsdoc.json and any base files that it refers to using the "extends" option.
   * @param tsdocJsonFilePath - the path to the tsdoc.json config file
   */
  public static loadFile(tsdocJsonFilePath: string): TSDocConfigFile {
    const configFile: TSDocConfigFile = new TSDocConfigFile();
    const alreadyVisitedPaths: Set<string> = new Set<string>();
    configFile._loadWithExtends(tsdocJsonFilePath, undefined, alreadyVisitedPaths);
    return configFile;
  }

  /**
   * Returns a report of any errors that occurred while attempting to load this file or any files
   * referenced via the "extends" field.
   *
   * @remarks
   * Use {@link TSDocConfigFile.hasErrors} to determine whether any errors occurred.
   */
  public getErrorSummary(): string {
    if (!this._hasErrors) {
      return 'No errors.';
    }

    let result: string = `Errors encountered for ${this.filePath}:\n`;

    for (const message of this.log.messages) {
      result += `  ${message.text}\n`;
    }

    for (const extendsFile of this.extendsFiles) {
      if (extendsFile.hasErrors) {
        result += extendsFile.getErrorSummary();
      }
    }

    return result;
  }

  /**
   * Applies the settings from this config file to a TSDoc parser configuration.
   * Any `extendsFile` settings will also applied.
   */
  public configureParser(configuration: TSDocConfiguration): void {
    // First apply the base config files
    for (const extendsFile of this.extendsFiles) {
      extendsFile.configureParser(configuration);
    }

    // Then apply this one
    for (const tagDefinition of this.tagDefinitions) {
      configuration.addTagDefinition(tagDefinition);
    }

    this.synonymDeletions.forEach((synonyms, tagName) => {
      const tagDefinition: TSDocTagDefinition | undefined
        = configuration.tryGetTagDefinition(tagName);
      if (!tagDefinition) {
        throw new Error(`A tag with the name ${tagName} could not be found.`);
      }
      configuration.removeSynonym(tagDefinition, ...synonyms);
    });

    this.synonymAdditions.forEach((synonyms, tagName) => {
      const tagDefinition: TSDocTagDefinition | undefined
        = configuration.tryGetTagDefinition(tagName);
      if (!tagDefinition) {
        throw new Error(`A tag with the name ${tagName} could not be found.`);
      }
      configuration.addSynonym(tagDefinition, ...synonyms);
    });
  }
}
