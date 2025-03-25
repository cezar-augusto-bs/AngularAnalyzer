import { FileHelper } from "../helpers/file.helper";

interface ComponentWithTags {
  file: string;
  customTags: string[];
}

interface ComponentInfo {
  selector: string;
  isStandalone: boolean;
  imports: string[];
  module?: string;
}

export class ImportAnalyzer {
  public static findUnusedImports() {
    const componentsWithTags: ComponentWithTags[] = this.parseJson(
      FileHelper.readFile("outputs/standalone-custom-tags-output.json")
    );
    const componentsInfo: Record<string, ComponentInfo> = this.parseJson(
      FileHelper.readFile("outputs/componentsMap.json")
    );

    const unusedImports: Record<string, string[]> = {};

    console.log(componentsWithTags.length);
    componentsWithTags.forEach(({ file, customTags }) => {
      customTags.forEach((tag) => {
        Object.keys(componentsInfo).forEach((componentName) => {
          const componentData = componentsInfo[componentName];

          if (componentData.isStandalone && componentData.imports.length > 0) {
            componentData.imports.forEach((importedModule) => {
              if (
                !this.usedInAnyOtherComponent(importedModule, componentsInfo)
              ) {
                if (!unusedImports[componentName]) {
                  unusedImports[componentName] = [];
                }
                unusedImports[componentName].push(importedModule);
              }
            });
          }
        });
      });
    });

    FileHelper.writeFile("unusedImports.json", unusedImports);
  }

  private static usedInAnyOtherComponent(
    importedModule: string,
    componentsInfo: Record<string, ComponentInfo>
  ): boolean {
    return Object.values(componentsInfo).some((component) =>
      component.imports.includes(importedModule)
    );
  }

  public static displayUnusedImports(): void {
    const unusedImports = this.findUnusedImports();
    console.log("Imports desnecessários:", unusedImports);
  }

  private static parseJson(jsonContent: string): any {
    try {
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("Erro ao parsear JSON:", error);
      return [];
    }
  }
}
