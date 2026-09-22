export type SeasonalMessage = {
  key: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

// Cape Town / Helderberg rain season runs roughly June–August.
// Messaging tracks the actual scheduling constraint this creates for
// NGSMS's weather-sensitive trades (waterproofing, paving, painting).
export function getSeasonalMessage(date: Date = new Date()): SeasonalMessage {
  const month = date.getMonth(); // 0 = Jan

  // Autumn — pre-winter push (Feb–May)
  if (month >= 1 && month <= 4) {
    return {
      key: "pre-winter",
      text: "Book waterproofing and paving before the June rains — outdoor jobs need dry ground and dry surfaces.",
      ctaLabel: "Book before winter",
      ctaHref: "/quote?service=Waterproofing",
    };
  }

  // Winter — rain season (Jun–Aug)
  if (month >= 5 && month <= 7) {
    return {
      key: "winter",
      text: "Rain season is here — spotted a leak? Roof and balcony waterproofing gets diagnosed and quoted year-round.",
      ctaLabel: "Get a leak checked",
      ctaHref: "/quote?service=Waterproofing",
    };
  }

  // Spring — best painting window + pollen build-up on panels (Sep–Nov)
  if (month >= 8 && month <= 10) {
    return {
      key: "spring",
      text: "Spring is the best painting window and pollen season for solar panels — book both before the summer rush.",
      ctaLabel: "Get a free quote",
      ctaHref: "/quote",
    };
  }

  // Summer — peak solar generation (Dec–Jan)
  return {
    key: "summer",
    text: "Peak solar generation season — dirty panels can cut your output by up to 25%. Worth a clean now.",
    ctaLabel: "Book a solar clean",
    ctaHref: "/quote?service=Solar%20Panel%20Cleaning",
  };
}
