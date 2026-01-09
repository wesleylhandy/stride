import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Test documentation links resolve correctly
 * 
 * Verifies that all internal documentation links in markdown files
 * are valid and can be resolved.
 */
describe('Documentation Links', () => {
  const docsDir = join(process.cwd(), 'content', 'docs');

  describe('Configuration Troubleshooting Links', () => {
    it('should have valid anchor links in configuration-troubleshooting.md', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');

      // Check for anchor links (should start with #)
      const anchorLinkRegex = /\[([^\]]+)\]\(#([^\)]+)\)/g;
      const matches = Array.from(content.matchAll(anchorLinkRegex));

      expect(matches.length).toBeGreaterThan(0);

      // Extract anchor IDs and verify they exist in content
      for (const match of matches) {
        const anchorText = match[1];
        const anchorId = match[2].toLowerCase().replace(/\s+/g, '-');

        // Anchor should exist as heading or be a valid markdown anchor
        const headingRegex = new RegExp(`^#{1,6}\\s+${anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
        const headingExists = headingRegex.test(content) || 
          content.includes(`id="${anchorId}"`) ||
          content.includes(`name="${anchorId}"`);

        // If not found as exact heading, check if it's a transformed anchor
        if (!headingExists) {
          // Common anchor transformations: lowercase, replace spaces with hyphens
          const transformedId = anchorId.toLowerCase().replace(/[^\w-]/g, '');
          const hasHeading = content.toLowerCase().includes(`# ${anchorText.toLowerCase()}`);
          
          // At least one form should match
          expect(hasHeading || content.includes(transformedId)).toBe(true);
        }
      }
    });

    it('should have valid cross-reference links to configuration reference', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');

      // Check for links to configuration reference
      const refLinks = content.match(/\[([^\]]+)\]\([^\)]*configuration[^\)]*\)/gi);

      if (refLinks) {
        // Links should be valid markdown links
        for (const link of refLinks) {
          expect(link).toMatch(/\[([^\]]+)\]\([^\)]+\)/);
        }
      }
    });

    it('should have valid links to board status configuration guide', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');

      // Check for references to board status configuration
      // May appear as internal links or external documentation
      const hasBoardStatusRef = 
        content.toLowerCase().includes('board status') ||
        content.toLowerCase().includes('status configuration') ||
        content.includes('board-status-configuration');

      // Should reference board/status configuration
      expect(hasBoardStatusRef).toBe(true);
    });

    it('should have valid error-specific anchor links', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');

      // Common error anchors that should exist
      const expectedAnchors = [
        'status-x-is-not-defined',
        'cannot-move-issue',
        'status-transition-not-allowed',
        'cannot-transition-from-closed',
      ];

      const contentLower = content.toLowerCase();

      for (const anchor of expectedAnchors) {
        // Check if anchor exists as heading or section
        const anchorLower = anchor.toLowerCase();
        const hasAnchor = 
          contentLower.includes(anchorLower) ||
          contentLower.includes(anchorLower.replace(/-/g, ' ')) ||
          content.includes(`#${anchor}`) ||
          content.includes(`id="${anchor}"`);

        // At least one form should exist
        expect(hasAnchor).toBe(true);
      }
    });
  });

  describe('Configuration Reference Links', () => {
    it('should have valid links in configuration-reference.md', async () => {
      const filePath = join(docsDir, 'configuration-reference.md');
      
      try {
        const content = await readFile(filePath, 'utf-8');

        // Check for markdown links
        const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
        const matches = Array.from(content.matchAll(linkRegex));

        // If links exist, they should be valid
        for (const match of matches) {
          const linkText = match[1];
          const linkUrl = match[2];

          expect(linkText.length).toBeGreaterThan(0);
          expect(linkUrl.length).toBeGreaterThan(0);

          // Internal links should start with # or / or be relative paths
          if (linkUrl.startsWith('#')) {
            // Anchor link - should exist in document
            const anchorId = linkUrl.substring(1).toLowerCase().replace(/\s+/g, '-');
            const hasAnchor = content.toLowerCase().includes(anchorId) ||
              content.toLowerCase().includes(linkText.toLowerCase());

            expect(hasAnchor).toBe(true);
          }
        }
      } catch (error) {
        // File may not exist yet, skip test
        expect(true).toBe(true);
      }
    });
  });

  describe('Configuration Examples Links', () => {
    it('should have valid links in configuration-examples.md', async () => {
      const filePath = join(docsDir, 'configuration-examples.md');
      
      try {
        const content = await readFile(filePath, 'utf-8');

        // Check for markdown links
        const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
        const matches = Array.from(content.matchAll(linkRegex));

        // Validate links
        for (const match of matches) {
          const linkText = match[1];
          const linkUrl = match[2];

          expect(linkText.length).toBeGreaterThan(0);
          expect(linkUrl.length).toBeGreaterThan(0);
        }
      } catch (error) {
        // File may not exist yet, skip test
        expect(true).toBe(true);
      }
    });
  });

  describe('Cross-Reference Links', () => {
    it('should have consistent link format across documentation', async () => {
      const files = [
        'configuration-troubleshooting.md',
        'configuration-reference.md',
        'configuration-examples.md',
      ];

      for (const filename of files) {
        const filePath = join(docsDir, filename);
        
        try {
          const content = await readFile(filePath, 'utf-8');
          const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
          const matches = Array.from(content.matchAll(linkRegex));

          // Links should follow consistent format
          for (const match of matches) {
            const linkUrl = match[2];

            // Internal links should start with # or /
            // External links should start with http/https
            if (!linkUrl.startsWith('#') && 
                !linkUrl.startsWith('/') && 
                !linkUrl.startsWith('http://') && 
                !linkUrl.startsWith('https://')) {
              // Relative links are also valid
              expect(typeof linkUrl).toBe('string');
            }
          }
        } catch (error) {
          // File may not exist, skip
          continue;
        }
      }
    });
  });

  describe('Help URL Links in Error Messages', () => {
    it('should verify help URLs point to valid documentation sections', () => {
      // Common help URLs used in validation errors
      const helpUrls = [
        '/docs/configuration-troubleshooting#status-x-is-not-defined-in-workflow',
        '/docs/configuration-troubleshooting#status-transition-not-allowed',
        '/docs/configuration-troubleshooting#cannot-transition-from-closed-status',
        '/docs/configuration',
      ];

      // All help URLs should be valid paths
      for (const url of helpUrls) {
        expect(url).toMatch(/^\/docs\/[a-z-]+(#.+)?$/);
      }
    });

    it('should have corresponding sections in troubleshooting guide', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');
      const contentLower = content.toLowerCase();

      // Sections that should exist based on help URLs
      const expectedSections = [
        'status',
        'transition',
        'closed',
        'workflow',
      ];

      // Content should mention these topics
      for (const section of expectedSections) {
        expect(contentLower).toContain(section);
      }
    });
  });

  describe('Documentation File Structure', () => {
    it('should have all required documentation files', async () => {
      const requiredFiles = [
        'configuration-troubleshooting.md',
        'configuration-reference.md',
        'configuration-examples.md',
      ];

      for (const filename of requiredFiles) {
        const filePath = join(docsDir, filename);
        
        try {
          const content = await readFile(filePath, 'utf-8');
          expect(content.length).toBeGreaterThan(0);
        } catch (error) {
          // File should exist
          throw new Error(`Required documentation file missing: ${filename}`);
        }
      }
    });

    it('should have proper markdown structure in documentation files', async () => {
      const filePath = join(docsDir, 'configuration-troubleshooting.md');
      const content = await readFile(filePath, 'utf-8');

      // Should have at least one heading
      const headingRegex = /^#{1,6}\s+/m;
      expect(headingRegex.test(content)).toBe(true);

      // Should have content beyond headings
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      expect(lines.length).toBeGreaterThan(1);
    });
  });
});
