import { FileExtensions } from "../enums/FileExtensions";
import { FileHelper } from "../helpers/file.helper";

export class StandaloneToMigrateAnalyzer {
  static execute(): void {
    const files = FileHelper.getFiles(FileHelper.ComponentsPath, [
      FileExtensions.Component,
    ]);
    const sharedFiles = FileHelper.getFiles(FileHelper.SharedPath, [
      FileExtensions.Component,
    ]);

    const report: Record<string, { files: string[] }> = {};

    this.getReport(files, report, FileHelper.ComponentsPath);
    this.getReport(sharedFiles, report, FileHelper.SharedPath);

    FileHelper.writeFile("standalone-to-migrate.json", report);
  }

  private static getReport(
    files: string[],
    report: Record<string, { files: string[] }>,
    fileBasePath: string
  ) {
    files.forEach((file) => {
      const content = FileHelper.readFile(file);
      const isStandalone = FileHelper.Regex.standalone.test(content);

      if (!isStandalone) {
        const relativePath = file.split(fileBasePath + "\\")[1];
        const firstFolder = relativePath?.split("\\")[0];

        if (!report[firstFolder]) {
          report[firstFolder] = {
            files: [],
          };
        }

        report[firstFolder].files.push(file);
      }
    });
  }
}
