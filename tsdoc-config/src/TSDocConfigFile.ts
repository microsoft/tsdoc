import { TSDocTagDefinition, TSDocTagSyntaxKind } from '@microsoft/tsdoc';
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
  tsdocVersion: string;
  extends?: string[];
  tagDefinitions: ITagConfigJson[];
}

export class TSDocConfigFile {

  public readonly filePath: string;

  public readonly tsdocVersion: string;

  public readonly extends: ReadonlyArray<string>;

  public readonly tagDefinitions: ReadonlyArray<TSDocTagDefinition>;

  private constructor(filePath: string, configJson: IConfigJson) {
    this.filePath = filePath;
    this.tsdocVersion = configJson.tsdocVersion;
    this.extends = configJson.extends || [];
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

  public static load(jsonFilePath: string): TSDocConfigFile {
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
}
