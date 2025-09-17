import fs from "fs";
import debug, { Debugger } from "debug";
import { Loader, MemoryCache } from "rgcache";
import { RegrafContext } from "regraf/typings/context.d";
import { Language } from "./Language";
import { LanguageContext } from "./LanguageContext";

export class LanguageController {
    private static debug: Debugger = debug("regraf:i18n");

    cache: MemoryCache<string, any, void>;
    languageResolver: (ctx: RegrafContext) => string | string[];
    fallbackLanguage: string;

    /**
     * Constructs a new instance of the class.
     *
     * @param {LanguageControllerOptions} options - An object containing configuration settings.
     * @param {number} [options.ttl] - Time-to-live for cache entries in seconds. If not provided, defaults to Number.MAX_VALUE.
     * @param {Function} [options.loader] - A function to load the language data. If not provided, defaults to an asynchronous function returning an empty object.
     * @param {string} [options.fallbackLanguage] - The default fallback language. If not provided, defaults to "en".
     * @param {Function} [options.languageResolver] - A function to resolve the language. If not provided, defaults to the defaultLanguageResolver.
     *
     * @return {void} This constructor does not return a value.
     */
    constructor(options: LanguageControllerOptions) {
        this.cache = new MemoryCache<string, any, void>({
            ttl: options.ttl ?? Number.MAX_VALUE,
            loader: options.loader ?? (async (lang: string | string[]) => {
                return {};
            })
        });
        this.fallbackLanguage = options.fallbackLanguage ?? "en";
        this.languageResolver = options.languageResolver ?? this.defaultLanguageResolver;

        this.middleware = this.middleware.bind(this);
    }

    private defaultLanguageResolver(ctx: RegrafContext): string | string[] {
        return ctx.from?.language_code ?? this.fallbackLanguage;
    }

    /**
     * Preloads language files from a specified folder or file path. If the provided path is a directory,
     * it recursively traverses through files and directories to load JSON language files into the cache.
     * Non-JSON files are skipped.
     *
     * @param {string} folderOrFile - The path to a folder or a file to preload language data from.
     * If a directory is specified, all JSON files within the directory structure are loaded.
     * If a JSON file path is specified, it is directly loaded into the cache.
     * @return {void} Returns nothing. The language data from valid JSON files is added to the cache.
     */
    public preloadLanguages(folderOrFile: string): void {
        LanguageController.debug("preloadLanguages", folderOrFile);
        if (!fs.existsSync(folderOrFile)) return;
        if (fs.lstatSync(folderOrFile).isDirectory()) {
            fs.readdirSync(folderOrFile).forEach(file => {
                this.preloadLanguages(`${folderOrFile}/${file}`);
            });
        } else {
            if (folderOrFile.endsWith(".json")) {
                LanguageController.debug("preloadLanguages", folderOrFile, "parsing as JSON language file");
                this.cache.set(folderOrFile, JSON.parse(fs.readFileSync(folderOrFile, "utf8")));
            } else {
                LanguageController.debug("preloadLanguages", folderOrFile, "unknown file type, skipping");
            }
        }
    }

    public async middleware(ctx: LanguageContext, next: () => Promise<void>) {
        let languages = this.languageResolver(ctx);
        if(!Array.isArray(languages)) languages = [languages];
        for (let language of languages) {
            let languageData = await this.cache.get(language);
            if(!languageData) continue;
            ctx.lang = new Language(language, languageData);
            return await next();
        }
        LanguageController.debug("middleware", "no language found, using fallback language", languages, this.fallbackLanguage);
        ctx.lang = new Language(this.fallbackLanguage, await this.cache.get(this.fallbackLanguage));
        return await next();
    }
}

/**
 * Configuration options for the LanguageController.
 *
 * @interface
 */
export interface LanguageControllerOptions {
    /**
     * Represents a loader function that can asynchronously load language data.
     *
     * The loader function is optional and, if provided, adheres to the following structure:
     *
     * - Takes a single string input to identify language code which is needed to load.
     * - Returns a promise that resolves to a record where the keys are language string and the values are language data.
     */
    loader?: Loader<string, Record<string, string>, void>;
    /**
     * Represents the time-to-live (TTL) used to determine the duration (in seconds) for holding loaded language data in memory before expiration.
     * This property is optional and, if not provided, defaults to {@linkcode Number.MAX_VALUE}, which means the data will never expire.
     */
    ttl?: number;
    /**
     * A function that resolves the language or languages to be used in a given context.
     *
     * @param {RegrafContext} ctx - The context provided for resolving the language.
     * @returns {string | string[]} - Returns a single language as a string or an array of languages as strings.
     */
    languageResolver?: (ctx: RegrafContext) => string | string[];
    /**
     * Specifies the fallback language to be used when the desired language is not available.
     * This variable can help ensure that content is displayed in a default language
     * when the primary language option cannot be resolved.
     *
     * @type {string | undefined}
     */
    fallbackLanguage?: string;
}