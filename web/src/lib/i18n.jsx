import { createContext, useContext } from "react";
import CONTENT from "../content/index.js";

export const LANGS = ["ko", "en", "cn"];

export const LangContext = createContext("ko");

export function useLang() {
  return useContext(LangContext);
}

// section: top-level key in src/content/index.js (e.g. "common", "dutyCalc", "kc" ...)
export function useT(section) {
  const lang = useContext(LangContext);
  return CONTENT[lang][section];
}

// DB name_ko/name_en/name_cn pattern: use the current-language column if present, else fall back to Korean.
export function pick(row, field, lang) {
  if (lang === "ko") return row[field];
  return row[`${field}_${lang}`] ?? row[field];
}
