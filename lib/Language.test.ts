// Language.test.ts
import { describe, expect, it, vi } from 'vitest';
import { Language } from './Language';

describe('Language class', () => {
    it('should construct with languageCode and data', () => {
        const lang = new Language('en', {greeting: 'Hello'});
        expect(lang.languageCode).toBe('en');
        expect(lang.data).toEqual({greeting: 'Hello'});
    });

    it('should translate a string without placeholders', () => {
        const lang = new Language('en', {greeting: 'Hello'});
        const result = lang.t('greeting');
        expect(result).toBe('Hello');
    });

    it('should replace placeholders in the translation string', () => {
        const lang = new Language('en', {welcome: 'Welcome, {{name}}!'});
        const result = lang.t('welcome', {name: 'John'});
        expect(result).toBe('Welcome, John!');
    });

    it('should replace array placeholders in order', () => {
        const lang = new Language('en', {pair: '%s and %s are friends.'});
        const result = lang.t('pair', ['Alice', 'Bob']);
        expect(result).toBe('Alice and Bob are friends.');
    });

    it('should return the correct count suffix', () => {
        const lang = new Language('en', {});
        const result1 = (lang as any).getCountSuffix(1);
        const result2 = (lang as any).getCountSuffix(4);
        const result3 = (lang as any).getCountSuffix(0);
        const result4 = (lang as any).getCountSuffix(11);
        expect(result1).toBe('.one');
        expect(result2).toBe('.few');
        expect(result3).toBe('.zero');
        expect(result4).toBe('.many');
    });

    it('should add a count suffix in translation when placeholders include "count"', () => {
        const lang = new Language('en', {
            'item.zero': 'No items',
            'item.one': 'One item',
            'item.few': '{{count}} items',
            'item.many': '{{count}} items'
        });

        const result = lang.t('item', {count: 2});
        expect(result).toBe('2 items');
    });

    it('should check if a translation exists', async () => {
        const lang = new Language('en', {welcome: 'Welcome!'});
        const result1 = await lang.has('welcome');
        const result2 = await lang.has('farewell');
        expect(result1).toBe(true);
        expect(result2).toBe(false);
    });

    it('should debug replacePlaceholders function correctly', () => {
        const debugMock = vi.fn();
        (Language as any).debug = debugMock;

        const lang = new Language('en', {welcome: 'Hello, {{name}}!'});
        lang.replacePlaceholders('Hello, {{name}}!', {name: 'Alice'});

        expect(debugMock).toHaveBeenCalledWith('replacePlaceholders', 'start', 'Hello, {{name}}!', {name: 'Alice'});
        expect(debugMock).toHaveBeenCalledWith('replacePlaceholders', 'end', 'Hello, Alice!');
    });
});