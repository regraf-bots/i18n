# @regraf/i18n

Internationalization (i18n) module for [Regraf](https://github.com/regraf-bots/regraf) - a modern fork of telegraf Telegram bot framework.

## Features

- 🌍 Multi-language support with fallback mechanism
- 📝 String interpolation with placeholders
- 🔢 Pluralization rules for different count values
- 💾 Memory caching with TTL support
- 🗂️ Automatic language file preloading
- 🎯 TypeScript support with full type definitions
- 🔧 Flexible language resolution strategies

## Installation

```bash
npm install @regraf/i18n
# or
yarn add @regraf/i18n
# or
pnpm add @regraf/i18n
```

## Quick Start

```typescript
import { Regraf } from 'regraf';
import { LanguageController } from '@regraf/i18n';

const bot = new Regraf(process.env.BOT_TOKEN!);

// Create language controller
const i18n = new LanguageController({
  fallbackLanguage: 'en',
  // Optional: custom language resolver
  languageResolver: (ctx) => ctx.from?.language_code ?? 'en'
});

// Preload language files from directory
i18n.preloadLanguages('./locales');

// Use i18n middleware
bot.use(i18n.middleware);

// Use translations in your handlers
bot.command('start', (ctx) => {
  ctx.reply(ctx.lang.t('welcome', { name: ctx.from.first_name }));
});

bot.launch();
```

## Language Files Structure

Create JSON files for each language in your locales directory:

**locales/en.json**
```json
{
  "welcome": "Welcome, {{name}}!",
  "greeting": "Hello!",
  "item.zero": "No items",
  "item.one": "One item",
  "item.few": "{{count}} items",
  "item.many": "{{count}} items"
}
```

**locales/ru.json**
```json
{
  "welcome": "Добро пожаловать, {{name}}!",
  "greeting": "Привет!",
  "item.zero": "Нет элементов",
  "item.one": "{{count}} элемент",
  "item.few": "{{count}} элемента",
  "item.many": "{{count}} элементов"
}
```

## API Reference

### LanguageController

The main controller class for managing translations.

#### Constructor Options

```typescript
interface LanguageControllerOptions {
  loader?: Loader<string, Record<string, string>, void>;
  ttl?: number;
  languageResolver?: (ctx: RegrafContext) => string | string[];
  fallbackLanguage?: string;
}
```

- `loader` - Custom loader function for language data
- `ttl` - Time-to-live for cache entries in seconds (default: never expires)
- `languageResolver` - Function to determine user's language from context
- `fallbackLanguage` - Default language when user's language is not available (default: "en")

#### Methods

##### `preloadLanguages(folderOrFile: string): void`

Preloads language files from a directory or specific file path. Recursively processes directories and loads all JSON files.

##### `middleware(ctx: LanguageContext, next: () => Promise<void>): Promise<void>`

Middleware function that adds language support to the context. Adds `lang` property to the context.

### Language

Class representing a specific language with translation data.

#### Methods

##### `t(path: string, placeholders?: Record<string, string | number | null> | string[]): string`

Translates a string with optional placeholder replacement.

**Placeholder Types:**
- Object placeholders: `{{key}}` replaced with `placeholders.key`
- Array placeholders: `%s` replaced in order with array elements
- Count-based pluralization: When `placeholders.count` is provided, automatically appends pluralization suffix

##### `has(path: string): Promise<boolean>`

Checks if a translation exists for the given path.

## Translation Features

### Placeholder Replacement

**Object-style placeholders:**
```typescript
// Translation: "Hello, {{name}}! You have {{count}} messages."
ctx.lang?.t('greeting', { name: 'John', count: 5 })
// Result: "Hello, John! You have 5 messages."
```

**Array-style placeholders:**
```typescript
// Translation: "%s and %s are friends"
ctx.lang?.t('friendship', ['Alice', 'Bob'])
// Result: "Alice and Bob are friends"
```

### Pluralization

The module automatically handles pluralization based on count values:

- `.zero` - for count = 0
- `.one` - for count = 1
- `.few` - for count = 2, 3, 4
- `.many` - for count = 0, 5–20, and other values

```typescript
// Translations:
// "item.zero": "No items"
// "item.one": "One item"
// "item.few": "{{count}} items"
// "item.many": "{{count}} items"

ctx.lang?.t('item', { count: 0 })  // "No items"
ctx.lang?.t('item', { count: 1 })  // "One item"
ctx.lang?.t('item', { count: 3 })  // "3 items"
ctx.lang?.t('item', { count: 10 }) // "10 items"
```

### Language Resolution

The module supports flexible language resolution:

```typescript
const i18n = new LanguageController({
  languageResolver: (ctx) => {
    // Single language
    return ctx.from?.language_code ?? 'en';

    // Multiple fallback languages
    return [
      ctx.from?.language_code ?? 'en',
      'en' // fallback
    ];
  }
});
```

## Custom Loaders

You can implement custom language data loaders:

```typescript
const i18n = new LanguageController({
  loader: async (languageCode: string) => {
    // Load from database, API, etc.
    const data = await loadFromDatabase(languageCode);
    return data;
  },
  ttl: 3600 // Cache for 1 hour
});
```

## TypeScript Support

The module provides full TypeScript support with proper type definitions:

```typescript
import { LanguageContext } from '@regraf/i18n';

bot.command('start', (ctx: LanguageContext) => {
  // ctx.lang is properly typed
  const message = ctx.lang?.t('welcome') ?? 'Welcome!';
  ctx.reply(message);
});
```

## Testing

Run the test suite:

```bash
npm test
```

The project uses [Vitest](https://vitest.dev/) for testing with comprehensive test coverage.

## Requirements

- Node.js >= 18.0.0
- [Regraf](https://github.com/regraf-bots/regraf) framework

## Dependencies

- `debug` - Debug logging
- `regraf` - Telegram bot framework
- `rgcache` - Memory caching

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests at the [GitHub repository](https://github.com/regraf-bots/i18n).

## Author

Ilya Petrov <me@redguy.ru>