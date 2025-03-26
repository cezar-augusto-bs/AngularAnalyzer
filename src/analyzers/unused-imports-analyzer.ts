import { FileHelper } from "../helpers/file.helper";
import { FileExtensions } from "../enums/FileExtensions";

export class UnusedComponentsImportsAnalyzer {
  private static readonly fileExtensions = [
    FileExtensions.Component,
    FileExtensions.Template,
  ];

  public static execute() {
    const modulesMap = this.getModulesMapping();
    const { componentsMap, componentsSelector } =
      this.getComponentsMapping(modulesMap);

    const unusedImports = this.getUnusedImportsInComponents(
      componentsSelector,
      componentsMap
    );

    this.removeUnusedImports(unusedImports, componentsMap);
  }

  public static removeUnusedImports(
    unusedImportsMap: ComponentMigrationMap,
    componentsMap: ComponentDetailsMap
  ) {
    for (const [componentName, unusedImports] of Object.entries(
      unusedImportsMap
    )) {
      const componentPath = componentsMap[componentName]?.path;
      if (!componentPath) {
        continue;
      }
      let fileContent = FileHelper.readFile(componentPath);

      const importsDeclarationMatch = fileContent.match(
        FileHelper.Regex.imports
      );
      if (!importsDeclarationMatch) {
        continue;
      }

      const contentBeforeComponentMatch = fileContent.match(
        /^(import\s.*?;[\s\n]*)+/gs
      );

      if (!contentBeforeComponentMatch) {
        continue;
      }
      const contentBeforeComponent = contentBeforeComponentMatch[0];

      const updatedContentBeforeComponent =
        contentBeforeComponentMatch[0].replace(
          FileHelper.Regex.importStatement,
          (match) => {
            if (
              unusedImports.some((unusedImport) => match.includes(unusedImport))
            ) {
              return "";
            }
            return match;
          }
        );

      let cleanedContentBeforeComponent = updatedContentBeforeComponent.replace(
        /\n\s*\n+/g,
        "\n"
      );

      fileContent = fileContent.replace(
        contentBeforeComponent,
        cleanedContentBeforeComponent
      );

      const importsDeclaration = importsDeclarationMatch[1];
      const updatedImports = unusedImports.reduce(
        (updatedContent, unusedImport) => {
          const importRegex = new RegExp(`(?:,?\s*${unusedImport}\s*)`, "g");
          return updatedContent
            .replace(importRegex, "")
            .replace(/\n\s*\n+/g, "\n")
            .replace(/,\s*,/g, ",");
        },
        importsDeclaration
      );

      let updatedContent = fileContent.replace(
        importsDeclaration,
        updatedImports
      );
      FileHelper.writeFile(componentPath, updatedContent);
    }
  }

  private static getUnusedImportsInComponents(
    componentsSelector: ComponentSelectorToClassMap,
    componentsMap: ComponentDetailsMap
  ) {
    const mappedComponents = new Set(Object.values(componentsSelector));

    const unusedImportsMap: ComponentMigrationMap = {};
    for (const [componentKey, componentMap] of Object.entries(componentsMap)) {
      const usedModules = new Set(
        componentMap.tags.map((tag) => componentsSelector[tag]).filter(Boolean)
      );

      const unusedImports = componentMap.imports.filter(
        (importItem) =>
          mappedComponents.has(importItem) && !usedModules.has(importItem)
      );

      if (unusedImports.length > 0) {
        unusedImportsMap[componentKey] = unusedImports;
      }
    }

    FileHelper.writeOutputFile(
      "unused-components-imports-output.json",
      unusedImportsMap
    );

    return unusedImportsMap;
  }

  private static getComponentsMapping(modulesMap: ComponentMigrationMap): {
    componentsMap: ComponentDetailsMap;
    componentsSelector: ComponentSelectorToClassMap;
  } {
    const files = [
      ...FileHelper.getFiles(FileHelper.ComponentsPath, this.fileExtensions),
      ...FileHelper.getFiles(FileHelper.SharedPath, this.fileExtensions),
    ];

    const componentsMap: ComponentDetailsMap = {};
    const componentsSelector: ComponentSelectorToClassMap = {};
    for (const file of files) {
      const content = FileHelper.readFile(file);
      const tagMatch = content.match(FileHelper.Regex.componentTag);
      const classNameMatch = content.match(FileHelper.Regex.className);
      if (!tagMatch || !classNameMatch) {
        continue;
      }

      const isStandalone = FileHelper.Regex.standalone.test(content);
      const importsMatch = content.match(FileHelper.Regex.imports);
      const className = classNameMatch[1];
      const selector = tagMatch[1];

      let imports: string[] = [];
      let module;
      if (isStandalone) {
        imports = importsMatch
          ? importsMatch[1]
              .split(",")
              .map((i: string) => i.trim())
              .filter(Boolean)
          : [];
      } else {
        module = Object.keys(modulesMap).find((module) =>
          modulesMap[module].includes(className)
        );
      }

      componentsMap[className] = {
        selector: selector,
        path: file,
        standalone: isStandalone,
        imports: imports,
        module: module,
        tags: this.getComponentsTags(file, content),
      };

      componentsSelector[selector] = isStandalone ? className : module ?? "";
    }

    FileHelper.writeOutputFile("components-map-output.json", componentsMap);
    // FileHelper.writeFile(
    //   "components-selector-map-output.json",
    //   componentsSelector
    // );

    return { componentsMap, componentsSelector };
  }

  public static getModulesMapping(): ComponentMigrationMap {
    const files = [
      ...FileHelper.getFiles(FileHelper.ComponentsPath, [
        FileExtensions.Module,
      ]),
      ...FileHelper.getFiles(FileHelper.SharedPath, [FileExtensions.Module]),
    ];

    const modulesMap: ComponentMigrationMap = {};
    for (const file of files) {
      const content = FileHelper.readFile(file);
      const moduleNameMatch = content.match(FileHelper.Regex.className);
      const ngModuleContentMatch = content.match(FileHelper.Regex.moduleName);
      if (!moduleNameMatch || !ngModuleContentMatch) {
        continue;
      }

      const declarationsMatch = ngModuleContentMatch[1].match(
        FileHelper.Regex.declarations
      );
      if (!declarationsMatch) {
        continue;
      }

      const moduleName = moduleNameMatch[1];
      const declaredComponents = declarationsMatch[1]
        .split(",")
        .map((i: string) => i.trim())
        .filter(Boolean);

      if (!modulesMap[moduleName]) {
        modulesMap[moduleName] = [];
      }
      modulesMap[moduleName].push(...declaredComponents);
    }

    // FileHelper.writeFile("modules-map-output.json", modulesMap);

    return modulesMap;
  }

  static getComponentsTags(file: string, content: string): string[] {
    const templatePath = FileHelper.resolveTemplatePath(file, content);
    if (!templatePath) {
      return [];
    }

    const templateContent = FileHelper.readFile(templatePath);
    const htmlTags = templateContent.match(FileHelper.Regex.htmlTagDeclaration);
    if (!htmlTags) {
      return [];
    }

    const customTags = htmlTags.map((tag) => {
      const match = tag.match(FileHelper.Regex.htmlTagName);
      return match ? match[1] : "";
    });

    return customTags.filter((tag) => tag.startsWith("app-"));
  }
}
