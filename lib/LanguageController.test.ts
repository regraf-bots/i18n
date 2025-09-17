import { LanguageController } from './LanguageController';
import { MemoryCache } from 'rgcache';
import { LanguageContext } from "./LanguageContext";
import fs from "fs";
import { Regraf } from "regraf";
import { expect, it, describe, vi }from 'vitest';

describe('LanguageController', () => {
    describe('constructor', () => {
        it('should initialize with default options', () => {
            const controller = new LanguageController({});
            expect(controller.fallbackLanguage).toBe('en');
            expect(typeof controller.languageResolver).toBe('function');
            expect(controller.cache).toBeInstanceOf(MemoryCache);
        });

        it('should initialize with custom options', () => {
            const customResolver = vi.fn();
            const controller = new LanguageController({
                ttl: 1000,
                fallbackLanguage: 'es',
                languageResolver: customResolver as any,
            });
            expect(controller.fallbackLanguage).toBe('es');
            expect(controller.languageResolver).toBe(customResolver);
            expect(controller.cache).toBeDefined();
        });
    });

    describe('preloadLanguages', () => {
        it('should not load anything if path does not exist', () => {
            const controller = new LanguageController({});
            vi.spyOn(fs, 'existsSync').mockReturnValue(false);

            controller.preloadLanguages('some/path');
            expect(fs.existsSync).toHaveBeenCalledWith('some/path');
        });

        it('should preload languages from JSON files', () => {
            const controller = new LanguageController({});
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs, 'lstatSync').mockReturnValue({isDirectory: () => false} as any);
            vi.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({key: 'value'}));

            const setSpy = vi.spyOn(controller.cache, 'set');

            controller.preloadLanguages('some/path/file.json');

            expect(fs.readFileSync).toHaveBeenCalledWith('some/path/file.json', 'utf8');
            expect(setSpy).toHaveBeenCalledWith('some/path/file.json', {key: 'value'});
        });

        it('should ignore non-JSON files', () => {
            const controller = new LanguageController({});
            vi.spyOn(fs, 'existsSync').mockReturnValue(true);
            vi.spyOn(fs, 'lstatSync').mockReturnValue({isDirectory: () => false} as any);

            const debugSpy = vi.spyOn(LanguageController as any, 'debug');

            controller.preloadLanguages('some/path/file.txt');

            expect(debugSpy).toHaveBeenCalledWith('preloadLanguages', 'some/path/file.txt', 'unknown file type, skipping');
        });
    });

    describe('middleware', () => {
        it('should load language based on the resolver', async () => {
            const mockLanguageData = {greeting: 'Hello'};
            const mockResolver = () => 'en';
            const controller = new LanguageController({
                languageResolver: mockResolver,
            });
            vi.spyOn(controller.cache, 'get').mockResolvedValue(mockLanguageData);
            const bot = new Regraf("mocked-token");
            bot.use(controller.middleware);

            bot.use((ctx: LanguageContext, next) => {
                expect(controller.cache.get).toHaveBeenCalledWith('en');
                expect(ctx.lang).toEqual(expect.objectContaining({languageCode: 'en', data: mockLanguageData}));
            });

            await bot.handleUpdate({
                update_id: 990,
                message: {
                    message_id: 992,
                    chat: {
                        id: 991,
                        type: 'private',
                        first_name: 'Bobr',
                    },
                    from: {
                        id: 993,
                        is_bot: false,
                        first_name: 'John',
                        last_name: 'Doe',
                        username: 'johndoe',
                        language_code: 'en',
                    },
                    text: 'Hello',
                    date: 1692288000,
                    entities: [],
                }
            });
        });

        it('should fallback to default language if none resolved', async () => {
            const mockLanguageData = {greeting: 'Hola'};
            const controller = new LanguageController({
                fallbackLanguage: 'es',
            });
            vi.spyOn(controller.cache, 'get').mockImplementation((key) =>
                Promise.resolve(key === 'es' ? mockLanguageData : null)
            );

            const bot = new Regraf("mocked-token");
            bot.use(controller.middleware);

            bot.on("message", (ctx: LanguageContext, next) => {
                expect(controller.cache.get).toHaveBeenCalledWith('es');
                expect(ctx.lang).toEqual(expect.objectContaining({languageCode: 'es', data: mockLanguageData}));
            });

            await bot.handleUpdate({
                update_id: 990,
                message: {
                    message_id: 992,
                    chat: {
                        id: 991,
                        type: 'private',
                        first_name: 'Bobr',
                    },
                    from: {
                        id: 993,
                        is_bot: false,
                        first_name: 'John',
                        last_name: 'Doe',
                        username: 'johndoe',
                        language_code: 'en',
                    },
                    text: 'Hello',
                    date: 1692288000,
                    entities: [],
                }
            })
        });
    });
});