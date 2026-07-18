const NAV_GROUPS = {
  ko: [
    {
      label: "HS CODE",
      items: [
        { label: "빠른 HS CODE 분류", soon: false, id: "classify" },
        { label: "HS코드 분류표", soon: false, id: "browse" },
        { label: "원큐 (One Queue) - B2B API", soon: false, id: "oneq" },
      ],
    },
    {
      label: "도구",
      items: [
        { label: "수입 관부가세 계산기", soon: false, id: "calc" },
        { label: "KC 인증대상 확인", soon: false, id: "kc" },
      ],
    },
    {
      label: "식품검역",
      items: [
        { label: "식품유형 확인", soon: false, id: "foodtype" },
        { label: "정밀검사비용 확인", soon: false, id: "inspectioncost" },
        { label: "영양성분 입력대상 확인", soon: false, id: "nutritionreq" },
        { label: "영양성분 퍼센트 계산", soon: false, id: "nutritionpct" },
      ],
    },
    {
      label: "수입식품 검역 의뢰",
      items: [{ label: "가공식품 의뢰", soon: false, id: "quarantine" }],
    },
  ],
  en: [
    {
      label: "HS CODE",
      items: [
        { label: "Quick HS Code Classifier", soon: false, id: "classify" },
        { label: "HS Code Directory", soon: false, id: "browse" },
        { label: "One Queue - B2B API", soon: false, id: "oneq" },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Import Duty & VAT Calculator", soon: false, id: "calc" },
        { label: "KC Certification Checker", soon: false, id: "kc" },
      ],
    },
    {
      label: "Food Quarantine",
      items: [
        { label: "Food Type Checker", soon: false, id: "foodtype" },
        { label: "Inspection Cost Checker", soon: false, id: "inspectioncost" },
        { label: "Nutrition Labeling Requirement Checker", soon: false, id: "nutritionreq" },
        { label: "Nutrition % Daily Value Calculator", soon: false, id: "nutritionpct" },
      ],
    },
    {
      label: "Imported Food Quarantine Request",
      items: [{ label: "Processed Food Request", soon: false, id: "quarantine" }],
    },
  ],
  cn: [
    {
      label: "HS编码",
      items: [
        { label: "快速HS编码归类", soon: false, id: "classify" },
        { label: "HS编码分类表", soon: false, id: "browse" },
        { label: "One Queue - B2B API", soon: false, id: "oneq" },
      ],
    },
    {
      label: "工具",
      items: [
        { label: "进口关税·增值税计算器", soon: false, id: "calc" },
        { label: "KC认证对象确认", soon: false, id: "kc" },
      ],
    },
    {
      label: "食品检疫",
      items: [
        { label: "食品类型确认", soon: false, id: "foodtype" },
        { label: "精密检查费用确认", soon: false, id: "inspectioncost" },
        { label: "营养成分标示对象确认", soon: false, id: "nutritionreq" },
        { label: "营养成分每日摄取量百分比计算", soon: false, id: "nutritionpct" },
      ],
    },
    {
      label: "进口食品检疫委托",
      items: [{ label: "加工食品委托", soon: false, id: "quarantine" }],
    },
  ],
};

export default {
  ko: {
    meta: {
      lang: "ko",
      title: "통관메이트 — HS코드 수입요건·부적합이력·법령 통합검색",
      description: "품목명 또는 HS코드로 수입요건, 통관 부적합·회수 이력, 최신 법령 개정을 한 번에 검색.",
    },
    brand: "통관메이트",
    logoAlt: "제이앤비관세사무소",
    navHome: "홈",
    navAbout: "회사소개",
    navGroups: NAV_GROUPS.ko,
    soonLabel: "준비중",
    soonTitle: "준비 중인 기능입니다",
    footer: (year) => `© ${year} 제이앤비관세사무소`,
    mobileMenuAria: "메뉴 열기",
    langSwitch: { ko: "KO", en: "EN", cn: "中文" },
  },
  en: {
    meta: {
      lang: "en",
      title: "Customs Mate — Unified Search for Import Requirements, Rejections & Regulations",
      description: "Search import requirements, customs rejection/recall history, and the latest regulation updates by item name or HS code — all in one place.",
    },
    brand: "Customs Mate",
    logoAlt: "JNB Global Customs",
    navHome: "Home",
    navAbout: "About Us",
    navGroups: NAV_GROUPS.en,
    soonLabel: "Coming Soon",
    soonTitle: "This feature is coming soon",
    footer: (year) => `© ${year} JNB Global Customs`,
    mobileMenuAria: "Open menu",
    langSwitch: { ko: "KO", en: "EN", cn: "中文" },
  },
  cn: {
    meta: {
      lang: "zh-CN",
      title: "通关伙伴 — HS编码进口要件·不合格记录·法规一站式查询",
      description: "输入品名或HS编码，一次性查询进口要件、通关不合格·召回记录及最新法规修订。",
    },
    brand: "通关伙伴",
    logoAlt: "JNB Global Customs",
    navHome: "首页",
    navAbout: "公司介绍",
    navGroups: NAV_GROUPS.cn,
    soonLabel: "即将推出",
    soonTitle: "该功能即将推出",
    footer: (year) => `© ${year} JNB Global Customs`,
    mobileMenuAria: "打开菜单",
    langSwitch: { ko: "KO", en: "EN", cn: "中文" },
  },
};
