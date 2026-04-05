export type ShoppingCategory =
  | "ovoce_zelenina"
  | "pecivo"
  | "mlecne"
  | "maso_uzeniny"
  | "napoje"
  | "drogerie"
  | "sladkosti"
  | "konzervovane"
  | "koření_omáčky"
  | "mrazene"
  | "ostatni";

export interface CategoryInfo {
  label: string;
  color: string; // tailwind bg class using design tokens or HSL
  textColor: string;
}

export const CATEGORY_INFO: Record<ShoppingCategory, CategoryInfo> = {
  ovoce_zelenina: { label: "Ovoce & Zelenina", color: "142 60% 45%", textColor: "0 0% 100%" },
  pecivo: { label: "Pečivo", color: "35 80% 55%", textColor: "0 0% 100%" },
  mlecne: { label: "Mléčné", color: "210 60% 55%", textColor: "0 0% 100%" },
  maso_uzeniny: { label: "Maso & Uzeniny", color: "0 65% 55%", textColor: "0 0% 100%" },
  napoje: { label: "Nápoje", color: "200 70% 50%", textColor: "0 0% 100%" },
  drogerie: { label: "Drogerie", color: "280 50% 55%", textColor: "0 0% 100%" },
  sladkosti: { label: "Sladkosti", color: "330 60% 55%", textColor: "0 0% 100%" },
  konzervovane: { label: "Konzervy & Trvanlivé", color: "45 60% 50%", textColor: "0 0% 100%" },
  "koření_omáčky": { label: "Koření & Omáčky", color: "25 70% 50%", textColor: "0 0% 100%" },
  mrazene: { label: "Mražené", color: "195 80% 60%", textColor: "0 0% 100%" },
  ostatni: { label: "Ostatní", color: "220 10% 50%", textColor: "0 0% 100%" },
};

// keyword → category mapping (Czech)
const KEYWORD_MAP: Array<[string[], ShoppingCategory]> = [
  // Ovoce & Zelenina
  [["banán", "jablko", "hruška", "pomeranč", "citron", "limetka", "grep", "mandarinka", "kiwi", "ananas", "mango", "avokádo", "jahod", "malin", "borůvk", "třešn", "višn", "švestk", "meruňk", "broskv", "vodní meloun", "meloun", "hrozn", "rajče", "rajčat", "okurk", "paprik", "cibul", "česnek", "brambor", "mrkev", "petržel", "celer", "brokolice", "květák", "zelí", "špenát", "salát", "rukola", "řepa", "ředkvičk", "cuketa", "lilek", "kukuřic", "hrášek", "fazol", "čočk", "dýně", "zázvor", "batát", "pórek", "kopr", "bazalka", "petrželk", "žampion", "houba", "hlíva"], "ovoce_zelenina"],
  // Pečivo
  [["chléb", "chleba", "rohlík", "houska", "bageta", "croissant", "pečivo", "knedlík", "toastový", "toast", "veka", "dalamánek", "bábovk", "koláč", "buchta", "mazanec", "vánočk"], "pecivo"],
  // Mléčné
  [["mléko", "jogurt", "sýr", "tvaroh", "máslo", "smetana", "kefír", "podmáslí", "eidam", "gouda", "hermelín", "niva", "cottage", "mascarpone", "parmazán", "mozzarella", "šlehačka", "vejc"], "mlecne"],
  // Maso & Uzeniny
  [["maso", "kuře", "kuřecí", "vepřov", "hovězí", "krůtí", "kachna", "králík", "ryba", "losos", "tuňák", "treska", "šunka", "salám", "párek", "klobás", "slanina", "špek", "uzené", "sekaná", "řízek", "steak", "svíčková", "guláš", "játra", "sekané"], "maso_uzeniny"],
  // Nápoje
  [["voda", "minerálka", "džus", "šťáva", "limonáda", "pivo", "víno", "kola", "cola", "fanta", "sprite", "čaj", "káva", "kafe", "nealko", "energy", "mošt", "sirup", "tonic", "sekt"], "napoje"],
  // Drogerie
  [["mýdlo", "šampon", "šampón", "sprchov", "zubní", "pasta", "kartáček", "toaleťák", "toaletní papír", "ubrousky", "utěrk", "plínk", "plen", "prací", "aviváž", "jar", "čistič", "savo", "deodorant", "deo", "krém", "holení", "žiletk", "vata", "vatov", "hygienick", "tampón", "vlhčené", "osvěžovač", "prášek", "mycí", "gel", "dezinfekce"], "drogerie"],
  // Sladkosti
  [["čokolád", "bonbon", "sušenk", "oplatk", "zmrzlin", "dortík", "dort", "puding", "gumov", "želé", "lízátk", "tyčinka", "müsli tyčink", "nutella", "karamel", "med", "marmeláda", "džem", "nutela"], "sladkosti"],
  // Konzervy & Trvanlivé
  [["konzerv", "těstovin", "špaget", "rýže", "mouka", "cukr", "olej", "ocet", "luštěnin", "fazole v", "kukuřice v", "hrášek v", "rajčata v", "protlak", "polévk", "instantní", "müsli", "cereáli", "ovesn", "krupic", "kuskus", "bulgur", "popcorn", "ořech", "mandle", "arašíd", "kešu", "rozink"], "konzervovane"],
  // Koření & Omáčky
  [["sůl", "pepř", "koření", "paprika mletá", "skořice", "kmín", "oregano", "tymián", "kečup", "hořčice", "majonéz", "tatark", "sójov", "worcester", "tabasco", "pesto", "dresink", "vinaigrette", "balsamico", "wasabi"], "koření_omáčky"],
  // Mražené
  [["mražen", "zmrazené", "pizza", "hranolky", "fish stick", "rybí prst"], "mrazene"],
];

export function detectCategory(itemName: string): ShoppingCategory {
  const lower = itemName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lowerOriginal = itemName.toLowerCase();

  for (const [keywords, category] of KEYWORD_MAP) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(kwNorm) || lowerOriginal.includes(kw)) {
        return category;
      }
    }
  }
  return "ostatni";
}
