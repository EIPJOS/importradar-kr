export default {
  ko: {
    title: "영양성분 입력대상 확인",
    legalCitation: "식품 등의 표시ㆍ광고에 관한 법률 시행규칙 별표4 · 영양표시 대상 식품등",
    intro:
      "식품유형을 검색하거나 대분류에서 직접 선택하면 영양성분 표시 의무 대상인지 확인합니다. 별표4 원문 규칙을 그대로 적용한 결과이며, 정확한 판단은 식품의약품안전처 고시 원문을 확인하세요.",
    searchLabel: "식품유형 검색",
    searchPlaceholder: (examples) => `예: ${examples}`,
    searching: "검색 중…",
    searchButton: "검색",
    badgeRequired: "영양표시 의무 대상",
    badgeNotRequired: "의무 대상 아님",
    reset: "초기화",
    reasonRequired: (article) =>
      `별표4 영양표시 대상 식품등 ${article}에 해당합니다. 영양성분(열량·나트륨·탄수화물·당류·지방·트랜스지방·포화지방·콜레스테롤·단백질)을 표시해야 합니다.`,
    legalBasis: (article) => `근거: 식품 등의 표시ㆍ광고에 관한 법률 시행규칙 ${article}`,
    exemptionIntro: "아래에 해당하면 위 판정과 무관하게 표시 의무가 면제될 수 있습니다(별표4 2.):",
    resultsFound: (n) => `일치하는 식품유형 ${n}건을 찾았습니다.`,
    noResults: "일치하는 식품유형을 찾지 못했습니다. 아래에서 대분류를 직접 선택해 보세요.",
    browseByCategory: "또는 대분류에서 직접 선택하세요",
  },
  en: {
    title: "Check Nutrition Labeling Requirement",
    legalCitation:
      "Enforcement Rules of the Act on Labeling and Advertising of Foods, etc., Annex 4 · Foods subject to nutrition labeling",
    intro:
      "Search for a food type or select a major category to check whether nutrition labeling is mandatory. Results apply Annex 4 rules directly; for authoritative judgment, refer to the original Ministry of Food and Drug Safety (MFDS) notice.",
    searchLabel: "Search food type",
    searchPlaceholder: (examples) => `e.g. ${examples}`,
    searching: "Searching…",
    searchButton: "Search",
    badgeRequired: "Nutrition labeling required",
    badgeNotRequired: "Not required",
    reset: "Reset",
    reasonRequired: (article) =>
      `This falls under Annex 4, foods subject to nutrition labeling, item ${article}. Nutrition information (calories, sodium, carbohydrates, sugars, fat, trans fat, saturated fat, cholesterol, protein) must be labeled.`,
    legalBasis: (article) =>
      `Basis: Enforcement Rules of the Act on Labeling and Advertising of Foods, etc., ${article}`,
    exemptionIntro:
      "Regardless of the determination above, labeling may be exempt if any of the following apply (Annex 4, Section 2):",
    resultsFound: (n) => `Found ${n} matching food type(s).`,
    noResults: "No matching food type found. Try selecting a major category below.",
    browseByCategory: "Or select a major category directly",
  },
  cn: {
    title: "确认营养成分标示适用对象",
    legalCitation: "《食品等标示广告相关法律施行规则》附表4 · 营养标示适用食品等",
    intro:
      "搜索食品类型或直接在大类中选择，即可确认是否属于营养成分标示义务对象。结果按附表4原文规则直接适用，准确判断请以食品药品安全处公告原文为准。",
    searchLabel: "搜索食品类型",
    searchPlaceholder: (examples) => `例：${examples}`,
    searching: "搜索中…",
    searchButton: "搜索",
    badgeRequired: "属于营养标示义务对象",
    badgeNotRequired: "不属于义务对象",
    reset: "重置",
    reasonRequired: (article) =>
      `属于附表4营养标示适用食品等第${article}项。须标示营养成分（热量、钠、碳水化合物、糖类、脂肪、反式脂肪、饱和脂肪、胆固醇、蛋白质）。`,
    legalBasis: (article) => `依据：《食品等标示广告相关法律施行规则》${article}`,
    exemptionIntro: "无论上述判定结果如何，符合以下情形时可免除标示义务（附表4第2项）：",
    resultsFound: (n) => `找到 ${n} 个匹配的食品类型。`,
    noResults: "未找到匹配的食品类型。请在下方直接选择大类。",
    browseByCategory: "或直接在大类中选择",
  },
};
