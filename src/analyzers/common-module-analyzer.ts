import { FileHelper } from "../helpers/file.helper";
import { FileExtensions } from "../enums/FileExtensions";

type CommonModuleAnalysisResult = {
  filePath: string;
  hasCommonModule: boolean;
  usesCommonFeatures: boolean;
} | null;

export class CommonModuleAnalyzer {
  static getResultFiles() {
    return FileHelper.getFiles(FileHelper.ComponentsPath, [
      FileExtensions.Component,
    ])
      .map((file) => CommonModuleAnalyzer.analyzeComponent(file))
      .filter(Boolean);
  }

  static analyzeComponent(filePath: string): CommonModuleAnalysisResult {
    const content = FileHelper.readFile(filePath);
    if (!FileHelper.Regex.standalone.test(content)) {
      return null;
    }

    const templatePath = FileHelper.resolveTemplatePath(filePath, content);
    if (!templatePath) {
      return null;
    }

    const hasCommonModule = FileHelper.Regex.commonModule.test(content);
    const usesCommonFeatures = templatePath
      ? [
          FileHelper.Regex.ngFeatures,
          FileHelper.Regex.commonPipes,
          FileHelper.Regex.commonDirectives,
        ].some((regex) => regex.test(FileHelper.readFile(templatePath)))
      : false;

    return { filePath, hasCommonModule, usesCommonFeatures };
  }

  static execute() {
    const results = this.getResultFiles();
    const requiredImports = results.filter(
      (r) => !!r && r.usesCommonFeatures && !r.hasCommonModule
    );
    const nonRequiredImports = results.filter(
      (r) => !!r && r.usesCommonFeatures && !r.hasCommonModule
    );

    FileHelper.writeOutputFile("common-module.json", {
      "required-imports": requiredImports,
      "non-required-imports": nonRequiredImports,
    });
  }
}
