export const DEFAULT_RECIPE = {
  flours: [
    { name: 'Wheat flour', grams: 350 },
    { name: 'Rye flour', grams: 150 },
  ],
  water: 350,
  starter: 100,
  salt: 10,
};

// Bulk time halves for every `halvingC` warmer; temperature input is clamped to the range.
export const BULK_MODEL = {
  refHours: 3,
  refTempC: 24,
  halvingC: 8,
  minTempC: 16,
  maxTempC: 32,
};

export const DEFAULT_SCHEDULE = {
  tempC: 22,
  coldRetard: true,
  retardHours: 12,
  proofHours: 1, // room-temperature proof used when cold retard is off
  outOfOvenHour: 10,
  starterFeedHours: 5,
  saltAfterMin: 30,
  foldSets: 4,
  foldEveryMin: 30,
  preheatMin: 45,
  steamMin: 20,
  noSteamMin: 22,
  steamTempC: 250,
  noSteamTempC: 210,
  restMin: 90,
};
