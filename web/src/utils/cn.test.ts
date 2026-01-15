import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('merges class names and filters falsy values', () => {
    const result = cn('button', undefined, false, 'primary');

    expect(result).toBe('button primary');
  });
});
