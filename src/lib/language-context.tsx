"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SupportedLanguage = "en" | "sn" | "nd";

export const LANGUAGE_STORAGE_KEY = "utare_language";
export const LANGUAGE_CHANGE_EVENT = "utare-language-change";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", shortLabel: "EN", nativeName: "English" },
  { code: "sn", label: "ChiShona", shortLabel: "SN", nativeName: "ChiShona" },
  { code: "nd", label: "isiNdebele", shortLabel: "ND", nativeName: "isiNdebele" },
];

export interface TranslationDictionary {
  toolbar: {
    prompt: string;
    audioOverview: string;
    audioPaused: string;
    playingAudio: string;
    flowDemo: string;
    accessibility: string;
    quickFaq: string;
    languageLabel: string;
    footerTitle: string;
    footerDesc: string;
  };
  network: {
    offlineBanner: string;
    onlineRestored: string;
    draftSavedNote: string;
  };
  hero: {
    eyebrow: string;
    titlePrefix: string;
    titleEmphasis: string;
    subtitle: string;
    ctaPrimary: string;
    ctaHubs: string;
    ctaOpportunities: string;
    heroNote: string;
    resilienceHeading: string;
    mobileBadgeTitle: string;
    mobileBadgeDesc: string;
    offlineBadgeTitle: string;
    offlineBadgeDesc: string;
    inclusionBadgeTitle: string;
    inclusionBadgeDesc: string;
  };
  journey: {
    eyebrow: string;
    heading: string;
    subheading: string;
    exploreStage: string;
    stages: {
      n: string;
      title: string;
      text: string;
      href: string;
    }[];
  };
  closing: {
    eyebrow: string;
    heading: string;
    subheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  a11yPanel: {
    languageSectionTitle: string;
    languageSectionDesc: string;
    screenReaderSectionTitle: string;
    screenReaderSectionDesc: string;
    disabilitySupportTitle: string;
    disabilitySupportBullets: string[];
  };
}

const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    toolbar: {
      prompt: "Need a guided walkthrough, language switch, or display adjustments?",
      audioOverview: "Audio Overview",
      audioPaused: "Audio Paused",
      playingAudio: "Playing Audio",
      flowDemo: "Flow Demo",
      accessibility: "Accessibility",
      quickFaq: "Quick Answers (FAQ)",
      languageLabel: "Language",
      footerTitle: "Guided Tour, FAQ & Accessibility",
      footerDesc:
        "— Read quick FAQs, switch language (EN / ChiShona / isiNdebele), listen to the audio walkthrough, or adjust display & screen-reader settings.",
    },
    network: {
      offlineBanner:
        "You are currently offline — your diagnostic drafts, saved progress, and language/accessibility settings stay saved on this device. Reconnect or visit a solar-powered Partner Hub to submit and sync.",
      onlineRestored:
        "Connection restored — your saved progress on this device is ready to submit and sync.",
      draftSavedNote: "Progress auto-saved on this device (safe if power or data cuts out)",
    },
    hero: {
      eyebrow: "UTARE ZEM AI · ECONOMIC MOBILITY ECOSYSTEM",
      titlePrefix: "Bridging Zimbabwe’s ",
      titleEmphasis: "Credential-to-Livelihood Paradox",
      subtitle:
        "Zimbabwe has talented graduates and skilled individuals—with 82.6% of surveyed talent holding university degrees—yet 43.5% remain unemployed and 84.6% of workers are trapped in misaligned survival gigs. UTARE bridges this gap through AI career guidance, human coaching, solar-powered partner hubs, and access to local and international earning opportunities.",
      ctaPrimary: "Start Candidate Bridge",
      ctaHubs: "Explore Partner Innovation Hubs",
      ctaOpportunities: "Browse Opportunities",
      heroNote:
        "Practical readiness, verified competency, and infrastructure access connecting Zimbabwean talent to global & local work.",
      resilienceHeading: "BUILT FOR REAL ZIMBABWEAN CONDITIONS & INCLUSION",
      mobileBadgeTitle: "Works on any phone & low data",
      mobileBadgeDesc:
        "Lightweight, mobile-first pages built for 3G/4G data bundles—no app download needed.",
      offlineBadgeTitle: "Power or data cuts out? Progress is saved",
      offlineBadgeDesc:
        "Form drafts auto-save on your device, an offline-safe engine completes your pathway if AI times out, and solar Partner Hubs offer backup power & Starlink.",
      inclusionBadgeTitle: "Accessible & multilingual by design",
      inclusionBadgeDesc:
        "English, ChiShona & isiNdebele support, plus screen-reader landmarks (NVDA, JAWS, VoiceOver, TalkBack), keyboard navigation, high contrast & audio overviews.",
    },
    journey: {
      eyebrow: "A CLEAR NEXT STEP",
      heading: "Your Pathway to Economic Mobility",
      subheading:
        "A guided 4-stage experience that helps candidates make informed decisions and overcome practical barriers at every step.",
      exploreStage: "Explore this stage",
      stages: [
        {
          n: "01",
          title: "Intake & Diagnostic",
          text: "Map your qualifications, experience, interests and last-mile infrastructure barriers across a 6-factor readiness diagnostic.",
          href: "/assessment",
        },
        {
          n: "02",
          title: "AI Pathway & Coach",
          text: "Explore tailored 90-day career directions powered by Gemini AI and paired with a 1-on-1 Zimbabwean industry mentor.",
          href: "/pathway",
        },
        {
          n: "03",
          title: "Partner Hubs",
          text: "Access solar-powered, Starlink-connected workspaces, equipment loan pools, and community support across Zimbabwe.",
          href: "/hubs",
        },
        {
          n: "04",
          title: "Remote Jobs & CV",
          text: "Generate grounded, ATS-ready CVs and application letters and explore verified local and global work opportunities.",
          href: "/jobs",
        },
      ],
    },
    closing: {
      eyebrow: "YOUR NEXT STEP STARTS HERE",
      heading: "Your Qualifications Should Open Doors to Opportunity.",
      subheading:
        "Build your skills, explore career pathways, and connect to verified economic opportunities.",
      ctaPrimary: "Start Candidate Bridge",
      ctaSecondary: "Explore Remote Opportunities",
    },
    a11yPanel: {
      languageSectionTitle: "Language & Regional Inclusion",
      languageSectionDesc:
        "Switch interface & audio overview between English, ChiShona, and isiNdebele (updates screen-reader language tags).",
      screenReaderSectionTitle: "Screen Reader & Disability Support",
      screenReaderSectionDesc:
        "Built for NVDA, JAWS, VoiceOver (iOS/Mac), Android TalkBack, keyboard-only navigation, and users with visual, motor, or cognitive disabilities.",
      disabilitySupportTitle: "Included Assistive Capabilities",
      disabilitySupportBullets: [
        "Screen Readers: Semantic landmarks (<main>, <nav>), ARIA live announcements, and Skip-to-Content.",
        "Keyboard Navigation: Full Tab / Shift+Tab, Enter, and Escape support without needing a mouse.",
        "Visual & Reading Comfort: High Contrast (7:1+), 4 Colorblind filters, 130% text scaling, Dyslexia spacing & Audio Overview.",
      ],
    },
  },
  sn: {
    toolbar: {
      prompt: "Munoda rubatsiro rwekufamba papeji, kuchinja mutauro, kana kugadzirisa maonero?",
      audioOverview: "Teerera Pfupiso",
      audioPaused: "Odhiyo Yamira",
      playingAudio: "Odhiyo Iri Kurira",
      flowDemo: "Ratidzo yeNzira",
      accessibility: "Rubatsiro & Mutauro",
      quickFaq: "Mibvunzo (FAQ)",
      languageLabel: "Mutauro",
      footerTitle: "Rubatsiro, Mibvunzo (FAQ) & Mutauro",
      footerDesc:
        "— Verengai mibvunzo, chinjai mutauro (English / ChiShona / isiNdebele), teererai pfupiso yeodhiyo, kana kugadzirisa screen reader.",
    },
    network: {
      offlineBanner:
        "Hamuna indaneti parizvino — zvamanyora, mafomu enyu, nemutauro wenyu zvakachengetwa mudhivaizi yenyu. Kana indaneti kana magetsi adzoka, kana kuPartner Hub ine solar, munoenderera mberi.",
      onlineRestored:
        "Indaneti yadzoka — zvamakachengeta mudhivaizi yenyu zvave kugona kutumirwa.",
      draftSavedNote: "Zvamanyora zvakachengetwa mudhivaizi (hazvirasiki kana magetsi kana data ikapera)",
    },
    hero: {
      eyebrow: "UTARE ZEM AI · RUBATSIRO RWEBASA NEUPFUMI",
      titlePrefix: "Kubatanidza Zivo Yenyu ",
      titleEmphasis: "Nezvigaro zveMabasa Epasi Rose",
      subtitle:
        "MuZimbabwe mune vana vechikoro vakadzidza uye vane unyanzvi—asi vazhinji havasati vawana mabasa anoenderana nedzidzo yavo. UTARE inobatsira kuburikidza negwara reAI, varairidzi vemuZimbabwe, maPartner Hubs ane solar neStarlink, uye mabasa emuno neepasi rose.",
      ctaPrimary: "Tanga Nzira Yako",
      ctaHubs: "Ona maPartner Hubs",
      ctaOpportunities: "Ona Mabasa",
      heroNote:
        "Kugadzirira basa, unyanzvi hunoongororwa, uye rubatsiro rwemagetsi neindaneti kubatanidza veZimbabwe kumabasa.",
      resilienceHeading: "YAKAGADZIRIRWA MAMIRIRO EMU ZIMBABWE NEKUBATANIDZA VOSE",
      mobileBadgeTitle: "Inoshanda pafoni uye nedata shoma",
      mobileBadgeDesc:
        "Peji rakareruka rinoshanda pafoni chero ipi zvayo uye pa3G/4G bundle diki—hapana app rinorema rekudhaunirodha.",
      offlineBadgeTitle: "Magetsi kana data rikapera? Zvakachengetwa",
      offlineBadgeDesc:
        "Fomu rako rinozochengetwa pafoni yako; kana indaneti yadzikira, sisitimu yedu inopedzisa pathway yako, uye maPartner Hubs ane solar neStarlink.",
      inclusionBadgeTitle: "Mutauro wako & rubatsiro rwevakaremara",
      inclusionBadgeDesc:
        "English, ChiShona neisiNdebele, pamwe nerubatsiro rweNVDA, JAWS, VoiceOver, TalkBack, keyboard navigation, High Contrast & odhiyo.",
    },
    journey: {
      eyebrow: "MATANHO AKAFANIRA",
      heading: "Nzira Yako Kubva Kudzidzo Kuenda Kubasa",
      subheading:
        "Matanho mana akapfava anokubatsira kuziva simba rako uye kukunda zvipingamupinyi zvebasa.",
      exploreStage: "Ongorora danho iri",
      stages: [
        {
          n: "01",
          title: "Ongororo yeKutanga",
          text: "Nyora zvidzidzo zvako, unyanzvi, uye mamiriro emagetsi kana laputopu pamatanho matanhatu.",
          href: "/assessment",
        },
        {
          n: "02",
          title: "AI Pathway & Murairidzi",
          text: "Wana hurongwa hwemazuva makumi mapfumbamwe (90 days) kubva kuGemini AI uye murairidzi wemuZimbabwe.",
          href: "/pathway",
        },
        {
          n: "03",
          title: "MaPartner Hubs",
          text: "Wana nzvimbo dzekushandira dzine magetsi esolar, Starlink Wi-Fi, uye makombiyuta ekukwereta muZimbabwe.",
          href: "/hubs",
        },
        {
          n: "04",
          title: "Mabasa eRemote & CV",
          text: "Gadzira CV netsamba dzebasa dzakagadzirirwa ATS uye unyorere mabasa akavimbika emuno nepasi rose.",
          href: "/jobs",
        },
      ],
    },
    closing: {
      eyebrow: "DANHO RAKO RINOTEVERA",
      heading: "Dzidzo Yako Inofanira Kukuvhurira Mikova yeMabasa.",
      subheading:
        "Vaka unyanzvi hwako, tsvaga nzira dzebasa, uye ubatanidzwe nemikana yakavimbika.",
      ctaPrimary: "Tanga Nzira Yako",
      ctaSecondary: "Ona Mabasa eRemote",
    },
    a11yPanel: {
      languageSectionTitle: "Mutauro & Kubatanidzwa (Language)",
      languageSectionDesc:
        "Chinja mutauro pakati peEnglish, ChiShona, neisiNdebele (zvinobatsirawo ma-screen readers).",
      screenReaderSectionTitle: "Screen Reader & Rubatsiro rweVakaremara",
      screenReaderSectionDesc:
        "Yakagadzirirwa NVDA, JAWS, VoiceOver, Android TalkBack, kushandisa keyboard chete, uye vanhu vane matambudziko ekuona kana kufambisa maoko.",
      disabilitySupportTitle: "Rubatsiro Ruri Mukati",
      disabilitySupportBullets: [
        "Screen Readers: Ma-landmarks (<main>, <nav>), ARIA live announcements, neSkip-to-Content.",
        "Keyboard Navigation: Shandisa Tab / Shift+Tab, Enter, neEscape pasina mouse.",
        "Kuona & Kuverenga: High Contrast (7:1+), Colorblind filters, 130% kukudza mavara, Dyslexia spacing & Odhiyo.",
      ],
    },
  },
  nd: {
    toolbar: {
      prompt: "Udinga usizo lokuhamba kulelikhasi, ukutshintsha ulimi, kumbe ukulungisa ukubona?",
      audioOverview: "Lalela Isifinyezo",
      audioPaused: "Umsindo Umisiwe",
      playingAudio: "Umsindo Uyadlala",
      flowDemo: "Isibonelo Sendlela",
      accessibility: "Usizo & Ulimi",
      quickFaq: "Imibuzo (FAQ)",
      languageLabel: "Ulimi",
      footerTitle: "Usizo, Imibuzo (FAQ) & Ulimi",
      footerDesc:
        "— Funda imibuzo, tshintsha ulimi (English / ChiShona / isiNdebele), lalela umsindo, kumbe ulungise i-screen reader.",
    },
    network: {
      offlineBanner:
        "Awukho ku-inthanethi khathesi — okubhalileyo, ama-draft akho, lolimi lwakho kugciniwe kudivayisi yakho. Nxa ugesi kumbe i-data ibuya, kumbe kuPartner Hub ye-solar, uzaqhubeka.",
      onlineRestored:
        "I-inthanethi isibuyile — okugciniweyo kudivayisi yakho sekulungele ukuthunyelwa.",
      draftSavedNote: "Okubhalileyo kugcinwa kudivayisi yakho (akupheli nxa ugesi kumbe i-data iphela)",
    },
    hero: {
      eyebrow: "UTARE ZEM AI · INDLELA YEMISEBENZI LOMNOTHO",
      titlePrefix: "Ukuxhumanisa Imfundo Yakho ",
      titleEmphasis: "Lamathuba Emisebenzi Emhlabeni",
      subtitle:
        "E-Zimbabwe kulabantu abafundileyo abalamakhono—kodwa abanengi kabakatholi imisebenzi ehambelana lemfundo yabo. I-UTARE ixwayisa nge-AI, abacebisi base-Zimbabwe, ama-Partner Hubs alogesi we-solar le-Starlink, kanye lemisebenzi yalapha lezaphetsheya.",
      ctaPrimary: "Qala Indlela Yakho",
      ctaHubs: "Bona ama-Partner Hubs",
      ctaOpportunities: "Bona Imisebenzi",
      heroNote:
        "Ukulungela umsebenzi, ukuqinisekisa amakhono, kanye logesi le-inthanethi ukuxhumanisa abase-Zimbabwe emisebenzini.",
      resilienceHeading: "YAKHELWE ISIMO SASE-ZIMBABWE LOKUFUKULA BONKE ABANTU",
      mobileBadgeTitle: "Isebenza efonini lange-data encane",
      mobileBadgeDesc:
        "Amakhasi alula asebenza kunoma yiphi ifoni lange-3G/4G bundle encane—akudingi i-app enkulu.",
      offlineBadgeTitle: "Ugesi kumbe i-data iphela? Okwakho kugciniwe",
      offlineBadgeDesc:
        "Ama-draft agcinwa efonini yakho; nxa inethiwekhi inciphile, uhlelo lwethu luyaqhubeka, futhi ama-Partner Hubs alogesi we-solar le-Starlink.",
      inclusionBadgeTitle: "Izilimi zakho & usizo lwabakhubazekileyo",
      inclusionBadgeDesc:
        "I-English, ChiShona lesiNdebele, kanye losekelo lwe-NVDA, JAWS, VoiceOver, TalkBack, keyboard navigation, High Contrast lomsindo.",
    },
    journey: {
      eyebrow: "ISINYATHELO ESILANDELAYO",
      heading: "Indlela Yakho Eya Emsebenzini",
      subheading:
        "Izigaba ezine ezicacileyo ezikusiza ukwazi amandla akho lokunqoba izithiyo zomsebenzi.",
      exploreStage: "Hlola lesi sigaba",
      stages: [
        {
          n: "01",
          title: "Ukuhlolwa Kokuqala",
          text: "Bhalisa imfundo yakho, amakhono, kanye lesimo sogesi kumbe ikhompyutha kusigaba esiyisithupha.",
          href: "/assessment",
        },
        {
          n: "02",
          title: "AI Pathway & Umcebisi",
          text: "Thola uhlelo lwensuku ezingamatshumi ayisithupha (90 days) oluvela ku-Gemini AI lomcebisi wase-Zimbabwe.",
          href: "/pathway",
        },
        {
          n: "03",
          title: "Ama-Partner Hubs",
          text: "Sebenzisa izindawo ezilogesi we-solar, i-Starlink Wi-Fi, lamakhompyutha okuboleka e-Zimbabwe.",
          href: "/hubs",
        },
        {
          n: "04",
          title: "Imisebenzi ye-Remote & CV",
          text: "Lungisa i-CV lencwadi yesicelo elungele i-ATS bese ufaka izicelo emisebenzini ethembekileyo.",
          href: "/jobs",
        },
      ],
    },
    closing: {
      eyebrow: "ISINYATHELO SAKHO ESIQALAYO",
      heading: "Imfundo Yakho Kufanele Ikuvulele Imisebenzi.",
      subheading:
        "Thuthukisa amakhono akho, hlola izindlela zemisebenzi, uxhumane lamathuba athembekileyo.",
      ctaPrimary: "Qala Indlela Yakho",
      ctaSecondary: "Bona Imisebenzi ye-Remote",
    },
    a11yPanel: {
      languageSectionTitle: "Ulimi & Ukufukulwa (Language)",
      languageSectionDesc:
        "Tshintsha ulimi phakathi kwe-English, ChiShona, lesiNdebele (kusiza lama-screen readers).",
      screenReaderSectionTitle: "I-Screen Reader & Usizo Lwakhubazekileyo",
      screenReaderSectionDesc:
        "Yakhelwe i-NVDA, JAWS, VoiceOver, Android TalkBack, ukusebenzisa i-keyboard kuphela, labantu abalenkinga zokubona kumbe zokuhambisa izandla.",
      disabilitySupportTitle: "Usizo Olutholakalayo",
      disabilitySupportBullets: [
        "Ama-Screen Readers: Ama-landmarks (<main>, <nav>), izaziso ze-ARIA live, le-Skip-to-Content.",
        "Keyboard Navigation: Sebenzisa i-Tab / Shift+Tab, Enter, le-Escape ngaphandle kwe-mouse.",
        "Ukubona Lokufunda: I-High Contrast (7:1+), ama-Colorblind filters, ukukhulisa amabala (130%), i-Dyslexia spacing lomsindo.",
      ],
    },
  },
};

interface LanguageContextValue {
  lang: SupportedLanguage;
  setLang: (next: SupportedLanguage) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: TRANSLATIONS.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === "en" || saved === "sn" || saved === "nd") {
        setLangState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {}
  }, []);

  const setLang = useCallback((next: SupportedLanguage) => {
    setLangState(next);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { lang: next } })
      );
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: TRANSLATIONS[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
