import * as fs from "fs";
import * as path from "path";
import { FileExtensions } from "../enums/FileExtensions";

export class FileHelper {
  public static readonly ComponentsPath =
    "C:\\Repos\\VGR.Angular\\src\\app\\lazy-modules";
  public static readonly SharedPath =
    "C:\\Repos\\VGR.Angular\\src\\app\\shared";

  public static readonly Utf8 = "utf8";

  public static readonly Regex = {
    standalone: /standalone:\s*true/,
    imports: /imports:\s*\[([^\]]*)\]/,
    declarations: /declarations:\s*\[([^\]]*)\]/,
    importStatement: /import\s+.*?from\s+['"].*?['"];?/g,
    componentTag: /selector:\s*['"]([^'"]+)['"],/,
    className: /export\s+class\s+(\w+)/,
    moduleName: /@NgModule\(\{([\s\S]*?)\}\)/,
    templateUrl: /templateUrl:\s*['"]([^'"]+)['"]/,
    styleUrls: /styleUrls:\s*\[([^\]]*)\]/,
    commonModule:
      /import\s*\{[^}]*CommonModule[^}]*\}\s*from\s*['"]@angular\/common['"]/,
    ngFeatures: /\*ngIf=|\*ngFor=/,
    commonPipes: /\|\s*(date|uppercase|lowercase)/,
    commonDirectives: /\bngClass\b|\bngStyle\b/,
    htmlTagDeclaration: /<([a-zA-Z0-9-]+)[^>]*>/g,
    htmlTagName: /<([a-zA-Z0-9-]+)/,
  };

  static getFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...FileHelper.getFiles(fullPath, extensions));
      } else if (extensions.some((e) => entry.endsWith(e))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  static readFile(filePath: string): string {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, this.Utf8) : "";
  }

  static writeOutputFile(fileName: string, data: any): void {
    fs.writeFileSync(`outputs/${fileName}`, JSON.stringify(data, null, 2));
  }

  static writeFile(fileName: string, data: any): void {
    fs.writeFileSync(fileName, data);
  }

  static resolveTemplatePath(file: string, content: string) {
    let templatePath = "";

    const templateUrlMatch = content.match(FileHelper.Regex.templateUrl);
    if (templateUrlMatch) {
      const templateFile = templateUrlMatch[1];

      templatePath = templateFile;
      if (templatePath.endsWith(FileExtensions.Template)) {
        templatePath = path.resolve(path.dirname(file), templateFile);
      } else {
        templatePath = path.resolve(
          path.dirname(file),
          `${path.basename(file, ".ts")}.html`
        );
      }
    }

    return templatePath;
  }
}
