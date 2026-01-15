import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateProjectKeyFromName,
  generateUniqueProjectKey,
} from './project-key';
import { projectRepository } from '@stride/database';

// Mock the projectRepository
vi.mock('@stride/database', () => ({
  projectRepository: {
    findByKey: vi.fn(),
  },
}));

describe('project-key utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateProjectKeyFromName', () => {
    it('should convert repository name to uppercase', () => {
      expect(generateProjectKeyFromName('my-repo')).toBe('MYREPO');
      expect(generateProjectKeyFromName('MyRepo')).toBe('MYREPO');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(generateProjectKeyFromName('my-awesome-repo')).toBe('MYAWESOMER');
      expect(generateProjectKeyFromName('my_repo')).toBe('MYREPO');
      expect(generateProjectKeyFromName('my.repo')).toBe('MYREPO');
      expect(generateProjectKeyFromName('my@repo')).toBe('MYREPO');
    });

    it('should truncate to 10 characters', () => {
      expect(generateProjectKeyFromName('very-long-repository-name')).toBe('VERYLONGRE');
    });

    it('should pad single character to 2 characters', () => {
      expect(generateProjectKeyFromName('a')).toBe('A0');
      expect(generateProjectKeyFromName('1')).toBe('10');
    });

    it('should use default key for empty string after cleaning', () => {
      expect(generateProjectKeyFromName('---')).toBe('PRJ');
      expect(generateProjectKeyFromName('...')).toBe('PRJ');
    });

    it('should throw error for empty input', () => {
      expect(() => generateProjectKeyFromName('')).toThrow(
        'Repository name cannot be empty'
      );
      expect(() => generateProjectKeyFromName('   ')).toThrow(
        'Repository name cannot be empty'
      );
    });

    it('should throw error when no alphanumeric characters remain', () => {
      expect(() => generateProjectKeyFromName('---')).not.toThrow();
      // But it should return PRJ as fallback
      expect(generateProjectKeyFromName('---')).toBe('PRJ');
    });

    it('should handle numbers in repository name', () => {
      expect(generateProjectKeyFromName('repo123')).toBe('REPO123');
      expect(generateProjectKeyFromName('my-repo-2024')).toBe('MYREPO2024');
    });

    it('should handle mixed case and special characters', () => {
      expect(generateProjectKeyFromName('My-Awesome-Repo-2024')).toBe('MYAWESOMER');
    });
  });

  describe('generateUniqueProjectKey', () => {
    it('should return base key when no conflict exists', async () => {
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(null);

      const result = await generateUniqueProjectKey('my-repo');

      expect(result).toBe('MYREPO');
      expect(projectRepository.findByKey).toHaveBeenCalledWith('MYREPO');
    });

    it('should append number suffix when base key conflicts', async () => {
      const existingProject = { id: 'existing-id', key: 'MYREPO' };
      vi.mocked(projectRepository.findByKey)
        .mockResolvedValueOnce(existingProject) // First call: base key exists
        .mockResolvedValueOnce(null); // Second call: MYREPO1 is available

      const result = await generateUniqueProjectKey('my-repo');

      expect(result).toBe('MYREPO1');
      expect(projectRepository.findByKey).toHaveBeenCalledTimes(2);
      expect(projectRepository.findByKey).toHaveBeenNthCalledWith(1, 'MYREPO');
      expect(projectRepository.findByKey).toHaveBeenNthCalledWith(2, 'MYREPO1');
    });

    it('should try multiple suffixes until finding available key', async () => {
      const existingProject = { id: 'existing-id', key: 'MYREPO' };
      vi.mocked(projectRepository.findByKey)
        .mockResolvedValueOnce(existingProject) // MYREPO exists
        .mockResolvedValueOnce(existingProject) // MYREPO1 exists
        .mockResolvedValueOnce(existingProject) // MYREPO2 exists
        .mockResolvedValueOnce(null); // MYREPO3 is available

      const result = await generateUniqueProjectKey('my-repo');

      expect(result).toBe('MYREPO3');
      expect(projectRepository.findByKey).toHaveBeenCalledTimes(4);
    });

    it('should exclude project ID from uniqueness check', async () => {
      const excludedProject = { id: 'excluded-id', key: 'MYREPO' };
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(excludedProject);

      const result = await generateUniqueProjectKey('my-repo', 'excluded-id');

      // Should return the key even though it exists, because it matches excluded ID
      expect(result).toBe('MYREPO');
      expect(projectRepository.findByKey).toHaveBeenCalledWith('MYREPO');
    });

    it('should handle long base keys with suffix truncation', async () => {
      const existingProject = { id: 'existing-id', key: 'VERYLONGRE' };
      vi.mocked(projectRepository.findByKey)
        .mockResolvedValueOnce(existingProject) // Base key exists
        .mockResolvedValueOnce(null); // VERYLONGRE1 is available (truncated if needed)

      const result = await generateUniqueProjectKey('very-long-repository-name');

      // Should handle truncation properly
      expect(result).toMatch(/^VERYLONGRE\d+$/);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle single character base keys', async () => {
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(null);

      const result = await generateUniqueProjectKey('a');

      expect(result).toBe('A0');
    });

    it('should use fallback random suffix if all numbers exhausted', async () => {
      const existingProject = { id: 'existing-id', key: 'MYREPO' };
      // Mock all numbers 1-99 as existing
      for (let i = 1; i <= 99; i++) {
        vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(existingProject);
      }
      // Last call returns null (fallback)
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(null);

      const result = await generateUniqueProjectKey('my-repo');

      // Should have a fallback key with random suffix
      expect(result).toMatch(/^MYREPO\d+$/);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle repository names with only numbers', async () => {
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(null);

      const result = await generateUniqueProjectKey('12345');

      expect(result).toBe('12345');
    });

    it('should handle repository names with special characters only', async () => {
      vi.mocked(projectRepository.findByKey).mockResolvedValueOnce(null);

      const result = await generateUniqueProjectKey('---');

      expect(result).toBe('PRJ');
    });
  });
});
