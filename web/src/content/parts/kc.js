export default {
  ko: {
    heading: "KC 인증대상 확인",
    countLabel: "국가기술표준원 KC 품목 데이터 · 534개 카테고리",
    note: "제품명 또는 품목명 단서를 입력하면 KC 인증대상 품목 후보와 인증유형(안전인증/안전확인)을 확인합니다. 정확한 대상 여부는 시험·인증기관 확인이 필요합니다.",
    labelProduct: "제품명",
    placeholder: "예: 전기주전자, 가습기, 완구",
    examples: [
      { label: "전기주전자", query: "전기주전자" },
      { label: "가습기", query: "가습기" },
      { label: "완구", query: "완구" },
      { label: "보조배터리", query: "보조배터리" },
    ],
    searchBtn: "검색",
    searchBtnLoading: "검색 중…",
    resultsCount: (n) => `동일하거나 가까운 KC 인증대상 품목 ${n}건을 찾았습니다.`,
    emptyResults:
      "일치하는 KC 인증대상 품목을 찾지 못했습니다. 인증대상이 아니거나, 다른 품목명으로 등록되어 있을 수 있습니다.",
  },
  en: {
    heading: "KC Certification Checker",
    countLabel: "Korean Agency for Technology and Standards KC item data · 534 categories",
    note: "Enter a product or item name to find candidate items subject to KC certification and their certification type (Safety Certification / Safety Confirmation). For a definitive determination, please confirm with a testing/certification body.",
    labelProduct: "Product Name",
    placeholder: "e.g. electric kettle, humidifier, toy",
    examples: [
      { label: "Electric Kettle", query: "전기주전자" },
      { label: "Humidifier", query: "가습기" },
      { label: "Toy", query: "완구" },
      { label: "Portable Battery", query: "보조배터리" },
    ],
    searchBtn: "Search",
    searchBtnLoading: "Searching…",
    resultsCount: (n) => `Found ${n} matching or related KC certification item(s).`,
    emptyResults:
      "No matching KC certification items were found. The item may not be subject to certification, or it may be registered under a different name.",
  },
  cn: {
    heading: "KC认证对象确认",
    countLabel: "韩国国家技术标准院 KC品目数据 · 534个类别",
    note: "输入产品名称或品目关键词，即可查询KC认证对象候选品目及认证类型（安全认证/安全确认）。准确的认证对象须以检测·认证机构确认为准。",
    labelProduct: "产品名称",
    placeholder: "例：电热水壶、加湿器、玩具",
    examples: [
      { label: "电热水壶", query: "전기주전자" },
      { label: "加湿器", query: "가습기" },
      { label: "玩具", query: "완구" },
      { label: "移动电源", query: "보조배터리" },
    ],
    searchBtn: "查询",
    searchBtnLoading: "查询中…",
    resultsCount: (n) => `找到 ${n} 个相同或相近的KC认证对象品目。`,
    emptyResults:
      "未找到匹配的KC认证对象品目。该品目可能不属于认证对象，或以其他品目名称登记。",
  },
};
