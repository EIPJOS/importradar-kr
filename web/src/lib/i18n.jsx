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
