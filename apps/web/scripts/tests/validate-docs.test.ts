import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { load } from 'js-yaml';
import { parseYamlConfig } from '@stride/yaml-config';

/**
 * Validate YAML examples in documentation
 * 
 * This is a test utility that validates all YAML code blocks in documentation files
 * against the configuration schema.
 */
async function validateYamlExample(yamlContent: string): Promise<{ valid: boolean; errors?: string[] }> {
  try {
    // Use the actual parse and validation function from yaml-config package
    const result = parseYamlConfig(yamlContent);
    
    if (result.success) {
      return { valid: true };
    } else {
      return {
        valid: false,
        errors: result.errors?.map((e) => {
          const pathStr = e.path.length > 0 ? e.path.join('.') : 'root';
          const lineInfo = e.line ? ` (line ${e.line})` : '';
          return `${pathStr}: ${e.message}${lineInfo}`;
        }) || ['Validation failed'],
      };
    }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Extract YAML code blocks from markdown
 */
function extractYamlBlocks(markdown: string): string[] {
  const yamlBlocks: string[] = [];
  const codeBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    yamlBlocks.push(match[1].trim());
  }

  return yamlBlocks;
}

describe('Documentation Example Validation', () => {
  const docsDir = join(process.cwd(), 'content', 'docs');

  describe('Configuration Examples File', () => {
    it('should validate all YAML examples in configuration-examples.md', async () => {
      const examplesPath = join(docsDir, 'configuration-examples.md');
      const content = await readFile(examplesPath, 'utf-8');
      const yamlBlocks = extractYamlBlocks(content);

      expect(yamlBlocks.length).toBeGreaterThan(0);

      for (const [index, yamlBlock] of yamlBlocks.entries()) {
        const result = await validateYamlExample(yamlBlock);
        expect(result.valid).toBe(true);
      }
    });

    it('should have valid YAML syntax in all code blocks', async () => {
      const examplesPath = join(docsDir, 'configuration-examples.md');
      const content = await readFile(examplesPath, 'utf-8');
      const yamlBlocks = extractYamlBlocks(content);

      for (const yamlBlock of yamlBlocks) {
        // Should not throw when parsing
        expect(() => load(yamlBlock)).not.toThrow();
      }
    });
  });

  describe('Configuration Reference File', () => {
    it('should validate YAML examples in configuration-reference.md', async () => {
      const referencePath = join(docsDir, 'configuration-reference.md');
      const content = await readFile(referencePath, 'utf-8');
      const yamlBlocks = extractYamlBlocks(content);

      // Reference may have examples
      if (yamlBlocks.length > 0) {
        for (const yamlBlock of yamlBlocks) {
          const result = await validateYamlExample(yamlBlock);
          expect(result.valid).toBe(true);
        }
      }
    });
  });

  describe('Configuration Troubleshooting File', () => {
    it('should validate YAML examples in configuration-troubleshooting.md', async () => {
      const troubleshootingPath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(troubleshootingPath, 'utf-8');
      const yamlBlocks = extractYamlBlocks(content);

      // Troubleshooting may have examples
      if (yamlBlocks.length > 0) {
        for (const yamlBlock of yamlBlocks) {
          const result = await validateYamlExample(yamlBlock);
          expect(result.valid).toBe(true);
        }
      }
    });
  });

  describe('YAML Code Block Extraction', () => {
    it('should extract YAML code blocks from markdown', () => {
      const markdown = `
# Test

\`\`\`yaml
project_key: TEST
project_name: Test
\`\`\`

Some text

\`\`\`yaml
workflow:
  default_status: todo
\`\`\`
      `;

      const blocks = extractYamlBlocks(markdown);
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain('project_key');
      expect(blocks[1]).toContain('workflow');
    });

    it('should handle code blocks with different languages', () => {
      const markdown = `
\`\`\`yaml
key: value
\`\`\`

\`\`\`json
{"key": "value"}
\`\`\`

\`\`\`yaml
another: example
\`\`\`
      `;

      const blocks = extractYamlBlocks(markdown);
      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toContain('key: value');
      expect(blocks[1]).toContain('another: example');
    });
  });

  describe('YAML Validation', () => {
    it('should validate correct YAML against schema', async () => {
      const validYaml = `
project_key: TEST
project_name: Test Project
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: open
custom_fields: []
automation_rules: []
      `;

      const result = await validateYamlExample(validYaml);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject YAML with missing required fields', async () => {
      const invalidYaml = `
project_key: TEST
# Missing project_name and workflow
      `;

      const result = await validateYamlExample(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject YAML with invalid status type', async () => {
      const invalidYaml = `
project_key: TEST
project_name: Test Project
workflow:
  default_status: todo
  statuses:
    - key: todo
      name: To Do
      type: invalid_type
      `;

      const result = await validateYamlExample(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle invalid YAML syntax gracefully', async () => {
      const invalidYaml = `
project_key: TEST
  invalid: indentation
      `;

      const result = await validateYamlExample(invalidYaml);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Documentation File Existence', () => {
    it('should have configuration-examples.md file', async () => {
      const examplesPath = join(docsDir, 'configuration-examples.md');
      const content = await readFile(examplesPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have configuration-reference.md file', async () => {
      const referencePath = join(docsDir, 'configuration-reference.md');
      const content = await readFile(referencePath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });

    it('should have configuration-troubleshooting.md file', async () => {
      const troubleshootingPath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(troubleshootingPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
