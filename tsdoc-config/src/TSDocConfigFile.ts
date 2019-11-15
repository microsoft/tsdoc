import {
  TSDocTagDefinition,
  TSDocTagSyntaxKind,
  TSDocConfiguration
} from '@microsoft/tsdoc';
import * as fs from 'fs';
import * as path from 'path';
import * as Ajv from 'ajv';

const ajv: Ajv.Ajv = new Ajv({ verbose: true });

function initializeSchemaValidator(): Ajv.ValidateFunction {
  const jsonSchemaContent: string = fs.readFileSync(path.join(__dirname, 'schemas/tsdoc-config.schema.json'))
    .toString();
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
 * Represents an individual `tsdoc-config.json` file.
 *
 * @public
 */
export class TSDocConfigFile {
  private readonly _extendsFiles: TSDocConfigFile[] = [];

  /**
   * The full path of the file.
   */
  public readonly filePath: string;

  /**
   * The `$schema` field from the `tsdoc-config.json` file.
   */
  public readonly tsdocSchema: string;

  /**
   * The `extends` field from the `tsdoc-config.json` file.  For the parsed file contents,
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
   * This method does not process the `extends` field of `tsdoc-config.json`.
   * For full functionality, including discovery of the file path, use the {@link ConfigLoader}
   * API instead.
   */
  public static loadFromFile(jsonFilePath: string): TSDocConfigFile {
    const fullJsonFilePath: string = path.resolve(jsonFilePath);

    const configJsonContent: string = fs.readFileSync(fullJsonFilePath).toString();

    const configJson: IConfigJson = JSON.parse(configJsonContent);
    const success: boolean = tsdocSchemaValidator(configJson) as boolean;

    if (!success) {
      const description: string = ajv.errorsText(tsdocSchemaValidator.errors);
      throw new Error('Error parsing config file: ' + description
        + '\nError in file: ' + jsonFilePath);
    }

    return new TSDocConfigFile(fullJsonFilePath, configJson);
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
  public applyToParserConfiguration(configuration: TSDocConfiguration): void {
    // First apply the base config files
    for (const extendsFile of this.extendsFiles) {
      extendsFile.applyToParserConfiguration(configuration);
    }

    // The apply this one
    for (const tagDefinition of this.tagDefinitions) {
      configuration.addTagDefinition(tagDefinition);
      configuration.setSupportForTag(tagDefinition, true);
    }
  }
}
