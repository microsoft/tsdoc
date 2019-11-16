import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  TSDocConfiguration
} from '@microsoft/tsdoc';
import * as fs from 'fs';
import * as resolve from 'resolve';
import * as path from 'path';
import * as Ajv from 'ajv';

const ajv: Ajv.Ajv = new Ajv({ verbose: true });

function initializeSchemaValidator(): Ajv.ValidateFunction {
  const jsonSchemaPath: string = resolve.sync('@microsoft/tsdoc/schemas/tsdocconfig.schema.json', { basedir: __dirname });
  const jsonSchemaContent: string = fs.readFileSync(jsonSchemaPath).toString();
  const jsonSchema: object = JSON.parse(jsonSchemaContent);
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
}

interface IConfigJson {
  $schema: string;
  tsdocVersion: string;
  extends?: string[];
  tagDefinitions: ITagConfigJson[];
}

/**
 * Represents an individual `tsdocconfig.json` file.
 *
 * @public
 */
export class TSDocConfigFile {
  public static readonly FILENAME: string = 'tsdocconfig.json';
  public static readonly CURRENT_SCHEMA_URL: string = 'https://developer.microsoft.com/json-schemas/tsdoc/v1/tsdocconfig.schema.json';

  private readonly _extendsFiles: TSDocConfigFile[] = [];

  /**
   * The full path of the file that was attempted to load.
   */
  public readonly filePath: string;

  public readonly fileNotFound: boolean = false;

  /**
   * The `$schema` field from the `tsdocconfig.json` file.
   */
  public readonly tsdocSchema: string;

  /**
   * The `extends` field from the `tsdocconfig.json` file.  For the parsed file contents,
   * use the `extendsFiles` property instead.
   */
  public readonly extendsPaths: ReadonlyArray<string>;

  public readonly tagDefinitions: ReadonlyArray<TSDocTagDefinition>;

  private constructor(filePath: string, configJson: IConfigJson) {
    this.filePath = filePath;
    this.tsdocSchema = configJson.$schema;
    this.extendsPaths = configJson.extends || [];
    const tagDefinitions: TSDocTagDefinition[] = [];

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
      tagDefinitions.push(new TSDocTagDefinition({
        tagName: jsonTagDefinition.tagName,
        syntaxKind: syntaxKind,
        allowMultiple: jsonTagDefinition.allowMultiple
      }));
    }

    this.tagDefinitions = tagDefinitions;
  }

  /**
   * Other config files that this file extends from.
   */
  public get extendsFiles(): ReadonlyArray<TSDocConfigFile> {
    return this._extendsFiles;
  }

  /**
   * Loads the contents of a single JSON input file.
   *
   * @remarks
   *
   * This method does not process the `extends` field of `tsdocconfig.json`.
   * For full functionality, including discovery of the file path, use the {@link TSDocConfigFileSet}
   * API instead.
   */
  private static _loadSingleFile(jsonFilePath: string): TSDocConfigFile {
    const fullJsonFilePath: string = path.resolve(jsonFilePath);

    const configJsonContent: string = fs.readFileSync(fullJsonFilePath).toString();

    const configJson: IConfigJson = JSON.parse(configJsonContent);
    const success: boolean = tsdocSchemaValidator(configJson) as boolean;

    if (!success) {
      const description: string = ajv.errorsText(tsdocSchemaValidator.errors);
      throw new Error('Error parsing config file: ' + description
        + '\nError in file: ' + jsonFilePath);
    }

    if (configJson.$schema !== TSDocConfigFile.CURRENT_SCHEMA_URL) {
      throw new Error('Expecting JSON "$schema" field to be ' + TSDocConfigFile.CURRENT_SCHEMA_URL
        + '\nError in file: ' + jsonFilePath);
    }

    return new TSDocConfigFile(fullJsonFilePath, configJson);
  }

  private static _findConfigPathForFolder(folderPath: string): string {
    if (folderPath) {
      let foundFolder: string = folderPath;
      for (;;) {
        const tsconfigFilePath: string = path.join(foundFolder, 'tsconfig.json');
        if (fs.existsSync(tsconfigFilePath)) {
          // Success
          return path.join(foundFolder, TSDocConfigFile.FILENAME);
        }

        const previousFolder: string = foundFolder;
        foundFolder = path.dirname(foundFolder);

        if (!foundFolder || foundFolder === previousFolder) {
          // Failed
          break;
        }
      }
    }
    return '';
  }

  private static _loadWithExtends(configFilePath: string, alreadyVisitedPaths: Set<string>): TSDocConfigFile {
    const hashKey: string = fs.realpathSync(configFilePath);
    if (alreadyVisitedPaths.has(hashKey)) {
      throw new Error('Circular reference encountered for "extends" field of ' + configFilePath);
    }
    alreadyVisitedPaths.add(hashKey);

    const configFile: TSDocConfigFile = TSDocConfigFile._loadSingleFile(configFilePath);

    const configFileFolder: string = path.dirname(configFile.filePath);

    for (const extendsField of configFile.extendsPaths) {
      const resolvedExtendsPath: string = resolve.sync(extendsField, { basedir: configFileFolder });
      if (!fs.existsSync(resolvedExtendsPath)) {
        throw new Error('Unable to resolve "extends" field of ' + configFilePath);
      }

      const baseConfigFile: TSDocConfigFile = TSDocConfigFile._loadWithExtends(resolvedExtendsPath, alreadyVisitedPaths);
      configFile.addExtendsFile(baseConfigFile);
    }

    return configFile;
  }

  /**
   * For the given folder, discover the relevant tsdocconfig.json files (if any), and load them.
   * @param folderPath - the path to a folder where the search should start
   */
  public static loadForFolder(folderPath: string): TSDocConfigFile {
    const rootConfigPath: string = TSDocConfigFile._findConfigPathForFolder(folderPath);
    const alreadyVisitedPaths: Set<string> = new Set<string>();
    return TSDocConfigFile._loadWithExtends(rootConfigPath, alreadyVisitedPaths);
  }

  /**
   * Adds an item to `TSDocConfigFile.extendsFiles`.
   */
  public addExtendsFile(otherFile: TSDocConfigFile): void {
    this._extendsFiles.push(otherFile);
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

    // The apply this one
    for (const tagDefinition of this.tagDefinitions) {
      configuration.addTagDefinition(tagDefinition);
      configuration.setSupportForTag(tagDefinition, true);
    }
  }
}
