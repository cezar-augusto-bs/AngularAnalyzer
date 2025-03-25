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

    this.analyzeUnusedImports(componentsSelector, componentsMap);
  }

  private static analyzeUnusedImports(
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

    FileHelper.writeFile(
      "unused-components-imports-output.json",
      unusedImportsMap
    );
  }

  private static getComponentsMapping(modulesMap: ComponentMigrationMap) {
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
        standalone: isStandalone,
        imports: imports,
        module: module,
        tags: this.getComponentsTags(file, content),
      };

      componentsSelector[selector] = isStandalone ? className : module ?? "";
    }

    // FileHelper.writeFile("components-map-output.json", componentsMap);
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
