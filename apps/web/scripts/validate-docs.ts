#!/usr/bin/env node

/**
 * Documentation Example Validation Script
 * 
 * Validates all YAML configuration examples in documentation files
 * against the project configuration schema.
 * 
 * Usage:
 *   pnpm validate-docs
 *   node apps/web/scripts/validate-docs.ts [directory]
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { parseYamlConfig } from '@stride/yaml-config';

interface ValidationResult {
  file: string;
  blockIndex: number;
  valid: boolean;
  errors?: string[];
  yaml?: string;
}

interface ValidationSummary {
  totalFiles: number;
  totalBlocks: number;
  validBlocks: number;
  invalidBlocks: number;
  results: ValidationResult[];
}

/**
 * Extract YAML code blocks from markdown content
 */
function extractYamlBlocks(content: string): string[] {
  const yamlBlocks: string[] = [];
  // Match ```yaml ... ``` blocks (with optional yaml language identifier variations)
  const codeBlockRegex = /```(?:yaml|yml)\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const yamlContent = match[1]?.trim();
    // Skip empty blocks or if match[1] is undefined
    if (yamlContent && yamlContent.length > 0) {
      yamlBlocks.push(yamlContent);
    }
  }

  return yamlBlocks;
}

/**
 * Validate a YAML block against the schema
 */
async function validateYamlBlock(yamlContent: string): Promise<{
  valid: boolean;
  errors?: string[];
}> {
  try {
    const result = parseYamlConfig(yamlContent);

    if (result.success) {
      return { valid: true };
    } else {
      const errors =
        result.errors?.map((e) => {
          const pathStr = e.path.length > 0 ? e.path.join('.') : 'root';
          const lineInfo = e.line ? ` (line ${e.line})` : '';
          return `${pathStr}: ${e.message}${lineInfo}`;
        }) || ['Validation failed'];

      return {
        valid: false,
        errors,
      };
    }
  } catch (error) {
    return {
      valid: false,
      errors: [
        error instanceof Error ? error.message : 'Unknown validation error',
      ],
    };
  }
}

/**
 * Recursively find all markdown files in a directory
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other ignored directories
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.next'
      ) {
        continue;
      }
      const subFiles = await findMarkdownFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && extname(entry.name) === '.md') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Validate all documentation files
 */
async function validateDocumentation(
  docsDir: string = join(process.cwd(), 'docs'),
): Promise<ValidationSummary> {
  console.log(`🔍 Scanning documentation in: ${docsDir}\n`);

  const markdownFiles = await findMarkdownFiles(docsDir);
  const results: ValidationResult[] = [];

  console.log(`Found ${markdownFiles.length} markdown file(s)\n`);

  for (const file of markdownFiles) {
    const content = await readFile(file, 'utf-8');
    const yamlBlocks = extractYamlBlocks(content);

    if (yamlBlocks.length === 0) {
      continue; // Skip files without YAML blocks
    }

    console.log(`📄 ${file}`);
    console.log(`   Found ${yamlBlocks.length} YAML block(s)`);

    for (const [index, yamlBlock] of yamlBlocks.entries()) {
      const validation = await validateYamlBlock(yamlBlock);
      const relativePath = file.replace(process.cwd() + '/', '');

      const result: ValidationResult = {
        file: relativePath,
        blockIndex: index + 1,
        valid: validation.valid,
        errors: validation.errors,
        yaml: yamlBlock.split('\n').slice(0, 3).join('\n'), // First 3 lines for context
      };

      results.push(result);

      if (validation.valid) {
        console.log(`   ✅ Block ${index + 1}: Valid`);
      } else {
        console.log(`   ❌ Block ${index + 1}: Invalid`);
        if (validation.errors) {
          validation.errors.forEach((error) => {
            console.log(`      - ${error}`);
          });
        }
      }
    }
    console.log('');
  }

  const validBlocks = results.filter((r) => r.valid).length;
  const invalidBlocks = results.filter((r) => !r.valid).length;

  return {
    totalFiles: markdownFiles.length,
    totalBlocks: results.length,
    validBlocks,
    invalidBlocks,
    results,
  };
}

/**
 * Print summary report
 */
function printSummary(summary: ValidationSummary): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary');
  console.log('='.repeat(60));
  console.log(`Total files scanned: ${summary.totalFiles}`);
  console.log(`Total YAML blocks: ${summary.totalBlocks}`);
  console.log(`✅ Valid blocks: ${summary.validBlocks}`);
  console.log(`❌ Invalid blocks: ${summary.invalidBlocks}`);
  console.log('='.repeat(60) + '\n');

  if (summary.invalidBlocks > 0) {
    console.log('❌ Validation failed! Invalid YAML blocks found:\n');
    summary.results
      .filter((r) => !r.valid)
      .forEach((result) => {
        console.log(`📄 ${result.file} (Block ${result.blockIndex})`);
        if (result.errors) {
          result.errors.forEach((error) => {
            console.log(`   - ${error}`);
          });
        }
        if (result.yaml) {
          console.log(`   YAML preview:\n   ${result.yaml.split('\n').map(line => `   ${line}`).join('\n')}\n   ...`);
        }
        console.log('');
      });
    process.exit(1);
  } else {
    console.log('✅ All documentation examples are valid!\n');
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const docsDir =
    args[0] || join(process.cwd(), 'docs');

  try {
    const summary = await validateDocumentation(docsDir);
    printSummary(summary);
  } catch (error) {
    console.error('❌ Error validating documentation:', error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { validateDocumentation, extractYamlBlocks, validateYamlBlock };
