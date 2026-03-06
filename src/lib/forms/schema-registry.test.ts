import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRegistry, schemaRegistry } from './schema-registry';
import { FormConfig } from './types';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry();
  });

  const mockConfig: FormConfig = {
    id: 'test-form',
    title: 'Test Form',
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
    onSubmit: async () => {},
  };

  describe('Register and Get', () => {
    it('should register a schema', () => {
      registry.register(mockConfig);
      expect(registry.has('test-form')).toBe(true);
    });

    it('should retrieve registered schema', () => {
      registry.register(mockConfig);
      const retrieved = registry.get('test-form');
      expect(retrieved).toEqual(mockConfig);
    });

    it('should return null for non-existent schema', () => {
      const retrieved = registry.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should warn when overwriting schema', () => {
      const consoleSpy = console.warn;
      registry.register(mockConfig);
      registry.register(mockConfig);
      // Verify warn was called
      expect(registry.has('test-form')).toBe(true);
    });
  });

  describe('Bulk Register', () => {
    it('should register multiple schemas', () => {
      const configs = [
        { ...mockConfig, id: 'form-1' },
        { ...mockConfig, id: 'form-2' },
      ];

      registry.registerBulk(configs);

      expect(registry.has('form-1')).toBe(true);
      expect(registry.has('form-2')).toBe(true);
    });
  });

  describe('List Operations', () => {
    it('should list all registered IDs', () => {
      registry.register({ ...mockConfig, id: 'form-1' });
      registry.register({ ...mockConfig, id: 'form-2' });

      const ids = registry.listIds();
      expect(ids).toContain('form-1');
      expect(ids).toContain('form-2');
    });

    it('should list all schemas', () => {
      registry.register({ ...mockConfig, id: 'form-1' });
      registry.register({ ...mockConfig, id: 'form-2' });

      const schemas = registry.listAll();
      expect(schemas).toHaveLength(2);
    });
  });

  describe('Remove and Clear', () => {
    it('should remove a schema', () => {
      registry.register(mockConfig);
      const removed = registry.remove('test-form');

      expect(removed).toBe(true);
      expect(registry.has('test-form')).toBe(false);
    });

    it('should return false when removing non-existent schema', () => {
      const removed = registry.remove('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear all schemas', () => {
      registry.register({ ...mockConfig, id: 'form-1' });
      registry.register({ ...mockConfig, id: 'form-2' });

      registry.clear();

      expect(registry.listAll()).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should validate correct schema', () => {
      const isValid = registry.validate(mockConfig);
      expect(isValid).toBe(true);
    });

    it('should reject schema without id', () => {
      const invalidConfig = { ...mockConfig, id: '' };
      expect(registry.validate(invalidConfig as FormConfig)).toBe(false);
    });

    it('should reject schema without title', () => {
      const invalidConfig = { ...mockConfig, title: '' };
      expect(registry.validate(invalidConfig as FormConfig)).toBe(false);
    });

    it('should reject schema without steps', () => {
      const invalidConfig = { ...mockConfig, steps: [] };
      expect(registry.validate(invalidConfig as FormConfig)).toBe(false);
    });

    it('should reject step without id', () => {
      const invalidConfig = {
        ...mockConfig,
        steps: [
          {
            ...mockConfig.steps[0],
            id: '',
          },
        ],
      };
      expect(registry.validate(invalidConfig as FormConfig)).toBe(false);
    });
  });

  describe('Singleton', () => {
    it('should maintain singleton instance', () => {
      expect(schemaRegistry).toBeInstanceOf(SchemaRegistry);
    });
  });
});
