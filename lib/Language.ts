import debug, { Debugger } from "debug";

export class Language {

    static debug: Debugger = debug("regraf:i18n");

    languageCode: string;
    data: Record<string, string>;

    public constructor(languageCode: string, data: Record<string, string>) {
        this.languageCode = languageCode;
        this.data = data;
    }

    public t(path: string, placeholders: Record<string, string | number | null> | string[] = []) {
        if (!Array.isArray(placeholders) && !isNaN(Number(placeholders.count))) {
            placeholders.count = Number(placeholders.count);
            path += this.getCountSuffix(placeholders.count);
        }
        return this.replacePlaceholders(this.data[path], placeholders);
    }

    private getCountSuffix(count: number): string {
        if (count === 0) return ".zero";
        if (count === 11) return ".many";
        switch (count % 10) {
            case 0:
                return ".many";
            case 1:
                return ".one";
            case 2:
            case 3:
            case 4:
                return ".few";
            default:
                return ".many";
        }
    }

    async has(path: string): Promise<boolean> {
        return path in this.data;
    }

    replacePlaceholders(data: string, placeholders: { [key: string]: string | number | null } | string[]): string {
        Language.debug("replacePlaceholders", "start", data, placeholders);
        if (Array.isArray(placeholders)) {
            for (let placeholder of placeholders) {
                data = data.replace("%s", placeholder);
            }
        } else if (typeof placeholders === "object") {
            for (let key in placeholders) {
                data = data.split(`{{${key}}}`).join(String(placeholders[key]));
            }
        }
        Language.debug("replacePlaceholders", "end", data);
        return data;
    }
}