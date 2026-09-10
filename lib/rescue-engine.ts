export type Locale = "pl" | "en";

export type ProtocolId = "cpr" | "choking" | "bleeding" | "unconscious";

export type RescueGuidanceKey =
  | "guidance_nosebleed"
  | "guidance_insect_mouth"
  | "guidance_insect_skin"
  | "guidance_chemical_ingestion"
  | "guidance_burn"
  | "guidance_seizure"
  | "guidance_fracture"
  | "guidance_fall_head_trauma"
  | "guidance_general_emergency";

export type SystemCommandType =
  | "start_cpr"
  | "stop_metronome"
  | "toggle_language";

export interface RescueEngineResult {
  type: "protocol" | "guidance" | "command" | "unknown";
  protocolId?: ProtocolId;
  guidanceKey?: RescueGuidanceKey;
  command?: SystemCommandType;
  titleKey?: string;
  displayText: string;
  spokenText: string;
  shouldStartMetronome?: boolean;
}

/**
 * Fonetyczna normalizacja tekstu pod kątem syntezatora mowy (TTS)
 */
export function normalizeSpeechForTTS(text: string, locale: Locale): string {
  if (!text) return "";
  let speechText = text;

  if (locale === "pl") {
    speechText = speechText
      .replace(/\b112\b/g, "sto dwanaście")
      .replace(/\bRKO\b/g, "er-ka-o")
      .replace(/\bSOR\b/g, "es-o-er")
      .replace(/(?:^|\s)1\.\s*/g, " Po pierwsze, ")
      .replace(/(?:^|\s)2\.\s*/g, " Po drugie, ")
      .replace(/(?:^|\s)3\.\s*/g, " Po trzecie, ")
      .replace(/(?:^|\s)4\.\s*/g, " Po czwarte, ")
      .replace(/(?:^|\s)5\.\s*/g, " Po piąte, ")
      .trim();
  } else {
    speechText = speechText
      .replace(/112\/911/g, "nine one one or one one two")
      .replace(/\b112\b/g, "one one two")
      .replace(/\b911\b/g, "nine one one")
      .replace(/\bCPR\b/g, "C-P-R")
      .replace(/(?:^|\s)1\.\s*/g, " Step one: ")
      .replace(/(?:^|\s)2\.\s*/g, " Step two: ")
      .replace(/(?:^|\s)3\.\s*/g, " Step three: ")
      .replace(/(?:^|\s)4\.\s*/g, " Step four: ")
      .replace(/(?:^|\s)5\.\s*/g, " Step five: ")
      .trim();
  }

  return speechText;
}

/**
 * Analizuje zapytanie użytkownika i dopasowuje odpowiedni klucz procedury ratunkowej.
 */
export function matchRescueGuidanceKey(
  query: string,
  locale: Locale,
): RescueGuidanceKey | null {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;

  if (locale === "pl") {
    // 1. Krwotok z nosa
    if (
      q.includes("nos") ||
      q.includes("nosa") ||
      q.includes("krwotok z nosa") ||
      q.includes("krew z nosa")
    ) {
      return "guidance_nosebleed";
    }

    // 2. Wykrywanie użądlenia / owada
    const words = q.split(/[\s,.-?!;:]+/).filter(Boolean);
    const hasInsectWord =
      q.includes("użądl") ||
      q.includes("uzadl") ||
      q.includes("ukąsz") ||
      q.includes("ukasz") ||
      q.includes("ugryz") ||
      q.includes("pszczoł") ||
      q.includes("pszczol") ||
      q.includes("szerszen") ||
      q.includes("szerszeń") ||
      words.some((w) =>
        ["osa", "osy", "osę", "ose", "osie", "osą", "osom"].includes(w),
      );

    const hasMouthWord =
      q.includes("język") ||
      q.includes("jezyk") ||
      q.includes("gardł") ||
      q.includes("gardl") ||
      q.includes("ust") ||
      q.includes("buzi") ||
      q.includes("krtan") ||
      q.includes("krtań") ||
      q.includes("przełyk");

    // Użądlenie w jamę ustną / gardło
    if (hasInsectWord && hasMouthWord) {
      return "guidance_insect_mouth";
    }

    // Zwykłe użądlenie na skórze
    if (hasInsectWord) {
      return "guidance_insect_skin";
    }

    // 3. Połknięcie detergentu / chemii
    if (
      q.includes("kulk") ||
      q.includes("kapsuł") ||
      q.includes("kapsul") ||
      q.includes("prani") ||
      q.includes("chemia") ||
      q.includes("detergent") ||
      q.includes("kret") ||
      q.includes("płyn do naczyń") ||
      q.includes("trucizn") ||
      q.includes("połkn") ||
      q.includes("polkn") ||
      q.includes("wypił") ||
      q.includes("wypil")
    ) {
      return "guidance_chemical_ingestion";
    }

    // 4. Oparzenia termiczne
    if (
      q.includes("oparzen") ||
      q.includes("sparzy") ||
      q.includes("wrzątek") ||
      q.includes("wrzatek") ||
      q.includes("gorąc") ||
      q.includes("gorac") ||
      q.includes("ogień") ||
      q.includes("ogien") ||
      q.includes("poparz")
    ) {
      return "guidance_burn";
    }

    // 5. Atak padaczki / drgawki
    if (
      q.includes("drgawk") ||
      q.includes("padaczk") ||
      q.includes("epilepsj") ||
      q.includes("drży") ||
      q.includes("drzy")
    ) {
      return "guidance_seizure";
    }

    // 6. Złamanie / zwichnięcie / skręcenie
    if (
      q.includes("złam") ||
      q.includes("zlam") ||
      q.includes("skręc") ||
      q.includes("skrec") ||
      q.includes("zwichn") ||
      q.includes("kość") ||
      q.includes("kosc")
    ) {
      return "guidance_fracture";
    }

    // 7. Upadek dziecka / uraz głowy
    if (
      q.includes("spadł") ||
      q.includes("spadl") ||
      q.includes("spadło") ||
      q.includes("spadlo") ||
      q.includes("upadł") ||
      q.includes("upadl") ||
      q.includes("upadek") ||
      q.includes("uderzył") ||
      q.includes("uderzyl") ||
      q.includes("głow") ||
      q.includes("glow") ||
      q.includes("guz") ||
      q.includes("przewijak") ||
      q.includes("łóżecz") ||
      q.includes("lozecz") ||
      q.includes("schod")
    ) {
      return "guidance_fall_head_trauma";
    }

    // 8. Świadoma prośba o ogólną pomoc
    if (
      q.includes("pomoc") ||
      q.includes("pomóż") ||
      q.includes("pomoz") ||
      q.includes("ratunk") ||
      q.includes("pogotowi") ||
      q.includes("zagrożenie życia")
    ) {
      return "guidance_general_emergency";
    }

    return null;
  } else {
    // English rules
    if (q.includes("nose") || q.includes("nosebleed")) {
      return "guidance_nosebleed";
    }

    const wordsEn = q.split(/[\s,.-?!;:]+/).filter(Boolean);
    const hasInsectEn =
      q.includes("sting") ||
      q.includes("stung") ||
      q.includes("bite") ||
      q.includes("bitten") ||
      q.includes("insect") ||
      wordsEn.some((w) => ["bee", "wasp", "hornet"].includes(w));

    const hasMouthEn =
      q.includes("tongue") ||
      q.includes("mouth") ||
      q.includes("throat") ||
      q.includes("airway");

    if (hasInsectEn && hasMouthEn) {
      return "guidance_insect_mouth";
    }

    if (hasInsectEn) {
      return "guidance_insect_skin";
    }

    if (
      q.includes("pod") ||
      q.includes("laundry") ||
      q.includes("chemical") ||
      q.includes("detergent") ||
      q.includes("poison") ||
      q.includes("swallow") ||
      q.includes("ingest") ||
      q.includes("bleach")
    ) {
      return "guidance_chemical_ingestion";
    }

    if (
      q.includes("burn") ||
      q.includes("scald") ||
      q.includes("boiling") ||
      q.includes("fire")
    ) {
      return "guidance_burn";
    }

    if (
      q.includes("seizure") ||
      q.includes("epilepsy") ||
      q.includes("convulsion") ||
      q.includes("shaking")
    ) {
      return "guidance_seizure";
    }

    if (
      q.includes("fracture") ||
      q.includes("broken") ||
      q.includes("sprain") ||
      q.includes("dislocat") ||
      q.includes("bone")
    ) {
      return "guidance_fracture";
    }

    if (
      q.includes("fell") ||
      q.includes("fall") ||
      q.includes("dropped") ||
      q.includes("head") ||
      q.includes("bump") ||
      q.includes("concussion") ||
      q.includes("stairs")
    ) {
      return "guidance_fall_head_trauma";
    }

    if (
      q.includes("help") ||
      q.includes("emergency") ||
      q.includes("save") ||
      q.includes("ambulance")
    ) {
      return "guidance_general_emergency";
    }

    return null;
  }
}

/**
 * Główny analizator komend głosowych i zapytań użytkownika.
 */
export function analyzeRescueQuery(
  rawQuery: string,
  locale: Locale,
  t: Record<string, string>,
): RescueEngineResult {
  const query = rawQuery.toLowerCase().trim();

  // Komendy systemowe
  if (query === "start" || query === "zacznij" || query === "start cpr") {
    return {
      type: "command",
      command: "start_cpr",
      protocolId: "cpr",
      titleKey: "title_cpr",
      displayText: t.cpr_full_guidance || t.cpr_desc,
      spokenText:
        t.cpr_full_guidance_spoken ||
        normalizeSpeechForTTS(t.cpr_full_guidance || t.cpr_desc, locale),
      shouldStartMetronome: true,
    };
  }

  if (query === "stop" || query === "pauza" || query === "pause") {
    return {
      type: "command",
      command: "stop_metronome",
      displayText: t.metronome_off,
      spokenText: t.metronome_off,
      shouldStartMetronome: false,
    };
  }

  if (query === "język" || query === "jezyk" || query === "language") {
    return {
      type: "command",
      command: "toggle_language",
      displayText: "",
      spokenText: "",
    };
  }

  // 1. Sprawdzenie RKO
  const isCpr =
    locale === "pl"
      ? query.includes("rko") ||
        query.includes("cpr") ||
        query.includes("reanimacj") ||
        query.includes("masaż serca") ||
        query.includes("masaz serca") ||
        query.includes("nie oddycha") ||
        query.includes("brak oddechu") ||
        query.includes("brak pulsu") ||
        query.includes("zatrzyman")
      : query.includes("cpr") ||
        query.includes("resuscitat") ||
        query.includes("cardiac arrest") ||
        query.includes("not breathing") ||
        query.includes("no pulse") ||
        query.includes("heart stopped");

  if (isCpr) {
    return {
      type: "protocol",
      protocolId: "cpr",
      titleKey: "title_cpr",
      displayText: t.cpr_full_guidance || t.cpr_desc,
      spokenText:
        t.cpr_full_guidance_spoken ||
        normalizeSpeechForTTS(t.cpr_full_guidance || t.cpr_desc, locale),
      shouldStartMetronome: true,
    };
  }

  // 2. Zadławienie / krztuszenie (elastyczne wykrywanie: zadławił, zadławienie, dławi się, krztusi)
  const isChoking =
    locale === "pl"
      ? query.includes("zadław") ||
        query.includes("zadlaw") ||
        query.includes("krztus") ||
        query.includes("zakrztus") ||
        query.includes("heimlich") ||
        query.includes("dław") ||
        query.includes("dlaw")
      : query.includes("chok") ||
        query.includes("heimlich") ||
        query.includes("strangl");

  if (isChoking) {
    return {
      type: "protocol",
      protocolId: "choking",
      titleKey: "title_choking",
      displayText: t.choking_desc,
      spokenText:
        t.choking_desc_spoken || normalizeSpeechForTTS(t.choking_desc, locale),
      shouldStartMetronome: false,
    };
  }

  // 3. Krwawienie (z wyłączeniem nosa)
  const isBleeding =
    locale === "pl"
      ? (query.includes("krwotok") ||
          query.includes("krwaw") ||
          query.includes("tętnic") ||
          query.includes("tetnic") ||
          query.includes("rana") ||
          query.includes("krew")) &&
        !query.includes("nos")
      : (query.includes("bleed") ||
          query.includes("arterial") ||
          query.includes("hemorrhage") ||
          query.includes("blood")) &&
        !query.includes("nose");

  if (isBleeding) {
    return {
      type: "protocol",
      protocolId: "bleeding",
      titleKey: "title_bleeding",
      displayText: t.bleeding_desc,
      spokenText:
        t.bleeding_desc_spoken ||
        normalizeSpeechForTTS(t.bleeding_desc, locale),
      shouldStartMetronome: false,
    };
  }

  // 4. Utrata przytomności
  const isUnconscious =
    locale === "pl"
      ? query.includes("nieprzytomn") ||
        query.includes("przytomnoś") ||
        query.includes("przytomnos") ||
        query.includes("zemdla") ||
        query.includes("omdlen") ||
        query.includes("nie reaguje")
      : query.includes("unconscious") ||
        query.includes("unresponsive") ||
        query.includes("fainted") ||
        query.includes("passed out") ||
        query.includes("collapse") ||
        query.includes("consciousness");

  if (isUnconscious) {
    return {
      type: "protocol",
      protocolId: "unconscious",
      titleKey: "title_unconscious",
      displayText: t.unconscious_desc,
      spokenText:
        t.unconscious_desc_spoken ||
        normalizeSpeechForTTS(t.unconscious_desc, locale),
      shouldStartMetronome: false,
    };
  }

  // 5. Dopasowanie szczegółowej bazy ratunkowej
  const guidanceKey = matchRescueGuidanceKey(query, locale);

  if (!guidanceKey) {
    return {
      type: "unknown",
      displayText: "",
      spokenText: "",
      shouldStartMetronome: false,
    };
  }

  const spokenKey = `${guidanceKey}_spoken`;
  const titleKey = guidanceKey.replace("guidance_", "title_");

  const displayText = t[guidanceKey] || "";
  const spokenText = t[spokenKey] || normalizeSpeechForTTS(displayText, locale);

  return {
    type: "guidance",
    guidanceKey,
    titleKey,
    displayText,
    spokenText,
    shouldStartMetronome: false,
  };
}

export function getRescueGuidance(
  query: string,
  locale: Locale,
  t: Record<string, string>,
): string {
  const key = matchRescueGuidanceKey(query, locale);
  return key && t[key] ? t[key] : "";
}
