// HS 관세율표 부(21개)·류(97개, 77류 유보) 목록 — 관세청 관세법령정보포털(CLIP,
// unipass.customs.go.kr) "관세율표-부류목록"에서 직접 옮긴 공식 데이터. 법령·공공기관
// 고시 성격의 표라 저작권 문제 없음. hs_codes 테이블의 chapter(2자리)와 매칭해서
// 부→류 계층 탐색 UI에 쓴다.
//
// en/cn은 WCO(세계관세기구) 통일품목분류체계(Harmonized System)의 국제 표준 부·류
// 명칭이다 — 각국 관세율표가 동일한 조약 텍스트를 그대로 쓰므로, 한국어 원문을
// 번역한 게 아니라 국제 표준 영문/중문 명칭을 그대로 옮긴 것이다.
export const HS_SECTIONS = [
  { no: 1, name: { ko: "살아 있는 동물과 동물성 생산품", en: "Live Animals; Animal Products", cn: "活动物；动物产品" }, chapters: [
    { no: "01", name: { ko: "살아 있는 동물", en: "Live Animals", cn: "活动物" } },
    { no: "02", name: { ko: "육과 식용 설육(屑肉)", en: "Meat and Edible Meat Offal", cn: "肉及食用杂碎" } },
    { no: "03", name: { ko: "어류·갑각류·연체동물과 그 밖의 수생(水生) 무척추동물", en: "Fish and Crustaceans, Molluscs and Other Aquatic Invertebrates", cn: "鱼、甲壳动物、软体动物及其他水生无脊椎动物" } },
    { no: "04", name: { ko: "낙농품, 새의 알, 천연꿀, 다른 류로 분류되지 않은 식용인 동물성 생산품", en: "Dairy Produce; Birds' Eggs; Natural Honey; Edible Products of Animal Origin, Not Elsewhere Specified or Included", cn: "乳品；蛋品；天然蜂蜜；其他食用动物产品" } },
    { no: "05", name: { ko: "다른 류로 분류되지 않은 동물성 생산품", en: "Products of Animal Origin, Not Elsewhere Specified or Included", cn: "其他动物产品" } },
  ]},
  { no: 2, name: { ko: "식물성 생산품", en: "Vegetable Products", cn: "植物产品" }, chapters: [
    { no: "06", name: { ko: "살아 있는 수목과 그 밖의 식물, 인경(鱗莖)·뿌리와 이와 유사한 물품, 절화(切花)와 장식용 잎", en: "Live Trees and Other Plants; Bulbs, Roots and the Like; Cut Flowers and Ornamental Foliage", cn: "活树及其他活植物；鳞茎、根及类似品；插花及装饰用簇叶" } },
    { no: "07", name: { ko: "식용의 채소·뿌리·괴경(塊莖)", en: "Edible Vegetables and Certain Roots and Tubers", cn: "食用蔬菜、根及块茎" } },
    { no: "08", name: { ko: "식용의 과실과 견과류, 감귤류·멜론의 껍질", en: "Edible Fruit and Nuts; Peel of Citrus Fruit or Melons", cn: "食用水果及坚果；柑橘属水果或甜瓜的果皮" } },
    { no: "09", name: { ko: "커피·차·마테(maté)·향신료", en: "Coffee, Tea, Maté and Spices", cn: "咖啡、茶、马黛茶及调味香料" } },
    { no: "10", name: { ko: "곡물", en: "Cereals", cn: "谷物" } },
    { no: "11", name: { ko: "제분공업의 생산품과 맥아, 전분, 이눌린(inulin), 밀의 글루텐(gluten)", en: "Products of the Milling Industry; Malt; Starches; Inulin; Wheat Gluten", cn: "制粉工业产品；麦芽；淀粉；菊粉；面筋" } },
    { no: "12", name: { ko: "채유(採油)에 적합한 종자와 과실, 각종 종자와 과실, 공업용·의약용 식물, 짚과 사료용 식물", en: "Oil Seeds and Oleaginous Fruits; Miscellaneous Grains, Seeds and Fruit; Industrial or Medicinal Plants; Straw and Fodder", cn: "含油子仁及果实；杂项子仁及果实；工业用或药用植物；饲料" } },
    { no: "13", name: { ko: "락(lac), 검·수지·그 밖의 식물성 수액과 추출물(extract)", en: "Lac; Gums, Resins and Other Vegetable Saps and Extracts", cn: "虫胶；树胶、树脂及其他植物液、汁" } },
    { no: "14", name: { ko: "식물성 편조물(編組物)용 재료와 다른 류로 분류되지 않은 식물성 생산품", en: "Vegetable Plaiting Materials; Vegetable Products Not Elsewhere Specified or Included", cn: "编结用植物材料；其他植物产品" } },
  ]},
  { no: 3, name: { ko: "동물성·식물성·미생물성 지방과 기름 및 이들의 분해생산물, 조제한 식용 지방과 동물성·식물성 왁스", en: "Animal or Vegetable Fats and Oils and Their Cleavage Products; Prepared Edible Fats; Animal or Vegetable Waxes", cn: "动、植物油、脂及其分解产品；精制的食用油脂；动、植物蜡" }, chapters: [
    { no: "15", name: { ko: "동물성·식물성·미생물성 지방과 기름 및 이들의 분해생산물, 조제한 식용 지방과 동물성·식물성 왁스", en: "Animal, Vegetable or Microbial Fats and Oils and Their Cleavage Products; Prepared Edible Fats; Animal or Vegetable Waxes", cn: "动、植物油、脂及其分解产品；精制的食用油脂；动、植物蜡" } },
  ]},
  { no: 4, name: { ko: "조제 식료품, 음료·주류·식초, 담배·제조한 담배 대용물 등", en: "Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes", cn: "食品；饮料、酒及醋；烟草、烟草代用品制品" }, chapters: [
    { no: "16", name: { ko: "육류·어류·갑각류·연체동물이나 그 밖의 수생(水生) 무척추동물 또는 곤충의 조제품", en: "Preparations of Meat, of Fish, of Crustaceans, Molluscs or Other Aquatic Invertebrates, or of Insects", cn: "肉、鱼、甲壳动物、软体动物及其他水生无脊椎动物或昆虫的制品" } },
    { no: "17", name: { ko: "당류(糖類)와 설탕과자", en: "Sugars and Sugar Confectionery", cn: "糖及糖食" } },
    { no: "18", name: { ko: "코코아와 그 조제품", en: "Cocoa and Cocoa Preparations", cn: "可可及可可制品" } },
    { no: "19", name: { ko: "곡물·고운 가루·전분·밀크의 조제품과 베이커리 제품", en: "Preparations of Cereals, Flour, Starch or Milk; Pastrycooks' Products", cn: "谷物、面粉、淀粉或乳的制品；糕饼点心" } },
    { no: "20", name: { ko: "채소·과실·견과류나 식물의 그 밖의 부분의 조제품", en: "Preparations of Vegetables, Fruit, Nuts or Other Parts of Plants", cn: "蔬菜、水果、坚果或植物其他部分的制品" } },
    { no: "21", name: { ko: "각종 조제 식료품", en: "Miscellaneous Edible Preparations", cn: "杂项食品" } },
    { no: "22", name: { ko: "음료·주류·식초", en: "Beverages, Spirits and Vinegar", cn: "饮料、酒及醋" } },
    { no: "23", name: { ko: "식품 공업에서 생기는 잔재물과 웨이스트(waste), 조제 사료", en: "Residues and Waste from the Food Industries; Prepared Animal Fodder", cn: "食品工业的残渣及废料；配制的动物饲料" } },
    { no: "24", name: { ko: "담배와 제조한 담배 대용물, 니코틴 함유 흡입 물품", en: "Tobacco and Manufactured Tobacco Substitutes; Products, Whether or Not Containing Nicotine, Intended for Inhalation Without Combustion; Other Nicotine Containing Products", cn: "烟草、烟草代用品制品；不论是否含尼古丁的供吸入而不燃烧的产品；其他含尼古丁产品" } },
  ]},
  { no: 5, name: { ko: "광물성 생산품", en: "Mineral Products", cn: "矿产品" }, chapters: [
    { no: "25", name: { ko: "소금, 황, 토석류(土石類), 석고·석회·시멘트", en: "Salt; Sulfur; Earths and Stone; Plastering Materials, Lime and Cement", cn: "盐；硫磺；泥灰及水泥" } },
    { no: "26", name: { ko: "광(鑛)·슬래그(slag)·회(灰)", en: "Ores, Slag and Ash", cn: "矿砂、矿渣及矿灰" } },
    { no: "27", name: { ko: "광물성 연료·광물유(鑛物油)와 이들의 증류물, 역청(瀝靑)물질, 광물성 왁스", en: "Mineral Fuels, Mineral Oils and Products of Their Distillation; Bituminous Substances; Mineral Waxes", cn: "矿物燃料、矿物油及其蒸馏产品；沥青物质；矿物蜡" } },
  ]},
  { no: 6, name: { ko: "화학공업이나 연관공업의 생산품", en: "Products of the Chemical or Allied Industries", cn: "化学工业及其相关工业的产品" }, chapters: [
    { no: "28", name: { ko: "무기화학품, 귀금속·희토류(稀土類)금속·방사성원소·동위원소의 유기화합물이나 무기화합물", en: "Inorganic Chemicals; Organic or Inorganic Compounds of Precious Metals, of Rare-Earth Metals, of Radioactive Elements or of Isotopes", cn: "无机化学品；贵金属、稀土金属、放射性元素或同位素的有机或无机化合物" } },
    { no: "29", name: { ko: "유기화학품", en: "Organic Chemicals", cn: "有机化学品" } },
    { no: "30", name: { ko: "의료용품", en: "Pharmaceutical Products", cn: "医药品" } },
    { no: "31", name: { ko: "비료", en: "Fertilizers", cn: "肥料" } },
    { no: "32", name: { ko: "유연용·염색용 추출물(extract), 탄닌과 이들의 유도체, 염료·안료와 그 밖의 착색제, 페인트·바니시(varnish) 등", en: "Tanning or Dyeing Extracts; Tannins and Their Derivatives; Dyes, Pigments and Other Coloring Matter; Paints and Varnishes; Putty and Other Mastics; Inks", cn: "鞣料浸膏、染料浸膏；鞣酸及其衍生物；染料、颜料及其他着色料；油漆、清漆；油灰及其他胶粘剂；墨水" } },
    { no: "33", name: { ko: "정유(essential oil)와 레지노이드(resinoid), 조제향료와 화장품·화장용품", en: "Essential Oils and Resinoids; Perfumery, Cosmetic or Toilet Preparations", cn: "精油及香膏；芳香料制品及化妆盥洗制品" } },
    { no: "34", name: { ko: "비누·유기계면활성제·조제 세제·조제 윤활제·인조 왁스·조제 왁스 등", en: "Soap, Organic Surface-Active Agents, Washing Preparations, Lubricating Preparations, Artificial Waxes, Prepared Waxes, Polishing or Scouring Preparations, Candles and Similar Articles, Modelling Pastes, Dental Waxes and Dental Preparations", cn: "肥皂、有机表面活性剂、洗涤剂、润滑剂、人造蜡、精制蜡、上光除污剂、蜡烛及类似品、塑型用膏、牙科用蜡及牙科用制剂" } },
    { no: "35", name: { ko: "단백질계 물질, 변성전분, 글루(glue), 효소", en: "Albuminoidal Substances; Modified Starches; Glues; Enzymes", cn: "蛋白类物质；改性淀粉；胶水；酶" } },
    { no: "36", name: { ko: "화약류, 화공품, 성냥, 발화성 합금, 특정 가연성 조제품", en: "Explosives; Pyrotechnic Products; Matches; Pyrophoric Alloys; Certain Combustible Preparations", cn: "炸药及其他火药类产品；烟火制品；火柴；引火合金；易燃材料及某些可燃制品" } },
    { no: "37", name: { ko: "사진용이나 영화용 재료", en: "Photographic or Cinematographic Goods", cn: "照相及电影用品" } },
    { no: "38", name: { ko: "각종 화학공업 생산품", en: "Miscellaneous Chemical Products", cn: "杂项化学产品" } },
  ]},
  { no: 7, name: { ko: "플라스틱과 그 제품, 고무와 그 제품", en: "Plastics and Articles Thereof; Rubber and Articles Thereof", cn: "塑料及其制品；橡胶及其制品" }, chapters: [
    { no: "39", name: { ko: "플라스틱과 그 제품", en: "Plastics and Articles Thereof", cn: "塑料及其制品" } },
    { no: "40", name: { ko: "고무와 그 제품", en: "Rubber and Articles Thereof", cn: "橡胶及其制品" } },
  ]},
  { no: 8, name: { ko: "원피·가죽·모피와 이들의 제품, 마구, 여행용구·핸드백 등", en: "Raw Hides and Skins, Leather, Furskins and Articles Thereof; Saddlery and Harness; Travel Goods, Handbags and Similar Containers", cn: "生皮、皮革、毛皮及其制品；鞍具及挽具；旅行用品、手提包及类似容器" }, chapters: [
    { no: "41", name: { ko: "원피(모피는 제외한다)와 가죽", en: "Raw Hides and Skins (Other than Furskins) and Leather", cn: "生皮（毛皮除外）及皮革" } },
    { no: "42", name: { ko: "가죽제품, 마구, 여행용구·핸드백과 이와 유사한 용기 등", en: "Articles of Leather; Saddlery and Harness; Travel Goods, Handbags and Similar Containers; Articles of Animal Gut", cn: "皮革制品；鞍具及挽具；旅行用品、手提包及类似容器；动物肠线制品" } },
    { no: "43", name: { ko: "모피·인조모피와 이들의 제품", en: "Furskins and Artificial Fur; Manufactures Thereof", cn: "毛皮、人造毛皮及其制品" } },
  ]},
  { no: 9, name: { ko: "목재와 그 제품, 목탄, 코르크와 그 제품, 짚 제품 등", en: "Wood and Articles of Wood; Wood Charcoal; Cork and Articles of Cork; Manufactures of Straw, of Esparto or of Other Plaiting Materials; Basketware and Wickerwork", cn: "木及木制品；木炭；软木及软木制品；稻草、秸秆等编结材料制品；篮筐及柳条编结品" }, chapters: [
    { no: "44", name: { ko: "목재와 그 제품, 목탄", en: "Wood and Articles of Wood; Wood Charcoal", cn: "木及木制品；木炭" } },
    { no: "45", name: { ko: "코르크(cork)와 그 제품", en: "Cork and Articles of Cork", cn: "软木及软木制品" } },
    { no: "46", name: { ko: "짚·에스파르토(esparto)나 그 밖의 조물 재료의 제품, 바구니 세공물 등", en: "Manufactures of Straw, of Esparto or of Other Plaiting Materials; Basketware and Wickerwork", cn: "稻草、秸秆、针茅或其他编结材料制品；篮筐及柳条编结品" } },
  ]},
  { no: 10, name: { ko: "목재나 그 밖의 섬유질 셀룰로오스재료의 펄프, 종이·판지와 이들의 제품", en: "Pulp of Wood or of Other Fibrous Cellulosic Material; Recovered (Waste and Scrap) Paper or Paperboard; Paper and Paperboard and Articles Thereof", cn: "木浆及其他纤维状纤维素浆；废纸品；纸、纸板及其制品" }, chapters: [
    { no: "47", name: { ko: "목재나 그 밖의 섬유질 셀룰로오스재료의 펄프, 회수한 종이·판지", en: "Pulp of Wood or of Other Fibrous Cellulosic Material; Recovered (Waste and Scrap) Paper or Paperboard", cn: "木浆及其他纤维状纤维素浆；回收（废碎料）纸或纸板" } },
    { no: "48", name: { ko: "종이와 판지, 제지용 펄프·종이·판지의 제품", en: "Paper and Paperboard; Articles of Paper Pulp, of Paper or of Paperboard", cn: "纸及纸板；纸浆、纸或纸板制品" } },
    { no: "49", name: { ko: "인쇄서적·신문·회화·그 밖의 인쇄물, 수제(手製)문서·타자문서·도면", en: "Printed Books, Newspapers, Pictures and Other Products of the Printing Industry; Manuscripts, Typescripts and Plans", cn: "印刷书籍、报纸、图画及其他印刷工业产品；手稿、打字稿及图则" } },
  ]},
  { no: 11, name: { ko: "방직용 섬유와 방직용 섬유의 제품", en: "Textiles and Textile Articles", cn: "纺织原料及纺织制品" }, chapters: [
    { no: "50", name: { ko: "견", en: "Silk", cn: "蚕丝" } },
    { no: "51", name: { ko: "양모·동물의 부드러운 털이나 거친 털·말의 털로 만든 실과 직물", en: "Wool, Fine or Coarse Animal Hair; Horsehair Yarn and Woven Fabric", cn: "羊毛、动物细毛或粗毛；马毛纱线及其机织物" } },
    { no: "52", name: { ko: "면", en: "Cotton", cn: "棉花" } },
    { no: "53", name: { ko: "그 밖의 식물성 방직용 섬유, 종이실(paper yarn)과 종이실로 만든 직물", en: "Other Vegetable Textile Fibers; Paper Yarn and Woven Fabrics of Paper Yarn", cn: "其他植物纺织纤维；纸纱线及其机织物" } },
    { no: "54", name: { ko: "인조필라멘트, 인조방직용 섬유재료의 스트립(strip)과 이와 유사한 것", en: "Man-Made Filaments; Strip and the Like of Man-Made Textile Materials", cn: "化学纤维长丝；人造纺织材料的扁条及类似品" } },
    { no: "55", name: { ko: "인조스테이플섬유", en: "Man-Made Staple Fibers", cn: "化学纤维短纤" } },
    { no: "56", name: { ko: "워딩(wadding)·펠트(felt)·부직포, 특수사, 끈·배의 밧줄(cordage)·로프·케이블 등", en: "Wadding, Felt and Nonwovens; Special Yarns; Twine, Cordage, Ropes and Cables and Articles Thereof", cn: "絮胎、毡呢及无纺织物；特种纱线；线、绳、索、缆及其制品" } },
    { no: "57", name: { ko: "양탄자류와 그 밖의 방직용 섬유로 만든 바닥깔개", en: "Carpets and Other Textile Floor Coverings", cn: "地毯及其他纺织材料的铺地制品" } },
    { no: "58", name: { ko: "특수직물, 터프트(tuft)한 직물, 레이스, 태피스트리(tapestry), 트리밍(trimming), 자수천", en: "Special Woven Fabrics; Tufted Textile Fabrics; Lace; Tapestries; Trimmings; Embroidery", cn: "特种机织物；簇绒织物；花边；装饰毯；饰带；刺绣品" } },
    { no: "59", name: { ko: "침투·도포·피복하거나 적층한 방직용 섬유의 직물, 공업용인 방직용 섬유제품", en: "Impregnated, Coated, Covered or Laminated Textile Fabrics; Textile Articles of a Kind Suitable for Industrial Use", cn: "浸渍、涂布、包覆或层压的纺织物；适用于工业用的纺织制品" } },
    { no: "60", name: { ko: "메리야스 편물과 뜨개질 편물", en: "Knitted or Crocheted Fabrics", cn: "针织物及钩编织物" } },
    { no: "61", name: { ko: "의류와 그 부속품(메리야스 편물이나 뜨개질 편물로 한정한다)", en: "Articles of Apparel and Clothing Accessories, Knitted or Crocheted", cn: "针织或钩编的服装及衣着附件" } },
    { no: "62", name: { ko: "의류와 그 부속품(메리야스 편물이나 뜨개질편물은 제외한다)", en: "Articles of Apparel and Clothing Accessories, Not Knitted or Crocheted", cn: "非针织或钩编的服装及衣着附件" } },
    { no: "63", name: { ko: "제품으로 된 방직용 섬유의 그 밖의 물품, 세트, 사용하던 의류·방직용 섬유제품, 넝마", en: "Other Made-Up Textile Articles; Sets; Worn Clothing and Worn Textile Articles; Rags", cn: "其他纺织制成品；成套物品；旧衣着及旧纺织制品；碎织物" } },
  ]},
  { no: 12, name: { ko: "신발류·모자류·산류(傘類)·지팡이·채찍 등과 이들의 부분품, 조제 깃털과 그 제품, 조화 등", en: "Footwear, Headgear, Umbrellas, Sun Umbrellas, Walking Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof; Prepared Feathers and Articles Made Therewith; Artificial Flowers; Articles of Human Hair", cn: "鞋、帽、伞、杖、鞭及其零件；已加工的羽毛及其制品；人造花；人发制品" }, chapters: [
    { no: "64", name: { ko: "신발류·각반과 이와 유사한 것, 이들의 부분품", en: "Footwear, Gaiters and the Like; Parts of Such Articles", cn: "鞋靴、护腿及类似品及其零件" } },
    { no: "65", name: { ko: "모자류와 그 부분품", en: "Headgear and Parts Thereof", cn: "帽类及其零件" } },
    { no: "66", name: { ko: "산류(傘類)·지팡이·시트스틱(seat-stick)·채찍·승마용 채찍과 이들의 부분품", en: "Umbrellas, Sun Umbrellas, Walking Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof", cn: "雨伞、阳伞、手杖、鞭子及其零件" } },
    { no: "67", name: { ko: "조제 깃털·솜털과 그 제품, 조화, 사람 머리카락으로 된 제품", en: "Prepared Feathers and Down and Articles Made of Feathers or of Down; Artificial Flowers; Articles of Human Hair", cn: "已加工羽毛、羽绒及其制品；人造花；人发制品" } },
  ]},
  { no: 13, name: { ko: "돌·플라스터(plaster)·시멘트·석면·운모나 이와 유사한 재료의 제품, 도자제품, 유리와 유리제품", en: "Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials; Ceramic Products; Glass and Glassware", cn: "石料、石膏、水泥、石棉、云母及类似材料的制品；陶瓷产品；玻璃及玻璃器" }, chapters: [
    { no: "68", name: { ko: "돌·플라스터(plaster)·시멘트·석면·운모나 이와 유사한 재료의 제품", en: "Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials", cn: "石料、石膏、水泥、石棉、云母及类似材料的制品" } },
    { no: "69", name: { ko: "도자제품", en: "Ceramic Products", cn: "陶瓷产品" } },
    { no: "70", name: { ko: "유리와 유리제품", en: "Glass and Glassware", cn: "玻璃及玻璃器" } },
  ]},
  { no: 14, name: { ko: "천연진주·양식진주·귀석·반귀석·귀금속 등과 이들의 제품, 모조 신변장식용품, 주화", en: "Natural or Cultured Pearls, Precious or Semi-Precious Stones, Precious Metals, Metals Clad with Precious Metal, and Articles Thereof; Imitation Jewelry; Coin", cn: "天然或养殖珍珠、宝石或半宝石、贵金属、包贵金属的金属及其制品；仿首饰；硬币" }, chapters: [
    { no: "71", name: { ko: "천연진주·양식진주·귀석·반귀석·귀금속·귀금속을 입힌 금속과 이들의 제품, 모조 신변장식용품, 주화", en: "Natural or Cultured Pearls, Precious or Semi-Precious Stones, Precious Metals, Metals Clad with Precious Metal, and Articles Thereof; Imitation Jewelry; Coin", cn: "天然或养殖珍珠、宝石或半宝石、贵金属、包贵金属的金属及其制品；仿首饰；硬币" } },
  ]},
  { no: 15, name: { ko: "비금속(卑金屬)과 그 제품", en: "Base Metals and Articles of Base Metal", cn: "贱金属及其制品" }, chapters: [
    { no: "72", name: { ko: "철강", en: "Iron and Steel", cn: "钢铁" } },
    { no: "73", name: { ko: "철강의 제품", en: "Articles of Iron or Steel", cn: "钢铁制品" } },
    { no: "74", name: { ko: "구리와 그 제품", en: "Copper and Articles Thereof", cn: "铜及其制品" } },
    { no: "75", name: { ko: "니켈과 그 제품", en: "Nickel and Articles Thereof", cn: "镍及其制品" } },
    { no: "76", name: { ko: "알루미늄과 그 제품", en: "Aluminum and Articles Thereof", cn: "铝及其制品" } },
    { no: "77", name: { ko: "(유 보)", en: "(Reserved)", cn: "（保留）" } },
    { no: "78", name: { ko: "납과 그 제품", en: "Lead and Articles Thereof", cn: "铅及其制品" } },
    { no: "79", name: { ko: "아연과 그 제품", en: "Zinc and Articles Thereof", cn: "锌及其制品" } },
    { no: "80", name: { ko: "주석과 그 제품", en: "Tin and Articles Thereof", cn: "锡及其制品" } },
    { no: "81", name: { ko: "그 밖의 비금속(卑金屬), 서멧(cermet), 이들의 제품", en: "Other Base Metals; Cermets; Articles Thereof", cn: "其他贱金属；金属陶瓷；其制品" } },
    { no: "82", name: { ko: "비금속(卑金屬)으로 만든 공구·도구·칼붙이·스푼·포크, 이들의 부분품", en: "Tools, Implements, Cutlery, Spoons and Forks, of Base Metal; Parts Thereof of Base Metal", cn: "贱金属工具、器具、刀、叉、勺及其零件" } },
    { no: "83", name: { ko: "비금속(卑金屬)으로 만든 각종 제품", en: "Miscellaneous Articles of Base Metal", cn: "贱金属杂项制品" } },
  ]},
  { no: 16, name: { ko: "기계류·전기기기와 이들의 부분품, 녹음기·음성재생기·텔레비전의 영상과 음향의 기록기·재생기 등", en: "Machinery and Mechanical Appliances; Electrical Equipment; Parts Thereof; Sound Recorders and Reproducers, Television Image and Sound Recorders and Reproducers, and Parts and Accessories of Such Articles", cn: "机器、机械器具、电气设备及其零件；录音机及放声机、电视图像、声音记录机及放声机及其零件、附件" }, chapters: [
    { no: "84", name: { ko: "원자로·보일러·기계류와 이들의 부분품", en: "Nuclear Reactors, Boilers, Machinery and Mechanical Appliances; Parts Thereof", cn: "核反应堆、锅炉、机器、机械器具及其零件" } },
    { no: "85", name: { ko: "전기기기와 그 부분품, 녹음기·음성 재생기·텔레비전의 영상과 음성의 기록기·재생기 등", en: "Electrical Machinery and Equipment and Parts Thereof; Sound Recorders and Reproducers, Television Image and Sound Recorders and Reproducers, and Parts and Accessories of Such Articles", cn: "电机、电气设备及其零件；录音机及放声机、电视图像、声音记录机及放声机及其零件、附件" } },
  ]},
  { no: 17, name: { ko: "차량·항공기·선박과 수송기기 관련품", en: "Vehicles, Aircraft, Vessels and Associated Transport Equipment", cn: "车辆、航空器、船舶及有关运输设备" }, chapters: [
    { no: "86", name: { ko: "철도용이나 궤도용 기관차·차량과 이들의 부분품, 철도용이나 궤도용 장비품 등", en: "Railway or Tramway Locomotives, Rolling-Stock and Parts Thereof; Railway or Tramway Track Fixtures and Fittings and Parts Thereof; Mechanical Traffic Signaling Equipment", cn: "铁道及电车道机车车辆及其零件；铁道及电车道轨道固定装置及其零件；机械交通信号设备" } },
    { no: "87", name: { ko: "철도용이나 궤도용 외의 차량과 그 부분품·부속품", en: "Vehicles Other than Railway or Tramway Rolling-Stock, and Parts and Accessories Thereof", cn: "非铁道及电车道车辆及其零件、附件" } },
    { no: "88", name: { ko: "항공기와 우주선, 이들의 부분품", en: "Aircraft, Spacecraft, and Parts Thereof", cn: "航空器、航天器及其零件" } },
    { no: "89", name: { ko: "선박과 수상 구조물", en: "Ships, Boats and Floating Structures", cn: "船舶及浮动结构体" } },
  ]},
  { no: 18, name: { ko: "광학기기·사진용 기기·영화용 기기·측정기기·검사기기·정밀기기·의료용 기기, 시계, 악기 등", en: "Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus; Clocks and Watches; Musical Instruments; Parts and Accessories Thereof", cn: "光学、照相、电影、计量、检验、医疗或外科用仪器及设备；钟表；乐器；上述物品的零件、附件" }, chapters: [
    { no: "90", name: { ko: "광학기기·사진용 기기·영화용 기기·측정기기·검사기기·정밀기기·의료용 기기, 이들의 부분품과 부속품", en: "Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus; Parts and Accessories Thereof", cn: "光学、照相、电影、计量、检验、医疗或外科用仪器及设备及其零件、附件" } },
    { no: "91", name: { ko: "시계와 그 부분품", en: "Clocks and Watches and Parts Thereof", cn: "钟表及其零件" } },
    { no: "92", name: { ko: "악기와 그 부분품과 부속품", en: "Musical Instruments; Parts and Accessories of Such Articles", cn: "乐器及其零件、附件" } },
  ]},
  { no: 19, name: { ko: "무기·총포탄과 이들의 부분품과 부속품", en: "Arms and Ammunition; Parts and Accessories Thereof", cn: "武器、弹药及其零件、附件" }, chapters: [
    { no: "93", name: { ko: "무기·총포탄과 이들의 부분품과 부속품", en: "Arms and Ammunition; Parts and Accessories Thereof", cn: "武器、弹药及其零件、附件" } },
  ]},
  { no: 20, name: { ko: "잡품", en: "Miscellaneous Manufactured Articles", cn: "杂项制品" }, chapters: [
    { no: "94", name: { ko: "가구, 침구·매트리스·매트리스 서포트(mattress support)·쿠션 등, 조명기구, 조립식 건축물", en: "Furniture; Bedding, Mattresses, Mattress Supports, Cushions and Similar Stuffed Furnishings; Lamps and Lighting Fittings; Illuminated Signs; Prefabricated Buildings", cn: "家具；寝具、褥垫、褥支架、软垫及类似的填充制品；未列名灯具及照明装置；发光标志、发光名牌及类似品；活动房屋" } },
    { no: "95", name: { ko: "완구·게임용구·운동용구와 이들의 부분품과 부속품", en: "Toys, Games and Sports Requisites; Parts and Accessories Thereof", cn: "玩具、游戏品及运动用品及其零件、附件" } },
    { no: "96", name: { ko: "잡품", en: "Miscellaneous Manufactured Articles", cn: "杂项制品" } },
  ]},
  { no: 21, name: { ko: "예술품·수집품·골동품", en: "Works of Art, Collectors' Pieces and Antiques", cn: "艺术品、收藏品及古物" }, chapters: [
    { no: "97", name: { ko: "예술품·수집품·골동품", en: "Works of Art, Collectors' Pieces and Antiques", cn: "艺术品、收藏品及古物" } },
  ]},
];

export function findChapterName(chapterCode, lang = "ko") {
  for (const section of HS_SECTIONS) {
    const chapter = section.chapters.find((c) => c.no === chapterCode);
    if (chapter) return chapter.name[lang] ?? chapter.name.ko;
  }
  return null;
}
