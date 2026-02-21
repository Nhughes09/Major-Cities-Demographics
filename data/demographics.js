// Global City Ethnic Demographics Projections (2025-2100)
// Sources: UN World Population Prospects, Pew Research, Eurostat, Census Bureau
// Note: These are modeled projections based on current demographic trends

const ETHNIC_COLORS = {
  "White/European": "#6B8EC2",
  "Black/African": "#D4A574",
  "Hispanic/Latino": "#E8786B",
  Asian: "#7BC4A8",
  "South Asian": "#C49BD4",
  "Middle Eastern/North African": "#F2C572",
  "Mixed/Multiracial": "#FF9EC6",
  Indigenous: "#8FD1E1",
  Other: "#A8A8A8",
};

const REGIONS = {
  "North America": ["new-york", "los-angeles", "toronto", "houston", "miami"],
  Europe: ["london", "paris", "amsterdam", "berlin", "birmingham-uk"],
  Africa: ["lagos", "nairobi", "johannesburg", "cairo"],
  Asia: ["tokyo", "mumbai", "dubai", "singapore"],
  Oceania: ["sydney"],
  "South America": ["sao-paulo"],
};

function lerp(start, end, steps) {
  const result = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const val = {};
    for (const key in start) {
      val[key] =
        Math.round((start[key] + (end[key] - start[key]) * t) * 10) / 10;
    }
    result.push(val);
  }
  return result;
}

function buildProjection(base2025, target2100, popStart, popEnd) {
  const steps = 15; // 2025 to 2100 in 5-year intervals
  const interp = lerp(base2025, target2100, steps);
  const years = [];
  for (let i = 0; i <= steps; i++) {
    const year = 2025 + i * 5;
    const popFactor = popStart + (popEnd - popStart) * (i / steps);
    // normalize to 100
    const vals = interp[i];
    const sum = Object.values(vals).reduce((a, b) => a + b, 0);
    const normalized = {};
    for (const k in vals)
      normalized[k] = Math.round((vals[k] / sum) * 1000) / 10;
    years.push({
      year,
      population: Math.round(popFactor * 1000) / 1000,
      groups: normalized,
    });
  }
  return years;
}

const CITIES_DATA = {
  "new-york": {
    name: "New York City",
    country: "United States",
    region: "North America",
    lat: 40.7128,
    lng: -74.006,
    data: buildProjection(
      {
        "White/European": 30.9,
        "Black/African": 20.2,
        "Hispanic/Latino": 28.7,
        Asian: 16.0,
        "Mixed/Multiracial": 3.2,
        Other: 1.0,
      },
      {
        "White/European": 18.0,
        "Black/African": 17.5,
        "Hispanic/Latino": 35.0,
        Asian: 18.0,
        "Mixed/Multiracial": 10.5,
        Other: 1.0,
      },
      8.3,
      9.1,
    ),
  },
  "los-angeles": {
    name: "Los Angeles",
    country: "United States",
    region: "North America",
    lat: 34.0522,
    lng: -118.2437,
    data: buildProjection(
      {
        "White/European": 28.9,
        "Black/African": 8.3,
        "Hispanic/Latino": 46.9,
        Asian: 11.7,
        "Mixed/Multiracial": 3.2,
        Other: 1.0,
      },
      {
        "White/European": 15.0,
        "Black/African": 6.5,
        "Hispanic/Latino": 52.0,
        Asian: 13.0,
        "Mixed/Multiracial": 12.5,
        Other: 1.0,
      },
      3.9,
      4.5,
    ),
  },
  toronto: {
    name: "Toronto",
    country: "Canada",
    region: "North America",
    lat: 43.6532,
    lng: -79.3832,
    data: buildProjection(
      {
        "White/European": 47.0,
        "Black/African": 9.1,
        "South Asian": 13.5,
        Asian: 12.7,
        "Hispanic/Latino": 3.2,
        "Middle Eastern/North African": 4.5,
        "Mixed/Multiracial": 7.0,
        Other: 3.0,
      },
      {
        "White/European": 28.0,
        "Black/African": 12.0,
        "South Asian": 18.0,
        Asian: 15.0,
        "Hispanic/Latino": 5.0,
        "Middle Eastern/North African": 7.0,
        "Mixed/Multiracial": 13.0,
        Other: 2.0,
      },
      6.2,
      8.5,
    ),
  },
  houston: {
    name: "Houston",
    country: "United States",
    region: "North America",
    lat: 29.7604,
    lng: -95.3698,
    data: buildProjection(
      {
        "White/European": 23.7,
        "Black/African": 22.1,
        "Hispanic/Latino": 44.8,
        Asian: 6.9,
        "Mixed/Multiracial": 1.8,
        Other: 0.7,
      },
      {
        "White/European": 12.0,
        "Black/African": 18.0,
        "Hispanic/Latino": 52.0,
        Asian: 8.0,
        "Mixed/Multiracial": 9.0,
        Other: 1.0,
      },
      2.3,
      3.2,
    ),
  },
  miami: {
    name: "Miami",
    country: "United States",
    region: "North America",
    lat: 25.7617,
    lng: -80.1918,
    data: buildProjection(
      {
        "White/European": 14.0,
        "Black/African": 16.8,
        "Hispanic/Latino": 65.0,
        Asian: 1.2,
        "Mixed/Multiracial": 2.5,
        Other: 0.5,
      },
      {
        "White/European": 8.0,
        "Black/African": 14.0,
        "Hispanic/Latino": 68.0,
        Asian: 2.0,
        "Mixed/Multiracial": 7.5,
        Other: 0.5,
      },
      4.6,
      5.8,
    ),
  },
  london: {
    name: "London",
    country: "United Kingdom",
    region: "Europe",
    lat: 51.5074,
    lng: -0.1278,
    data: buildProjection(
      {
        "White/European": 53.0,
        "Black/African": 13.5,
        "South Asian": 12.0,
        Asian: 5.5,
        "Middle Eastern/North African": 4.0,
        "Mixed/Multiracial": 5.5,
        Other: 6.5,
      },
      {
        "White/European": 32.0,
        "Black/African": 18.0,
        "South Asian": 16.0,
        Asian: 8.0,
        "Middle Eastern/North African": 7.0,
        "Mixed/Multiracial": 14.0,
        Other: 5.0,
      },
      9.0,
      11.2,
    ),
  },
  paris: {
    name: "Paris",
    country: "France",
    region: "Europe",
    lat: 48.8566,
    lng: 2.3522,
    data: buildProjection(
      {
        "White/European": 56.0,
        "Black/African": 12.0,
        "Middle Eastern/North African": 15.0,
        Asian: 5.0,
        "South Asian": 3.0,
        "Mixed/Multiracial": 6.0,
        Other: 3.0,
      },
      {
        "White/European": 34.0,
        "Black/African": 18.0,
        "Middle Eastern/North African": 22.0,
        Asian: 7.0,
        "South Asian": 4.0,
        "Mixed/Multiracial": 13.0,
        Other: 2.0,
      },
      11.0,
      12.8,
    ),
  },
  amsterdam: {
    name: "Amsterdam",
    country: "Netherlands",
    region: "Europe",
    lat: 52.3676,
    lng: 4.9041,
    data: buildProjection(
      {
        "White/European": 49.0,
        "Black/African": 8.0,
        "Middle Eastern/North African": 14.0,
        "South Asian": 10.0,
        Asian: 6.0,
        "Mixed/Multiracial": 9.0,
        Other: 4.0,
      },
      {
        "White/European": 30.0,
        "Black/African": 12.0,
        "Middle Eastern/North African": 18.0,
        "South Asian": 13.0,
        Asian: 8.0,
        "Mixed/Multiracial": 16.0,
        Other: 3.0,
      },
      0.9,
      1.1,
    ),
  },
  berlin: {
    name: "Berlin",
    country: "Germany",
    region: "Europe",
    lat: 52.52,
    lng: 13.405,
    data: buildProjection(
      {
        "White/European": 74.0,
        "Middle Eastern/North African": 9.0,
        Asian: 4.5,
        "Black/African": 3.5,
        "South Asian": 2.0,
        "Mixed/Multiracial": 5.0,
        Other: 2.0,
      },
      {
        "White/European": 50.0,
        "Middle Eastern/North African": 16.0,
        Asian: 8.0,
        "Black/African": 8.0,
        "South Asian": 4.0,
        "Mixed/Multiracial": 12.0,
        Other: 2.0,
      },
      3.6,
      4.2,
    ),
  },
  "birmingham-uk": {
    name: "Birmingham",
    country: "United Kingdom",
    region: "Europe",
    lat: 52.4862,
    lng: -1.8904,
    data: buildProjection(
      {
        "White/European": 48.0,
        "South Asian": 22.0,
        "Black/African": 9.0,
        "Mixed/Multiracial": 6.0,
        "Middle Eastern/North African": 5.0,
        Asian: 4.0,
        Other: 6.0,
      },
      {
        "White/European": 28.0,
        "South Asian": 26.0,
        "Black/African": 14.0,
        "Mixed/Multiracial": 16.0,
        "Middle Eastern/North African": 7.0,
        Asian: 5.0,
        Other: 4.0,
      },
      1.1,
      1.4,
    ),
  },
  lagos: {
    name: "Lagos",
    country: "Nigeria",
    region: "Africa",
    lat: 6.5244,
    lng: 3.3792,
    data: buildProjection(
      {
        "Black/African": 95.0,
        "Mixed/Multiracial": 2.0,
        "White/European": 0.5,
        Asian: 1.5,
        Other: 1.0,
      },
      {
        "Black/African": 90.0,
        "Mixed/Multiracial": 4.5,
        "White/European": 0.5,
        Asian: 3.0,
        Other: 2.0,
      },
      16.0,
      40.0,
    ),
  },
  nairobi: {
    name: "Nairobi",
    country: "Kenya",
    region: "Africa",
    lat: -1.2921,
    lng: 36.8219,
    data: buildProjection(
      {
        "Black/African": 93.0,
        "South Asian": 3.0,
        "Mixed/Multiracial": 1.5,
        "White/European": 0.8,
        Asian: 1.0,
        Other: 0.7,
      },
      {
        "Black/African": 87.0,
        "South Asian": 4.5,
        "Mixed/Multiracial": 4.0,
        "White/European": 0.5,
        Asian: 2.5,
        Other: 1.5,
      },
      5.4,
      14.0,
    ),
  },
  johannesburg: {
    name: "Johannesburg",
    country: "South Africa",
    region: "Africa",
    lat: -26.2041,
    lng: 28.0473,
    data: buildProjection(
      {
        "Black/African": 76.0,
        "White/European": 12.5,
        "Mixed/Multiracial": 5.5,
        "South Asian": 4.5,
        Asian: 1.0,
        Other: 0.5,
      },
      {
        "Black/African": 80.0,
        "White/European": 5.0,
        "Mixed/Multiracial": 8.0,
        "South Asian": 4.0,
        Asian: 2.0,
        Other: 1.0,
      },
      6.0,
      10.5,
    ),
  },
  cairo: {
    name: "Cairo",
    country: "Egypt",
    region: "Africa",
    lat: 30.0444,
    lng: 31.2357,
    data: buildProjection(
      {
        "Middle Eastern/North African": 90.0,
        "Black/African": 5.0,
        "White/European": 1.5,
        Asian: 1.0,
        "Mixed/Multiracial": 1.5,
        Other: 1.0,
      },
      {
        "Middle Eastern/North African": 84.0,
        "Black/African": 8.0,
        "White/European": 1.0,
        Asian: 2.5,
        "Mixed/Multiracial": 3.5,
        Other: 1.0,
      },
      22.0,
      38.0,
    ),
  },
  tokyo: {
    name: "Tokyo",
    country: "Japan",
    region: "Asia",
    lat: 35.6762,
    lng: 139.6503,
    data: buildProjection(
      {
        Asian: 96.0,
        "White/European": 1.0,
        "Mixed/Multiracial": 1.5,
        "South Asian": 0.5,
        "Black/African": 0.3,
        Other: 0.7,
      },
      {
        Asian: 82.0,
        "White/European": 2.5,
        "Mixed/Multiracial": 8.0,
        "South Asian": 3.5,
        "Black/African": 1.5,
        Other: 2.5,
      },
      37.4,
      30.0,
    ),
  },
  mumbai: {
    name: "Mumbai",
    country: "India",
    region: "Asia",
    lat: 19.076,
    lng: 72.8777,
    data: buildProjection(
      {
        "South Asian": 94.0,
        Asian: 2.0,
        "Middle Eastern/North African": 1.5,
        "White/European": 0.5,
        "Mixed/Multiracial": 1.0,
        Other: 1.0,
      },
      {
        "South Asian": 88.0,
        Asian: 3.5,
        "Middle Eastern/North African": 2.0,
        "White/European": 1.0,
        "Mixed/Multiracial": 4.0,
        Other: 1.5,
      },
      21.0,
      32.0,
    ),
  },
  dubai: {
    name: "Dubai",
    country: "United Arab Emirates",
    region: "Asia",
    lat: 25.2048,
    lng: 55.2708,
    data: buildProjection(
      {
        "South Asian": 50.0,
        "Middle Eastern/North African": 17.0,
        Asian: 15.0,
        "White/European": 8.0,
        "Black/African": 5.0,
        "Mixed/Multiracial": 3.0,
        Other: 2.0,
      },
      {
        "South Asian": 42.0,
        "Middle Eastern/North African": 15.0,
        Asian: 18.0,
        "White/European": 6.0,
        "Black/African": 10.0,
        "Mixed/Multiracial": 7.0,
        Other: 2.0,
      },
      3.6,
      7.0,
    ),
  },
  singapore: {
    name: "Singapore",
    country: "Singapore",
    region: "Asia",
    lat: 1.3521,
    lng: 103.8198,
    data: buildProjection(
      {
        Asian: 74.3,
        "South Asian": 9.0,
        "Mixed/Multiracial": 3.5,
        "Middle Eastern/North African": 7.0,
        "White/European": 3.2,
        "Black/African": 1.0,
        Other: 2.0,
      },
      {
        Asian: 65.0,
        "South Asian": 14.0,
        "Mixed/Multiracial": 8.0,
        "Middle Eastern/North African": 5.0,
        "White/European": 3.0,
        "Black/African": 2.0,
        Other: 3.0,
      },
      5.9,
      6.5,
    ),
  },
  sydney: {
    name: "Sydney",
    country: "Australia",
    region: "Oceania",
    lat: -33.8688,
    lng: 151.2093,
    data: buildProjection(
      {
        "White/European": 54.0,
        Asian: 20.0,
        "South Asian": 7.0,
        "Middle Eastern/North African": 5.0,
        Indigenous: 1.5,
        "Mixed/Multiracial": 5.5,
        "Black/African": 3.5,
        Other: 3.5,
      },
      {
        "White/European": 35.0,
        Asian: 26.0,
        "South Asian": 12.0,
        "Middle Eastern/North African": 7.0,
        Indigenous: 2.0,
        "Mixed/Multiracial": 12.0,
        "Black/African": 3.5,
        Other: 2.5,
      },
      5.4,
      7.8,
    ),
  },
  "sao-paulo": {
    name: "São Paulo",
    country: "Brazil",
    region: "South America",
    lat: -23.5505,
    lng: -46.6333,
    data: buildProjection(
      {
        "White/European": 54.0,
        "Mixed/Multiracial": 30.0,
        "Black/African": 7.0,
        Asian: 6.0,
        Indigenous: 0.5,
        Other: 2.5,
      },
      {
        "White/European": 32.0,
        "Mixed/Multiracial": 45.0,
        "Black/African": 10.0,
        Asian: 7.0,
        Indigenous: 0.5,
        Other: 5.5,
      },
      22.0,
      26.5,
    ),
  },
};
