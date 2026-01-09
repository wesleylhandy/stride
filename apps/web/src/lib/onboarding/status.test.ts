import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isOnboardingComplete, shouldRedirectToOnboarding } from './status';
import { projectRepository } from '@stride/database';

// Mock the projectRepository
vi.mock('@stride/database', () => ({
  projectRepository: {
    count: vi.fn(),
  },
}));

describe('onboarding status helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('isOnboardingComplete', () => {
    it('should return true when user has at least one project', async () => {
      // Mock: projects exist in the system
      vi.mocked(projectRepository.count).mockResolvedValueOnce(1);

      const result = await isOnboardingComplete('user-123');
      
      expect(result).toBe(true);
      expect(projectRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return true when user has multiple projects', async () => {
      // Mock: multiple projects exist
      vi.mocked(projectRepository.count).mockResolvedValueOnce(5);

      const result = await isOnboardingComplete('user-123');
      
      expect(result).toBe(true);
      expect(projectRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return false when user has no projects', async () => {
      // Mock: no projects exist
      vi.mocked(projectRepository.count).mockResolvedValueOnce(0);

      const result = await isOnboardingComplete('user-123');
      
      expect(result).toBe(false);
      expect(projectRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return false when project count is zero', async () => {
      // Mock: zero projects
      vi.mocked(projectRepository.count).mockResolvedValueOnce(0);

      const result = await isOnboardingComplete('user-456');
      
      expect(result).toBe(false);
    });
  });

  describe('shouldRedirectToOnboarding', () => {
    it('should return false when onboarding is complete (has projects)', async () => {
      // Mock: projects exist
      vi.mocked(projectRepository.count).mockResolvedValueOnce(1);

      const result = await shouldRedirectToOnboarding('user-123');
      
      expect(result).toBe(false);
      expect(projectRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return true when onboarding is incomplete (no projects)', async () => {
      // Mock: no projects exist
      vi.mocked(projectRepository.count).mockResolvedValueOnce(0);

      const result = await shouldRedirectToOnboarding('user-123');
      
      expect(result).toBe(true);
      expect(projectRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return the inverse of isOnboardingComplete', async () => {
      // Test that it's truly the inverse
      vi.mocked(projectRepository.count).mockResolvedValueOnce(0);
      
      const redirect = await shouldRedirectToOnboarding('user-123');
      const complete = await isOnboardingComplete('user-123');
      
      expect(redirect).toBe(!complete);
    });
  });
});
