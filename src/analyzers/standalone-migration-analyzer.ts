import { FileExtensions } from "../enums/FileExtensions";
import { FileHelper } from "../helpers/file.helper";

export class StandaloneMigrationAnalyzer {
  static execute(): void {
    const files = FileHelper.getFiles(FileHelper.ComponentsPath, [
      FileExtensions.Component,
    ]);
    const sharedFiles = FileHelper.getFiles(FileHelper.SharedPath, [
      FileExtensions.Component,
    ]);

    const report: ComponentMigrationMap = {};

    this.getReport(files, report, FileHelper.ComponentsPath);
    this.getReport(sharedFiles, report, FileHelper.SharedPath);

    FileHelper.writeOutputFile("standalone-to-migrate-output.json", report);
  }

  private static getReport(
    files: string[],
    report: ComponentMigrationMap,
    fileBasePath: string
  ) {
    files.forEach((file) => {
      const content = FileHelper.readFile(file);
      const classNameMatch = content.match(FileHelper.Regex.className);
      const isStandalone = FileHelper.Regex.standalone.test(content);

      if (!isStandalone && classNameMatch) {
        const className = classNameMatch[1];
        const relativePath = file.split(fileBasePath + "\\")[1];
        const firstFolder = relativePath?.split("\\")[0];

        if (!report[firstFolder]) {
          report[firstFolder] = [];
        }
        report[firstFolder].push(className);
      }
    });
  }
}
