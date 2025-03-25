import { CommonModuleAnalyzer } from "./analyzers/common-module-analyzer";
import { StandaloneMigrationAnalyzer } from "./analyzers/standalone-migration-analyzer";
import { UnusedComponentsImportsAnalyzer as UnusedImportsAnalyzer } from "./analyzers/unused-imports-analyzer";
import { AnalyzerType } from "./enums/AnalyzerType";

const args = process.argv.slice(2);

if (args.some((a) => a === AnalyzerType.CommonModule)) {
  CommonModuleAnalyzer.execute();
}

if (args.some((a) => a === AnalyzerType.UnusedImports)) {
  UnusedImportsAnalyzer.execute();
}

if (args.some((a) => a === AnalyzerType.StandaloneMigration)) {
  StandaloneMigrationAnalyzer.execute();
}
