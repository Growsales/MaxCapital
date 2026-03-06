import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { draftManager } from './draft-manager';

describe('DraftManager', () => {
  const formId = 'test-form';
  const testData = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Save and Load', () => {
    it('should save draft to localStorage', () => {
      draftManager.saveDraft(formId, testData);
      expect(localStorage.getItem(`maxcapital_draft_${formId}`)).toBeTruthy();
    });

    it('should load saved draft', () => {
      draftManager.saveDraft(formId, testData);
      const loaded = draftManager.loadDraft(formId);

      expect(loaded).toEqual(testData);
    });

    it('should return null for non-existent draft', () => {
      const loaded = draftManager.loadDraft('non-existent');
      expect(loaded).toBeNull();
    });
  });

  describe('Draft Existence', () => {
    it('should detect existing draft', () => {
      draftManager.saveDraft(formId, testData);
      expect(draftManager.hasDraft(formId)).toBe(true);
    });

    it('should detect non-existent draft', () => {
      expect(draftManager.hasDraft('non-existent')).toBe(false);
    });
  });

  describe('Clear Draft', () => {
    it('should clear draft from localStorage', () => {
      draftManager.saveDraft(formId, testData);
      draftManager.clearDraft(formId);

      expect(draftManager.hasDraft(formId)).toBe(false);
    });
  });

  describe('Draft Timestamp', () => {
    it('should return draft timestamp', () => {
      draftManager.saveDraft(formId, testData);
      const timestamp = draftManager.getDraftTimestamp(formId);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp?.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return null for non-existent draft timestamp', () => {
      const timestamp = draftManager.getDraftTimestamp('non-existent');
      expect(timestamp).toBeNull();
    });
  });

  describe('Expiration', () => {
    it('should remove expired draft', () => {
      // Save with 1 second TTL
      draftManager.saveDraft(formId, testData, 0.0001);

      // Wait for expiration
      setTimeout(() => {
        const loaded = draftManager.loadDraft(formId);
        expect(loaded).toBeNull();
      }, 100);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired drafts', () => {
      // Save multiple drafts
      draftManager.saveDraft('form-1', { data: 1 }, 0.0001);
      draftManager.saveDraft('form-2', { data: 2 }, 0.0001);
      draftManager.saveDraft('form-3', { data: 3 });

      setTimeout(() => {
        const cleaned = draftManager.cleanupExpiredDrafts();
        expect(cleaned).toBeGreaterThan(0);
      }, 100);
    });
  });

  describe('Multiple Forms', () => {
    it('should handle multiple form drafts independently', () => {
      const data1 = { name: 'Form 1' };
      const data2 = { name: 'Form 2' };

      draftManager.saveDraft('form-1', data1);
      draftManager.saveDraft('form-2', data2);

      expect(draftManager.loadDraft('form-1')).toEqual(data1);
      expect(draftManager.loadDraft('form-2')).toEqual(data2);
    });

    it('should clear only specific form draft', () => {
      draftManager.saveDraft('form-1', { data: 1 });
      draftManager.saveDraft('form-2', { data: 2 });

      draftManager.clearDraft('form-1');

      expect(draftManager.hasDraft('form-1')).toBe(false);
      expect(draftManager.hasDraft('form-2')).toBe(true);
    });
  });
});
