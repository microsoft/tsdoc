interface ITSDocConfigFileData {
  filePath: string;
}

export class TSDocConfigFile {
  public readonly filePath: string;

  private constructor(data: ITSDocConfigFileData) {
    this.filePath = data.filePath;
  }

  public static load(filePath: string): TSDocConfigFile {
    return new TSDocConfigFile({
      filePath
    });
  }
}
