import type { RegrafContext } from "regraf/typings/context";
import { Language } from "./Language";

export type LanguageContext = RegrafContext & {
    lang?: Language;
}