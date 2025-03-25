import { FileHelper } from "../helpers/file.helper";
import { FileExtensions } from "../enums/FileExtensions";

export class StandaloneCustomTagsAnalyzer {
  private static readonly fileExtensions = [
    FileExtensions.Component,
    FileExtensions.Template,
  ];

  private static getFiles() {
    return [
      ...FileHelper.getFiles(FileHelper.ComponentsPath, this.fileExtensions),
      ...FileHelper.getFiles(FileHelper.SharedPath, this.fileExtensions),
    ];
  }

  static generateCustomTagsReport(): void {
    const files = this.getFiles();
    const nativeHtmlTags = FileHelper.readFile(FileHelper.TagsToIgnorePath);

    const report: any[] = [];

    files.forEach((file) => {
      const content = FileHelper.readFile(file);
      const templatePath = FileHelper.resolveTemplatePath(file, content);
      const isStandalone = FileHelper.Regex.standalone.test(content);

      if (templatePath && isStandalone) {
        const templateContent = FileHelper.readFile(templatePath);
        if (!templateContent) {
          return;
        }

        const customTags = this.extractTagsWithImport(
          templateContent,
          nativeHtmlTags
        );

        if (customTags.length > 0) {
          report.push({
            file: file,
            customTags: customTags,
          });
        }
      }
    });

    FileHelper.writeFile("standalone-custom-tags-output.json", report);
  }

  static extractTagsWithImport(
    templateContent: string,
    nativeHtmlTags: string
  ): string[] {
    const htmlTags = templateContent.match(/<([a-zA-Z0-9-]+)[^>]*>/g);
    if (!htmlTags) {
      return [];
    }

    const customTags = htmlTags.map((tag) => {
      const match = tag.match(/<([a-zA-Z0-9-]+)/);
      return match ? match[1] : "";
    });

    return customTags.filter((tag) => !!tag && !nativeHtmlTags.includes(tag));
  }
}
