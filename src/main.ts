import { CommonModuleAnalyzer } from "./analyzers/common-module-analyzer";
import { ImportAnalyzer } from "./analyzers/last-analyzer";
import { StandaloneCustomTagsAnalyzer } from "./analyzers/standalone-custom-tags-analyzer";
import { StandaloneToMigrateAnalyzer } from "./analyzers/standalone-to-migrate-analyzer";
import { StandaloneUnusedImportsAnalyzer } from "./analyzers/standalone-unused-imports-analyzer";
import { AnalyzerType } from "./enums/AnalyzerType";

const args = process.argv.slice(2);

// if (args.some((a) => a === AnalyzerType.CommonModule)) {
// }

// if (args.some((a) => a === AnalyzerType.StandaloneUnusedImports)) {
// }

// if (args.some((a) => a === AnalyzerType.StandaloneToMigrate)) {
// }

// CommonModuleAnalyzer.execute();
// StandaloneCustomTagsAnalyzer.generateCustomTagsReport();
// StandaloneToMigrateAnalyzer.execute();
// StandaloneUnusedImportsAnalyzer.mapProjectStructure();

ImportAnalyzer.findUnusedImports();
