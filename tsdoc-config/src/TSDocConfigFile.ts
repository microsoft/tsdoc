import * as fs from 'fs';
import * as path from 'path';
import * as Ajv from 'ajv';

interface ITSDocConfigFileData {
  filePath: string;
}

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

interface IConfigJson {
}

export class TSDocConfigFile {

  public readonly filePath: string;

  private constructor(data: ITSDocConfigFileData) {
    this.filePath = data.filePath;
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

    return new TSDocConfigFile({
      filePath: fullJsonFilePath
    });
  }
}
