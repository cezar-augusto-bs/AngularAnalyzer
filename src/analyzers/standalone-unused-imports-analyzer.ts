import * as fs from "fs";
import * as path from "path";
import { FileHelper } from "../helpers/file.helper";
import { FileExtensions } from "../enums/FileExtensions";

export class StandaloneUnusedImportsAnalyzer {
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

  static mapProjectStructure(): {
    componentsMap: Record<
      string,
      { selector: string; isStandalone: boolean; imports: string[] }
    >;
  } {
    const componentsMap: Record<
      string,
      { selector: string; isStandalone: boolean; imports: string[] }
    > = {};

    const files = this.getFiles();

    const moduleMap = this.mapModule();

    files.forEach((file) => {
      const content = FileHelper.readFile(file);
      const tagMatch = content.match(FileHelper.Regex.componentTag);
      const classNameMatch = content.match(FileHelper.Regex.className);
      const isStandalone = FileHelper.Regex.standalone.test(content);
      const importsMatch = content.match(FileHelper.Regex.imports);

      if (tagMatch && classNameMatch) {
        const className = classNameMatch[1];
        const classSelector = tagMatch[1];
        const importsList = importsMatch
          ? importsMatch[1]
              .split(",")
              .map((imp: string) => imp.trim())
              .filter(Boolean)
          : [];

        const moduleName = !isStandalone
          ? Object.keys(moduleMap).find((module) =>
              moduleMap[module].includes(className)
            )
          : undefined;

        componentsMap[className] = {
          selector: classSelector,
          isStandalone,
          imports: importsList,
          ...(moduleName && { module: moduleName }),
        };
      }
    });

    FileHelper.writeFile("componentsMap.json", componentsMap);

    return { componentsMap };
  }

  public static mapModule() {
    const files = [
      ...FileHelper.getFiles(FileHelper.ComponentsPath, [
        FileExtensions.Module,
      ]),
      ...FileHelper.getFiles(FileHelper.SharedPath, [FileExtensions.Module]),
    ];

    const moduleMap = files.reduce<Record<string, string[]>>(
      (map, moduleFile) => {
        const content = FileHelper.readFile(moduleFile);
        const ngModuleContent = content.match(FileHelper.Regex.moduleName)?.[1];
        const moduleName = content.match(FileHelper.Regex.className)?.[1];

        if (!ngModuleContent || !moduleName) return map;

        const declaredComponents =
          ngModuleContent
            .match(FileHelper.Regex.declarations)?.[1]
            ?.split(",")
            .map((item: string) => item.trim())
            .filter(Boolean) ?? [];

        if (!map[moduleName]) {
          map[moduleName] = [];
        }

        map[moduleName].push(...declaredComponents);

        return map;
      },
      {}
    );

    FileHelper.writeFile("moduleMap.json", moduleMap);
    return moduleMap;
  }

  static generateUnusedImportsReport(): void {
    const files = this.getFiles();

    const report: any[] = [];

    files.forEach((file) => {
      const content = FileHelper.readFile(file);
      const importsMatch = content.match(FileHelper.Regex.imports);
      const templateUrlMatch = content.match(FileHelper.Regex.templateUrl);

      if (importsMatch && templateUrlMatch) {
        const imports = importsMatch[1]
          .split(",")
          .map((imp: string) => imp.trim())
          .filter(Boolean);
        const templateFile = templateUrlMatch[1];

        const templateContent = FileHelper.readFile(templateFile);

        const usedImports = this.checkImportsInTemplate(
          templateContent,
          imports
        );
        const unusedImports = imports.filter(
          (imp: string) => !usedImports.includes(imp)
        );

        if (unusedImports.length > 0) {
          report.push({
            file: file,
            unusedImports: unusedImports,
          });
        }
      }
    });

    FileHelper.writeFile("unusedImportsReport.json", report);
  }

  static checkImportsInTemplate(
    templateContent: string,
    imports: string[]
  ): string[] {
    const usedImports: string[] = [];

    imports.forEach((importStmt) => {
      const importName = importStmt.split("from")[0].trim();
      const regex = new RegExp(`\\b${importName}\\b`);

      if (regex.test(templateContent)) {
        usedImports.push(importStmt);
      }
    });

    return usedImports;
  }
}
