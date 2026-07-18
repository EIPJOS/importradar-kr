import common from "./parts/common.js";
import home from "./parts/home.js";
import dutyCalc from "./parts/dutyCalc.js";
import kc from "./parts/kc.js";
import foodType from "./parts/foodType.js";
import inspectionCost from "./parts/inspectionCost.js";
import nutritionReq from "./parts/nutritionReq.js";
import nutritionPct from "./parts/nutritionPct.js";
import hsBrowser from "./parts/hsBrowser.js";
import quickClassify from "./parts/quickClassify.js";
import oneQ from "./parts/oneQ.js";
import quarantine from "./parts/quarantine.js";
import about from "./parts/about.js";

const PARTS = {
  common,
  home,
  dutyCalc,
  kc,
  foodType,
  inspectionCost,
  nutritionReq,
  nutritionPct,
  hsBrowser,
  quickClassify,
  oneQ,
  quarantine,
  about,
};

const CONTENT = { ko: {}, en: {}, cn: {} };
for (const [key, part] of Object.entries(PARTS)) {
  for (const lang of Object.keys(CONTENT)) {
    CONTENT[lang][key] = part[lang];
  }
}

export default CONTENT;
