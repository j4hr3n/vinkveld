export interface Grape {
  id: string;
  name: string;
  color: "red" | "white";
  description: string;
  flavorProfile: string[];
  foodPairings: string[];
  regions: string[];
}

export const GRAPES: Grape[] = [
  // --- Røde druer ---
  {
    id: "cabernet-sauvignon",
    name: "Cabernet Sauvignon",
    color: "red",
    description:
      "Verdens mest kjente røde drue, kjent for sin dype farge og kraftige tanniner. Gir viner med lang lagringsevne og kompleks karakter som utvikler seg over tid.",
    flavorProfile: ["Solbær", "Sedertre", "Grønn pepper", "Grafitt", "Tobakk"],
    foodPairings: ["Grillet biff", "Lam", "Harde oster", "Viltgryte"],
    regions: ["Bordeaux", "Napa Valley", "Coonawarra", "Maipo Valley"],
  },
  {
    id: "merlot",
    name: "Merlot",
    color: "red",
    description:
      "En myk og fruktdrevet drue som ofte brukes i blendinger med Cabernet Sauvignon. Gir runde, tilgjengelige viner med fløyelsmyk tannin.",
    flavorProfile: ["Plomme", "Kirsebær", "Sjokolade", "Urter", "Vanilje"],
    foodPairings: ["Pasta med kjøttsaus", "And", "Sopp-risotto", "Milde oster"],
    regions: ["Bordeaux", "Toscana", "Washington State", "Chile"],
  },
  {
    id: "pinot-noir",
    name: "Pinot Noir",
    color: "red",
    description:
      "En krevende men edel drue som gir elegante, lettere rødviner med fascinerende kompleksitet. Tynnhudede druer gir lysere farge og finere tanniner.",
    flavorProfile: ["Bringebær", "Kirsebær", "Rose", "Jordbunn", "Krydder"],
    foodPairings: ["Laks", "And", "Kylling", "Trøffel", "Brie"],
    regions: ["Bourgogne", "Marlborough", "Oregon", "Central Otago"],
  },
  {
    id: "syrah",
    name: "Syrah / Shiraz",
    color: "red",
    description:
      "Kraftig og krydret drue som gir mørke, fyldige viner. Kjent som Syrah i Frankrike og Shiraz i Australia, men samme drue med ulike stiler.",
    flavorProfile: ["Blåbær", "Svart pepper", "Røkt kjøtt", "Lakris", "Viol"],
    foodPairings: [
      "Grillet lam",
      "BBQ-ribbe",
      "Krydret gryte",
      "Blåmuggost",
    ],
    regions: ["Nord-Rhône", "Barossa Valley", "Stellenbosch", "Washington"],
  },
  {
    id: "tempranillo",
    name: "Tempranillo",
    color: "red",
    description:
      "Spanias stolthet og grunnpilaren i Rioja. Gir elegante viner med god syrebalanse som tar til seg eikens karakter på en vakker måte.",
    flavorProfile: [
      "Kirsebær",
      "Lær",
      "Vanilje",
      "Tobakk",
      "Tørket fiken",
    ],
    foodPairings: ["Spansk pølse", "Tapas", "Lam", "Manchego"],
    regions: ["Rioja", "Ribera del Duero", "Toro", "Alentejo"],
  },
  {
    id: "sangiovese",
    name: "Sangiovese",
    color: "red",
    description:
      "Italias mest plantede røde drue, kjent fra Chianti og Brunello di Montalcino. Gir viner med livlig syre, kirsebærfrukt og jordet karakter.",
    flavorProfile: [
      "Surkirsebær",
      "Tomat",
      "Oregano",
      "Te",
      "Balsamisk eddik",
    ],
    foodPairings: ["Pizza", "Pasta med tomatsaus", "Kalvekjøtt", "Parmesan"],
    regions: ["Toscana", "Emilia-Romagna", "Umbria", "Korsika"],
  },
  {
    id: "nebbiolo",
    name: "Nebbiolo",
    color: "red",
    description:
      "Piemontes edeldrue som gir Barolo og Barbaresco — kraftige viner med intens tannin og fantastisk aldringspotensial. Overraskende lys farge tross sin kraft.",
    flavorProfile: ["Rose", "Tjære", "Kirsebær", "Trøffel", "Lakris"],
    foodPairings: ["Trøffel-pasta", "Braised biff", "Vilt", "Modne oster"],
    regions: ["Piemonte", "Lombardia", "Valle d'Aosta"],
  },
  {
    id: "grenache",
    name: "Grenache",
    color: "red",
    description:
      "En varmekjær drue som gir generøse, fruktige viner med høy alkohol og myk tannin. Sentral i Châteauneuf-du-Pape og mange spanske viner.",
    flavorProfile: ["Jordbær", "Hvit pepper", "Lavendel", "Kanel", "Appelsin"],
    foodPairings: ["Grillet kylling", "Ratatouille", "Chorizo", "Paella"],
    regions: ["Sør-Rhône", "Priorat", "Sardinia", "McLaren Vale"],
  },
  {
    id: "malbec",
    name: "Malbec",
    color: "red",
    description:
      "Opprinnelig fra Cahors i Frankrike, men fant sitt andre hjem i Argentina. Gir inky, mørke viner med saftig frukt og fløyelsmyk tekstur.",
    flavorProfile: [
      "Bjørnebær",
      "Plomme",
      "Kakao",
      "Lær",
      "Violet",
    ],
    foodPairings: ["Argentinsk biff", "Empanadas", "Grillet grønnsaker", "Mørk sjokolade"],
    regions: ["Mendoza", "Cahors", "Salta", "Valle de Uco"],
  },
  {
    id: "zinfandel",
    name: "Zinfandel",
    color: "red",
    description:
      "Californias signatur-drue (genetisk identisk med Italias Primitivo). Gir kraftige, jammy viner med høy alkohol og moden fruktkarakter.",
    flavorProfile: [
      "Brombær",
      "Bringebærsyltetøy",
      "Svart pepper",
      "Kanel",
      "Rosiner",
    ],
    foodPairings: ["BBQ-ribbe", "Pizza", "Burger", "Krydret mat"],
    regions: ["Sonoma", "Paso Robles", "Puglia", "Lodi"],
  },
  {
    id: "barbera",
    name: "Barbera",
    color: "red",
    description:
      "Piemontes mest plantede drue, kjent for sin livlige syre og dype farge. Gir friske, fruktdrevne viner som er perfekte til italiensk mat.",
    flavorProfile: ["Kirsebær", "Plomme", "Krydder", "Anis", "Mandel"],
    foodPairings: ["Pasta", "Pizza", "Salami", "Tomat-baserte retter"],
    regions: ["Piemonte", "Lombardia", "California"],
  },
  {
    id: "cabernet-franc",
    name: "Cabernet Franc",
    color: "red",
    description:
      "Elegante og aromatisk drue, forelder til Cabernet Sauvignon. Gir lettere, mer parfymerte viner med urteaktige toner og silkemyk tannin.",
    flavorProfile: [
      "Bringebær",
      "Paprika",
      "Fiol",
      "Grafitt",
      "Grønn pepper",
    ],
    foodPairings: ["Kylling", "Lam med urter", "Ratatouille", "Geitost"],
    regions: ["Loire", "Bordeaux", "Friuli", "Finger Lakes"],
  },
  {
    id: "mourvedre",
    name: "Mourvèdre",
    color: "red",
    description:
      "Kraftig, varmekjær drue som gir mørke, strukturerte viner med animalsk karakter. Viktig i Bandol og som blandingspartner i Rhône og Provence.",
    flavorProfile: ["Brombær", "Vilt", "Lær", "Svart pepper", "Jord"],
    foodPairings: ["Viltgryte", "Braised lam", "Krydret pølse", "Aubergine"],
    regions: ["Bandol", "Châteauneuf-du-Pape", "Jumilla", "Barossa"],
  },
  {
    id: "gamay",
    name: "Gamay",
    color: "red",
    description:
      "Beaujolais' hjertedrue som gir lette, sjarmerende viner med frisk frukt. Serveres ofte lett kjølt. Cru Beaujolais viser druens seriøse side.",
    flavorProfile: ["Kirsebær", "Banan", "Peon", "Jordbær", "Pepper"],
    foodPairings: ["Charcuterie", "Kylling", "Sushi", "Lett salat"],
    regions: ["Beaujolais", "Loire", "Sveits", "Oregon"],
  },
  {
    id: "pinotage",
    name: "Pinotage",
    color: "red",
    description:
      "Sør-Afrikas egen drue, en krysning av Pinot Noir og Cinsault. Gir røykfylte, rustikke viner med unik karakter og braai-vennlig profil.",
    flavorProfile: ["Røyk", "Brombær", "Banan", "Kaffe", "Sjokolade"],
    foodPairings: ["Braai/grillkjøtt", "Bobotie", "Viltpølse", "BBQ"],
    regions: ["Stellenbosch", "Swartland", "Paarl"],
  },
  {
    id: "carmenere",
    name: "Carménère",
    color: "red",
    description:
      "Opprinnelig fra Bordeaux, men gjenoppdaget i Chile hvor den var forvekslet med Merlot. Gir myke, krydderstyrte viner med grønn pepper-karakter.",
    flavorProfile: [
      "Grønn pepper",
      "Brombær",
      "Kakao",
      "Kaffe",
      "Røkt paprika",
    ],
    foodPairings: ["Grillet kjøtt", "Empanadas", "Meksikansk mat", "Mørk sjokolade"],
    regions: ["Chile", "Bordeaux", "Nord-Italia"],
  },

  // --- Hvite druer ---
  {
    id: "chardonnay",
    name: "Chardonnay",
    color: "white",
    description:
      "Verdens mest populære hvite drue, utrolig allsidig. Spenner fra stram Chablis til fyldig, eikemodnet California-stil. Tar terroir og vinifisering som en kameleont.",
    flavorProfile: ["Eple", "Sitrus", "Smør", "Vanilje", "Hasselnøtt"],
    foodPairings: ["Hummer", "Kylling i fløtesaus", "Fisk", "Brie"],
    regions: ["Bourgogne", "Champagne", "Napa Valley", "Margaret River"],
  },
  {
    id: "sauvignon-blanc",
    name: "Sauvignon Blanc",
    color: "white",
    description:
      "Frisk, aromatisk drue kjent for sin sprø syre og gressaktige aromaer. New Zealand-stilen er eksplosivt fruktdreven, mens Loire gir mer mineralsk uttrykk.",
    flavorProfile: [
      "Stikkelsbær",
      "Gress",
      "Sitrus",
      "Pasjonsfrukt",
      "Flint",
    ],
    foodPairings: ["Geitost", "Skalldyr", "Salat", "Asiatisk mat"],
    regions: ["Marlborough", "Sancerre", "Bordeaux", "Stellenbosch"],
  },
  {
    id: "riesling",
    name: "Riesling",
    color: "white",
    description:
      "Kanskje vinverdenens mest allsidige drue, fra knusktørr til honningsøt. Beholder fantastisk syre uansett søthetsnivå, og aldres fortryllende med petrolnoter.",
    flavorProfile: ["Lime", "Fersken", "Petrol", "Honning", "Jasmin"],
    foodPairings: ["Krydret asiatisk mat", "Svineknoke", "Blåmuggost", "Sushi"],
    regions: ["Mosel", "Alsace", "Clare Valley", "Finger Lakes"],
  },
  {
    id: "pinot-grigio",
    name: "Pinot Grigio / Pinot Gris",
    color: "white",
    description:
      "Lett og frisk som Pinot Grigio (Italia) eller rik og aromatisk som Pinot Gris (Alsace). Samme drue, helt ulike stiler avhengig av vinifisering.",
    flavorProfile: ["Pære", "Eple", "Mandel", "Honning", "Sitrus"],
    foodPairings: ["Lett fisk", "Risotto", "Antipasti", "Salat"],
    regions: ["Veneto", "Alsace", "Oregon", "New Zealand"],
  },
  {
    id: "gewurztraminer",
    name: "Gewürztraminer",
    color: "white",
    description:
      "Eksotisk og intenst aromatisk drue med lav syre og guldrosa farge. Unik lychee-karakter gjør den umiskjennelig. Elsket av noen, for mye for andre.",
    flavorProfile: ["Lychee", "Rose", "Ingefær", "Krydder", "Grapefrukt"],
    foodPairings: [
      "Thaimat",
      "Indisk mat",
      "Foie gras",
      "Munster-ost",
    ],
    regions: ["Alsace", "Alto Adige", "Tyskland", "New Zealand"],
  },
  {
    id: "viognier",
    name: "Viognier",
    color: "white",
    description:
      "Fyldig, parfymert drue som gir frodige viner med lav syre. Opprinnelig nesten utdødd fra Condrieu, men nå plantet over hele verden.",
    flavorProfile: ["Aprikos", "Fersken", "Honeysuckle", "Vanilje", "Ingefær"],
    foodPairings: [
      "Krydret kylling",
      "Kremet pasta",
      "Kamskjell",
      "Mild curry",
    ],
    regions: ["Condrieu", "Languedoc", "California", "Australia"],
  },
  {
    id: "chenin-blanc",
    name: "Chenin Blanc",
    color: "white",
    description:
      "Utrolig allsidig drue fra Loire som kan lage tørr, halvtørr, søt og musserende vin. Sør-Afrikas mest plantede hvite drue med gammelvinsstil.",
    flavorProfile: ["Eple", "Kvede", "Honning", "Kamomille", "Lanolin"],
    foodPairings: ["Svinekjøtt", "Geitost", "Thai-mat", "Tarte tatin"],
    regions: ["Loire", "Swartland", "Stellenbosch", "Vouvray"],
  },
  {
    id: "gruner-veltliner",
    name: "Grüner Veltliner",
    color: "white",
    description:
      "Østerrikes nasjonaldrue som gir friske, pepperstyrte viner med god drikkelighet. Perfekt matvin som overrasker med sin allsidighet.",
    flavorProfile: [
      "Hvit pepper",
      "Grønne erter",
      "Sitrus",
      "Eple",
      "Linse",
    ],
    foodPairings: ["Wienerschnitzel", "Asparges", "Sushi", "Salat"],
    regions: ["Wachau", "Kamptal", "Kremstal", "Wien"],
  },
  {
    id: "albarino",
    name: "Albariño",
    color: "white",
    description:
      "Galicisk drue fra Nordvest-Spania, perfekt til sjømat. Gir friske, aromatiske viner med saltaktig mineralitet som speiler Atlanterhavets påvirkning.",
    flavorProfile: ["Fersken", "Aprikos", "Sitrus", "Salte mandler", "Blomst"],
    foodPairings: ["Sjømat", "Gambas", "Ceviche", "Skalldyr"],
    regions: ["Rías Baixas", "Vinho Verde", "California"],
  },
  {
    id: "vermentino",
    name: "Vermentino",
    color: "white",
    description:
      "Middelhavsdrue som trives langs kysten. Gir friske, lettdrikkelige viner med urteaktig karakter og behagelig bitterhet i avslutningen.",
    flavorProfile: ["Sitron", "Mandel", "Urter", "Grapefrukt", "Anis"],
    foodPairings: ["Grillet fisk", "Pesto-pasta", "Oliven", "Middelhavsmat"],
    regions: ["Sardinia", "Liguria", "Provence", "Korsika"],
  },
  {
    id: "torrontes",
    name: "Torrontés",
    color: "white",
    description:
      "Argentinas signatur-hvitvin, intenst aromatisk med blomsteraktig parfyme. Gir duftende, friske viner som overrasker med sin ekspressivitet.",
    flavorProfile: ["Rose", "Geranium", "Fersken", "Sitrus", "Muskat"],
    foodPairings: ["Ceviche", "Krydret mat", "Sushi", "Fruktsalat"],
    regions: ["Salta", "La Rioja", "San Juan"],
  },
  {
    id: "semillon",
    name: "Sémillon",
    color: "white",
    description:
      "Undervurdert drue som gir noen av verdens beste søteviner (Sauternes) og fantastiske tørre viner i Hunter Valley. Voksaktig og honningfylt med alder.",
    flavorProfile: ["Sitron", "Voks", "Honning", "Lanolin", "Nøtt"],
    foodPairings: ["Foie gras", "Blåmuggost", "Kremet fisk", "Fruktdessert"],
    regions: ["Bordeaux", "Hunter Valley", "Barossa Valley"],
  },
  {
    id: "marsanne",
    name: "Marsanne",
    color: "white",
    description:
      "Fyldig Rhône-drue som gir runde, nøtteaktige viner med lav syre. Blandes ofte med Roussanne for balanse. Trives i varmt klima.",
    flavorProfile: ["Mandel", "Voks", "Fersken", "Akasie", "Marsipan"],
    foodPairings: ["Kylling i fløtesaus", "Grillet fisk", "Kremet ost", "Risotto"],
    regions: ["Hermitage", "Languedoc", "Victoria", "California"],
  },
  {
    id: "muscadet",
    name: "Muscadet (Melon de Bourgogne)",
    color: "white",
    description:
      "Lett, mineralsk drue fra Loirens munning. Sur lie-modning gir kremet tekstur til ellers stram vin. Den ultimate østersvinen.",
    flavorProfile: ["Sitron", "Sjøsalt", "Grønt eple", "Gjær", "Kritt"],
    foodPairings: ["Østers", "Reker", "Moules-frites", "Lett fisk"],
    regions: ["Loire", "Nantais"],
  },
  {
    id: "hondarrabi-zuri",
    name: "Hondarrabi Zuri",
    color: "white",
    description:
      "Baskisk hvitvinsdrue og hoveddrue i Txakoli. Gir friske, lett musserende viner med høy syre og lav alkohol, sterkt preget av Atlanterhavet.",
    flavorProfile: ["Sitron", "Grønt eple", "Saltlake", "Blomst", "Urter"],
    foodPairings: ["Pintxos", "Sjømat", "Blekksprut", "Anchoas"],
    regions: ["Txakoli de Getaria", "Txakoli de Bizkaia", "Txakoli de Álava"],
  },
  {
    id: "assyrtiko",
    name: "Assyrtiko",
    color: "white",
    description:
      "Gresk edeldrue fra Santorini med vulkansk mineralitet og rakettdrevet syre. Tåler varme som få hvite druer og gir aldringsverdige viner.",
    flavorProfile: ["Sitron", "Kritt", "Saltlake", "Røkt stein", "Lime"],
    foodPairings: ["Grillet blekksprut", "Feta", "Sjømat", "Gresk salat"],
    regions: ["Santorini", "Attika", "Drama"],
  },
];

const GRAPES_BY_ID = new Map(GRAPES.map((g) => [g.id, g]));

export function getGrapeById(id: string): Grape | undefined {
  return GRAPES_BY_ID.get(id);
}

export function getGrapesByColor(color: "red" | "white"): Grape[] {
  return GRAPES.filter((g) => g.color === color);
}
