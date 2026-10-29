#!/usr/bin/env node
import { runVariationsCleanup, CleanupOptions } from '../src/lib/cleanup-service';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
================================================================================
  CraftyKidsCo - Product Variations & Stock Data Cleanup Script
================================================================================

Usage:
  npx tsx --env-file=.env scripts/cleanup-variations.ts [options]

Options:
  --commit, --write       Execute write operations on MongoDB Atlas.
                          (Default is DRY-RUN mode, no changes are committed)
  --dry-run               Explicitly run in preview / dry-run mode.
  --disambiguate-skus     Automatically resolve duplicate SKUs with suffixes.
  --no-baseline           Skip creating initial baseline StockLog records.
  -h, --help              Show this help message.

Examples:
  # 1. Preview all changes without touching the database:
  npx tsx --env-file=.env scripts/cleanup-variations.ts

  # 2. Execute and commit cleanup to MongoDB Atlas:
  npx tsx --env-file=.env scripts/cleanup-variations.ts --commit

  # 3. Commit cleanup AND disambiguate duplicate SKUs:
  npx tsx --env-file=.env scripts/cleanup-variations.ts --commit --disambiguate-skus
================================================================================
`);
    process.exit(0);
  }

  const commit = args.includes('--commit') || args.includes('--write');
  const disambiguateSkus = args.includes('--disambiguate-skus');
  const createBaselineLogs = !args.includes('--no-baseline');

  const options: CleanupOptions = {
    dryRun: !commit,
    disambiguateSkus,
    createBaselineLogs,
  };

  console.log('\n================================================================================');
  console.log(`  STARTING MONGODB ATLAS VARIATIONS CLEANUP [${commit ? '⚠️ COMMIT / WRITE MODE' : '🔍 DRY-RUN PREVIEW MODE'}]`);
  console.log('================================================================================\n');

  const startTime = Date.now();

  try {
    const report = await runVariationsCleanup(options);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n--------------------------------------------------------------------------------');
    console.log('  CLEANUP EXECUTION REPORT');
    console.log('--------------------------------------------------------------------------------');
    console.log(`Mode:                           ${report.dryRun ? 'DRY RUN (Preview Only - No DB writes)' : 'COMMIT (Applied to MongoDB Atlas)'}`);
    console.log(`Total Products Scanned:         ${report.totalProductsScanned}`);
    console.log(`Variable Products Found:        ${report.variableProductsFound}`);
    console.log(`Simple Products Found:          ${report.simpleProductsFound}`);
    console.log(`Legacy Variations Migrated:     ${report.legacyVariationsMigrated}`);
    console.log(`Product-Level Fields Unset:     ${report.productLevelFieldsUnsetCount}`);
    console.log(`Invalid Sale Prices Nullified:  ${report.invalidSalePricesNullified}`);
    console.log(`Option Values Normalized:       ${report.optionValuesNormalized}`);
    console.log(`Duplicate SKU Groups Found:     ${report.duplicateSkusFound.length}`);
    console.log(`Baseline Stock Logs:            ${report.baselineStockLogsCreated} ${report.dryRun ? '(to create)' : '(created)'}`);
    console.log(`Execution Time:                 ${duration}s`);
    console.log('--------------------------------------------------------------------------------\n');

    if (report.duplicateSkusFound.length > 0) {
      console.log('⚠️  DUPLICATE SKUs:');
      for (const dup of report.duplicateSkusFound) {
        console.log(`  • SKU: "${dup.sku}" (${dup.occurrences.length} occurrences)`);
        dup.occurrences.forEach((occ, i) => {
          const newSkuInfo = dup.disambiguatedTo ? ` -> ${dup.disambiguatedTo[i]}` : '';
          console.log(`      [${i + 1}] Product: "${occ.productTitle}" (${occ.productId}) Option: "${occ.optionValue || 'Base'}"${newSkuInfo}`);
        });
      }
      console.log('');
    }

    if (report.changes.length > 0) {
      console.log(`📋  CHANGES (${report.changes.length} actions):`);
      report.changes.slice(0, 30).forEach((ch) => console.log(`  • ${ch}`));
      if (report.changes.length > 30) {
        console.log(`  ... and ${report.changes.length - 30} more actions.`);
      }
      console.log('');
    }

    if (report.dryRun) {
      console.log('💡  DRY-RUN COMPLETE. No actual database updates were committed.');
      console.log('👉  To apply these changes permanently to MongoDB Atlas, run:');
      console.log('    npx tsx --env-file=.env scripts/cleanup-variations.ts --commit --disambiguate-skus\n');
    } else {
      console.log('✅  CLEANUP COMMITTED SUCCESSFULLY TO MONGODB ATLAS!\n');
    }

    process.exit(0);
  } catch (err: any) {
    console.error('\n❌  Cleanup failed with error:', err.message || err);
    process.exit(1);
  }
}

main();
