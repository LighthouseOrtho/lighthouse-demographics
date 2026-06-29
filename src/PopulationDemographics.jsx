import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDemographicsData } from "./useDemographicsData";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ── DESIGN TOKENS (matching LighthouseCompanies) ────────────────────────────
const C = {
  navy:"#0B1F3A", teal:"#00C4B4", teal2:"#007A70",
  red:"#E05252",  red2:"#B03030",
  green:"#3CB87A", green2:"#1A7A40",
  amber:"#F5A623", gold2:"#8B6914",
  bg:"#EEF2F7", card:"#FFFFFF", border:"#C8D6E5",
  text:"#0B1F3A", sub:"#5A7A9A",
  purple:"#7C3AED", purple2:"#5B21B6",
  pink:"#EC4899", pink2:"#BE185D",
};

// ── LOGO ────────────────────────────────────────────────────────────────────
function LighthouseLogo({ size=40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="50" fill="#5B8AC5"/>
      <path d="M50 28 Q10 22 2 38 Q18 30 50 34 Z" fill="white" opacity="0.9"/>
      <path d="M50 28 Q90 22 98 38 Q82 30 50 34 Z" fill="white" opacity="0.9"/>
      <path d="M38 95 L40 55 L60 55 L62 95 Z" fill="#2a2a2a"/>
      <path d="M40 55 L44 95 L38 95 L40 55 Z" fill="#555" opacity="0.5"/>
      <rect x="38" y="68" width="24" height="5" rx="1" fill="#444"/>
      <ellipse cx="50" cy="55" rx="14" ry="4" fill="#1a1a1a"/>
      <rect x="36" y="51" width="28" height="5" rx="2" fill="#1a1a1a"/>
      <rect x="44" y="40" width="12" height="12" rx="2" fill="#333"/>
      <ellipse cx="50" cy="40" rx="10" ry="3.5" fill="#1a1a1a"/>
      <ellipse cx="50" cy="39" rx="10" ry="3" fill="#2a2a2a"/>
      <circle cx="50" cy="31" r="7" fill="white"/>
      <circle cx="48" cy="29" r="2.5" fill="white" opacity="0.5"/>
      <ellipse cx="50" cy="24.5" rx="7" ry="2.5" fill="#1a1a1a"/>
      <ellipse cx="50" cy="23" rx="5" ry="3" fill="#2a2a2a"/>
      <circle cx="50" cy="21" r="2.5" fill="#1a1a1a"/>
    </svg>
  );
}

// ── POPULATION DATA ──────────────────────────────────────────────────────────
// All values in thousands. Sources: UN World Population Prospects 2024 + projections.
// Data covers 2005, 2010, 2015, 2020, 2025, 2030, 2035
// Age groups: under18, 18to64, 65to79, over80, total
// Male/Female splits at ~48.6% / 51.4% (varies by age group)

const YEARS = [2005,2010,2015,2020,2025,2030,2035];

const REGIONS = {
  "Global": {
    color:"#CC2229", flag:"🌍",
    data:[
      {y:2005,total:6542000,under18:1980000,a18to49:2898000,a50to64:1242000,a65to79:345000,over80:77000},
      {y:2010,total:6957000,under18:2010000,a18to49:3122000,a50to64:1338000,a65to79:392000,over80:95000},
      {y:2015,total:7383000,under18:2050000,a18to49:3374000,a50to64:1446000,a65to79:430000,over80:110000},
      {y:2020,total:7795000,under18:2090000,a18to49:3605000,a50to64:1545000,a65to79:435000,over80:120000},
      {y:2025,total:8200000,under18:2120000,a18to49:3801000,a50to64:1629000,a65to79:510000,over80:140000},
      {y:2030,total:8548000,under18:2090000,a18to49:3990000,a50to64:1710000,a65to79:600000,over80:158000},
      {y:2035,total:8875000,under18:2050000,a18to49:4123000,a50to64:1767000,a65to79:720000,over80:215000},
    ],
    countries:["United Kingdom","Germany","France","United States","Japan","China","India","Brazil","Nigeria","South Africa","Australia","Canada"],
  },
  "Europe": {
    color:"#1B54A8", flag:"🇪🇺",
    data:[
      {y:2005,total:728000,under18:141000,a18to49:338800,a50to64:145200,a65to79:84000,over80:19000},
      {y:2010,total:736000,under18:137000,a18to49:342300,a50to64:146700,a65to79:89000,over80:21000},
      {y:2015,total:743000,under18:134000,a18to49:341600,a50to64:146400,a65to79:98000,over80:23000},
      {y:2020,total:748000,under18:132000,a18to49:338800,a50to64:145200,a65to79:106000,over80:26000},
      {y:2025,total:749000,under18:129000,a18to49:333200,a50to64:142800,a65to79:114000,over80:30000},
      {y:2030,total:746000,under18:125000,a18to49:323400,a50to64:138600,a65to79:127000,over80:32000},
      {y:2035,total:740000,under18:120000,a18to49:311500,a50to64:133500,a65to79:142000,over80:33000},
    ],
    countries:["United Kingdom","Germany","France","Italy","Spain","Netherlands","Poland","Sweden","Norway","Denmark","Switzerland","Belgium","Portugal","Austria","Ireland","Finland"],
  },
  "Americas": {
    color:"#D4870A", flag:"🌎",
    data:[
      {y:2005,total:882000,under18:268000,a18to49:391300,a50to64:167700,a65to79:46000,over80:9000},
      {y:2010,total:938000,under18:272000,a18to49:421400,a50to64:180600,a65to79:53000,over80:11000},
      {y:2015,total:993000,under18:277000,a18to49:451500,a50to64:193500,a65to79:59000,over80:12000},
      {y:2020,total:1041000,under18:277000,a18to49:478100,a50to64:204900,a65to79:66000,over80:15000},
      {y:2025,total:1086000,under18:276000,a18to49:499800,a50to64:214200,a65to79:77000,over80:19000},
      {y:2030,total:1127000,under18:272000,a18to49:518000,a50to64:222000,a65to79:91000,over80:24000},
      {y:2035,total:1163000,under18:265000,a18to49:533400,a50to64:228600,a65to79:107000,over80:29000},
    ],
    countries:["United States","Canada","Brazil","Mexico","Colombia","Argentina","Chile","Peru"],
  },
  "Asia-Pacific": {
    color:"#007A5E", flag:"🌏",
    data:[
      {y:2005,total:3938000,under18:1272000,a18to49:1729000,a50to64:741000,a65to79:168000,over80:28000},
      {y:2010,total:4164000,under18:1280000,a18to49:1862000,a50to64:798000,a65to79:196000,over80:28000},
      {y:2015,total:4393000,under18:1290000,a18to49:1974000,a50to64:846000,a65to79:242000,over80:41000},
      {y:2020,total:4641000,under18:1310000,a18to49:2107000,a50to64:903000,a65to79:273000,over80:48000},
      {y:2025,total:4864000,under18:1300000,a18to49:2247000,a50to64:963000,a65to79:302000,over80:52000},
      {y:2030,total:5060000,under18:1270000,a18to49:2366000,a50to64:1014000,a65to79:345000,over80:65000},
      {y:2035,total:5220000,under18:1230000,a18to49:2443000,a50to64:1047000,a65to79:410000,over80:90000},
    ],
    countries:["Japan","China","India","Australia","South Korea","Indonesia","Philippines","Vietnam","Thailand","Malaysia","Singapore","New Zealand","Pakistan","Bangladesh"],
  },
  "Africa": {
    color:"#9B1D8A", flag:"🌍",
    data:[
      {y:2005,total:913000,under18:440000,a18to49:318500,a50to64:136500,a65to79:16000,over80:2000},
      {y:2010,total:1045000,under18:497000,a18to49:368900,a50to64:158100,a65to79:19000,over80:2000},
      {y:2015,total:1189000,under18:557000,a18to49:427000,a50to64:183000,a65to79:20000,over80:2000},
      {y:2020,total:1360000,under18:625000,a18to49:494200,a50to64:211800,a65to79:27000,over80:2000},
      {y:2025,total:1530000,under18:690000,a18to49:565600,a50to64:242400,a65to79:29000,over80:3000},
      {y:2030,total:1710000,under18:750000,a18to49:644700,a50to64:276300,a65to79:35000,over80:4000},
      {y:2035,total:1925000,under18:830000,a18to49:735000,a50to64:315000,a65to79:41000,over80:4000},
    ],
    countries:["Nigeria","South Africa","Ethiopia","Egypt","Kenya","Ghana","Tanzania","Morocco","Mozambique","Uganda"],
  },
  "Middle East": {
    color:"#B8860B", flag:"🕌",
    data:[
      {y:2005,total:193000,under18:68000,a18to49:81200,a50to64:34800,a65to79:7400,over80:1600},
      {y:2010,total:222000,under18:73000,a18to49:97300,a50to64:41700,a65to79:8500,over80:1500},
      {y:2015,total:255000,under18:78000,a18to49:116200,a50to64:49800,a65to79:9300,over80:1700},
      {y:2020,total:284000,under18:79000,a18to49:134400,a50to64:57600,a65to79:11000,over80:2000},
      {y:2025,total:310000,under18:79000,a18to49:150500,a50to64:64500,a65to79:13000,over80:3000},
      {y:2030,total:338000,under18:79000,a18to49:167300,a50to64:71700,a65to79:17000,over80:3000},
      {y:2035,total:363000,under18:78000,a18to49:182700,a50to64:78300,a65to79:21000,over80:3000},
    ],
    countries:["Saudi Arabia","UAE","Iran","Iraq","Israel","Jordan","Kuwait","Qatar","Bahrain","Oman"],
  },
};

const COUNTRIES = {
  // Europe
  "United Kingdom":{ region:"Europe", flag:"🇬🇧", color:"#003087",
    data:[
      {y:2005,total:60300,under18:13200,a18to49:27090,a50to64:11610,a65to79:6600,over80:1800},
      {y:2010,total:62800,under18:13500,a18to49:28350,a50to64:12150,a65to79:6900,over80:1900},
      {y:2015,total:65200,under18:14000,a18to49:29260,a50to64:12540,a65to79:7300,over80:2100},
      {y:2020,total:67200,under18:14200,a18to49:30100,a50to64:12900,a65to79:7600,over80:2400},
      {y:2025,total:69551,under18:14329,a18to49:29063,a50to64:12456,a65to79:9945,over80:3758},
      {y:2030,total:70400,under18:13900,a18to49:30870,a50to64:13230,a65to79:9400,over80:3000},
      {y:2035,total:71700,under18:13600,a18to49:31010,a50to64:13290,a65to79:10500,over80:3300},
    ]},
  "Germany":{ region:"Europe", flag:"🇩🇪", color:"#1A1A1A",
    data:[
      {y:2005,total:82500,under18:14100,a18to49:39270,a50to64:16830,a65to79:9800,over80:2500},
      {y:2010,total:81800,under18:13300,a18to49:38780,a50to64:16620,a65to79:10200,over80:2900},
      {y:2015,total:81700,under18:13000,a18to49:37800,a50to64:16200,a65to79:11300,over80:3400},
      {y:2020,total:83200,under18:13600,a18to49:38010,a50to64:16290,a65to79:11900,over80:3400},
      {y:2025,total:84075,under18:13996,a18to49:35106,a50to64:15045,a65to79:13630,over80:6298},
      {y:2030,total:84900,under18:13400,a18to49:36260,a50to64:15540,a65to79:15300,over80:4400},
      {y:2035,total:84200,under18:12700,a18to49:34930,a50to64:14970,a65to79:17100,over80:4500},
    ]},
  "France":{ region:"Europe", flag:"🇫🇷", color:"#0055A4",
    data:[
      {y:2005,total:63000,under18:14500,a18to49:28560,a50to64:12240,a65to79:6100,over80:1600},
      {y:2010,total:64800,under18:15000,a18to49:29330,a50to64:12570,a65to79:6100,over80:1800},
      {y:2015,total:66800,under18:15300,a18to49:29890,a50to64:12810,a65to79:6700,over80:2100},
      {y:2020,total:67900,under18:15400,a18to49:30030,a50to64:12870,a65to79:7000,over80:2600},
      {y:2025,total:66651,under18:13309,a18to49:26823,a50to64:11495,a65to79:10793,over80:4232},
      {y:2030,total:69300,under18:14800,a18to49:29890,a50to64:12810,a65to79:8700,over80:3100},
      {y:2035,total:69800,under18:14400,a18to49:29610,a50to64:12690,a65to79:9800,over80:3300},
    ]},
  "Italy":{ region:"Europe", flag:"🇮🇹", color:"#009246",
    data:[
      {y:2005,total:58600,under18:9800,a18to49:28070,a50to64:12030,a65to79:7000,over80:1700},
      {y:2010,total:59600,under18:9800,a18to49:28420,a50to64:12180,a65to79:7200,over80:2000},
      {y:2015,total:60800,under18:9700,a18to49:28490,a50to64:12210,a65to79:8000,over80:2400},
      {y:2020,total:59600,under18:9200,a18to49:27440,a50to64:11760,a65to79:8800,over80:2400},
      {y:2025,total:59146,under18:8639,a18to49:24964,a50to64:10699,a65to79:10169,over80:4675},
      {y:2030,total:58200,under18:8300,a18to49:25340,a50to64:10860,a65to79:11000,over80:2700},
      {y:2035,total:57100,under18:7800,a18to49:24080,a50to64:10320,a65to79:11900,over80:3000},
    ]},
  "Spain":{ region:"Europe", flag:"🇪🇸", color:"#AA151B",
    data:[
      {y:2005,total:43900,under18:8500,a18to49:20860,a50to64:8940,a65to79:4600,over80:1000},
      {y:2010,total:46700,under18:9200,a18to49:22190,a50to64:9510,a65to79:4700,over80:1100},
      {y:2015,total:46400,under18:8800,a18to49:21840,a50to64:9360,a65to79:5200,over80:1200},
      {y:2020,total:47400,under18:8800,a18to49:21980,a50to64:9420,a65to79:5700,over80:1500},
      {y:2025,total:47890,under18:7592,a18to49:20954,a50to64:8980,a65to79:7258,over80:3107},
      {y:2030,total:48000,under18:8200,a18to49:21490,a50to64:9210,a65to79:7100,over80:2000},
      {y:2035,total:47900,under18:7700,a18to49:21070,a50to64:9030,a65to79:7900,over80:2200},
    ]},
  "Sweden":{ region:"Europe", flag:"🇸🇪", color:"#006AA7",
    data:[
      {y:2005,total:9050,under18:1890,a18to49:3997,a50to64:1713,a65to79:1100,over80:350},
      {y:2010,total:9380,under18:1930,a18to49:4144,a50to64:1776,a65to79:1140,over80:390},
      {y:2015,total:9800,under18:2050,a18to49:4305,a50to64:1845,a65to79:1200,over80:400},
      {y:2020,total:10360,under18:2180,a18to49:4543,a50to64:1947,a65to79:1290,over80:400},
      {y:2025,total:10800,under18:2230,a18to49:4711,a50to64:2019,a65to79:1390,over80:450},
      {y:2030,total:11200,under18:2260,a18to49:4844,a50to64:2076,a65to79:1580,over80:440},
      {y:2035,total:11500,under18:2270,a18to49:4935,a50to64:2115,a65to79:1740,over80:440},
    ]},
  "Netherlands":{ region:"Europe", flag:"🇳🇱", color:"#AE1C28",
    data:[
      {y:2005,total:16300,under18:3400,a18to49:7630,a50to64:3270,a65to79:1700,over80:300},
      {y:2010,total:16600,under18:3300,a18to49:7770,a50to64:3330,a65to79:1850,over80:350},
      {y:2015,total:16900,under18:3300,a18to49:7840,a50to64:3360,a65to79:2000,over80:400},
      {y:2020,total:17500,under18:3400,a18to49:7980,a50to64:3420,a65to79:2200,over80:500},
      {y:2025,total:18347,under18:3347,a18to49:7820,a50to64:3351,a65to79:2879,over80:949},
      {y:2030,total:18300,under18:3400,a18to49:8120,a50to64:3480,a65to79:2800,over80:500},
      {y:2035,total:18600,under18:3300,a18to49:8120,a50to64:3480,a65to79:3100,over80:600},
    ]},
  "Poland":{ region:"Europe", flag:"🇵🇱", color:"#DC143C",
    data:[
      {y:2005,total:38200,under18:7400,a18to49:18620,a50to64:7980,a65to79:3500,over80:700},
      {y:2010,total:38100,under18:7000,a18to49:18550,a50to64:7950,a65to79:3800,over80:800},
      {y:2015,total:38000,under18:6900,a18to49:18200,a50to64:7800,a65to79:4200,over80:900},
      {y:2020,total:37900,under18:7000,a18to49:17850,a50to64:7650,a65to79:4500,over80:900},
      {y:2025,total:37200,under18:6600,a18to49:17150,a50to64:7350,a65to79:5200,over80:900},
      {y:2030,total:36100,under18:6100,a18to49:16450,a50to64:7050,a65to79:5700,over80:800},
      {y:2035,total:34800,under18:5700,a18to49:15540,a50to64:6660,a65to79:6200,over80:700},
    ]},
  "Norway":{ region:"Europe", flag:"🇳🇴", color:"#EF2B2D",
    data:[
      {y:2005,total:4620,under18:1020,a18to49:2051,a50to64:879,a65to79:500,over80:170},
      {y:2010,total:4890,under18:1070,a18to49:2184,a50to64:936,a65to79:520,over80:180},
      {y:2015,total:5190,under18:1140,a18to49:2331,a50to64:999,a65to79:550,over80:170},
      {y:2020,total:5380,under18:1180,a18to49:2415,a50to64:1035,a65to79:600,over80:150},
      {y:2025,total:5550,under18:1200,a18to49:2485,a50to64:1065,a65to79:640,over80:160},
      {y:2030,total:5700,under18:1220,a18to49:2527,a50to64:1083,a65to79:720,over80:150},
      {y:2035,total:5850,under18:1230,a18to49:2562,a50to64:1098,a65to79:800,over80:160},
    ]},
  "Denmark":{ region:"Europe", flag:"🇩🇰", color:"#C60C30",
    data:[
      {y:2005,total:5430,under18:1110,a18to49:2471,a50to64:1059,a65to79:620,over80:170},
      {y:2010,total:5550,under18:1120,a18to49:2513,a50to64:1077,a65to79:650,over80:190},
      {y:2015,total:5690,under18:1170,a18to49:2562,a50to64:1098,a65to79:660,over80:200},
      {y:2020,total:5840,under18:1210,a18to49:2625,a50to64:1125,a65to79:680,over80:200},
      {y:2025,total:5970,under18:1230,a18to49:2674,a50to64:1146,a65to79:730,over80:190},
      {y:2030,total:6100,under18:1250,a18to49:2702,a50to64:1158,a65to79:800,over80:190},
      {y:2035,total:6220,under18:1260,a18to49:2709,a50to64:1161,a65to79:890,over80:200},
    ]},
  "Switzerland":{ region:"Europe", flag:"🇨🇭", color:"#FF0000",
    data:[
      {y:2005,total:7440,under18:1440,a18to49:3409,a50to64:1461,a65to79:880,over80:250},
      {y:2010,total:7790,under18:1460,a18to49:3584,a50to64:1536,a65to79:940,over80:270},
      {y:2015,total:8280,under18:1540,a18to49:3808,a50to64:1632,a65to79:1010,over80:290},
      {y:2020,total:8640,under18:1570,a18to49:3955,a50to64:1695,a65to79:1100,over80:320},
      {y:2025,total:9000,under18:1600,a18to49:4088,a50to64:1752,a65to79:1220,over80:340},
      {y:2030,total:9300,under18:1610,a18to49:4158,a50to64:1782,a65to79:1390,over80:360},
      {y:2035,total:9550,under18:1610,a18to49:4207,a50to64:1803,a65to79:1570,over80:360},
    ]},
  "Belgium":{ region:"Europe", flag:"🇧🇪", color:"#FAE042",
    data:[
      {y:2005,total:10480,under18:2200,a18to49:4830,a50to64:2070,a65to79:1150,over80:230},
      {y:2010,total:10900,under18:2280,a18to49:5012,a50to64:2148,a65to79:1220,over80:240},
      {y:2015,total:11250,under18:2350,a18to49:5131,a50to64:2199,a65to79:1320,over80:250},
      {y:2020,total:11590,under18:2440,a18to49:5229,a50to64:2241,a65to79:1430,over80:250},
      {y:2025,total:11800,under18:2460,a18to49:5278,a50to64:2262,a65to79:1550,over80:250},
      {y:2030,total:12000,under18:2460,a18to49:5292,a50to64:2268,a65to79:1730,over80:250},
      {y:2035,total:12200,under18:2450,a18to49:5271,a50to64:2259,a65to79:1970,over80:250},
    ]},
  "Portugal":{ region:"Europe", flag:"🇵🇹", color:"#006600",
    data:[
      {y:2005,total:10560,under18:1800,a18to49:5040,a50to64:2160,a65to79:1300,over80:260},
      {y:2010,total:10630,under18:1740,a18to49:5040,a50to64:2160,a65to79:1400,over80:290},
      {y:2015,total:10350,under18:1650,a18to49:4858,a50to64:2082,a65to79:1500,over80:260},
      {y:2020,total:10200,under18:1600,a18to49:4725,a50to64:2025,a65to79:1580,over80:270},
      {y:2025,total:10000,under18:1540,a18to49:4571,a50to64:1959,a65to79:1680,over80:250},
      {y:2030,total:9750,under18:1470,a18to49:4382,a50to64:1878,a65to79:1780,over80:240},
      {y:2035,total:9470,under18:1380,a18to49:4179,a50to64:1791,a65to79:1880,over80:240},
    ]},
  "Austria":{ region:"Europe", flag:"🇦🇹", color:"#ED2939",
    data:[
      {y:2005,total:8230,under18:1660,a18to49:3850,a50to64:1650,a65to79:870,over80:200},
      {y:2010,total:8380,under18:1620,a18to49:3941,a50to64:1689,a65to79:920,over80:210},
      {y:2015,total:8640,under18:1640,a18to49:4046,a50to64:1734,a65to79:1000,over80:220},
      {y:2020,total:9010,under18:1740,a18to49:4193,a50to64:1797,a65to79:1040,over80:240},
      {y:2025,total:9200,under18:1760,a18to49:4228,a50to64:1812,a65to79:1170,over80:230},
      {y:2030,total:9380,under18:1760,a18to49:4228,a50to64:1812,a65to79:1340,over80:240},
      {y:2035,total:9520,under18:1750,a18to49:4207,a50to64:1803,a65to79:1530,over80:230},
    ]},
  "Ireland":{ region:"Europe", flag:"🇮🇪", color:"#169B62",
    data:[
      {y:2005,total:4140,under18:950,a18to49:2009,a50to64:861,a65to79:270,over80:50},
      {y:2010,total:4560,under18:1070,a18to49:2205,a50to64:945,a65to79:290,over80:50},
      {y:2015,total:4630,under18:1120,a18to49:2219,a50to64:951,a65to79:300,over80:60},
      {y:2020,total:4990,under18:1190,a18to49:2401,a50to64:1029,a65to79:320,over80:50},
      {y:2025,total:5300,under18:1230,a18to49:2548,a50to64:1092,a65to79:380,over80:50},
      {y:2030,total:5550,under18:1260,a18to49:2639,a50to64:1131,a65to79:470,over80:50},
      {y:2035,total:5780,under18:1280,a18to49:2716,a50to64:1164,a65to79:570,over80:50},
    ]},
  "Finland":{ region:"Europe", flag:"🇫🇮", color:"#003580",
    data:[
      {y:2005,total:5250,under18:1040,a18to49:2373,a50to64:1017,a65to79:640,over80:180},
      {y:2010,total:5370,under18:1060,a18to49:2415,a50to64:1035,a65to79:670,over80:190},
      {y:2015,total:5490,under18:1080,a18to49:2464,a50to64:1056,a65to79:710,over80:180},
      {y:2020,total:5530,under18:1080,a18to49:2450,a50to64:1050,a65to79:770,over80:180},
      {y:2025,total:5570,under18:1070,a18to49:2429,a50to64:1041,a65to79:840,over80:190},
      {y:2030,total:5580,under18:1060,a18to49:2401,a50to64:1029,a65to79:920,over80:170},
      {y:2035,total:5570,under18:1040,a18to49:2359,a50to64:1011,a65to79:1000,over80:160},
    ]},
  // Americas
  "United States":{ region:"Americas", flag:"🇺🇸", color:"#3C3B6E",
    data:[
      {y:2005,total:296100,under18:72900,a18to49:134190,a50to64:57510,a65to79:24400,over80:7100},
      {y:2010,total:309300,under18:73700,a18to49:140560,a50to64:60240,a65to79:25800,over80:9000},
      {y:2015,total:321400,under18:73900,a18to49:146230,a50to64:62670,a65to79:28400,over80:10200},
      {y:2020,total:331400,under18:72900,a18to49:149940,a50to64:64260,a65to79:33100,over80:11200},
      {y:2025,total:347276,under18:73078,a18to49:147240,a50to64:63103,a65to79:49277,over80:14577},
      {y:2030,total:347800,under18:72100,a18to49:155330,a50to64:66570,a65to79:42700,over80:11100},
      {y:2035,total:354900,under18:71400,a18to49:157080,a50to64:67320,a65to79:47200,over80:11900},
    ]},
  "Canada":{ region:"Americas", flag:"🇨🇦", color:"#FF0000",
    data:[
      {y:2005,total:32300,under18:7100,a18to49:15120,a50to64:6480,a65to79:3000,over80:600},
      {y:2010,total:34000,under18:7200,a18to49:15960,a50to64:6840,a65to79:3200,over80:800},
      {y:2015,total:35600,under18:7400,a18to49:16660,a50to64:7140,a65to79:3600,over80:800},
      {y:2020,total:37700,under18:7700,a18to49:17430,a50to64:7470,a65to79:4200,over80:900},
      {y:2025,total:40127,under18:7333,a18to49:17265,a50to64:7399,a65to79:6128,over80:2002},
      {y:2030,total:42000,under18:8200,a18to49:19040,a50to64:8160,a65to79:5600,over80:1000},
      {y:2035,total:43800,under18:8400,a18to49:19670,a50to64:8430,a65to79:6300,over80:1000},
    ]},
  "Brazil":{ region:"Americas", flag:"🇧🇷", color:"#009C3B",
    data:[
      {y:2005,total:188400,under18:60200,a18to49:83650,a50to64:35850,a65to79:7200,over80:1500},
      {y:2010,total:196800,under18:57600,a18to49:89950,a50to64:38550,a65to79:9200,over80:1500},
      {y:2015,total:204500,under18:54100,a18to49:96180,a50to64:41220,a65to79:11500,over80:1500},
      {y:2020,total:213200,under18:51200,a18to49:101640,a50to64:43560,a65to79:14700,over80:2100},
      {y:2025,total:219000,under18:48900,a18to49:105560,a50to64:45240,a65to79:16800,over80:2500},
      {y:2030,total:224000,under18:46600,a18to49:108640,a50to64:46560,a65to79:19600,over80:2600},
      {y:2035,total:228000,under18:44100,a18to49:110950,a50to64:47550,a65to79:23000,over80:2400},
    ]},
  "Mexico":{ region:"Americas", flag:"🇲🇽", color:"#006847",
    data:[
      {y:2005,total:103900,under18:35900,a18to49:43750,a50to64:18750,a65to79:4500,over80:1000},
      {y:2010,total:112300,under18:36500,a18to49:48790,a50to64:20910,a65to79:5200,over80:900},
      {y:2015,total:121000,under18:36800,a18to49:54180,a50to64:23220,a65to79:5900,over80:900},
      {y:2020,total:128900,under18:36800,a18to49:59080,a50to64:25320,a65to79:6900,over80:800},
      {y:2025,total:134900,under18:36300,a18to49:63000,a50to64:27000,a65to79:7700,over80:900},
      {y:2030,total:140800,under18:35700,a18to49:66710,a50to64:28590,a65to79:9000,over80:800},
      {y:2035,total:146200,under18:35000,a18to49:70000,a50to64:30000,a65to79:10400,over80:800},
    ]},
  "Argentina":{ region:"Americas", flag:"🇦🇷", color:"#74ACDF",
    data:[
      {y:2005,total:38600,under18:11600,a18to49:16730,a50to64:7170,a65to79:2600,over80:500},
      {y:2010,total:40700,under18:11800,a18to49:17710,a50to64:7590,a65to79:2900,over80:700},
      {y:2015,total:43400,under18:12100,a18to49:19180,a50to64:8220,a65to79:3200,over80:700},
      {y:2020,total:45600,under18:12400,a18to49:20230,a50to64:8670,a65to79:3600,over80:700},
      {y:2025,total:47700,under18:12600,a18to49:21350,a50to64:9150,a65to79:3900,over80:700},
      {y:2030,total:49700,under18:12700,a18to49:22400,a50to64:9600,a65to79:4300,over80:700},
      {y:2035,total:51800,under18:12800,a18to49:23520,a50to64:10080,a65to79:4700,over80:700},
    ]},
  "Colombia":{ region:"Americas", flag:"🇨🇴", color:"#FCD116",
    data:[
      {y:2005,total:43100,under18:15200,a18to49:17990,a50to64:7710,a65to79:1900,over80:300},
      {y:2010,total:46000,under18:15200,a18to49:19670,a50to64:8430,a65to79:2200,over80:500},
      {y:2015,total:48200,under18:14700,a18to49:21280,a50to64:9120,a65to79:2600,over80:500},
      {y:2020,total:50900,under18:14500,a18to49:22960,a50to64:9840,a65to79:3100,over80:500},
      {y:2025,total:53000,under18:14200,a18to49:24220,a50to64:10380,a65to79:3700,over80:500},
      {y:2030,total:54900,under18:13700,a18to49:25340,a50to64:10860,a65to79:4400,over80:600},
      {y:2035,total:56500,under18:13200,a18to49:26250,a50to64:11250,a65to79:5200,over80:600},
    ]},
  "Chile":{ region:"Americas", flag:"🇨🇱", color:"#D52B1E",
    data:[
      {y:2005,total:16300,under18:4400,a18to49:7420,a50to64:3180,a65to79:1100,over80:200},
      {y:2010,total:17100,under18:4300,a18to49:7840,a50to64:3360,a65to79:1300,over80:300},
      {y:2015,total:17900,under18:4200,a18to49:8400,a50to64:3600,a65to79:1500,over80:200},
      {y:2020,total:19100,under18:4200,a18to49:9100,a50to64:3900,a65to79:1700,over80:200},
      {y:2025,total:19600,under18:4000,a18to49:9380,a50to64:4020,a65to79:1900,over80:300},
      {y:2030,total:20100,under18:3800,a18to49:9660,a50to64:4140,a65to79:2300,over80:200},
      {y:2035,total:20500,under18:3700,a18to49:9870,a50to64:4230,a65to79:2500,over80:200},
    ]},
  "Peru":{ region:"Americas", flag:"🇵🇪", color:"#D91023",
    data:[
      {y:2005,total:27800,under18:9700,a18to49:11550,a50to64:4950,a65to79:1400,over80:200},
      {y:2010,total:29300,under18:9600,a18to49:12530,a50to64:5370,a65to79:1600,over80:200},
      {y:2015,total:31400,under18:9700,a18to49:13720,a50to64:5880,a65to79:1900,over80:200},
      {y:2020,total:33000,under18:9800,a18to49:14700,a50to64:6300,a65to79:2000,over80:200},
      {y:2025,total:34400,under18:9700,a18to49:15610,a50to64:6690,a65to79:2200,over80:200},
      {y:2030,total:35700,under18:9500,a18to49:16450,a50to64:7050,a65to79:2500,over80:200},
      {y:2035,total:36900,under18:9200,a18to49:17290,a50to64:7410,a65to79:2800,over80:200},
    ]},
  // Asia-Pacific
  "Japan":{ region:"Asia-Pacific", flag:"🇯🇵", color:"#BC002D",
    data:[
      {y:2005,total:127700,under18:20700,a18to49:59360,a50to64:25440,a65to79:16500,over80:5700},
      {y:2010,total:128100,under18:19000,a18to49:57470,a50to64:24630,a65to79:19400,over80:7600},
      {y:2015,total:126900,under18:17400,a18to49:55020,a50to64:23580,a65to79:21100,over80:9800},
      {y:2020,total:125700,under18:16300,a18to49:51590,a50to64:22110,a65to79:24600,over80:11100},
      {y:2025,total:123103,under18:17230,a18to49:48265,a50to64:20685,a65to79:23788,over80:13136},
      {y:2030,total:122000,under18:14200,a18to49:47600,a50to64:20400,a65to79:27500,over80:12300},
      {y:2035,total:119100,under18:13100,a18to49:45290,a50to64:19410,a65to79:29800,over80:11500},
    ]},
  "China":{ region:"Asia-Pacific", flag:"🇨🇳", color:"#DE2910",
    data:[
      {y:2005,total:1304500,under18:314000,a18to49:625100,a50to64:267900,a65to79:81000,over80:16500},
      {y:2010,total:1340900,under18:297000,a18to49:655200,a50to64:280800,a65to79:91000,over80:16900},
      {y:2015,total:1371200,under18:281000,a18to49:686000,a50to64:294000,a65to79:91000,over80:19200},
      {y:2020,total:1411100,under18:283000,a18to49:690200,a50to64:295800,a65to79:116000,over80:26100},
      {y:2025,total:1408000,under18:268000,a18to49:686000,a50to64:294000,a65to79:122000,over80:38000},
      {y:2030,total:1399000,under18:252000,a18to49:672000,a50to64:288000,a65to79:148000,over80:39000},
      {y:2035,total:1383000,under18:240000,a18to49:646800,a50to64:277200,a65to79:180000,over80:39000},
    ]},
  "India":{ region:"Asia-Pacific", flag:"🇮🇳", color:"#FF9933",
    data:[
      {y:2005,total:1147000,under18:420000,a18to49:470400,a50to64:201600,a65to79:48000,over80:7000},
      {y:2010,total:1230000,under18:430000,a18to49:515900,a50to64:221100,a65to79:55000,over80:8000},
      {y:2015,total:1310000,under18:431000,a18to49:565600,a50to64:242400,a65to79:61000,over80:10000},
      {y:2020,total:1380000,under18:427000,a18to49:613200,a50to64:262800,a65to79:66000,over80:11000},
      {y:2025,total:1441000,under18:419000,a18to49:657300,a50to64:281700,a65to79:71000,over80:12000},
      {y:2030,total:1497000,under18:402000,a18to49:700000,a50to64:300000,a65to79:82000,over80:13000},
      {y:2035,total:1550000,under18:387000,a18to49:739900,a50to64:317100,a65to79:95000,over80:11000},
    ]},
  "Australia":{ region:"Asia-Pacific", flag:"🇦🇺", color:"#00008B",
    data:[
      {y:2005,total:20400,under18:4900,a18to49:9450,a50to64:4050,a65to79:1700,over80:300},
      {y:2010,total:22300,under18:5100,a18to49:10360,a50to64:4440,a65to79:2000,over80:400},
      {y:2015,total:24000,under18:5500,a18to49:11130,a50to64:4770,a65to79:2200,over80:400},
      {y:2020,total:25700,under18:5900,a18to49:11900,a50to64:5100,a65to79:2500,over80:300},
      {y:2025,total:26974,under18:5765,a18to49:11430,a50to64:4899,a65to79:3620,over80:1260},
      {y:2030,total:28700,under18:6500,a18to49:13160,a50to64:5640,a65to79:3100,over80:300},
      {y:2035,total:30000,under18:6700,a18to49:13790,a50to64:5910,a65to79:3300,over80:300},
    ]},
  "South Korea":{ region:"Asia-Pacific", flag:"🇰🇷", color:"#CD2E3A",
    data:[
      {y:2005,total:48100,under18:10200,a18to49:23590,a50to64:10110,a65to79:3700,over80:500},
      {y:2010,total:49410,under18:9800,a18to49:24150,a50to64:10350,a65to79:4400,over80:710},
      {y:2015,total:51010,under18:9200,a18to49:25270,a50to64:10830,a65to79:4800,over80:910},
      {y:2020,total:51840,under18:8300,a18to49:25760,a50to64:11040,a65to79:5700,over80:1040},
      {y:2025,total:52000,under18:7500,a18to49:25480,a50to64:10920,a65to79:6900,over80:1200},
      {y:2030,total:51800,under18:6900,a18to49:24780,a50to64:10620,a65to79:7900,over80:1500},
      {y:2035,total:51300,under18:6200,a18to49:23660,a50to64:10140,a65to79:9700,over80:1600},
    ]},
  "Singapore":{ region:"Asia-Pacific", flag:"🇸🇬", color:"#EF3340",
    data:[
      {y:2005,total:4270,under18:840,a18to49:2156,a50to64:924,a65to79:310,over80:40},
      {y:2010,total:5080,under18:950,a18to49:2604,a50to64:1116,a65to79:360,over80:50},
      {y:2015,total:5540,under18:960,a18to49:2870,a50to64:1230,a65to79:420,over80:60},
      {y:2020,total:5690,under18:980,a18to49:2926,a50to64:1254,a65to79:490,over80:40},
      {y:2025,total:5910,under18:1000,a18to49:3017,a50to64:1293,a65to79:570,over80:30},
      {y:2030,total:6130,under18:1010,a18to49:3087,a50to64:1323,a65to79:680,over80:30},
      {y:2035,total:6290,under18:1000,a18to49:3122,a50to64:1338,a65to79:800,over80:30},
    ]},
  "New Zealand":{ region:"Asia-Pacific", flag:"🇳🇿", color:"#00247D",
    data:[
      {y:2005,total:4110,under18:1010,a18to49:1883,a50to64:807,a65to79:350,over80:60},
      {y:2010,total:4370,under18:1040,a18to49:2016,a50to64:864,a65to79:380,over80:70},
      {y:2015,total:4600,under18:1100,a18to49:2114,a50to64:906,a65to79:420,over80:60},
      {y:2020,total:5090,under18:1160,a18to49:2373,a50to64:1017,a65to79:490,over80:50},
      {y:2025,total:5240,under18:1180,a18to49:2429,a50to64:1041,a65to79:550,over80:40},
      {y:2030,total:5440,under18:1200,a18to49:2499,a50to64:1071,a65to79:630,over80:40},
      {y:2035,total:5620,under18:1210,a18to49:2555,a50to64:1095,a65to79:720,over80:40},
    ]},
  "Indonesia":{ region:"Asia-Pacific", flag:"🇮🇩", color:"#CE1126",
    data:[
      {y:2005,total:222000,under18:78000,a18to49:94500,a50to64:40500,a65to79:8100,over80:900},
      {y:2010,total:241800,under18:79000,a18to49:106400,a50to64:45600,a65to79:9700,over80:1100},
      {y:2015,total:259100,under18:78000,a18to49:118300,a50to64:50700,a65to79:11000,over80:1100},
      {y:2020,total:273500,under18:76000,a18to49:128800,a50to64:55200,a65to79:12500,over80:1000},
      {y:2025,total:285000,under18:73000,a18to49:138600,a50to64:59400,a65to79:13000,over80:1000},
      {y:2030,total:296000,under18:70000,a18to49:147000,a50to64:63000,a65to79:15000,over80:1000},
      {y:2035,total:305000,under18:66000,a18to49:155400,a50to64:66600,a65to79:16000,over80:1000},
    ]},
  "Thailand":{ region:"Asia-Pacific", flag:"🇹🇭", color:"#2D2A4A",
    data:[
      {y:2005,total:65900,under18:16400,a18to49:31430,a50to64:13470,a65to79:4100,over80:500},
      {y:2010,total:67300,under18:15100,a18to49:32480,a50to64:13920,a65to79:5200,over80:600},
      {y:2015,total:68400,under18:14000,a18to49:33110,a50to64:14190,a65to79:6500,over80:600},
      {y:2020,total:69800,under18:13300,a18to49:33670,a50to64:14430,a65to79:7700,over80:700},
      {y:2025,total:71700,under18:12800,a18to49:34440,a50to64:14760,a65to79:9000,over80:700},
      {y:2030,total:72500,under18:12200,a18to49:34440,a50to64:14760,a65to79:10300,over80:800},
      {y:2035,total:72800,under18:11500,a18to49:34020,a50to64:14580,a65to79:12000,over80:700},
    ]},
  "Malaysia":{ region:"Asia-Pacific", flag:"🇲🇾", color:"#CC0001",
    data:[
      {y:2005,total:26100,under18:8800,a18to49:11340,a50to64:4860,a65to79:970,over80:130},
      {y:2010,total:28300,under18:9000,a18to49:12670,a50to64:5430,a65to79:1100,over80:100},
      {y:2015,total:31000,under18:9400,a18to49:14210,a50to64:6090,a65to79:1200,over80:100},
      {y:2020,total:32700,under18:9600,a18to49:15120,a50to64:6480,a65to79:1400,over80:100},
      {y:2025,total:34400,under18:9700,a18to49:16100,a50to64:6900,a65to79:1600,over80:100},
      {y:2030,total:36100,under18:9700,a18to49:17150,a50to64:7350,a65to79:1800,over80:100},
      {y:2035,total:37700,under18:9600,a18to49:18200,a50to64:7800,a65to79:2000,over80:100},
    ]},
  "Vietnam":{ region:"Asia-Pacific", flag:"🇻🇳", color:"#DA251D",
    data:[
      {y:2005,total:83300,under18:25500,a18to49:37030,a50to64:15870,a65to79:4400,over80:500},
      {y:2010,total:87800,under18:24200,a18to49:40110,a50to64:17190,a65to79:5700,over80:600},
      {y:2015,total:92700,under18:24100,a18to49:43470,a50to64:18630,a65to79:6000,over80:500},
      {y:2020,total:97300,under18:24300,a18to49:46340,a50to64:19860,a65to79:6200,over80:600},
      {y:2025,total:101300,under18:24300,a18to49:49140,a50to64:21060,a65to79:6300,over80:500},
      {y:2030,total:104800,under18:24200,a18to49:51590,a50to64:22110,a65to79:6400,over80:500},
      {y:2035,total:107900,under18:23800,a18to49:53970,a50to64:23130,a65to79:6500,over80:500},
    ]},
  "Philippines":{ region:"Asia-Pacific", flag:"🇵🇭", color:"#0038A8",
    data:[
      {y:2005,total:84200,under18:33000,a18to49:33740,a50to64:14460,a65to79:2600,over80:400},
      {y:2010,total:93400,under18:35200,a18to49:38430,a50to64:16470,a65to79:2900,over80:400},
      {y:2015,total:103200,under18:37200,a18to49:43610,a50to64:18690,a65to79:3300,over80:400},
      {y:2020,total:113900,under18:39600,a18to49:49700,a50to64:21300,a65to79:2900,over80:400},
      {y:2025,total:122000,under18:40700,a18to49:54530,a50to64:23370,a65to79:3000,over80:400},
      {y:2030,total:130200,under18:41400,a18to49:59150,a50to64:25350,a65to79:4000,over80:300},
      {y:2035,total:138300,under18:42000,a18to49:63910,a50to64:27390,a65to79:4700,over80:300},
    ]},
  "Pakistan":{ region:"Asia-Pacific", flag:"🇵🇰", color:"#01411C",
    data:[
      {y:2005,total:155000,under18:69000,a18to49:56000,a50to64:24000,a65to79:5500,over80:500},
      {y:2010,total:177000,under18:77000,a18to49:65100,a50to64:27900,a65to79:6400,over80:600},
      {y:2015,total:199000,under18:84000,a18to49:74900,a50to64:32100,a65to79:7400,over80:600},
      {y:2020,total:221000,under18:88000,a18to49:86800,a50to64:37200,a65to79:8200,over80:800},
      {y:2025,total:245000,under18:93000,a18to49:99400,a50to64:42600,a65to79:9400,over80:600},
      {y:2030,total:269000,under18:97000,a18to49:112000,a50to64:48000,a65to79:11000,over80:600},
      {y:2035,total:294000,under18:101000,a18to49:125300,a50to64:53700,a65to79:13000,over80:600},
    ]},
  "Bangladesh":{ region:"Asia-Pacific", flag:"🇧🇩", color:"#006A4E",
    data:[
      {y:2005,total:146000,under18:58000,a18to49:57400,a50to64:24600,a65to79:5400,over80:600},
      {y:2010,total:156000,under18:57000,a18to49:64400,a50to64:27600,a65to79:6400,over80:600},
      {y:2015,total:162000,under18:54000,a18to49:70700,a50to64:30300,a65to79:6500,over80:500},
      {y:2020,total:167000,under18:51000,a18to49:76300,a50to64:32700,a65to79:6600,over80:400},
      {y:2025,total:174000,under18:49000,a18to49:81900,a50to64:35100,a65to79:7500,over80:500},
      {y:2030,total:180000,under18:47000,a18to49:87500,a50to64:37500,a65to79:7500,over80:500},
      {y:2035,total:186000,under18:45000,a18to49:93100,a50to64:39900,a65to79:7500,over80:500},
    ]},
  // Africa
  "Nigeria":{ region:"Africa", flag:"🇳🇬", color:"#008751",
    data:[
      {y:2005,total:140500,under18:68000,a18to49:48300,a50to64:20700,a65to79:3100,over80:400},
      {y:2010,total:162500,under18:79000,a18to49:55650,a50to64:23850,a65to79:3600,over80:400},
      {y:2015,total:186000,under18:90000,a18to49:64400,a50to64:27600,a65to79:3600,over80:400},
      {y:2020,total:213400,under18:103000,a18to49:74200,a50to64:31800,a65to79:4000,over80:400},
      {y:2025,total:242000,under18:115000,a18to49:85400,a50to64:36600,a65to79:4600,over80:400},
      {y:2030,total:274000,under18:128000,a18to49:98000,a50to64:42000,a65to79:5600,over80:400},
      {y:2035,total:310000,under18:143000,a18to49:112700,a50to64:48300,a65to79:5700,over80:300},
    ]},
  "South Africa":{ region:"Africa", flag:"🇿🇦", color:"#007A4D",
    data:[
      {y:2005,total:48100,under18:18300,a18to49:19180,a50to64:8220,a65to79:2200,over80:200},
      {y:2010,total:51200,under18:19000,a18to49:20440,a50to64:8760,a65to79:2700,over80:300},
      {y:2015,total:55400,under18:20100,a18to49:22820,a50to64:9780,a65to79:2500,over80:200},
      {y:2020,total:59300,under18:21200,a18to49:24710,a50to64:10590,a65to79:2500,over80:300},
      {y:2025,total:62700,under18:22000,a18to49:26390,a50to64:11310,a65to79:2700,over80:300},
      {y:2030,total:66300,under18:22500,a18to49:28490,a50to64:12210,a65to79:2900,over80:200},
      {y:2035,total:70200,under18:23200,a18to49:30520,a50to64:13080,a65to79:3200,over80:200},
    ]},
  "Ethiopia":{ region:"Africa", flag:"🇪🇹", color:"#078930",
    data:[
      {y:2005,total:80100,under18:38000,a18to49:27440,a50to64:11760,a65to79:2500,over80:400},
      {y:2010,total:92700,under18:43000,a18to49:32550,a50to64:13950,a65to79:2900,over80:300},
      {y:2015,total:107500,under18:48000,a18to49:39200,a50to64:16800,a65to79:3200,over80:300},
      {y:2020,total:118000,under18:50000,a18to49:45150,a50to64:19350,a65to79:3200,over80:300},
      {y:2025,total:131000,under18:53000,a18to49:51100,a50to64:21900,a65to79:4700,over80:300},
      {y:2030,total:145000,under18:57000,a18to49:58100,a50to64:24900,a65to79:4700,over80:300},
      {y:2035,total:162000,under18:62000,a18to49:65800,a50to64:28200,a65to79:5700,over80:300},
    ]},
  "Egypt":{ region:"Africa", flag:"🇪🇬", color:"#CE1126",
    data:[
      {y:2005,total:74000,under18:26000,a18to49:30800,a50to64:13200,a65to79:3600,over80:400},
      {y:2010,total:82500,under18:27000,a18to49:35700,a50to64:15300,a65to79:4000,over80:500},
      {y:2015,total:92200,under18:28000,a18to49:41300,a50to64:17700,a65to79:4700,over80:500},
      {y:2020,total:102000,under18:30000,a18to49:46900,a50to64:20100,a65to79:4500,over80:500},
      {y:2025,total:112000,under18:31000,a18to49:53200,a50to64:22800,a65to79:4600,over80:400},
      {y:2030,total:122000,under18:32000,a18to49:58800,a50to64:25200,a65to79:5600,over80:400},
      {y:2035,total:132000,under18:33000,a18to49:65100,a50to64:27900,a65to79:5600,over80:400},
    ]},
  "Kenya":{ region:"Africa", flag:"🇰🇪", color:"#006600",
    data:[
      {y:2005,total:36500,under18:16500,a18to49:13020,a50to64:5580,a65to79:1300,over80:100},
      {y:2010,total:41800,under18:18500,a18to49:15120,a50to64:6480,a65to79:1500,over80:200},
      {y:2015,total:48500,under18:21000,a18to49:17920,a50to64:7680,a65to79:1700,over80:200},
      {y:2020,total:54000,under18:23000,a18to49:20300,a50to64:8700,a65to79:1800,over80:200},
      {y:2025,total:59500,under18:25000,a18to49:22750,a50to64:9750,a65to79:1800,over80:200},
      {y:2030,total:65500,under18:27000,a18to49:25410,a50to64:10890,a65to79:2000,over80:200},
      {y:2035,total:71800,under18:29000,a18to49:28350,a50to64:12150,a65to79:2100,over80:200},
    ]},
  "Ghana":{ region:"Africa", flag:"🇬🇭", color:"#006B3F",
    data:[
      {y:2005,total:21500,under18:9700,a18to49:7630,a50to64:3270,a65to79:800,over80:100},
      {y:2010,total:24700,under18:10600,a18to49:9170,a50to64:3930,a65to79:900,over80:100},
      {y:2015,total:28000,under18:11500,a18to49:10780,a50to64:4620,a65to79:1000,over80:100},
      {y:2020,total:31000,under18:12300,a18to49:12180,a50to64:5220,a65to79:1200,over80:100},
      {y:2025,total:34000,under18:13000,a18to49:13790,a50to64:5910,a65to79:1200,over80:100},
      {y:2030,total:37200,under18:13700,a18to49:15470,a50to64:6630,a65to79:1300,over80:100},
      {y:2035,total:40600,under18:14500,a18to49:17290,a50to64:7410,a65to79:1300,over80:100},
    ]},
  "Morocco":{ region:"Africa", flag:"🇲🇦", color:"#C1272D",
    data:[
      {y:2005,total:30500,under18:9900,a18to49:13160,a50to64:5640,a65to79:1600,over80:200},
      {y:2010,total:32600,under18:9900,a18to49:14420,a50to64:6180,a65to79:1900,over80:200},
      {y:2015,total:35000,under18:10100,a18to49:15820,a50to64:6780,a65to79:2000,over80:300},
      {y:2020,total:37000,under18:10200,a18to49:16940,a50to64:7260,a65to79:2300,over80:300},
      {y:2025,total:38800,under18:10300,a18to49:17990,a50to64:7710,a65to79:2500,over80:300},
      {y:2030,total:40500,under18:10200,a18to49:19040,a50to64:8160,a65to79:2900,over80:200},
      {y:2035,total:42100,under18:10000,a18to49:20090,a50to64:8610,a65to79:3200,over80:200},
    ]},
  "Tanzania":{ region:"Africa", flag:"🇹🇿", color:"#1EB53A",
    data:[
      {y:2005,total:38800,under18:19000,a18to49:13020,a50to64:5580,a65to79:1100,over80:100},
      {y:2010,total:45000,under18:21000,a18to49:15820,a50to64:6780,a65to79:1200,over80:200},
      {y:2015,total:53500,under18:24000,a18to49:19600,a50to64:8400,a65to79:1300,over80:200},
      {y:2020,total:61700,under18:28000,a18to49:22400,a50to64:9600,a65to79:1600,over80:100},
      {y:2025,total:70200,under18:31000,a18to49:26180,a50to64:11220,a65to79:1700,over80:100},
      {y:2030,total:80000,under18:34000,a18to49:30520,a50to64:13080,a65to79:2100,over80:300},
      {y:2035,total:91200,under18:38000,a18to49:35700,a50to64:15300,a65to79:2000,over80:200},
    ]},
  "Uganda":{ region:"Africa", flag:"🇺🇬", color:"#FCDC04",
    data:[
      {y:2005,total:27300,under18:14700,a18to49:8190,a50to64:3510,a65to79:800,over80:100},
      {y:2010,total:32900,under18:17300,a18to49:10220,a50to64:4380,a65to79:900,over80:100},
      {y:2015,total:39700,under18:20000,a18to49:12880,a50to64:5520,a65to79:1200,over80:100},
      {y:2020,total:46000,under18:22700,a18to49:15330,a50to64:6570,a65to79:1300,over80:100},
      {y:2025,total:52900,under18:25300,a18to49:18340,a50to64:7860,a65to79:1300,over80:100},
      {y:2030,total:60500,under18:28100,a18to49:21560,a50to64:9240,a65to79:1500,over80:100},
      {y:2035,total:69500,under18:31600,a18to49:25410,a50to64:10890,a65to79:1500,over80:100},
    ]},
  "Mozambique":{ region:"Africa", flag:"🇲🇿", color:"#009A44",
    data:[
      {y:2005,total:19700,under18:9500,a18to49:6580,a50to64:2820,a65to79:700,over80:100},
      {y:2010,total:23000,under18:10900,a18to49:7840,a50to64:3360,a65to79:800,over80:100},
      {y:2015,total:27200,under18:12600,a18to49:9450,a50to64:4050,a65to79:1000,over80:100},
      {y:2020,total:31300,under18:14200,a18to49:11130,a50to64:4770,a65to79:1100,over80:100},
      {y:2025,total:35700,under18:15900,a18to49:13090,a50to64:5610,a65to79:1000,over80:100},
      {y:2030,total:41000,under18:17800,a18to49:15400,a50to64:6600,a65to79:1100,over80:100},
      {y:2035,total:47200,under18:20200,a18to49:17990,a50to64:7710,a65to79:1200,over80:100},
    ]},
  // Middle East
  "Saudi Arabia":{ region:"Middle East", flag:"🇸🇦", color:"#006C35",
    data:[
      {y:2005,total:24200,under18:7800,a18to49:10990,a50to64:4710,a65to79:600,over80:100},
      {y:2010,total:28300,under18:7900,a18to49:13650,a50to64:5850,a65to79:800,over80:100},
      {y:2015,total:31600,under18:7700,a18to49:16030,a50to64:6870,a65to79:900,over80:100},
      {y:2020,total:35000,under18:7600,a18to49:18270,a50to64:7830,a65to79:1200,over80:100},
      {y:2025,total:37400,under18:7500,a18to49:20020,a50to64:8580,a65to79:1200,over80:100},
      {y:2030,total:40000,under18:7500,a18to49:21700,a50to64:9300,a65to79:1400,over80:100},
      {y:2035,total:42200,under18:7500,a18to49:23170,a50to64:9930,a65to79:1500,over80:100},
    ]},
  "UAE":{ region:"Middle East", flag:"🇦🇪", color:"#00732F",
    data:[
      {y:2005,total:4800,under18:850,a18to49:2674,a50to64:1146,a65to79:120,over80:10},
      {y:2010,total:7900,under18:1100,a18to49:4648,a50to64:1992,a65to79:140,over80:20},
      {y:2015,total:9100,under18:1100,a18to49:5474,a50to64:2346,a65to79:170,over80:10},
      {y:2020,total:9900,under18:1300,a18to49:5873,a50to64:2517,a65to79:200,over80:10},
      {y:2025,total:10400,under18:1400,a18to49:6139,a50to64:2631,a65to79:220,over80:10},
      {y:2030,total:11200,under18:1500,a18to49:6601,a50to64:2829,a65to79:260,over80:10},
      {y:2035,total:12100,under18:1600,a18to49:7140,a50to64:3060,a65to79:290,over80:10},
    ]},
  "Iran":{ region:"Middle East", flag:"🇮🇷", color:"#239F40",
    data:[
      {y:2005,total:70500,under18:24000,a18to49:30100,a50to64:12900,a65to79:3100,over80:400},
      {y:2010,total:74300,under18:22000,a18to49:33600,a50to64:14400,a65to79:3900,over80:400},
      {y:2015,total:79100,under18:20000,a18to49:37800,a50to64:16200,a65to79:4600,over80:500},
      {y:2020,total:84000,under18:19000,a18to49:41300,a50to64:17700,a65to79:5300,over80:700},
      {y:2025,total:88000,under18:19000,a18to49:44100,a50to64:18900,a65to79:5600,over80:400},
      {y:2030,total:92000,under18:19000,a18to49:46200,a50to64:19800,a65to79:6600,over80:400},
      {y:2035,total:96000,under18:19000,a18to49:48300,a50to64:20700,a65to79:7600,over80:400},
    ]},
  "Israel":{ region:"Middle East", flag:"🇮🇱", color:"#003399",
    data:[
      {y:2005,total:6900,under18:2100,a18to49:2940,a50to64:1260,a65to79:500,over80:100},
      {y:2010,total:7600,under18:2300,a18to49:3220,a50to64:1380,a65to79:600,over80:100},
      {y:2015,total:8400,under18:2600,a18to49:3570,a50to64:1530,a65to79:600,over80:100},
      {y:2020,total:9200,under18:2900,a18to49:3920,a50to64:1680,a65to79:600,over80:100},
      {y:2025,total:9800,under18:3100,a18to49:4130,a50to64:1770,a65to79:700,over80:100},
      {y:2030,total:10500,under18:3300,a18to49:4480,a50to64:1920,a65to79:700,over80:100},
      {y:2035,total:11200,under18:3500,a18to49:4760,a50to64:2040,a65to79:800,over80:100},
    ]},
  "Iraq":{ region:"Middle East", flag:"🇮🇶", color:"#CE1126",
    data:[
      {y:2005,total:28000,under18:13000,a18to49:9730,a50to64:4170,a65to79:1000,over80:100},
      {y:2010,total:32100,under18:14000,a18to49:11830,a50to64:5070,a65to79:1100,over80:100},
      {y:2015,total:37400,under18:15000,a18to49:14700,a50to64:6300,a65to79:1300,over80:100},
      {y:2020,total:41200,under18:15000,a18to49:17150,a50to64:7350,a65to79:1500,over80:100},
      {y:2025,total:44800,under18:15000,a18to49:19810,a50to64:8490,a65to79:1400,over80:100},
      {y:2030,total:48400,under18:15300,a18to49:21980,a50to64:9420,a65to79:1600,over80:100},
      {y:2035,total:52200,under18:15800,a18to49:24150,a50to64:10350,a65to79:1800,over80:100},
    ]},
  "Jordan":{ region:"Middle East", flag:"🇯🇴", color:"#007A3D",
    data:[
      {y:2005,total:5700,under18:2300,a18to49:2240,a50to64:960,a65to79:180,over80:20},
      {y:2010,total:6500,under18:2300,a18to49:2800,a50to64:1200,a65to79:190,over80:10},
      {y:2015,total:7600,under18:2500,a18to49:3360,a50to64:1440,a65to79:270,over80:30},
      {y:2020,total:10200,under18:3300,a18to49:4620,a50to64:1980,a65to79:270,over80:30},
      {y:2025,total:10600,under18:3300,a18to49:4830,a50to64:2070,a65to79:370,over80:30},
      {y:2030,total:11100,under18:3300,a18to49:5180,a50to64:2220,a65to79:370,over80:30},
      {y:2035,total:11700,under18:3400,a18to49:5460,a50to64:2340,a65to79:470,over80:30},
    ]},
  "Kuwait":{ region:"Middle East", flag:"🇰🇼", color:"#007A3D",
    data:[
      {y:2005,total:2600,under18:700,a18to49:1295,a50to64:555,a65to79:45,over80:5},
      {y:2010,total:3000,under18:700,a18to49:1575,a50to64:675,a65to79:45,over80:5},
      {y:2015,total:3900,under18:900,a18to49:2065,a50to64:885,a65to79:45,over80:5},
      {y:2020,total:4200,under18:1000,a18to49:2198,a50to64:942,a65to79:55,over80:5},
      {y:2025,total:4400,under18:1000,a18to49:2317,a50to64:993,a65to79:85,over80:5},
      {y:2030,total:4700,under18:1100,a18to49:2443,a50to64:1047,a65to79:105,over80:5},
      {y:2035,total:5000,under18:1100,a18to49:2625,a50to64:1125,a65to79:145,over80:5},
    ]},
  "Qatar":{ region:"Middle East", flag:"🇶🇦", color:"#8D1B3D",
    data:[
      {y:2005,total:850,under18:200,a18to49:441,a50to64:189,a65to79:20,over80:0},
      {y:2010,total:1750,under18:280,a18to49:1008,a50to64:432,a65to79:30,over80:0},
      {y:2015,total:2240,under18:350,a18to49:1302,a50to64:558,a65to79:30,over80:0},
      {y:2020,total:2780,under18:500,a18to49:1568,a50to64:672,a65to79:40,over80:0},
      {y:2025,total:2900,under18:520,a18to49:1638,a50to64:702,a65to79:40,over80:0},
      {y:2030,total:3100,under18:550,a18to49:1743,a50to64:747,a65to79:60,over80:0},
      {y:2035,total:3300,under18:580,a18to49:1862,a50to64:798,a65to79:60,over80:0},
    ]},
  "Bahrain":{ region:"Middle East", flag:"🇧🇭", color:"#CE1126",
    data:[
      {y:2005,total:760,under18:200,a18to49:378,a50to64:162,a65to79:20,over80:0},
      {y:2010,total:1100,under18:250,a18to49:574,a50to64:246,a65to79:30,over80:0},
      {y:2015,total:1400,under18:300,a18to49:749,a50to64:321,a65to79:30,over80:0},
      {y:2020,total:1700,under18:360,a18to49:910,a50to64:390,a65to79:40,over80:0},
      {y:2025,total:1770,under18:370,a18to49:952,a50to64:408,a65to79:40,over80:0},
      {y:2030,total:1840,under18:380,a18to49:987,a50to64:423,a65to79:50,over80:0},
      {y:2035,total:1920,under18:390,a18to49:1036,a50to64:444,a65to79:50,over80:0},
    ]},
  "Oman":{ region:"Middle East", flag:"🇴🇲", color:"#DB161B",
    data:[
      {y:2005,total:2500,under18:930,a18to49:1057,a50to64:453,a65to79:55,over80:5},
      {y:2010,total:3100,under18:900,a18to49:1505,a50to64:645,a65to79:45,over80:5},
      {y:2015,total:4200,under18:1000,a18to49:2191,a50to64:939,a65to79:65,over80:5},
      {y:2020,total:4500,under18:1100,a18to49:2331,a50to64:999,a65to79:65,over80:5},
      {y:2025,total:4900,under18:1200,a18to49:2520,a50to64:1080,a65to79:95,over80:5},
      {y:2030,total:5200,under18:1300,a18to49:2653,a50to64:1137,a65to79:105,over80:5},
      {y:2035,total:5500,under18:1400,a18to49:2793,a50to64:1197,a65to79:105,over80:5},
    ]},
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = n => {
  if (n >= 1000000) return (n/1000000).toFixed(1)+"B";
  if (n >= 1000) return (n/1000).toFixed(1)+"M";
  return n.toLocaleString()+"K";
};
const fmtM = n => n >= 1000 ? (n/1000).toFixed(2)+"B" : n.toFixed(1)+"M";

function getAgeGroups(genderFilter) {
  // Apply gender multipliers: female ~51%, male ~49%, but 65+ female ~56%, 80+ female ~62%
  const gm = genderFilter === "All" ? 1 : (genderFilter === "Female" ? 1 : 1); // base multiplier
  const mod = genderFilter === "All" ? { u18:1, w:1, p:1, s:1, e:1 } :
    genderFilter === "Male" ? { u18:0.51, w:0.49, p:0.48, s:0.44, e:0.38 } :
    { u18:0.49, w:0.51, p:0.52, s:0.56, e:0.62 };
  return mod;
}

function getDataForYear(rows, y) {
  return rows.find(r => r.y === y) || rows[rows.length-1];
}

function computeProfile(dataRows, ageGroups, genderFilter, year) {
  const row = getDataForYear(dataRows, year);
  if (!row) return null;
  const mod = getAgeGroups(genderFilter);
  const u18  = Math.round(row.under18  * mod.u18);
  const w    = Math.round(row.a18to49  * mod.w);
  const p    = Math.round((row.a50to64||0) * mod.p);
  const s    = Math.round(row.a65to79  * mod.s);
  const e    = Math.round(row.over80   * mod.e);
  const over65 = s + e;
  let total = 0;
  if (ageGroups.includes("under18")) total += u18;
  if (ageGroups.includes("18to49"))  total += w;
  if (ageGroups.includes("50to64"))  total += p;
  if (ageGroups.includes("65to79"))  total += s;
  if (ageGroups.includes("over80"))  total += e;
  const breakdown = { under18:u18, a18to49:w, a50to64:p, a65to79:s, over80:e, over65 };
  return { total, breakdown, rawTotal: row.total };
}

function growthRate(a, b) {
  if (!a || a === 0) return 0;
  return ((b - a) / a * 100).toFixed(1);
}

// Compound annual growth rate (%) between value a (startYear) and b (endYear)
function cagr(a, b, years) {
  if (!a || a <= 0 || !b || b <= 0 || years <= 0) return 0;
  return (Math.pow(b / a, 1 / years) - 1) * 100;
}

// A prominent pill showing a CAGR / growth %, colour-coded by sign & magnitude
function CagrBadge({ value, label, size = "md" }) {
  const v = typeof value === "number" ? value : parseFloat(value);
  const up = v > 0;
  const strong = Math.abs(v) >= 1.5;
  const col = up ? (strong ? C.green2 : C.green) : (v < 0 ? C.red : C.amber);
  const bg  = up ? `${C.green}1A` : (v < 0 ? `${C.red}1A` : `${C.amber}1A`);
  const fs = size === "lg" ? 16 : size === "sm" ? 9 : 12;
  const pad = size === "lg" ? "4px 10px" : size === "sm" ? "1px 6px" : "2px 8px";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,background:bg,borderRadius:20,padding:pad,whiteSpace:"nowrap"}}>
      <span style={{fontSize:fs*0.7,color:col,lineHeight:1}}>{up?"▲":v<0?"▼":"▬"}</span>
      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:fs,letterSpacing:0.5,color:col,lineHeight:1}}>{up?"+":""}{v.toFixed(1)}%</span>
      {label && <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:fs*0.6,letterSpacing:1,color:col,opacity:0.8,lineHeight:1}}>{label}</span>}
    </span>
  );
}

// ── MINI SPARKLINE ────────────────────────────────────────────────────────────
function Spark({ values, color="#00C4B4", w=60, h=24 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]} r="2.5" fill={color}/>
    </svg>
  );
}

// ── ZOOMABLE CHART WRAPPER + MODAL ─────────────────────────────────────────
// Wrap any chart. Shows an expand affordance; clicking calls onZoom with a
// larger render of the same chart so it pops out in a full-width modal.
function Zoomable({ title, onZoom, renderLarge, children }) {
  return (
    <div style={{position:"relative"}}>
      <div
        onClick={()=>onZoom && onZoom({ title, node: renderLarge() })}
        style={{cursor:"zoom-in"}}
        title="Tap to enlarge"
      >
        {children}
      </div>
      <button
        onClick={(e)=>{e.stopPropagation(); onZoom && onZoom({ title, node: renderLarge() });}}
        title="Enlarge chart"
        style={{
          position:"absolute", top:2, right:2, zIndex:2,
          border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.9)",
          borderRadius:7, width:22, height:22, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, color:C.sub, lineHeight:1, padding:0,
        }}
      >⤢</button>
    </div>
  );
}

function ChartModal({ data, onClose }) {
  if (!data) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:1000,
        background:"rgba(11,31,58,0.72)", backdropFilter:"blur(4px)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:"20px 20px 0 0",
          boxShadow:"0 -8px 40px rgba(11,31,58,0.35)",
          width:"100%", maxWidth:720, maxHeight:"90vh", overflowY:"auto",
          paddingBottom:32,
        }}
      >
        {/* Handle bar */}
        <div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:6}}>
          <div style={{width:40,height:4,borderRadius:2,background:C.border}}/>
        </div>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"10px 18px 12px", borderBottom:`1px solid ${C.border}`,
          marginBottom:16,
        }}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,color:C.navy,lineHeight:1}}>{data.title||"CHART"}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:2,color:C.teal,marginTop:2}}>LIGHTHOUSE POPULATION ANALYTICS</div>
          </div>
          <button onClick={onClose} style={{
            border:`1px solid ${C.border}`, background:C.bg, borderRadius:10,
            width:34, height:34, cursor:"pointer", fontSize:18, color:C.navy,
            lineHeight:1, display:"flex", alignItems:"center", justifyContent:"center",
          }}>×</button>
        </div>
        <div style={{padding:"0 16px"}}>{data.node}</div>
      </div>
    </div>
  );
}

// ── DONUT CHART ───────────────────────────────────────────────────────────────
function Donut({ segments, size=130, centerLabel, centerSub, interactive=false, year }) {
  const [active, setActive] = useState(null);
  const total = segments.reduce((s,g)=>s+g.value,0);
  if (total === 0) return null;
  const ring = Math.max(18, size * 0.2);
  const edge = Math.max(10, size * 0.11);
  const labelFs = Math.max(16, size * 0.13);
  const subFs   = Math.max(8, size * 0.06);
  const cx = size/2, cy = size/2;
  let cum = 0;
  const slices = segments.map((seg, idx) => {
    const pct = seg.value / total;
    const startAngle = cum * 2 * Math.PI - Math.PI/2;
    const endAngle   = (cum + pct) * 2 * Math.PI - Math.PI/2;
    cum += pct;
    const r = size/2 - edge;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const ir = r - ring;
    const ix1 = cx + ir * Math.cos(endAngle), iy1 = cy + ir * Math.sin(endAngle);
    const ix2 = cx + ir * Math.cos(startAngle), iy2 = cy + ir * Math.sin(startAngle);
    const path = `M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${ix1},${iy1} A${ir},${ir} 0 ${largeArc},0 ${ix2},${iy2} Z`;
    return { seg, pct, path, idx };
  });
  const act = active!=null ? slices[active] : null;

  if (!interactive) {
    return (
      <div style={{position:"relative",width:size,margin:"0 auto"}}>
        <svg width={size} height={size} style={{display:"block"}}>
          {slices.map(s => <path key={s.seg.label} d={s.path} fill={s.seg.color} opacity="0.92"/>)}
          <text x={cx} y={cy-subFs*0.3} textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize={labelFs} fill={C.navy}>{centerLabel}</text>
          <text x={cx} y={cy+subFs*1.6} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize={subFs} fill={C.sub}>{centerSub}</text>
        </svg>
      </div>
    );
  }

  // Interactive: donut + side info panel (wraps below on narrow screens)
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:16,alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"relative",flexShrink:0}}>
        <svg width={size} height={size} style={{display:"block"}}>
          {slices.map(s => (
            <path key={s.seg.label} d={s.path} fill={s.seg.color}
              opacity={active==null || active===s.idx ? 0.92 : 0.3}
              stroke={active===s.idx ? "#fff" : "none"} strokeWidth={active===s.idx ? 2.5 : 0}
              style={{cursor:"pointer", transition:"opacity 0.15s"}}
              onMouseEnter={()=>setActive(s.idx)}
              onClick={(e)=>{e.stopPropagation();setActive(a=>a===s.idx?null:s.idx);}}
            />
          ))}
          {/* Centre reflects the touched slice; falls back to headline metric */}
          <text x={cx} y={cy-subFs*0.3} textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize={labelFs} fill={act?act.seg.color:C.navy}>{act?`${(act.seg.mixPct!=null?act.seg.mixPct:act.pct*100).toFixed(1)}%`:centerLabel}</text>
          <text x={cx} y={cy+subFs*1.6} textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize={subFs} fill={C.sub}>{act?act.seg.label:centerSub}</text>
        </svg>
        <div style={{textAlign:"center",fontFamily:"system-ui",fontSize:12,color:C.sub,marginTop:6}}>Tap a slice for detail</div>
      </div>

      {/* Side info panel — always fully visible */}
      <div style={{
        flex:"1 1 200px", minWidth:190, maxWidth:280,
        background:C.navy, borderRadius:14, padding:"14px 16px",
        boxShadow:"0 6px 20px rgba(11,31,58,0.25)",
        border:`1px solid ${act?act.seg.color:"rgba(255,255,255,0.12)"}`,
        alignSelf:"stretch",
      }}>
        {!act ? (
          <div style={{display:"flex",flexDirection:"column",justifyContent:"center",height:"100%",minHeight:120,textAlign:"center"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1.5,color:"rgba(255,255,255,0.85)",marginBottom:6}}>AGE BAND DETAIL</div>
            <div style={{fontFamily:"system-ui",fontSize:14,color:"rgba(255,255,255,0.82)",lineHeight:1.5}}>Tap any slice of the donut to see its population, share of mix, 2030 projection and growth rate.</div>
            {/* mini legend */}
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px 10px",justifyContent:"center",marginTop:12}}>
              {slices.map(s=>(
                <div key={s.seg.label} onClick={()=>setActive(s.idx)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                  <span style={{width:8,height:8,borderRadius:2,background:s.seg.color}}/>
                  <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.92)"}}>{s.seg.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:`1px solid rgba(255,255,255,0.14)`}}>
              <span style={{width:14,height:14,borderRadius:4,background:act.seg.color,flexShrink:0}}/>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:1,color:"#fff",lineHeight:1}}>{act.seg.label}</div>
                <div style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.85)",marginTop:2}}>{act.seg.range||"age band"}</div>
              </div>
            </div>
            {[
              {k:`Population ${year||""}`.trim(), v:fmt(act.seg.value), c:"#fff"},
              {k:"% of mix", v:`${act.seg.mixPct!=null?act.seg.mixPct.toFixed(1):(act.pct*100).toFixed(1)}%`, c:act.seg.color},
              {k:"2030 projection", v:act.seg.pop2030!=null?fmt(Math.round(act.seg.pop2030)):"—", c:"#fff"},
              {k:"CAGR 2025–30", v:act.seg.cagr2530!=null?`${act.seg.cagr2530>0?"+":""}${act.seg.cagr2530.toFixed(2)}%`:"—",
                c:act.seg.cagr2530>0?C.green:act.seg.cagr2530<0?"#FF8A8A":"rgba(255,255,255,0.7)"},
            ].map(row=>(
              <div key={row.k} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:7}}>
                <span style={{fontFamily:"system-ui",fontSize:14,color:"rgba(255,255,255,0.88)"}}>{row.k}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:0.5,color:row.c}}>{row.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── POPULATION BAR CHART ──────────────────────────────────────────────────────
function PopBarChart({ data, genderFilter, ageGroups, highlightYear, big=false }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const H = big ? 280 : 110, barMax = big ? 240 : 86, lblFs = big ? 14 : 12, valFs = big ? 14 : 12, valTop = big ? -20 : -14;
  return (
    <div style={{display:"flex", alignItems:"flex-end", gap:big?8:4, height:H, paddingBottom:big?26:18, position:"relative"}}>
      {data.map((d, i) => {
        const h = Math.max((d.value / maxVal) * barMax, 2);
        const isHighlight = d.year === highlightYear;
        const isFuture = d.year > 2025;
        return (
          <div key={d.year} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center"}}>
            <div style={{
              width:"100%", height:h, borderRadius:"3px 3px 0 0",
              background: isHighlight ? C.teal : isFuture ? `${d.color}88` : d.color,
              border: isHighlight ? `1.5px solid ${C.teal}` : "none",
              transition:"height 0.3s",
              position:"relative",
            }}>
              {(isHighlight || big) && <div style={{position:"absolute",top:valTop,left:"50%",transform:"translateX(-50%)",fontFamily:"'Bebas Neue',sans-serif",fontSize:valFs,letterSpacing:1,color:isHighlight?C.teal:C.sub,whiteSpace:"nowrap"}}>{fmt(d.value)}</div>}
            </div>
            <div style={{
              fontFamily:"'Bebas Neue',sans-serif", fontSize:lblFs, letterSpacing:0.5,
              color: isHighlight ? C.teal : isFuture ? C.sub : (big?C.navy:C.navy),
              marginTop:3, textAlign:"center",
            }}>{d.year}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── LINE CHART ────────────────────────────────────────────────────────────────
function TrendLine({ series, years, height=120, showLegend=true, showCagr=true, width=340 }) {
  const [hover, setHover] = useState(null); // {si, i}
  if (!series || series.length === 0) return null;
  const w = width, h = height, padL=30, padR=showCagr?52:10, padT=12, padB=24;
  const allVals = series.flatMap(s => s.values);
  const maxV = Math.max(...allVals, 1), minV = 0;
  const toX = i => padL + (i / (years.length - 1)) * (w - padL - padR);
  const toY = v => padT + (1 - (v - minV) / (maxV - minV)) * (h - padT - padB);

  // CAGR to 2030 for a series (2025→2030 if both present, else full span)
  const cagrTo2030 = (s) => {
    const i25 = years.indexOf(2025), i30 = years.indexOf(2030);
    if (i25>=0 && i30>=0) return cagr(s.values[i25], s.values[i30], years[i30]-years[i25]);
    return cagr(s.values[0], s.values[s.values.length-1], years[years.length-1]-years[0]);
  };

  const hv = hover ? { s:series[hover.si], i:hover.i } : null;

  return (
    <div style={{overflowX:"auto",position:"relative"}}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{display:"block"}}>
        {/* Grid */}
        {[0,0.25,0.5,0.75,1].map(pct => {
          const y = padT + (1-pct)*(h-padT-padB);
          const v = Math.round(maxV * pct);
          return (
            <g key={pct}>
              <line x1={padL} y1={y} x2={w-padR} y2={y} stroke={C.border} strokeWidth="0.5"/>
              <text x={padL-4} y={y+3} textAnchor="end" fontSize="10" fill={C.sub} fontFamily="system-ui">{fmt(v)}</text>
            </g>
          );
        })}
        {/* 2025 divider (now → projection) */}
        {years.includes(2025) && (() => {
          const x = toX(years.indexOf(2025));
          return <line x1={x} y1={padT} x2={x} y2={h-padB} stroke={C.amber} strokeWidth="1" strokeDasharray="3,2"/>;
        })()}
        {/* hovered vertical guide */}
        {hv && <line x1={toX(hv.i)} y1={padT} x2={toX(hv.i)} y2={h-padB} stroke={C.navy} strokeWidth="0.75" strokeDasharray="2,2" opacity="0.5"/>}
        {/* Series — bold, thick lines */}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
          const dim = hover && hover.si !== si;
          return (
            <g key={si}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={dim?2.5:4} strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={s.dashed ? "6,4" : "none"} opacity={dim?0.4:1}/>
              {s.values.map((v, i) => (
                <circle key={i} cx={toX(i)} cy={toY(v)} r={hover&&hover.si===si&&hover.i===i?5.5:3.5}
                  fill="#fff" stroke={s.color} strokeWidth={hover&&hover.si===si&&hover.i===i?3:2} opacity={dim?0.4:1}/>
              ))}
            </g>
          );
        })}
        {/* End-of-line CAGR annotation */}
        {showCagr && series.map((s, si) => {
          const g = cagrTo2030(s);
          const lastY = toY(s.values[s.values.length-1]);
          const col = g > 0 ? C.green2 : g < 0 ? C.red : C.amber;
          return (
            <g key={"c"+si}>
              <text x={w-padR+4} y={lastY-1} fontSize="12" fontWeight="700" fill={col} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.3">{g>0?"+":""}{g.toFixed(2)}%</text>
              <text x={w-padR+4} y={lastY+7} fontSize="9" fill={C.sub} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">CAGR→30</text>
            </g>
          );
        })}
        {/* invisible hit targets for hover/touch */}
        {series.map((s, si) => s.values.map((v, i) => (
          <circle key={si+"-"+i} cx={toX(i)} cy={toY(v)} r="11" fill="transparent" style={{cursor:"pointer"}}
            onMouseEnter={()=>setHover({si,i})}
            onMouseLeave={()=>setHover(null)}
            onClick={(e)=>{e.stopPropagation();setHover(h=>h&&h.si===si&&h.i===i?null:{si,i});}}
          />
        )))}
        {/* X axis labels */}
        {years.map((y, i) => (
          <text key={y} x={toX(i)} y={h-padB+12} textAnchor="middle" fontSize="10" fill={hv&&hv.i===i?C.navy:C.sub} fontWeight={hv&&hv.i===i?700:400} fontFamily="system-ui">{y}</text>
        ))}
        {/* Projection label */}
        {years.includes(2025) && (
          <text x={toX(years.indexOf(2025))+4} y={padT+8} fontSize="9" fill={C.amber} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">PROJECTED ▶</text>
        )}
      </svg>

      {/* Info box on point touch/hover */}
      {hv && (() => {
        const g = cagrTo2030(hv.s);
        const xFrac = toX(hv.i) / w;            // 0..1 across the svg
        const leftPct = Math.min(Math.max(xFrac*100, 18), 82);
        const gc = g>0?C.green:g<0?"#FF8A8A":"rgba(255,255,255,0.7)";
        return (
          <div style={{
            position:"absolute", top:6, left:`${leftPct}%`, transform:"translateX(-50%)",
            background:C.navy, borderRadius:12, padding:"10px 12px", minWidth:150, zIndex:20,
            boxShadow:"0 8px 24px rgba(11,31,58,0.35)", border:`1px solid ${hv.s.color}`, pointerEvents:"none",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,paddingBottom:6,borderBottom:`1px solid rgba(255,255,255,0.14)`}}>
              <span style={{width:12,height:3,borderRadius:2,background:hv.s.color,flexShrink:0}}/>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.8,color:"#fff",lineHeight:1}}>{hv.s.ageLabel||hv.s.label}</span>
            </div>
            {hv.s.ageLabel && hv.s.ageLabel!==hv.s.label && (
              <div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:4}}>
                <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.88)"}}>Series</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:"#fff"}}>{hv.s.label}</span>
              </div>
            )}
            {[
              {k:"Year", v:years[hv.i], c:"#fff"},
              {k:"Population", v:fmt(hv.s.values[hv.i]), c:"#fff"},
              {k:"CAGR → 2030", v:`${g>0?"+":""}${g.toFixed(2)}%`, c:gc},
            ].map(row=>(
              <div key={row.k} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:14,marginBottom:3}}>
                <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.88)"}}>{row.k}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:0.5,color:row.c}}>{row.v}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {showLegend && (
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px 14px",marginTop:6,paddingLeft:padL}}>
          {series.map((s,i)=>{
            const g = cagrTo2030(s);
            const col = g>0?C.green2:g<0?C.red:C.amber;
            return (
              <div key={i} onClick={()=>setHover(h=>h&&h.si===i?null:{si:i,i:years.indexOf(2025)>=0?years.indexOf(2025):0})} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
                <div style={{width:18,height:4,background:s.color,borderRadius:2}}/>
                <span style={{fontFamily:"system-ui",fontSize:13,color:C.sub}}>{s.label}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.3,color:col}}>{g>0?"+":""}{g.toFixed(2)}% CAGR→30</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── POPULATION PYRAMID (responsive, centered) ──────────────────────────────
function PopPyramid({ dataRow, title, big=false }) {
  if (!dataRow) return null;
  const { under18, a18to49, a50to64, a65to79, over80 } = dataRow;
  const groups = [
    { label:"80+",   total:over80,  mPct:0.38, fPct:0.62, color:C.red },
    { label:"65–79", total:a65to79, mPct:0.44, fPct:0.56, color:C.amber },
    { label:"18–49", total:a18to49, mPct:0.49, fPct:0.51, color:C.teal   },
    { label:"50–64", total:a50to64, mPct:0.48, fPct:0.52, color:C.purple },
    { label:"<18",   total:under18, mPct:0.51, fPct:0.49, color:C.green },
  ];
  // Largest single half-bar value → scales every bar to a % of the available half-width
  const max = Math.max(...groups.map(g => Math.max(g.total * g.mPct, g.total * g.fPct)), 1);
  const barH = big ? 30 : 13;
  const lblW = big ? 56 : 34;
  const hdrFs = big ? 12 : 8;
  const lblFs = big ? 12 : 8;
  const valFs = big ? 10 : 0;
  const rowGap = big ? 10 : 3;

  return (
    <div style={{width:"100%"}}>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:big?11:8,letterSpacing:2,color:C.sub,textAlign:"center",marginBottom:big?10:6}}>{title || "AGE PYRAMID"}</div>
      {/* Gender headers, centered over each half */}
      <div style={{display:"flex",alignItems:"center",marginBottom:big?8:4}}>
        <div style={{flex:1,textAlign:"right",paddingRight:6}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:hdrFs,color:"#3C7AC6",letterSpacing:1}}>◀ MALE</span>
        </div>
        <div style={{width:lblW}}/>
        <div style={{flex:1,textAlign:"left",paddingLeft:6}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:hdrFs,color:C.pink,letterSpacing:1}}>FEMALE ▶</span>
        </div>
      </div>
      {groups.map(g => {
        const mW = (g.total * g.mPct / max) * 100; // % of half width
        const fW = (g.total * g.fPct / max) * 100;
        const mVal = Math.round(g.total * g.mPct);
        const fVal = Math.round(g.total * g.fPct);
        return (
          <div key={g.label} style={{display:"flex",alignItems:"center",marginBottom:rowGap}}>
            {/* Male half — grows right-to-left */}
            <div style={{flex:1,display:"flex",justifyContent:"flex-end",alignItems:"center",gap:5}}>
              {big && <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:valFs,color:"#3C7AC6",letterSpacing:0.3,whiteSpace:"nowrap"}}>{fmt(mVal)}</span>}
              <div style={{height:barH,width:`${mW}%`,background:"#3C7AC6",borderRadius:"3px 0 0 3px",opacity:0.85,transition:"width 0.3s"}}/>
            </div>
            {/* Centered age label */}
            <div style={{width:lblW,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:lblFs,color:C.navy,letterSpacing:0.3,flexShrink:0}}>{g.label}</div>
            {/* Female half — grows left-to-right */}
            <div style={{flex:1,display:"flex",justifyContent:"flex-start",alignItems:"center",gap:5}}>
              <div style={{height:barH,width:`${fW}%`,background:C.pink,borderRadius:"0 3px 3px 0",opacity:0.85,transition:"width 0.3s"}}/>
              {big && <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:valFs,color:C.pink,letterSpacing:0.3,whiteSpace:"nowrap"}}>{fmt(fVal)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AGE DISTRIBUTION CHART ─────────────────────────────────────────────────
// Shows the selected year as a column chart by age band (the real data
// granularity). Additional selected years are overlaid as lines so you can see
// how the band distribution shifts over time.

function AgeDistributionCurve({ series, title, height = 150 }) {
  // series: [{ year, row, color, primary }]
  const valid = (series || []).filter(s => s.row);
  if (valid.length === 0) return null;

  // 4 age bands — these are the real granularity of the data, so the primary
  // year is drawn as columns (one per band) and comparison years as lines.
  const BANDS = [
    { key:"under18", label:"<18",   color:C.green },
    { key:"a18to49", label:"18–49", color:C.teal   },
    { key:"a50to64", label:"50–64", color:C.purple },
    { key:"a65to79", label:"65–79", color:C.amber },
    { key:"over80",  label:"80+",   color:C.red   },
  ];
  const valOf = (row, b) => row ? (row[b.key] || 0) : 0;
  const maxV = Math.max(1, ...valid.flatMap(s => BANDS.map(b => valOf(s.row, b))));

  const primary = valid.find(s => s.primary) || valid[0];
  const compares = valid.filter(s => !s.primary);

  const w = 320, h = height, padL = 38, padR = 8, padT = 10, padB = 22;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const n = BANDS.length;
  const slot = plotW / n;                       // width per band slot
  const barW = slot * 0.6;                       // column width
  const cx = i => padL + slot * i + slot / 2;    // band centre x
  // Square-root scale: keeps proportions readable while lifting small bands
  // (e.g. 80+) off the axis so they're legible. Axis labels show true values.
  const sq = v => Math.sqrt(Math.max(0, v));
  const sqMax = sq(maxV);
  const toY = v => padT + (1 - sq(v) / sqMax) * plotH;

  return (
    <div style={{width:"100%"}}>
      {title && <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,textAlign:"center",marginBottom:4}}>{title}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
        {/* y gridlines (positioned on sqrt scale, labelled with true values) */}
        {[0,0.25,0.5,0.75,1].map(p=>{
          const val = maxV * p * p;            // invert sqrt for an evenly-spaced look
          const y = toY(val);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={w-padR} y2={y} stroke={C.border} strokeWidth="0.5"/>
              <text x={padL-5} y={y+3} textAnchor="end" fontSize="11" fill={C.sub} fontFamily="system-ui">{fmt(Math.round(val))}</text>
            </g>
          );
        })}
        {/* primary-year columns */}
        {BANDS.map((b,i)=>{
          const v = valOf(primary.row, b);
          const y = toY(v);
          const barH = (h-padB)-y;
          const inside = barH > 22; // room to sit the value inside near the base
          const baseY = h - padB;
          return (
            <g key={b.key}>
              <rect x={cx(i)-barW/2} y={y} width={barW} height={barH} rx="2" fill={b.color} opacity="0.85"/>
              {/* population sits inside the column near the base */}
              <text x={cx(i)} y={inside ? baseY-7 : y-6} textAnchor="middle" fontSize="12" fontWeight="700"
                fill={inside ? "#fff" : b.color} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">{fmt(v)}</text>
            </g>
          );
        })}
        {/* comparison years: a horizontal marker across each column + % change above the line */}
        {compares.map((s,si)=>{
          const markW = barW * 1.12; // slightly wider than the column
          return (
            <g key={si}>
              {BANDS.map((b,i)=>{
                const cv = valOf(s.row, b);
                const pv = valOf(primary.row, b);
                const y = toY(cv);
                const pct = pv > 0 ? ((cv - pv) / pv * 100) : 0;
                const up = pct > 0;
                // % sits centered just above the marker line; stack upward for
                // multiple comparison years so they don't overlap
                const labelY = y - 5 - si*12;
                return (
                  <g key={i}>
                    <line x1={cx(i)-markW/2} y1={y} x2={cx(i)+markW/2} y2={y}
                      stroke={s.color} strokeWidth="2.5" strokeLinecap="round"/>
                    <text x={cx(i)} y={labelY} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.3"
                      fill={up?C.green2:pct<0?C.red:C.sub}>{up?"+":""}{pct.toFixed(1)}%</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* x-axis band labels */}
        {BANDS.map((b,i)=>(
          <text key={b.key} x={cx(i)} y={h-padB+15} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.navy} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">{b.label}</text>
        ))}
        <text x={padL+plotW/2} y={h-2} textAnchor="middle" fontSize="10" fill={C.sub} fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">AGE BAND · √ SCALE</text>
      </svg>
      {/* legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",justifyContent:"center",marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:14,height:11,borderRadius:2,background:`linear-gradient(90deg,${C.green},${C.teal},${C.amber},${C.red})`,opacity:0.85}}/>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:0.5,color:C.navy}}>{primary.year} (selected)</span>
        </div>
        {compares.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:18,height:0,borderTop:`2.5px solid ${s.color}`}}/>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:0.5,color:C.sub}}>{s.year} · Δ% vs {primary.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COUNTRY PROFILE CARD ──────────────────────────────────────────────────────
function CountryProfileCard({ name, data, year, ageGroups, genderFilter, onSelect, isSelected, isFav, onToggleFav, defaultOpen, cardId, onZoom }) {
  const [expanded, setExpanded] = useState(!!defaultOpen);
  const [compareYears, setCompareYears] = useState([]); // extra years overlaid on the distribution curve
  const countryData = COUNTRIES[name];
  if (!countryData) return null;
  const rowNow    = getDataForYear(countryData.data, year);
  const row2005   = countryData.data[0];
  const rowLatest = countryData.data[countryData.data.length-1];
  if (!rowNow) return null;

  const mod = getAgeGroups(genderFilter);
  const u18_now  = Math.round(rowNow.under18 * mod.u18);
  const w_now    = Math.round((rowNow.a18to49||0) * mod.w);
  const p_now    = Math.round((rowNow.a50to64||0) * mod.p);
  const s_now    = Math.round(rowNow.a65to79 * mod.s);
  const e_now    = Math.round(rowNow.over80  * mod.e);
  const over65_now = s_now + e_now;

  const agingIndex = rowNow.total > 0 ? ((rowNow.a65to79 + rowNow.over80) / rowNow.total * 100).toFixed(1) : "0";
  const row2025   = getDataForYear(countryData.data, 2025);
  const agingTrend = growthRate(row2025.a65to79 + row2025.over80, rowLatest.a65to79 + rowLatest.over80);
  // CAGRs (2025→2035, 10yr): total population and 65+ ageing population
  const totalCagr  = cagr(row2025.total, rowLatest.total, 10);
  const aging65Cagr = cagr(row2025.a65to79 + row2025.over80, rowLatest.a65to79 + rowLatest.over80, 10);
  const over80Cagr  = cagr(row2025.over80, rowLatest.over80, 10);

  const color = countryData.color;
  const trendSeries = [{
    label:"65+ Population",
    ageLabel:name,
    color: C.amber,
    values: countryData.data.map(d => d.a65to79 + d.over80),
  },{
    label:"Total Population",
    ageLabel:name,
    color: color,
    values: countryData.data.map(d => d.total),
    dashed: true,
  }];

  const row2030 = getDataForYear(countryData.data, 2030);
  const bandKey = { "<18":"under18", "18-49":"a18to49", "50-64":"a50to64", "65-79":"a65to79", "80+":"over80" };
  const modKey  = { "<18":"u18", "18-49":"w", "50-64":"p", "65-79":"s", "80+":"e" };
  const bandRange = { "<18":"0–17 yrs", "18-49":"18–49 yrs", "50-64":"50–64 yrs", "65-79":"65–79 yrs", "80+":"80+ yrs" };
  const rawDonut = [
    { label:"<18",   value:u18_now,  color:C.green },
    { label:"18-49", value:w_now,   color:C.teal   },
    { label:"50-64", value:p_now,   color:C.purple },
    { label:"65-79", value:s_now,    color:C.amber },
    { label:"80+",   value:e_now,    color:C.red   },
  ].filter(s => s.value > 0);
  const donutTotal = rawDonut.reduce((a,b)=>a+b.value,0);
  const donutSegs = rawDonut.map(s => {
    const k = bandKey[s.label];
    const mk = modKey[s.label];
    const v2025 = (row2025[k]||0) * (mod[mk]||1);
    const v2030 = (row2030[k]||0) * (mod[mk]||1);
    return {
      ...s,
      range: bandRange[s.label],
      mixPct: donutTotal>0 ? (s.value/donutTotal*100) : 0,
      cagr2530: cagr(v2025, v2030, 5),
      pop2030: Math.round(v2030),
    };
  });

  const spark65Values = countryData.data.map(d => d.a65to79 + d.over80);

  return (
    <div id={cardId} style={{
      background:"#fff", borderRadius:14, border:`1px solid ${C.border}`,
      overflow:"hidden", boxShadow:"0 2px 12px rgba(11,31,58,0.08)",
      borderLeft:`4px solid ${color}`,
    }}>
      {/* CARD HEADER */}
      <div style={{padding:"12px 14px", cursor:"pointer"}} onClick={()=>setExpanded(v=>!v)}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          {/* Flag & country */}
          <div style={{
            width:40, height:40, borderRadius:10, flexShrink:0,
            background:`linear-gradient(135deg,${color}22 0%,${color}11 100%)`,
            border:`1px solid ${color}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22,
          }}>{countryData.flag}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1.5,color:C.navy,lineHeight:1}}>{name}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1.5,color:color,marginTop:1}}>{countryData.region}</div>
          </div>
          {/* Aging index badge */}
          <div style={{textAlign:"center",marginRight:4}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:parseFloat(agingIndex)>18?C.red:parseFloat(agingIndex)>12?C.amber:C.green,lineHeight:1}}>{agingIndex}%</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1,color:C.sub}}>65+</div>
          </div>
          {/* Spark 65+ */}
          <div style={{flexShrink:0}}>
            <Spark values={spark65Values} color={C.amber} w={50} h={22}/>
          </div>
          {/* Add to selection (quick) */}
          <button onClick={e=>{e.stopPropagation();onSelect&&onSelect(name);}}
            title={isSelected?"Remove from comparison list":"Add to comparison list"}
            style={{
              border:`1.5px solid ${isSelected?C.red:C.teal}`,
              background:isSelected?`${C.red}14`:`${C.teal}14`,
              color:isSelected?C.red:C.teal,cursor:"pointer",
              borderRadius:8,padding:"3px 8px",flexShrink:0,
              fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.5,lineHeight:1,
            }}>{isSelected?"✓":"+"}</button>
          {/* Fav & expand */}
          <button onClick={e=>{e.stopPropagation();onToggleFav&&onToggleFav(name);}} style={{border:"none",background:"none",cursor:"pointer",fontSize:18,color:isFav?C.amber:"#CBD5E1",padding:"0 2px"}}>
            {isFav?"★":"☆"}
          </button>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.sub,letterSpacing:1}}>{expanded?"▲":"▼"}</div>
        </div>

        {/* Population summary stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}>
          {[
            {label:"TOTAL",  value:fmt(rowNow.total), color:color},
            {label:"< 18",   value:fmt(u18_now), color:C.green},
            {label:"18–64",  value:fmt(w_now),   color:C.teal},
            {label:"65+",    value:fmt(over65_now), color:parseFloat(agingIndex)>18?C.red:C.amber},
          ].map(({label,value,color:c})=>(
            <div key={label} style={{background:"#F4F8FC",borderRadius:8,padding:"7px 4px",textAlign:"center",borderTop:`2px solid ${c}`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.sub,marginBottom:2}}>{label}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:c,letterSpacing:0.5,lineHeight:1}}>{value}</div>
            </div>
          ))}
        </div>

        {/* CAGR strip — highly visible growth rates (2025→2035) */}
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.sub,flexShrink:0}}>CAGR 25–35</span>
          <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>Total</span>
              <CagrBadge value={totalCagr} size="sm"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>65+</span>
              <CagrBadge value={aging65Cagr} size="sm"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>80+</span>
              <CagrBadge value={over80Cagr} size="sm"/>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAIL */}
      {expanded && (
        <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 14px 18px"}}>
                    {/* ── 4-CHART GRID — all same size, click any to enlarge ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>

            {/* 1 — Age Donut */}
            <div style={{background:"#F4F8FC",borderRadius:12,padding:"10px 8px",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:C.navy,marginBottom:6,textAlign:"center"}}>AGE MIX {year}</div>
              <Zoomable
                title={`${name} · Age Distribution ${year}`}
                onZoom={onZoom}
                renderLarge={()=>(
                  <div style={{padding:"8px 0"}}>
                    <Donut interactive year={year} segments={donutSegs} size={240} centerLabel={agingIndex+"%"} centerSub="aged 65+"/>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginTop:12}}>
                      {[{l:"<18",col:C.green},{l:"18-49",col:C.teal},{l:"50-64",col:C.purple},{l:"65-79",col:C.amber},{l:"80+",col:C.red}].map(({l,col})=>(
                        <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                          <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                          <span style={{fontFamily:"system-ui",fontSize:12,color:C.navy}}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              >
                <Donut segments={donutSegs} size={130} centerLabel={agingIndex+"%"} centerSub="aged 65+"/>
              </Zoomable>
              <div style={{display:"flex",flexWrap:"wrap",gap:"3px 8px",justifyContent:"center",marginTop:6}}>
                {[{l:"<18",col:C.green},{l:"18-49",col:C.teal},{l:"50-64",col:C.purple},{l:"65-79",col:C.amber},{l:"80+",col:C.red}].map(({l,col})=>(
                  <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
                    <div style={{width:6,height:6,borderRadius:1,background:col}}/>
                    <span style={{fontFamily:"system-ui",fontSize:10,color:C.navy}}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2 — Population Pyramid */}
            <div style={{background:"#F4F8FC",borderRadius:12,padding:"10px 8px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:C.navy,marginBottom:6,textAlign:"center"}}>AGE PYRAMID {year}</div>
              <Zoomable
                title={`${name} · Population Pyramid ${year}`}
                onZoom={onZoom}
                renderLarge={()=><div style={{padding:"8px 0"}}><PopPyramid big dataRow={rowNow} title={`PYRAMID ${year}`}/></div>}
              >
                <PopPyramid dataRow={rowNow} title=""/>
              </Zoomable>
            </div>

            {/* 3 — Age Distribution Bars */}
            <div style={{background:"#F4F8FC",borderRadius:12,padding:"10px 8px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:C.navy}}>AGE BANDS</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                  {YEARS.filter(y=>y!==year).map(y=>{
                    const on=compareYears.includes(y);
                    return (
                      <button key={y} onClick={e=>{e.stopPropagation();setCompareYears(p=>p.includes(y)?p.filter(x=>x!==y):[...p,y]);}}
                        style={{border:on?`1px solid ${C.navy}`:`1px solid ${C.border}`,borderRadius:8,padding:"1px 5px",background:on?C.navy:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,color:on?"#fff":C.sub,cursor:"pointer"}}>
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
              {(()=>{
                const distSeries=[
                  {year,row:rowNow,color,primary:true},
                  ...compareYears.sort((a,b)=>a-b).map((y,i)=>({year:y,row:getDataForYear(countryData.data,y),color:[C.purple,C.pink,"#3C7AC6",C.green2,C.red2,C.gold2][i%6]})),
                ];
                const yrLabel=[year,...compareYears].length>1?`${Math.min(year,...compareYears)}–${Math.max(year,...compareYears)}`:`${year}`;
                return (
                  <Zoomable
                    title={`${name} · Age Distribution ${yrLabel}`}
                    onZoom={onZoom}
                    renderLarge={()=><AgeDistributionCurve height={300} series={distSeries}/>}
                  >
                    <AgeDistributionCurve height={140} series={distSeries}/>
                  </Zoomable>
                );
              })()}
            </div>

            {/* 4 — Population Trend */}
            <div style={{background:"#F4F8FC",borderRadius:12,padding:"10px 8px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:C.navy,marginBottom:4}}>POP TREND 2005–2035</div>
              <Zoomable
                title={`${name} · Population Trend 2005–2035`}
                onZoom={onZoom}
                renderLarge={()=><TrendLine series={trendSeries} years={YEARS} height={280} width={540} showLegend={true}/>}
              >
                <TrendLine series={trendSeries} years={YEARS} height={140} showLegend={false}/>
              </Zoomable>
            </div>

          </div>

          {/* Key stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{background:"#FFF8EC",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.amber}33`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.amber,marginBottom:4}}>65+ AGEING GROWTH 2025→2035</div>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.amber,lineHeight:1}}>{agingTrend}%</div>
                <CagrBadge value={aging65Cagr} label="CAGR" size="sm"/>
              </div>
              <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,marginTop:3}}>total change · {aging65Cagr.toFixed(2)}% per yr</div>
            </div>
            <div style={{background:"#F0FAF5",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.green}33`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.green,marginBottom:4}}>80+ POPULATION {year}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.green,lineHeight:1}}>{fmt(Math.round(rowNow.over80 * mod.e))}</div>
              <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,marginTop:2}}>
                {((rowNow.over80/rowNow.total)*100).toFixed(1)}% of total
              </div>
            </div>
          </div>

          {/* Select for comparison */}
          <button onClick={e=>{e.stopPropagation();onSelect&&onSelect(name);}} style={{
            width:"100%",padding:"9px",borderRadius:10,
            border:`1.5px solid ${isSelected?C.red:C.teal}`,
            background:isSelected?C.red:C.teal,
            fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,
            color:"#fff",cursor:"pointer",
          }}>
            {isSelected?"✓ SELECTED FOR TABLE":"+ ADD TO COMPARISON"}
          </button>
        </div>
      )}
    </div>
  );
}


// ── US STATE PROFILE CARD ──────────────────────────────────────────────────────
function StateProfileCard({ name, isSelected, onSelect, defaultOpen, cardId, onZoom }) {
  const [expanded, setExpanded] = useState(!!defaultOpen);
  const stateData = US_STATE_DATA[name];
  if (!stateData) return null;
  const row = stateData[2025];
  const row2030 = stateData[2030] || null;
  if (!row) return null;

  const agingPct = ((row.a65to79 + row.over80) / row.total * 100).toFixed(1);
  const cagr65   = row2030 ? cagr(row.a65to79+row.over80, row2030.a65to79+row2030.over80, 5) : null;
  const cagrTot  = row2030 ? cagr(row.total, row2030.total, 5) : null;
  const spark65  = row2030 ? [row.a65to79+row.over80, row2030.a65to79+row2030.over80] : [row.a65to79+row.over80];

  const donutSegs = [
    { label:"<18",   value:row.under18,  color:C.green,  mixPct:(row.under18/row.total*100),  cagr2530:null, pop2030:row2030?row2030.under18:null },
    { label:"18-49", value:row.a18to49,  color:C.teal,   mixPct:(row.a18to49/row.total*100),  cagr2530:null, pop2030:row2030?row2030.a18to49:null },
    { label:"50-64", value:row.a50to64,  color:C.purple, mixPct:(row.a50to64/row.total*100),  cagr2530:null, pop2030:row2030?row2030.a50to64:null },
    { label:"65-79", value:row.a65to79,  color:C.amber,  mixPct:(row.a65to79/row.total*100),  cagr2530:null, pop2030:row2030?row2030.a65to79:null },
    { label:"80+",   value:row.over80,   color:C.red,    mixPct:(row.over80/row.total*100),   cagr2530:null, pop2030:row2030?row2030.over80:null },
  ].filter(s => s.value > 0);

  return (
    <div id={cardId} style={{
      background:"#fff", borderRadius:14, border:`1px solid ${C.border}`,
      overflow:"hidden", boxShadow:"0 2px 12px rgba(11,31,58,0.08)",
      borderLeft:`4px solid ${C.navy}`,
    }}>
      {/* HEADER */}
      <div style={{padding:"12px 14px",cursor:"pointer"}} onClick={()=>setExpanded(v=>!v)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:40,height:40,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#3C3B6E22,#3C3B6E11)",
            border:"1px solid #3C3B6E44",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
          }}>🇺🇸</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:1.5,color:C.navy,lineHeight:1}}>{name}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:C.teal,marginTop:1}}>UNITED STATES</div>
          </div>
          <div style={{textAlign:"center",marginRight:4}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,lineHeight:1,color:parseFloat(agingPct)>18?C.red:parseFloat(agingPct)>12?C.amber:C.green}}>{agingPct}%</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:C.sub}}>65+</div>
          </div>
          <div style={{flexShrink:0}}><Spark values={spark65} color={C.amber} w={44} h={20}/></div>
          <button onClick={e=>{e.stopPropagation();onSelect&&onSelect(name);}} style={{
            border:`1.5px solid ${isSelected?C.red:C.teal}`,
            background:isSelected?`${C.red}14`:`${C.teal}14`,
            color:isSelected?C.red:C.teal,cursor:"pointer",
            borderRadius:8,padding:"3px 8px",flexShrink:0,
            fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.5,lineHeight:1,
          }}>{isSelected?"✓":"+"}</button>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.sub,letterSpacing:1}}>{expanded?"▲":"▼"}</div>
        </div>

        {/* STATS GRID */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginTop:8}}>
          {[
            {label:"TOTAL",  value:row.total.toLocaleString(),              color:C.navy},
            {label:"< 18",   value:row.under18.toLocaleString(),            color:C.green},
            {label:"65+",    value:(row.a65to79+row.over80).toLocaleString(),color:parseFloat(agingPct)>18?C.red:C.amber},
          ].map(({label,value,color:col})=>(
            <div key={label} style={{background:"#F4F8FC",borderRadius:8,padding:"7px 4px",textAlign:"center",borderTop:`2px solid ${col}`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:C.sub,marginBottom:2}}>{label}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:col,letterSpacing:0.5,lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
            </div>
          ))}
        </div>

        {/* CAGR STRIP */}
        {cagr65 !== null && (
          <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:C.sub,flexShrink:0}}>CAGR 25–30</span>
            <div style={{display:"flex",gap:8}}>
              {[{l:"Total",v:cagrTot},{l:"65+",v:cagr65}].map(({l,v})=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontFamily:"system-ui",fontSize:10,color:C.sub}}>{l}</span>
                  <CagrBadge value={v} size="sm"/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EXPANDED DETAIL */}
      {expanded && (
        <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 14px 18px"}}>
          {/* Donut */}
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:2,color:C.navy,marginBottom:10}}>AGE DISTRIBUTION 2025</div>
          <Donut interactive year={2025} segments={donutSegs} size={160} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:"5px 10px",justifyContent:"center",marginTop:10}}>
            {[{l:"<18",col:C.green},{l:"18-49",col:C.teal},{l:"50-64",col:C.purple},{l:"65-79",col:C.amber},{l:"80+",col:C.red}].map(({l,col})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:8,height:8,borderRadius:2,background:col}}/>
                <span style={{fontFamily:"system-ui",fontSize:11,color:C.navy}}>{l}</span>
              </div>
            ))}
          </div>

          {/* 2030 outlook */}
          {row2030 && (
            <div style={{marginTop:14}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:2,color:C.navy,marginBottom:10}}>2025 → 2030 OUTLOOK</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:"#FFF8EC",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.amber}33`}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:C.amber,marginBottom:4}}>65+ POP 2030</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.amber,lineHeight:1}}>{fmt(row2030.a65to79+row2030.over80)}</div>
                  <div style={{marginTop:4}}><CagrBadge value={cagr65} size="sm"/></div>
                </div>
                <div style={{background:"#F0FAF5",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.green}33`}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:C.green,marginBottom:4}}>TOTAL 2030</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.green,lineHeight:1}}>{fmt(row2030.total)}</div>
                  <div style={{marginTop:4}}><CagrBadge value={cagrTot} size="sm"/></div>
                </div>
              </div>
            </div>
          )}

          <button onClick={e=>{e.stopPropagation();onSelect&&onSelect(name);}} style={{
            width:"100%",padding:"9px",borderRadius:10,marginTop:14,
            border:`1.5px solid ${isSelected?C.red:C.teal}`,
            background:isSelected?C.red:C.teal,
            fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,
            color:"#fff",cursor:"pointer",
          }}>
            {isSelected?"✓ SELECTED":"+ ADD TO COMPARISON"}
          </button>
        </div>
      )}
    </div>
  );
}


function RegionCard({ region, regionData, selectedYear, onZoom }) {
  const [sex, setSex] = useState("All");
  const row   = regionData ? regionData.find(d => d.year === selectedYear) || regionData[regionData.length-1] : null;
  const row30 = regionData ? regionData.find(d => d.year === 2030) : null;
  const rd    = REGIONS[region] || {};
  const color = rd.color || C.teal;
  const flag  = rd.flag || "🌍";
  const mod = sex==="Male" ? {u18:0.51,w:0.49,p:0.48,s:0.44,e:0.38}
            : sex==="Female" ? {u18:0.49,w:0.51,p:0.52,s:0.56,e:0.62}
            : {u18:1,w:1,p:1,s:1,e:1};
  const bands = [
    {key:"under18",label:"<18",  col:C.green, v:Math.round((row.under18||0)*mod.u18), v30:row30?Math.round((row30.under18||0)*mod.u18):null},
    {key:"a18to49",label:"18-49",col:C.teal,  v:Math.round((row.a18to49||0)*mod.w),  v30:row30?Math.round((row30.a18to49||0)*mod.w):null},
    {key:"a50to64",label:"50-64",col:C.purple,v:Math.round((row.a50to64||0)*mod.p),  v30:row30?Math.round((row30.a50to64||0)*mod.p):null},
    {key:"a65to79",label:"65-79",col:C.amber, v:Math.round((row.a65to79||0)*mod.s),  v30:row30?Math.round((row30.a65to79||0)*mod.s):null},
    {key:"over80", label:"80+",  col:C.red,   v:Math.round((row.over80||0)*mod.e),   v30:row30?Math.round((row30.over80||0)*mod.e):null},
  ];
  const total  = sex==="All" ? (row.total||1) : (bands.reduce((s,b)=>s+b.v,0)||row.total||1);
  const a65    = bands[3].v+bands[4].v;
  const a65pct = (a65/total*100).toFixed(1);
  const totCagr= (row.total&&row30&&row30.total)?((Math.pow(row30.total/row.total,0.2)-1)*100):null;
  const td = (regionData||[]).filter(d=>d.year<=2030).sort((a,b)=>a.year-b.year);
  const W=280,H=52,pL=30,pR=6,pT=6,pB=18;
  const tMin=Math.min(...td.map(d=>d.total||0));
  const tMax=Math.max(...td.map(d=>d.total||1));
  const tRng=tMax-tMin||1;
  const tx=i=>pL+(i/Math.max(td.length-1,1))*(W-pL-pR);
  const ty=v=>pT+(1-(v-tMin)/tRng)*(H-pT-pB);
  const pts=td.map((d,i)=>tx(i).toFixed(1)+","+ty(d.total||0).toFixed(1)).join(" ");
  const aPts=[tx(0).toFixed(1)+","+(H-pB),...td.map((d,i)=>tx(i).toFixed(1)+","+ty(d.total||0).toFixed(1)),tx(td.length-1).toFixed(1)+","+(H-pB)].join(" ");
  const gid="rg-"+region.replace(/[^a-z0-9]/gi,"-");
  return (
    <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 16px rgba(11,31,58,0.12)",border:"1px solid "+C.border,scrollSnapAlign:"start",flexShrink:0,width:"calc(100vw - 24px)",maxWidth:390}}>
      {/* Colour top strip */}
      <div style={{height:6,background:color}}/>
      {/* Card header - light background, high contrast */}
      <div style={{background:"#F8F5EE",padding:"14px 16px 12px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          {/* Left: flag + region */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:24}}>{flag}</span>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:C.navy,lineHeight:1}}>{region.toUpperCase()}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1.5,color:color,marginTop:2}}>{selectedYear > 2025 ? "PROJECTED · " : ""}{selectedYear}</div>
            </div>
          </div>
          {/* Right: dynamic total */}
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:C.navy,lineHeight:1,letterSpacing:1}}>{fmt(total)}</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,color:C.sub,marginTop:2}}>{sex.toUpperCase() === "ALL" ? "TOTAL" : sex.toUpperCase()} POPULATION</div>
          </div>
        </div>
        {/* Key metrics */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {[
            {l:"65+ SHARE", v:a65pct+"%",  c:parseFloat(a65pct)>18?C.red:C.amber, bg:parseFloat(a65pct)>18?"#FEF2F2":"#FFFBEB"},
            {l:"80+ POP",   v:fmt(bands[4].v), c:C.navy, bg:"#F0F4FF"},
            {l:"CAGR →30", v:totCagr!=null?(totCagr>0?"+":"")+totCagr.toFixed(2)+"%":"—", c:totCagr!=null&&totCagr>0?C.green:C.red, bg:totCagr!=null&&totCagr>0?"#F0FDF4":"#FEF2F2"},
          ].map(m=>(
            <div key={m.l} style={{textAlign:"center",background:m.bg,borderRadius:10,padding:"8px 4px",border:"1px solid "+C.border}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:C.sub,marginBottom:3}}>{m.l}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:m.c,letterSpacing:0.3,lineHeight:1}}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid "+C.border,background:"#F8FAFC"}}>
        {["All","Male","Female"].map(s=>(
          <button key={s} onClick={()=>setSex(s)} style={{flex:1,padding:"8px 0",border:"none",borderBottom:sex===s?"2px solid "+color:"2px solid transparent",background:"transparent",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1.5,color:sex===s?C.navy:C.sub,cursor:"pointer"}}>{s.toUpperCase()}</button>
        ))}
      </div>
      <div style={{padding:"8px 14px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 1fr 1.5fr",gap:4,paddingBottom:5,borderBottom:"1px solid "+C.border}}>
          {["BAND","POPULATION","SHARE","CAGR"].map(h=>(<div key={h} style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:C.sub,textAlign:h==="BAND"?"left":"right"}}>{h}</div>))}
        </div>
        {bands.map(b=>{
          const share=(b.v/total*100).toFixed(1);
          const gr=(b.v&&b.v30)?((Math.pow(b.v30/b.v,0.2)-1)*100):null;
          return (
            <div key={b.key} style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 1fr 1.5fr",gap:4,padding:"5px 0",borderBottom:"1px solid rgba(200,214,229,0.3)"}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:2,background:b.col,flexShrink:0}}/><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.navy,letterSpacing:0.3}}>{b.label}</span></div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.navy,textAlign:"right"}}>{fmt(b.v)}</div>
              <div style={{fontFamily:"system-ui",fontSize:11,color:C.sub,textAlign:"right"}}>{share}%</div>
              <div style={{textAlign:"right"}}>{gr!=null&&<span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:gr>0?C.green:"#FF8A8A"}}>{gr>0?"+":""}{gr.toFixed(2)}%</span>}</div>
            </div>
          );
        })}
        <div style={{display:"grid",gridTemplateColumns:"2fr 2.5fr 1fr 1.5fr",gap:4,padding:"6px 0 8px",borderTop:"1.5px solid "+C.border}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.navy}}>TOTAL</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.navy,textAlign:"right"}}>{fmt(total)}</div>
          <div style={{fontFamily:"system-ui",fontSize:11,color:C.sub,textAlign:"right"}}>100%</div>
          <div style={{textAlign:"right"}}>{totCagr!=null&&<span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:totCagr>0?C.green:"#FF8A8A"}}>{totCagr>0?"+":""}{totCagr.toFixed(2)}%</span>}</div>
        </div>
      </div>
      <div style={{borderTop:"1px solid "+C.border,padding:"8px 14px 12px",background:"#F8FAFC"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:2,color:C.sub}}>POPULATION TREND 2005–2030</div>
          {onZoom&&(<button onClick={()=>onZoom({title:region+" Population Trend",node:<TrendLine series={[{label:region,color,values:td.map(d=>d.total||0)}]} years={td.map(d=>d.year)} height={260} width={500} showLegend={false}/>})} style={{border:"1px solid "+C.border,background:"#fff",borderRadius:6,width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.sub,padding:0}}>&#x2922;</button>)}
        </div>
        <svg width="100%" viewBox={"0 0 "+W+" "+H} style={{display:"block",overflow:"visible"}}>
          <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/></linearGradient></defs>
          <polygon points={aPts} fill={"url(#"+gid+")"}/>
          <text x={pL-3} y={pT+6} textAnchor="end" fontSize="7.5" fill={C.sub} fontFamily="system-ui">{fmt(tMax)}</text>
          <text x={pL-3} y={H-pB+1} textAnchor="end" fontSize="7.5" fill={C.sub} fontFamily="system-ui">{fmt(tMin)}</text>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          {td.map((d,i)=>(<text key={d.year} x={tx(i)} y={H-1} textAnchor="middle" fontSize="7.5" fill={d.year===selectedYear?C.navy:C.sub} fontFamily="system-ui" fontWeight={d.year===selectedYear?"700":"400"}>{d.year}</text>))}
          {td.map((d,i)=>d.year===selectedYear?(<circle key="sel" cx={tx(i)} cy={ty(d.total||0)} r="3" fill={color} stroke="#fff" strokeWidth="1.5"/>):null)}
        </svg>
      </div>
    </div>
  );
}
// ── DEMOGRAPHIC MAP (Mapbox GL) ─────────────────────────────────────────────
// ── US STATE CENTROIDS (for map markers) ──────────────────────────────────
const US_STATE_CENTROIDS = [
  { name:"Alabama", lat:32.8, lng:-86.9 },
  { name:"Alaska", lat:64.2, lng:-152.5 },
  { name:"Arizona", lat:34.0, lng:-111.1 },
  { name:"Arkansas", lat:34.7, lng:-92.2 },
  { name:"California", lat:36.8, lng:-119.4 },
  { name:"Colorado", lat:39.1, lng:-105.3 },
  { name:"Connecticut", lat:41.6, lng:-72.8 },
  { name:"Delaware", lat:39.0, lng:-75.5 },
  { name:"District of Columbia", lat:38.9, lng:-77.0 },
  { name:"Florida", lat:27.7, lng:-81.5 },
  { name:"Georgia", lat:33.0, lng:-83.5 },
  { name:"Hawaii", lat:19.9, lng:-155.5 },
  { name:"Idaho", lat:44.1, lng:-114.7 },
  { name:"Illinois", lat:40.6, lng:-89.4 },
  { name:"Indiana", lat:40.3, lng:-86.1 },
  { name:"Iowa", lat:42.0, lng:-93.1 },
  { name:"Kansas", lat:38.5, lng:-98.5 },
  { name:"Kentucky", lat:37.8, lng:-84.3 },
  { name:"Louisiana", lat:30.5, lng:-92.1 },
  { name:"Maine", lat:45.3, lng:-69.4 },
  { name:"Maryland", lat:39.0, lng:-76.6 },
  { name:"Massachusetts", lat:42.2, lng:-71.5 },
  { name:"Michigan", lat:44.3, lng:-84.5 },
  { name:"Minnesota", lat:46.7, lng:-94.6 },
  { name:"Mississippi", lat:32.3, lng:-89.3 },
  { name:"Missouri", lat:38.6, lng:-91.8 },
  { name:"Montana", lat:47.0, lng:-109.5 },
  { name:"Nebraska", lat:41.1, lng:-99.9 },
  { name:"Nevada", lat:38.8, lng:-116.4 },
  { name:"New Hampshire", lat:43.2, lng:-71.6 },
  { name:"New Jersey", lat:40.1, lng:-74.4 },
  { name:"New Mexico", lat:34.5, lng:-105.9 },
  { name:"New York", lat:43.3, lng:-74.2 },
  { name:"North Carolina", lat:35.6, lng:-79.0 },
  { name:"North Dakota", lat:47.5, lng:-101.0 },
  { name:"Ohio", lat:40.4, lng:-82.9 },
  { name:"Oklahoma", lat:35.0, lng:-97.1 },
  { name:"Oregon", lat:44.6, lng:-120.6 },
  { name:"Pennsylvania", lat:41.2, lng:-77.2 },
  { name:"Puerto Rico", lat:18.2, lng:-66.6 },
  { name:"Rhode Island", lat:41.7, lng:-71.5 },
  { name:"South Carolina", lat:34.0, lng:-81.2 },
  { name:"South Dakota", lat:43.9, lng:-99.9 },
  { name:"Tennessee", lat:35.5, lng:-86.6 },
  { name:"Texas", lat:31.1, lng:-99.9 },
  { name:"Utah", lat:39.3, lng:-111.1 },
  { name:"Vermont", lat:44.0, lng:-72.6 },
  { name:"Virginia", lat:37.4, lng:-78.6 },
  { name:"Washington", lat:47.8, lng:-120.7 },
  { name:"West Virginia", lat:38.6, lng:-80.5 },
  { name:"Wisconsin", lat:43.8, lng:-89.6 },
  { name:"Wyoming", lat:43.0, lng:-107.3 },
];

// ── US STATE DATA (2025 + 2030, ACS/Census) ───────────────────────────────
const US_STATE_DATA = {
  "Alabama": { 2025:{year:2025,total:5157699,under18:1132203,a65to79:749449,over80:205717}, 2030:{year:2030,total:5213942,under18:1126771,a65to79:826330,over80:254940} },
  "Alaska": { 2025:{year:2025,total:740133,under18:174198,a65to79:91090,over80:18325}, 2030:{year:2030,total:751139,under18:179899,a65to79:100669,over80:26484} },
  "Arizona": { 2025:{year:2025,total:7582384,under18:1585751,a65to79:1152362,over80:338796}, 2030:{year:2030,total:7766236,under18:1638932,a65to79:1355511,over80:451423} },
  "Arkansas": { 2025:{year:2025,total:3088354,under18:698141,a65to79:440532,over80:122175}, 2030:{year:2030,total:3084796,under18:697640,a65to79:478488,over80:150769} },
  "California": { 2025:{year:2025,total:39431263,under18:8411338,a65to79:5015840,over80:1509021}, 2030:{year:2030,total:41321454,under18:8645586,a65to79:5815442,over80:1978111} },
  "Colorado": { 2025:{year:2025,total:5957494,under18:1206847,a65to79:780385,over80:199979}, 2030:{year:2030,total:6387211,under18:1353259,a65to79:892702,over80:286144} },
  "Connecticut": { 2025:{year:2025,total:3675069,under18:727220,a65to79:540355,over80:172982}, 2030:{year:2030,total:3629971,under18:716900,a65to79:591188,over80:211964} },
  "Delaware": { 2025:{year:2025,total:1051917,under18:213746,a65to79:179401,over80:48423}, 2030:{year:2030,total:1063673,under18:211937,a65to79:198839,over80:62785} },
  "District of Columbia": { 2025:{year:2025,total:702250,under18:130018,a65to79:68101,over80:22573}, 2030:{year:2030,total:761820,under18:134473,a65to79:71702,over80:24755} },
  "Florida": { 2025:{year:2025,total:23372215,under18:4491936,a65to79:3838642,over80:1255711}, 2030:{year:2030,total:23790046,under18:4413994,a65to79:4539577,over80:1521550} },
  "Georgia": { 2025:{year:2025,total:11180878,under18:2531131,a65to79:1400369,over80:365234}, 2030:{year:2030,total:11534245,under18:2559386,a65to79:1647017,over80:495087} },
  "Hawaii": { 2025:{year:2025,total:1446146,under18:293560,a65to79:235057,over80:76248}, 2030:{year:2030,total:1529814,under18:298845,a65to79:256754,over80:100337} },
  "Idaho": { 2025:{year:2025,total:2001619,under18:467247,a65to79:278451,over80:77100}, 2030:{year:2030,total:2066265,under18:498198,a65to79:317088,over80:105662} },
  "Illinois": { 2025:{year:2025,total:12710158,under18:2692660,a65to79:1755608,over80:518974}, 2030:{year:2030,total:12798928,under18:2692244,a65to79:1907173,over80:633182} },
  "Indiana": { 2025:{year:2025,total:6924275,under18:1578728,a65to79:956034,over80:262367}, 2030:{year:2030,total:7018843,under18:1614085,a65to79:1046385,over80:336020} },
  "Iowa": { 2025:{year:2025,total:3241488,under18:727370,a65to79:465624,over80:146979}, 2030:{year:2030,total:3301784,under18:757228,a65to79:514097,over80:180095} },
  "Kansas": { 2025:{year:2025,total:2970606,under18:686628,a65to79:416438,over80:117336}, 2030:{year:2030,total:3002711,under18:706242,a65to79:453391,over80:150754} },
  "Kentucky": { 2025:{year:2025,total:4588372,under18:1020211,a65to79:657225,over80:168625}, 2030:{year:2030,total:4633881,under18:1023428,a65to79:718045,over80:217947} },
  "Louisiana": { 2025:{year:2025,total:4597740,under18:1062537,a65to79:655821,over80:164043}, 2030:{year:2030,total:4752752,under18:1075163,a65to79:709673,over80:212037} },
  "Maine": { 2025:{year:2025,total:1405012,under18:244679,a65to79:258935,over80:70991}, 2030:{year:2030,total:1388293,under18:250868,a65to79:273581,over80:94331} },
  "Maryland": { 2025:{year:2025,total:6263220,under18:1368343,a65to79:850825,over80:248927}, 2030:{year:2030,total:6494090,under18:1391545,a65to79:943286,over80:314025} },
  "Massachusetts": { 2025:{year:2025,total:7136171,under18:1354765,a65to79:1025942,over80:310000}, 2030:{year:2030,total:7409395,under18:1419895,a65to79:1149149,over80:399847} },
  "Michigan": { 2025:{year:2025,total:10140459,under18:2103755,a65to79:1549650,over80:438209}, 2030:{year:2030,total:10224497,under18:2160337,a65to79:1656237,over80:547926} },
  "Minnesota": { 2025:{year:2025,total:5793151,under18:1290824,a65to79:812852,over80:243421}, 2030:{year:2030,total:6023698,under18:1348956,a65to79:925657,over80:312580} },
  "Mississippi": { 2025:{year:2025,total:2943045,under18:671997,a65to79:422020,over80:109327}, 2030:{year:2030,total:2956772,under18:653964,a65to79:473141,over80:143294} },
  "Missouri": { 2025:{year:2025,total:6245466,under18:1366801,a65to79:910668,over80:258533}, 2030:{year:2030,total:6281703,under18:1378587,a65to79:1001972,over80:321367} },
  "Montana": { 2025:{year:2025,total:1137233,under18:230015,a65to79:192228,over80:49195}, 2030:{year:2030,total:1159875,under18:246472,a65to79:203066,over80:67657} },
  "Nebraska": { 2025:{year:2025,total:2005466,under18:479649,a65to79:269552,over80:78500}, 2030:{year:2030,total:2067878,under18:501190,a65to79:299419,over80:100028} },
  "Nevada": { 2025:{year:2025,total:3267467,under18:687705,a65to79:457631,over80:117720}, 2030:{year:2030,total:3437890,under18:720462,a65to79:537345,over80:160966} },
  "New Hampshire": { 2025:{year:2025,total:1409032,under18:248169,a65to79:239017,over80:64215}, 2030:{year:2030,total:1424739,under18:257565,a65to79:269666,over80:86412} },
  "New Jersey": { 2025:{year:2025,total:9500851,under18:2043575,a65to79:1312827,over80:393838}, 2030:{year:2030,total:9675872,under18:2027213,a65to79:1427458,over80:479644} },
  "New Mexico": { 2025:{year:2025,total:2130256,under18:443837,a65to79:333629,over80:95604}, 2030:{year:2030,total:2162106,under18:461823,a65to79:373423,over80:122654} },
  "New York": { 2025:{year:2025,total:19867248,under18:3972535,a65to79:2852162,over80:905011}, 2030:{year:2030,total:20836092,under18:4168202,a65to79:3052346,over80:1073333} },
  "North Carolina": { 2025:{year:2025,total:11046024,under18:2349516,a65to79:1558027,over80:422663}, 2030:{year:2030,total:11160159,under18:2347461,a65to79:1774071,over80:569788} },
  "North Dakota": { 2025:{year:2025,total:796568,under18:178027,a65to79:104788,over80:35507}, 2030:{year:2030,total:867403,under18:208805,a65to79:117442,over80:38354} },
  "Ohio": { 2025:{year:2025,total:11883304,under18:2568566,a65to79:1768823,over80:502574}, 2030:{year:2030,total:11999653,under18:2597463,a65to79:1916051,over80:637406} },
  "Oklahoma": { 2025:{year:2025,total:4095393,under18:963347,a65to79:538447,over80:153634}, 2030:{year:2030,total:4121121,under18:965777,a65to79:599924,over80:186930} },
  "Oregon": { 2025:{year:2025,total:4272371,under18:825249,a65to79:659416,over80:190801}, 2030:{year:2030,total:4563425,under18:901590,a65to79:728049,over80:262261} },
  "Pennsylvania": { 2025:{year:2025,total:13078751,under18:2624989,a65to79:2046560,over80:619414}, 2030:{year:2030,total:13231491,under18:2674163,a65to79:2229058,over80:760815} },
  "Puerto Rico": { 2025:{year:2025,total:3203295,under18:480726,a65to79:566282,over80:223232} },
  "Rhode Island": { 2025:{year:2025,total:1112308,under18:203536,a65to79:167126,over80:53042}, 2030:{year:2030,total:1131942,under18:215302,a65to79:185846,over80:64045} },
  "South Carolina": { 2025:{year:2025,total:5478831,under18:1149839,a65to79:863028,over80:219696}, 2030:{year:2030,total:5514501,under18:1142920,a65to79:953817,over80:308683} },
  "South Dakota": { 2025:{year:2025,total:924669,under18:217535,a65to79:136636,over80:39266}, 2030:{year:2030,total:944259,under18:227019,a65to79:150341,over80:49908} },
  "Tennessee": { 2025:{year:2025,total:7227750,under18:1576399,a65to79:1007458,over80:266521}, 2030:{year:2030,total:7359519,under18:1591685,a65to79:1125402,over80:352905} },
  "Texas": { 2025:{year:2025,total:31290831,under18:7657490,a65to79:3462895,over80:902574}, 2030:{year:2030,total:32463602,under18:7758610,a65to79:4189497,over80:1226426} },
  "Utah": { 2025:{year:2025,total:3503613,under18:932753,a65to79:345047,over80:89875}, 2030:{year:2030,total:3699050,under18:1016377,a65to79:404835,over80:126936} },
  "Vermont": { 2025:{year:2025,total:648493,under18:112028,a65to79:115410,over80:33075}, 2030:{year:2030,total:656319,under18:120487,a65to79:122077,over80:41920} },
  "Virginia": { 2025:{year:2025,total:8811195,under18:1874030,a65to79:1210185,over80:340200}, 2030:{year:2030,total:9129002,under18:1944039,a65to79:1348432,over80:444313} },
  "Washington": { 2025:{year:2025,total:7958180,under18:1652049,a65to79:1085046,over80:293462}, 2030:{year:2030,total:8512355,under18:1815411,a65to79:1229984,over80:413651} },
  "West Virginia": { 2025:{year:2025,total:1769979,under18:347578,a65to79:305456,over80:81395}, 2030:{year:2030,total:1750206,under18:344540,a65to79:307906,over80:100336} },
  "Wisconsin": { 2025:{year:2025,total:5960975,under18:1233276,a65to79:914415,over80:256627}, 2030:{year:2030,total:6052525,under18:1278711,a65to79:1021275,over80:334931} },
  "Wyoming": { 2025:{year:2025,total:587618,under18:124986,a65to79:94147,over80:23226}, 2030:{year:2030,total:586925,under18:133566,a65to79:95819,over80:30040} },
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Country name → ISO 3166-1 alpha-3 for Mapbox boundary matching
const ISO_MAP = {
  "United States":"USA","Canada":"CAN","United Kingdom":"GBR","Germany":"DEU",
  "France":"FRA","Italy":"ITA","Spain":"ESP","Netherlands":"NLD",
  "Japan":"JPN","Australia":"AUS","Brazil":"BRA","Mexico":"MEX",
  "Argentina":"ARG","Colombia":"COL","Chile":"CHL","Peru":"PER",
  "China":"CHN","India":"IND","South Korea":"KOR","Indonesia":"IDN",
  "Thailand":"THA","Malaysia":"MYS","Vietnam":"VNM","Philippines":"PHL",
  "Pakistan":"PAK","Bangladesh":"BGD","Singapore":"SGP","New Zealand":"NZL",
  "Nigeria":"NGA","South Africa":"ZAF","Ethiopia":"ETH","Egypt":"EGY",
  "Kenya":"KEN","Ghana":"GHA","Tanzania":"TZA","Morocco":"MAR",
  "Uganda":"UGA","Mozambique":"MOZ",
  "Saudi Arabia":"SAU","UAE":"ARE","Iran":"IRN","Iraq":"IRQ",
  "Israel":"ISR","Jordan":"JOR","Kuwait":"KWT","Qatar":"QAT",
  "Bahrain":"BHR","Oman":"OMN",
  "Sweden":"SWE","Norway":"NOR","Denmark":"DNK","Poland":"POL",
  "Belgium":"BEL","Austria":"AUT","Switzerland":"CHE","Portugal":"PRT",
  "Finland":"FIN","Ireland":"IRL",
};
const ISO_TO_NAME = Object.fromEntries(Object.entries(ISO_MAP).map(([n,i])=>[i,n]));

// Country centroids for zoom + popup positioning
const CENTROIDS = {
  "United States":[-98,39,4],"Canada":[-106,56,3],"United Kingdom":[-2,54,5.5],
  "Germany":[10,51,5.5],"France":[2,47,5.5],"Italy":[12,43,5.5],
  "Spain":[-3,40,5.5],"Netherlands":[5,52,7],"Japan":[138,37,5],
  "Australia":[134,-25,3.5],"Brazil":[-52,-14,3.5],"Mexico":[-102,24,4.5],
  "Argentina":[-64,-35,3.5],"Colombia":[-72,4,5],"Chile":[-70,-33,4],
  "Peru":[-76,-10,4.5],"China":[104,35,3.5],"India":[79,22,4],
  "South Korea":[128,36,6],"Indonesia":[118,-2,4],"Thailand":[101,15,5.5],
  "Malaysia":[109,4,5.5],"Vietnam":[106,16,5],"Philippines":[122,12,5.5],
  "Pakistan":[69,30,5],"Bangladesh":[90,24,6.5],"Singapore":[104,1.3,10],
  "New Zealand":[173,-41,5],"Nigeria":[8,10,5],"South Africa":[25,-29,5],
  "Ethiopia":[39,9,5],"Egypt":[30,27,5.5],"Kenya":[38,0,5.5],
  "Ghana":[-1,8,6],"Tanzania":[35,-6,5.5],"Morocco":[-6,32,5.5],
  "Uganda":[32,1,6.5],"Mozambique":[35,-18,4.5],
  "Saudi Arabia":[45,24,4.5],"UAE":[54,24,7],"Iran":[53,32,5],
  "Iraq":[44,33,5.5],"Israel":[35,31,7],"Jordan":[36,31,7],
  "Kuwait":[48,29,8],"Qatar":[51,25,8],"Bahrain":[50.5,26,10],"Oman":[57,21,6],
  "Sweden":[16,63,4],"Norway":[10,65,4],"Denmark":[10,56,6.5],
  "Poland":[20,52,5.5],"Belgium":[4,51,7.5],"Austria":[14,47,6.5],
  "Switzerland":[8,47,7],"Portugal":[-8,39,6],"Finland":[26,64,4.5],"Ireland":[-8,53,6],
};

// Region view configs
const REGION_VIEW = {
  "Global":      { lon:10,   lat:20,  zoom:1.5 },
  "Europe":      { lon:15,   lat:50,  zoom:3.8 },
  "Americas":    { lon:-85,  lat:20,  zoom:2.2 },
  "Asia-Pacific":{ lon:115,  lat:10,  zoom:2.3 },
  "Africa":      { lon:20,   lat:5,   zoom:2.5 },
  "Middle East": { lon:45,   lat:28,  zoom:4.0 },
};

function DemographicMap({ year, metric, onMetricChange, region, onPick, selectedCountries }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const prevRegion = useRef(region);
  const [hoveredState, setHoveredState] = useState(null);
  const [pinnedState, setPinnedState] = useState(null);


  const metricVal = (name) => {
    const cd = COUNTRIES[name]; if (!cd) return null;
    const row = getDataForYear(cd.data, year);
    const r2025 = getDataForYear(cd.data, 2025), r2035 = cd.data[cd.data.length-1];
    if (!row) return null;
    if (metric==="aging") return (row.a65to79+row.over80)/row.total*100;
    if (metric==="total") return row.total;
    if (metric==="cagr")  return cagr(r2025.a65to79+r2025.over80, r2035.a65to79+r2035.over80, 10);
    return null;
  };

  const metricCfg = {
    aging: { label:"65+ SHARE", fmtV:v=>v.toFixed(1)+"%" },
    total: { label:"TOTAL POP", fmtV:v=>fmt(Math.round(v)) },
    cagr:  { label:"65+ CAGR 25–35", fmtV:v=>(v>0?"+":"")+v.toFixed(2)+"%" },
  }[metric];

  const allVals = Object.keys(COUNTRIES).map(metricVal).filter(v=>v!=null);
  const lo = Math.min(...allVals), hi = Math.max(...allVals);

  const shade = (v) => {
    if (v==null) return "rgba(226,232,240,0.3)";
    const t = hi>lo ? (v-lo)/(hi-lo) : 0.5;
    const lerp=(a,b,x)=>Math.round(a+(b-a)*x);
    let r,g,b;
    if (t<0.5){ const x=t/0.5; r=lerp(0,245,x); g=lerp(196,166,x); b=lerp(180,35,x); }
    else { const x=(t-0.5)/0.5; r=lerp(245,224,x); g=lerp(166,82,x); b=lerp(35,82,x); }
    return `rgb(${r},${g},${b})`;
  };

  // Build fill-color expression for Mapbox
  const fillExpr = useMemo(() => {
    const matches = [];
    Object.entries(ISO_MAP).forEach(([name, iso]) => {
      const v = metricVal(name);
      if (v != null) matches.push(iso, shade(v));
    });
    if (matches.length === 0) return "rgba(226,232,240,0.3)";
    return ["match", ["get", "iso_3166_1_alpha_3"], ...matches, "rgba(226,232,240,0.3)"];
  }, [metric, year]);

  const rv = REGION_VIEW[region] || REGION_VIEW.Global;

  // Create map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [rv.lon, rv.lat],
      zoom: rv.zoom,
      attributionControl: false,
    });
    m.addControl(new mapboxgl.NavigationControl({ showCompass:false }), "top-right");
    m.on("load", () => {
      m.addSource("country-boundaries", {
        type:"vector", url:"mapbox://mapbox.country-boundaries-v1",
      });
      m.addLayer({
        id:"country-fill", type:"fill",
        source:"country-boundaries", "source-layer":"country_boundaries",
        paint:{ "fill-color":"rgba(226,232,240,0.3)", "fill-opacity":0.75 },
        filter:["has","iso_3166_1_alpha_3"],
      });
      m.addLayer({
        id:"country-outline", type:"line",
        source:"country-boundaries", "source-layer":"country_boundaries",
        paint:{ "line-color":"rgba(255,255,255,0.6)", "line-width":0.4 },
        filter:["has","iso_3166_1_alpha_3"],
      });
      setMapReady(true);
    });
    m.on("mousemove","country-fill",(e)=>{
      if (!e.features||!e.features.length) return;
      m.getCanvas().style.cursor="pointer";
      const iso=e.features[0].properties.iso_3166_1_alpha_3;
      const name=ISO_TO_NAME[iso];
      if (name) setHover(name);
    });
    m.on("mouseleave","country-fill",()=>{
      m.getCanvas().style.cursor="";
      setHover(null);
    });
    m.on("click","country-fill",(e)=>{
      if (!e.features||!e.features.length) return;
      const iso=e.features[0].properties.iso_3166_1_alpha_3;
      const name=ISO_TO_NAME[iso];
      if (!name||!COUNTRIES[name]) return;
      const cen=CENTROIDS[name];
      if (cen) m.flyTo({center:[cen[0],cen[1]],zoom:cen[2],duration:800});
      setPinned(p=>p===name?null:name);
    });

      // ── US STATE MARKERS ──────────────────────────────────────────────────
      m.on("load", () => {
        const stateFeatures = US_STATE_CENTROIDS.map(s => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [s.lng, s.lat] },
          properties: { name: s.name },
        }));
        m.addSource("us-states", {
          type: "geojson",
          data: { type: "FeatureCollection", features: stateFeatures },
        });
        m.addLayer({
          id: "state-dots",
          type: "circle",
          source: "us-states",
          paint: {
            "circle-radius": ["interpolate",["linear"],["zoom"],3,3,8,7],
            "circle-color": "#3C3B6E",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.85,
          },
        });
      });
      m.on("mouseenter","state-dots",(e) => {
        if (!e.features||!e.features.length) return;
        m.getCanvas().style.cursor = "pointer";
        setHoveredState(e.features[0].properties.name);
      });
      m.on("mouseleave","state-dots",() => {
        m.getCanvas().style.cursor = "";
        setHoveredState(null);
      });
      m.on("click","state-dots",(e) => {
        if (!e.features||!e.features.length) return;
        e.preventDefault();
        const name = e.features[0].properties.name;
        const st = US_STATE_CENTROIDS.find(s=>s.name===name);
        if (st) m.flyTo({ center:[st.lng,st.lat], zoom:6, duration:800 });
        setPinnedState(p => p===name?null:name);
      });

    mapRef.current = m;
    return () => { m.remove(); mapRef.current=null; };
  }, []);

  // Update fill colors when metric/year changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    try { mapRef.current.setPaintProperty("country-fill","fill-color",fillExpr); } catch(e){}
  }, [fillExpr, mapReady]);

  // Fly to region when filter changes
  useEffect(() => {
    if (region!==prevRegion.current && mapRef.current) {
      const rv=REGION_VIEW[region]||REGION_VIEW.Global;
      mapRef.current.flyTo({center:[rv.lon,rv.lat],zoom:rv.zoom,duration:1200});
      prevRegion.current=region;
      setPinned(null);
    }
  }, [region]);

  const activeName = hover || pinned;
  const hv = activeName && COUNTRIES[activeName] ? { name:activeName } : null;
  const hvRow = hv ? getDataForYear(COUNTRIES[hv.name].data, year) : null;
  const hvCagr = hv ? (()=>{ const cd=COUNTRIES[hv.name]; const a=getDataForYear(cd.data,2025), b=cd.data[cd.data.length-1]; return cagr(a.a65to79+a.over80,b.a65to79+b.over80,10);})() : null;

  return (
    <div style={{position:"relative"}}>
      {/* metric switch */}
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.navy,alignSelf:"center"}}>SHADE BY</span>
        {[{id:"aging",l:"65+ Share"},{id:"total",l:"Total Pop"},{id:"cagr",l:"65+ CAGR"}].map(m=>(
          <button key={m.id} onClick={()=>onMetricChange(m.id)} style={{
            border:metric===m.id?`1.5px solid ${C.teal}`:`1px solid ${C.border}`,
            borderRadius:20,padding:"4px 12px",background:metric===m.id?C.teal:"#fff",
            fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,
            color:metric===m.id?"#fff":C.sub,cursor:"pointer",
          }}>{m.l}</button>
        ))}
      </div>

      <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`}}>
        <div ref={containerRef} style={{width:"100%",height:340}}/>
      </div>

      {/* legend */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1,color:C.sub}}>{metricCfg.fmtV(lo)}</span>
        <div style={{flex:1,height:8,borderRadius:4,background:"linear-gradient(90deg,rgb(0,196,180),rgb(245,166,35),rgb(224,82,82))"}}/>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1,color:C.sub}}>{metricCfg.fmtV(hi)}</span>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.navy,marginLeft:4}}>{metricCfg.label}</span>
      </div>

      {/* data popup */}
      {hv && hvRow && (
        <div style={{
          position:"absolute", top:46, right:10, zIndex:20,
          background:C.navy, borderRadius:12, padding:"12px 14px", minWidth:190,
          boxShadow:"0 10px 28px rgba(11,31,58,0.4)", border:`1px solid ${C.teal}`,
          pointerEvents:pinned?"auto":"none",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:7,borderBottom:`1px solid rgba(255,255,255,0.14)`}}>
            <span style={{fontSize:18}}>{COUNTRIES[hv.name]?.flag}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:0.8,color:"#fff",lineHeight:1}}>{hv.name}</div>
              <div style={{fontFamily:"system-ui",fontSize:12,color:"rgba(255,255,255,0.85)",marginTop:2}}>{COUNTRIES[hv.name]?.region} · {year}</div>
            </div>
            {pinned && (
              <button onClick={(e)=>{e.stopPropagation();setPinned(null);}} style={{border:"none",background:"rgba(255,255,255,0.12)",color:"#fff",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:14,lineHeight:1,flexShrink:0}}>×</button>
            )}
          </div>
          {[
            {k:"Total pop", v:fmt(hvRow.total), c:"#fff"},
            {k:"65+ share", v:((hvRow.a65to79+hvRow.over80)/hvRow.total*100).toFixed(1)+"%", c:C.amber},
            {k:"80+ pop", v:fmt(hvRow.over80), c:"#fff"},
            {k:"65+ CAGR→35", v:(hvCagr>0?"+":"")+hvCagr.toFixed(2)+"%", c:hvCagr>0?C.green:"#FF8A8A"},
          ].map(row=>(
            <div key={row.k} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:14,marginBottom:4}}>
              <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.88)"}}>{row.k}</span>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:0.5,color:row.c}}>{row.v}</span>
            </div>
          ))}
          {pinned && onPick && (
            <button onClick={(e)=>{e.stopPropagation();onPick(pinned);}} style={{
              width:"100%",marginTop:8,border:`1px solid ${C.teal}`,background:"transparent",color:C.teal,
              borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,cursor:"pointer",
            }}>OPEN FULL PROFILE ▸</button>
          )}
        </div>
      )}

      {/* US State popup */}
      {(hoveredState||pinnedState) && US_STATE_DATA[hoveredState||pinnedState] && (() => {
        const sName = hoveredState||pinnedState;
        const sRow = US_STATE_DATA[sName][2025];
        const aging = sRow ? (((sRow.a65to79||0)+(sRow.over80||0))/sRow.total*100).toFixed(1) : "—";
        return (
          <div style={{
            position:"absolute",top:46,right:10,zIndex:21,
            background:C.navy,borderRadius:12,padding:"12px 14px",minWidth:170,
            boxShadow:"0 10px 28px rgba(11,31,58,0.4)",border:`1px solid #3C3B6E`,
            pointerEvents:pinnedState?"auto":"none",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:7,borderBottom:`1px solid rgba(255,255,255,0.14)`}}>
              <span style={{fontSize:16}}>🇺🇸</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.8,color:"#fff",lineHeight:1}}>{sName}</div>
                <div style={{fontFamily:"system-ui",fontSize:12,color:"rgba(255,255,255,0.85)",marginTop:2}}>United States · 2025</div>
              </div>
              {pinnedState && <button onClick={e=>{e.stopPropagation();setPinnedState(null);}} style={{border:"none",background:"rgba(255,255,255,0.12)",color:"#fff",borderRadius:6,width:22,height:22,cursor:"pointer",fontSize:14,lineHeight:1}}>×</button>}
            </div>
            {[
              {k:"Total pop", v:sRow.total.toLocaleString(), col:"#fff"},
              {k:"65+ share", v:aging+"%", col:"#F5A623"},
              {k:"80+ pop", v:(sRow.over80||0).toLocaleString(), col:"#fff"},
            ].map(r=>(
              <div key={r.k} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:14,marginBottom:4}}>
                <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.88)"}}>{r.k}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.5,color:r.col}}>{r.v}</span>
              </div>
            ))}
          </div>
        );
      })()}

    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function PopulationDemographics() {

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("explorer");
  const { data: liveData, loading: liveLoading } = useDemographicsData();

  const [liveVer, setLiveVer] = useState(0);
  useEffect(() => {
    if (!liveData || !liveData.countries) return;
    liveData.countries.forEach(rec => {
      const match = Object.keys(COUNTRIES).find(k => k === rec.name);
      const data = Object.keys(rec.byYear).map(Number).sort((a,b)=>a-b).map(yr => {
        const d = rec.byYear[yr];
        return { y:yr, total:d.total||0, under18:d.under18||0,
          a18to49:d.age18_49||0, a50to64:d.age50_64||0,
          a65to79:d.age65_79||0, over80:d.age80plus||0 };
      });
      if (match) COUNTRIES[match].data = data;
    });
    setLiveVer(v => v + 1);
  }, [liveData]);

 // explorer | profiles
  const [region, setRegion]       = useState("Global");
  const [genderFilter, setGender] = useState("All");
  const [ageGroups, setAgeGroups] = useState(["under18","18to49","50to64","65to79","over80"]);
  const [selectedYear, setYear]   = useState(2025);
  const [selectedCountries, setSelectedCountries] = useState(["United Kingdom","Germany","Japan","United States"]);
  const [favCountries, setFavCountries] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const toggleState = name => setSelectedStates(prev => prev.includes(name) ? prev.filter(x=>x!==name) : [...prev,name]);
  const [sortCol, setSortCol]     = useState("total");
  const [sortDir, setSortDir]     = useState("desc");
  const [search, setSearch]       = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [chartType, setChartType] = useState("trend"); // trend | pyramid | donut
  const [focusCountry, setFocusCountry] = useState(null); // country to auto-open in profiles
  const [profileSort, setProfileSort] = useState("size"); // size | alpha
  const [mapMetric, setMapMetric] = useState("aging");
  const [selectorOpen, setSelectorOpen] = useState(false); // dropdown checkbox panel
  const [zoomData, setZoomData] = useState(null); // chart pop-out modal
  const openZoom = (d) => setZoomData(d);

  // Jump from any table/chart to a country's profile card.
  const goToProfile = (name) => {
    setFocusCountry(name);
    setSearch("");            // clear any profile search filter so the card is visible
    setActiveTab("profiles");
    // wait for the profiles tab to render, then scroll the card into view
    setTimeout(() => {
      const el = document.getElementById(`profile-${name}`);
      if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
    }, 120);
  };

  // ── COUNTRY LIST FOR REGION ────────────────────────────────────────────────
  const availableCountries = useMemo(() => {
    if (region === "Global") return Object.keys(COUNTRIES);
    return REGIONS[region]?.countries.filter(c => COUNTRIES[c]) || [];
  }, [region]);

  const filteredCountriesList = useMemo(() => {
    const q = countrySearch.toLowerCase();
    return availableCountries.filter(c => c.toLowerCase().includes(q));
  }, [availableCountries, countrySearch]);

  // Only selected countries that also belong to the current region drive
  // the tables and charts. Switching region narrows the view automatically.
  const activeCountries = useMemo(() =>
    selectedCountries.filter(c => availableCountries.includes(c)),
  [selectedCountries, availableCountries]);

  const toggleCountry = name => {
    setSelectedCountries(prev =>
      prev.includes(name) ? prev.filter(x=>x!==name) : [...prev, name]
    );
  };

  // Select / clear all countries currently visible in the dropdown filter
  const selectAllVisible = () =>
    setSelectedCountries(prev => [...new Set([...prev, ...filteredCountriesList])]);
  const clearAllVisible = () =>
    setSelectedCountries(prev => prev.filter(c => !filteredCountriesList.includes(c)));
  const allVisibleSelected = filteredCountriesList.length > 0 &&
    filteredCountriesList.every(c => selectedCountries.includes(c));

  const toggleFav = name => setFavCountries(prev => prev.includes(name) ? prev.filter(x=>x!==name) : [...prev,name]);

  // ── TABLE DATA ─────────────────────────────────────────────────────────────
  const tableRows = useMemo(() => {
    return activeCountries
      .map(name => {
        const cd = COUNTRIES[name];
        if (!cd) return null;
        const rowNow  = getDataForYear(cd.data, selectedYear);
        const row2005 = cd.data[0];
        const rowPrev = getDataForYear(cd.data, selectedYear === 2005 ? 2005 : Math.max(2005, selectedYear - 5));
        if (!rowNow) return null;
        const mod = getAgeGroups(genderFilter);
        const u18    = Math.round(rowNow.under18 * mod.u18);
        const w      = Math.round((rowNow.a18to49||0) * mod.w);
        const p      = Math.round((rowNow.a50to64||0) * mod.p);
        const s      = Math.round(rowNow.a65to79 * mod.s);
        const e      = Math.round(rowNow.over80  * mod.e);
        const over65 = s + e;
        let selected = 0;
        if (ageGroups.includes("under18")) selected += u18;
        if (ageGroups.includes("18to49"))  selected += w;
        if (ageGroups.includes("50to64"))  selected += p;
        if (ageGroups.includes("65to79"))  selected += s;
        if (ageGroups.includes("over80"))  selected += e;
        const prevTotal = rowPrev ? rowPrev.total : rowNow.total;
        const growth = growthRate(prevTotal, rowNow.total);
        const aging65growth = growthRate(row2005.a65to79 + row2005.over80, rowNow.a65to79 + rowNow.over80);
        // CAGR 2025→2035 (10yr): total and 65+ ageing population
        const r2025 = getDataForYear(cd.data, 2025);
        const r2035 = cd.data[cd.data.length-1];
        const totalCagr = cagr(r2025.total, r2035.total, 10);
        const aging65Cagr = cagr(r2025.a65to79 + r2025.over80, r2035.a65to79 + r2035.over80, 10);
        return {
          name, flag:cd.flag, color:cd.color, region:cd.region,
          total:rowNow.total, under18:u18, a18to49:w, a50to64:p, a65to79:s, over80:e, over65,
          selected, growth: parseFloat(growth), aging65growth: parseFloat(aging65growth),
          totalCagr, aging65Cagr,
          agingPct: ((rowNow.a65to79+rowNow.over80)/rowNow.total*100).toFixed(1),
        };
      }).filter(Boolean);
  }, [activeCountries, selectedYear, genderFilter, ageGroups]);

  const grandTotal = tableRows.reduce((s,r)=>s+r.selected, 0);

  // ── ANNUAL PROJECTION TABLE (2026–2030) ────────────────────────────────────
  // Underlying data is in 5-year steps, so we anchor on 2025 and 2030 and fill
  // the intermediate years by compounding at the implied annual rate (CAGR).
  const PROJ_YEARS = [2026,2027,2028,2029,2030];
  const selectedBandsValue = (row) => {
    if (!row) return 0;
    const mod = getAgeGroups(genderFilter);
    let v = 0;
    if (ageGroups.includes("under18")) v += row.under18 * mod.u18;
    if (ageGroups.includes("18to49"))  v += (row.a18to49||0) * mod.w;
    if (ageGroups.includes("50to64"))  v += (row.a50to64||0) * mod.p;
    if (ageGroups.includes("65to79"))  v += row.a65to79 * mod.s;
    if (ageGroups.includes("over80"))  v += row.over80  * mod.e;
    return v;
  };
  const projectionRows = useMemo(() => {
    return activeCountries.map(name => {
      const cd = COUNTRIES[name];
      if (!cd) return null;
      const v2025 = selectedBandsValue(getDataForYear(cd.data, 2025));
      const v2030 = selectedBandsValue(getDataForYear(cd.data, 2030));
      if (v2025 <= 0) return null;
      // annual compound rate implied over the 5-year window
      const r = Math.pow(v2030 / v2025, 1/5) - 1;
      const years = {};
      const v2025r = Math.round(v2025);
      PROJ_YEARS.forEach(y => { years[y] = Math.round(v2025 * Math.pow(1 + r, y - 2025)); });
      // year-on-year annual growth %; 2026 measured against 2025
      const annual = {};
      PROJ_YEARS.forEach(y => {
        const prev = y === 2026 ? v2025r : years[y-1];
        annual[y] = prev > 0 ? ((years[y] - prev) / prev * 100) : 0;
      });
      const growthPct = ((years[2030] - years[2026]) / years[2026] * 100);
      // CAGR across the displayed window 2026→2030 (4 intervals)
      const cagr = (Math.pow(years[2030] / years[2026], 1/4) - 1) * 100;
      return {
        name, flag:cd.flag, color:cd.color, region:cd.region,
        years, annual, growthPct, cagr,
        y2030: years[2030], // sort handle
      };
    }).filter(Boolean);
  }, [activeCountries, genderFilter, ageGroups]);

  const [projSortDesc, setProjSortDesc] = useState(true);
  const sortedProjection = useMemo(() =>
    [...projectionRows].sort((a,b)=> projSortDesc ? b.y2030 - a.y2030 : a.y2030 - b.y2030),
  [projectionRows, projSortDesc]);

  const sortedRows = useMemo(() => {
    return [...tableRows].sort((a,b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });
  }, [tableRows, sortCol, sortDir]);

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  // ── REGIONAL SUMMARY ───────────────────────────────────────────────────────
  const regionData = useMemo(() => {
    const rd = REGIONS[region];
    if (!rd) return null;
    return rd.data.map(d => ({
      year: d.y,
      total: d.total,
      under18: d.under18,
      a18to49: d.a18to49||0,
      a50to64: d.a50to64||0,
      a65to79: d.a65to79,
      over65: d.a65to79 + d.over80,
      over80: d.over80,
    }));
  }, [region]);

  const regionNow = regionData?.find(d=>d.year===selectedYear) || regionData?.[regionData.length-1];
  const region2005 = regionData?.[0];

  // ── GLOBAL TREND SERIES ────────────────────────────────────────────────────
  const trendSeries = useMemo(() => {
    if (activeCountries.length === 0) return [];
    const BL = { under18:"<18", "18to49":"18–49", "50to64":"50–64", "65to79":"65–79", over80:"80+" };
    const aLabel = ["under18","18to49","50to64","65to79","over80"].filter(b=>ageGroups.includes(b)).map(b=>BL[b]).join(" + ");
    return activeCountries.slice(0,6).map(name => {
      const cd = COUNTRIES[name];
      if (!cd) return null;
      return {
        label: name,
        ageLabel: aLabel,
        color: cd.color,
        values: YEARS.map(y => {
          const row = getDataForYear(cd.data, y);
          const mod = getAgeGroups(genderFilter);
          if (!row) return 0;
          let v = 0;
          if (ageGroups.includes("under18")) v += row.under18 * mod.u18;
          if (ageGroups.includes("18to49"))  v += (row.a18to49||0) * mod.w;
          if (ageGroups.includes("50to64"))  v += (row.a50to64||0) * mod.p;
          if (ageGroups.includes("65to79"))  v += row.a65to79 * mod.s;
          if (ageGroups.includes("over80"))  v += row.over80  * mod.e;
          return Math.round(v);
        }),
      };
    }).filter(Boolean);
  }, [activeCountries, ageGroups, genderFilter]);

  // ── DONUT SEGMENTS FOR REGION ──────────────────────────────────────────────
  const regionDonut = useMemo(() => {
    if (!regionNow) return [];
    const r2025 = regionData?.find(d=>d.year===2025);
    const r2030 = regionData?.find(d=>d.year===2030);
    const raw = [
      { label:"<18",   key:"under18", range:"0–17 yrs",  value:regionNow.under18, color:C.green },
      { label:"18-49", key:"a18to49", range:"18–49 yrs", value:regionNow.a18to49||0, color:C.teal   },
      { label:"50-64", key:"a50to64", range:"50–64 yrs", value:regionNow.a50to64||0, color:C.purple },
      { label:"65-79", key:"a65to79", range:"65–79 yrs", value:regionNow.a65to79, color:C.amber },
      { label:"80+",   key:"over80",  range:"80+ yrs",   value:regionNow.over80,  color:C.red   },
    ].filter(s => s.value > 0);
    const tot = raw.reduce((a,b)=>a+b.value,0);
    return raw.map(s => ({
      ...s,
      mixPct: tot>0 ? (s.value/tot*100) : 0,
      cagr2530: (r2025 && r2030) ? cagr(r2025[s.key], r2030[s.key], 5) : 0,
      pop2030: r2030 ? r2030[s.key] : null,
    }));
  }, [regionNow, regionData]);

  const agingPct = regionNow && regionNow.total > 0
    ? ((regionNow.over65 / regionNow.total) * 100).toFixed(1)
    : "0";

  // ── AGE GROUP TOGGLES ──────────────────────────────────────────────────────
  // ageGroups holds real bands: under18, 18to64, 65to79, over80.
  // A chip is "active" when ALL its bands are selected. Toggling adds/removes its bands.
  const chipActive = chip => chip.bands.every(b => ageGroups.includes(b));
  const toggleAge = chip => {
    const allOn = chipActive(chip);
    setAgeGroups(prev => {
      let next;
      if (allOn) next = prev.filter(b => !chip.bands.includes(b));
      else next = [...new Set([...prev, ...chip.bands])];
      return next.length === 0 ? prev : next; // never allow empty selection
    });
  };

  const AGE_CHIPS = [
    { id:"under18", label:"Under 18",  color:C.green,  bands:["under18"] },
    { id:"18to49",  label:"18 – 49",   color:C.teal,   bands:["18to49"] },
    { id:"50to64",  label:"50 – 64",   color:C.purple, bands:["50to64"] },
    { id:"over65",  label:"65+ (all)", color:C.amber,  bands:["65to79","over80"] },
    { id:"65to79",  label:"65 – 79",   color:C.gold2,  bands:["65to79"] },
    { id:"over80",  label:"80+",       color:C.red,    bands:["over80"] },
  ];

  const GENDER_CHIPS = ["All","Male","Female"];

  // Dynamic table age columns — reflect the currently selected age bands.
  // If both 65-79 and 80+ are on, also surface a combined 65+ column.
  const AGE_COL_DEFS = [
    { key:"under18", label:"<18",    color:C.green, band:"under18" },
    { key:"a18to49", label:"18–49",  color:C.teal,   band:"18to49"  },
    { key:"a50to64", label:"50–64",  color:C.purple, band:"50to64"  },
    { key:"over65",  label:"65+",    color:C.amber, band:"__both65" },
    { key:"a65to79", label:"65–79",  color:C.gold2, band:"65to79"  },
    { key:"over80",  label:"80+",    color:C.red,   band:"over80"   },
  ];
  const ageColumns = AGE_COL_DEFS.filter(c => {
    if (c.band === "__both65") return ageGroups.includes("65to79") && ageGroups.includes("over80");
    return ageGroups.includes(c.band);
  });
  const BAND_LABELS = { under18:"<18", "18to49":"18–49", "50to64":"50–64", "65to79":"65–79", over80:"80+" };
  const ageLabel = ["under18","18to49","50to64","65to79","over80"]
    .filter(b => ageGroups.includes(b)).map(b => BAND_LABELS[b]).join(" + ");

  const SortArrow = ({col}) => sortCol===col
    ? <span style={{color:C.teal,fontSize:12,marginLeft:2}}>{sortDir==="desc"?"▼":"▲"}</span>
    : <span style={{color:C.border,fontSize:12,marginLeft:2}}>▼</span>;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh", background:C.bg, fontFamily:"system-ui,sans-serif", paddingBottom:32}}>

      {/* ── HEADER ── */}
      <div style={{background:C.navy, borderBottom:`3px solid ${C.teal}`, padding:"0 16px", position:"sticky", top:0, zIndex:200}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:10, paddingBottom:10, maxWidth:700, margin:"0 auto"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <LighthouseLogo size={44}/>
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:3, color:"#fff", lineHeight:1}}>LIGHTHOUSE</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:4, color:C.teal, lineHeight:1.2, marginTop:1}}>POPULATION ANALYTICS</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:2, color:"rgba(255,255,255,0.85)"}}>GLOBAL DEMOGRAPHICS</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2, color:C.teal, marginTop:1}}>2005 – 2035</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:0,maxWidth:700,margin:"0 auto",borderTop:`1px solid rgba(255,255,255,0.1)`}}>
          {[
            {id:"map",      icon:"🗺️", label:"MAP"},
            {id:"explorer", icon:"🌍", label:"EXPLORER"},
            {id:"profiles", icon:"📋", label:"PROFILES"},
          ].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              flex:1, border:"none", background:"none", cursor:"pointer",
              padding:"10px 0 8px", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              borderBottom: activeTab===t.id ? `3px solid ${C.teal}` : "3px solid transparent",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:1.5,
              color: activeTab===t.id ? C.teal : "rgba(255,255,255,0.5)",
              transition:"color 0.15s",
            }}>
              <span style={{fontSize:13}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 12px"}}>

        {/* ── FILTERS PANEL ── */}
        <div style={{marginTop:14, background:"#fff", borderRadius:14, border:`1px solid ${C.border}`, padding:"14px 16px", boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>

          {/* Row 1: Region */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.navy,marginBottom:6}}>REGION</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.keys(REGIONS).map(r=>{
                const active = region===r;
                return (
                  <button key={r} onClick={()=>{setRegion(r);}} style={{
                    border: active?`1.5px solid ${REGIONS[r].color}`:`1px solid ${C.border}`,
                    borderRadius:20, padding:"4px 12px",
                    background: active?REGIONS[r].color:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,
                    color:active?"#fff":C.sub,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",
                  }}>
                    <span style={{fontSize:14}}>{REGIONS[r].flag}</span>{r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Gender */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.navy,marginBottom:6}}>GENDER</div>
            <div style={{display:"flex",gap:6}}>
              {GENDER_CHIPS.map(g=>{
                const active=genderFilter===g;
                const gc = g==="Male"?"#3C7AC6":g==="Female"?C.pink:C.navy;
                return (
                  <button key={g} onClick={()=>setGender(g)} style={{
                    border:active?`1.5px solid ${gc}`:`1px solid ${C.border}`,
                    borderRadius:20,padding:"4px 14px",
                    background:active?gc:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,
                    color:active?"#fff":C.sub,cursor:"pointer",
                  }}>{g}</button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Age Groups */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.navy,marginBottom:6}}>AGE GROUPS</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {AGE_CHIPS.map(a=>{
                const active=chipActive(a);
                return (
                  <button key={a.id} onClick={()=>toggleAge(a)} style={{
                    border:active?`1.5px solid ${a.color}`:`1px solid ${C.border}`,
                    borderRadius:20,padding:"4px 14px",
                    background:active?a.color:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,
                    color:active?"#fff":C.sub,cursor:"pointer",
                    boxShadow:active?`0 2px 6px ${a.color}44`:"none",
                  }}>{a.label}</button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Year Slider */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub}}>YEAR</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,color:selectedYear>2025?C.amber:C.navy}}>
                {selectedYear} {selectedYear>2025?"▶ PROJECTED":""}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {YEARS.map(y=>{
                const active=selectedYear===y;
                const future=y>2025;
                return (
                  <button key={y} onClick={()=>setYear(y)} style={{
                    flex:1,minWidth:34,border:active?`1.5px solid ${future?C.amber:C.teal}`:`1px solid ${C.border}`,
                    borderRadius:8,padding:"5px 2px",
                    background:active?(future?C.amber:C.teal):"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.5,
                    color:active?"#fff":future?C.amber:C.sub,cursor:"pointer",
                    textAlign:"center",
                  }}>{y}</button>
                );
              })}
            </div>
          </div>
        </div>


        {/* ── SWIPEABLE REGION CARDS ── */}
        <div style={{display:'flex',gap:12,overflowX:'auto',scrollSnapType:'x mandatory',WebkitOverflowScrolling:'touch',paddingBottom:8,msOverflowStyle:'none',scrollbarWidth:'none'}}>
          {Object.entries(REGIONS).map(([r,rd])=>{
            const rData = YEARS.map(y=>{
              const countryList = rd.countries||[];
              return countryList.reduce((acc,name)=>{
                const cd=COUNTRIES[name]; if(!cd) return acc; const row=getDataForYear(cd.data,y); if(!row) return acc;
                return {year:y,total:acc.total+(row.total||0),under18:acc.under18+(row.under18||0),a18to49:acc.a18to49+(row.a18to49||0),a50to64:acc.a50to64+(row.a50to64||0),a65to79:acc.a65to79+(row.a65to79||0),over80:acc.over80+(row.over80||0)};
              },{year:y,total:0,under18:0,a18to49:0,a50to64:0,a65to79:0,over80:0});
            }).filter(d=>d.total>0);
            return <RegionCard key={r} region={r} regionData={rData} selectedYear={selectedYear} onZoom={openZoom}/>;
          })}
        </div>
        {/* ── REGION SUMMARY BANNER ── */}
        {regionNow && (
          <div style={{
            marginTop:12, borderRadius:14, overflow:"hidden",
            background:`linear-gradient(135deg, ${C.navy} 0%, #1A3A5C 100%)`,
            border:`1px solid ${REGIONS[region]?.color||C.teal}44`,
            boxShadow:"0 3px 16px rgba(11,31,58,0.15)",
          }}>
            <div style={{padding:"12px 16px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:20}}>{REGIONS[region]?.flag||"🌍"}</span>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:"#fff",lineHeight:1}}>{region}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.teal,marginTop:1}}>POPULATION OVERVIEW · {selectedYear}</div>
                </div>
                {selectedYear > 2025 && (
                  <div style={{marginLeft:"auto",background:C.amber,borderRadius:8,padding:"3px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,color:"#fff"}}>PROJECTED</div>
                )}
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
                {[
                  {label:"TOTAL",   value:fmt(regionNow.total), color:REGIONS[region]?.color||C.teal},
                  {label:"< 18",    value:fmt(regionNow.under18), color:C.green},
                  {label:"18–49",   value:fmt(regionNow.a18to49||0), color:C.teal},
                  {label:"50–64",   value:fmt(regionNow.a50to64||0), color:C.purple},
                  {label:"65–79",   value:fmt(regionNow.over65 - regionNow.over80), color:C.amber},
                  {label:"80+",     value:fmt(regionNow.over80), color:C.red},
                ].map(({label,value,color})=>(
                  <div key={label} style={{background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"8px 4px",textAlign:"center",borderTop:`2px solid ${color}`}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:"rgba(255,255,255,0.82)",marginBottom:2}}>{label}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color,letterSpacing:0.5,lineHeight:1}}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Donut + aging callout */}
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:12,alignItems:"center"}}>
                <div style={{position:"relative"}}>
                  <button
                    onClick={()=>openZoom({title:`${region} · Age Distribution ${selectedYear}`, node:(
                      <div>
                        <Donut interactive year={selectedYear} segments={regionDonut} size={240} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
                        <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:12}}>
                          {[{l:"<18",c:C.green},{l:"18-49",c:C.teal},{l:"50-64",c:C.purple},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:11,height:11,borderRadius:3,background:c}}/>
                              <span style={{fontFamily:"system-ui",fontSize:15,color:C.sub}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )})}
                    title="Enlarge chart"
                    style={{position:"absolute",top:-2,right:-2,zIndex:2,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.12)",borderRadius:7,width:20,height:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",lineHeight:1,padding:0}}
                  >⤢</button>
                  <div onClick={()=>openZoom({title:`${region} · Age Distribution ${selectedYear}`, node:(
                      <div>
                        <Donut interactive year={selectedYear} segments={regionDonut} size={240} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
                        <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:12}}>
                          {[{l:"<18",c:C.green},{l:"18-64",c:C.teal},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:11,height:11,borderRadius:3,background:c}}/>
                              <span style={{fontFamily:"system-ui",fontSize:15,color:C.sub}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )})} style={{cursor:"zoom-in"}}>
                    <Donut segments={regionDonut} size={140} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:"rgba(255,255,255,0.75)",marginBottom:8}}>KEY INDICATORS</div>
                  {[
                    {label:"65+ Population", value:fmt(regionNow.over65), color:C.amber},
                    {label:"80+ Population", value:fmt(regionNow.over80), color:C.red},
                    {label:"Ageing Index",   value:agingPct+"%", color:parseFloat(agingPct)>20?C.red:C.amber},
                    {label:"Working Age",    value:((((regionNow.a18to49||0)+(regionNow.a50to64||0))/regionNow.total)*100).toFixed(1)+"%", color:C.teal},
                  ].map(({label,value,color})=>(
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,0.88)"}}>{label}</span>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color,letterSpacing:0.5}}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regional trend bar */}
            <div style={{background:"rgba(0,0,0,0.2)",padding:"10px 16px 4px",borderTop:`1px solid rgba(255,255,255,0.08)`,position:"relative"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:"rgba(255,255,255,0.75)",marginBottom:4}}>65+ TREND</div>
              <button
                onClick={()=>openZoom({title:`${region} · 65+ Population Trend`, node:(
                  <PopBarChart data={REGIONS[region]?.data.map(d=>({year:d.y,value:d.a65to79+d.over80,color:C.amber}))||[]} highlightYear={selectedYear}/>
                )})}
                title="Enlarge chart"
                style={{position:"absolute",top:8,right:10,zIndex:2,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.12)",borderRadius:7,width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",lineHeight:1,padding:0}}
              >⤢</button>
              <div onClick={()=>openZoom({title:`${region} · 65+ Population Trend`, node:(
                  <PopBarChart data={REGIONS[region]?.data.map(d=>({year:d.y,value:d.a65to79+d.over80,color:C.amber}))||[]} highlightYear={selectedYear}/>
                )})} style={{cursor:"zoom-in"}}>
                <PopBarChart
                  data={REGIONS[region]?.data.map(d=>({year:d.y,value:d.a65to79+d.over80,color:C.amber}))||[]}
                  highlightYear={selectedYear}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "map" && (
          <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"12px 12px",boxShadow:"0 1px 6px rgba(11,31,58,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>DEMOGRAPHIC MAP</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,marginTop:1}}>{region.toUpperCase()} · {selectedYear} · CHANGE REGION ABOVE TO ZOOM</div>
              </div>
            </div>
            <DemographicMap
              year={selectedYear}
              metric={mapMetric}
              onMetricChange={setMapMetric}
              region={region}
              selectedCountries={selectedCountries}
              onPick={goToProfile}
            />
            <div style={{fontFamily:"system-ui",fontSize:13,color:C.sub,marginTop:10,lineHeight:1.5}}>
              Hover or tap a country to see its detail card. From the card you can open the full profile. Use the <b>Region</b> filter above to zoom the map. Countries with data are shaded by the selected metric.
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "explorer" && (
          <>
            {/* ── COUNTRY SELECTOR (dropdown checkboxes) ── */}
            <div style={{marginTop:12,position:"relative",zIndex:50}}>
              {/* Trigger */}
              <div onClick={()=>setSelectorOpen(o=>!o)} style={{
                background:"#fff",borderRadius:14,border:`1px solid ${selectorOpen?C.teal:C.border}`,
                padding:"12px 14px",cursor:"pointer",boxShadow:"0 2px 10px rgba(11,31,58,0.06)",
                display:"flex",alignItems:"center",gap:10,
              }}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>SELECT COUNTRIES</div>
                  {activeCountries.length>0 ? (
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                      {activeCountries.slice(0,6).map(n=>{
                        const cd=COUNTRIES[n];
                        return (
                          <span key={n} style={{display:"inline-flex",alignItems:"center",gap:3,background:`${cd.color}18`,border:`1px solid ${cd.color}55`,borderRadius:14,padding:"2px 7px",fontFamily:"system-ui",fontSize:13,color:C.navy}}>
                            <span style={{fontSize:14}}>{cd.flag}</span>{n}
                            <span onClick={e=>{e.stopPropagation();toggleCountry(n);}} style={{marginLeft:1,color:cd.color,fontWeight:700,cursor:"pointer"}}>×</span>
                          </span>
                        );
                      })}
                      {activeCountries.length>6 && (
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:0.5,color:C.sub,alignSelf:"center"}}>+{activeCountries.length-6} more</span>
                      )}
                    </div>
                  ) : (
                    <div style={{fontFamily:"system-ui",fontSize:14,color:C.sub,marginTop:4}}>Tap to choose countries…</div>
                  )}
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:C.teal,lineHeight:1}}>{activeCountries.length}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1,color:C.sub}}>SHOWN</div>
                </div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:C.sub}}>{selectorOpen?"▲":"▼"}</div>
              </div>

              {selectorOpen && (
                <>
                  {/* click-away overlay */}
                  <div onClick={()=>setSelectorOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
                  {/* Dropdown panel */}
                  <div style={{
                    position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:60,
                    background:"#fff",borderRadius:14,border:`1px solid ${C.teal}`,
                    boxShadow:"0 8px 28px rgba(11,31,58,0.18)",padding:"12px",
                  }}>
                    {/* Search */}
                    <div style={{background:"#F4F8FC",borderRadius:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 12px",marginBottom:8}}>
                      <span style={{color:C.sub,marginRight:8,fontSize:13}}>🔍</span>
                      <input autoFocus value={countrySearch} onChange={e=>setCountrySearch(e.target.value)} placeholder={`Search ${region==="Global"?"all countries":region}…`}
                        style={{flex:1,border:"none",outline:"none",fontFamily:"system-ui",fontSize:13,color:C.text,background:"transparent",padding:"9px 0"}}/>
                      {countrySearch && <span onClick={()=>setCountrySearch("")} style={{cursor:"pointer",color:C.sub,fontSize:14}}>×</span>}
                    </div>
                    {/* Bulk actions */}
                    <div style={{display:"flex",gap:6,marginBottom:8}}>
                      <button onClick={selectAllVisible} style={{flex:1,border:`1px solid ${C.teal}`,background:allVisibleSelected?C.teal:"#fff",color:allVisibleSelected?"#fff":C.teal,borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>
                        ✓ SELECT ALL{countrySearch?` (${filteredCountriesList.length})`:""}
                      </button>
                      <button onClick={clearAllVisible} style={{flex:1,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,cursor:"pointer"}}>
                        ✕ CLEAR
                      </button>
                    </div>
                    {/* Checkbox list */}
                    <div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
                      {filteredCountriesList.length===0 && (
                        <div style={{fontFamily:"system-ui",fontSize:15,color:C.sub,textAlign:"center",padding:"16px"}}>No countries match “{countrySearch}”.</div>
                      )}
                      {filteredCountriesList.map(name=>{
                        const cd=COUNTRIES[name]; if(!cd) return null;
                        const checked = selectedCountries.includes(name);
                        return (
                          <label key={name} onClick={()=>toggleCountry(name)} style={{
                            display:"flex",alignItems:"center",gap:9,padding:"7px 8px",borderRadius:8,cursor:"pointer",
                            background:checked?`${cd.color}12`:"transparent",
                          }}>
                            <span style={{
                              width:18,height:18,borderRadius:5,flexShrink:0,
                              border:checked?`1.5px solid ${cd.color}`:`1.5px solid ${C.border}`,
                              background:checked?cd.color:"#fff",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              color:"#fff",fontSize:15,fontWeight:700,
                            }}>{checked?"✓":""}</span>
                            <span style={{fontSize:15}}>{cd.flag}</span>
                            <span style={{flex:1,fontFamily:"system-ui",fontSize:13,color:C.navy}}>{name}</span>
                            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:0.5,color:C.sub}}>{cd.region}</span>
                          </label>
                        );
                      })}
                    </div>
                    {/* Done */}
                    <button onClick={()=>setSelectorOpen(false)} style={{width:"100%",marginTop:8,border:"none",background:C.navy,color:"#fff",borderRadius:10,padding:"9px",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:2,cursor:"pointer"}}>
                      DONE · {activeCountries.length} SELECTED
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── EMPTY STATE ── */}
            {activeCountries.length === 0 && (
              <div style={{marginTop:12,textAlign:"center",padding:"34px 20px",background:"#fff",borderRadius:14,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:26,marginBottom:8}}>{REGIONS[region]?.flag||"🌍"}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:C.sub,letterSpacing:2}}>NO COUNTRIES SELECTED IN {region.toUpperCase()}</div>
                <div style={{fontFamily:"system-ui",fontSize:15,color:C.sub,marginTop:6}}>
                  {selectedCountries.length>0
                    ? "Your selections sit outside this region — pick countries below or switch region."
                    : "Tap countries below to add them to the table and charts."}
                </div>
              </div>
            )}

            {/* ── TREND CHART ── */}
            {trendSeries.length > 0 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"12px 12px",boxShadow:"0 1px 6px rgba(11,31,58,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>POPULATION TREND</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,marginTop:1}}>
                      {ageLabel} · {genderFilter.toUpperCase()}
                    </div>
                  </div>
                </div>
                <Zoomable
                  title="Population Trend 2005–2035"
                  onZoom={openZoom}
                  renderLarge={()=><TrendLine series={trendSeries} years={YEARS} height={240} width={560} showLegend={true}/>}
                >
                  <TrendLine series={trendSeries} years={YEARS} height={130} showLegend={true}/>
                </Zoomable>
              </div>
            )}

            {/* ── SUMMARY TABLE ── */}
            {sortedRows.length > 0 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>
                <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>COMPARISON TABLE</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,marginTop:1}}>{selectedYear} · {region.toUpperCase()} · {genderFilter.toUpperCase()} · AGES {ageLabel}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:1,color:C.teal}}>TOTAL: {fmt(grandTotal)}</div>
                </div>

                <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,padding:"0 16px 6px"}}>← swipe to see all columns →</div>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                  <table style={{borderCollapse:"collapse",fontSize:14,minWidth:"100%",whiteSpace:"nowrap"}}>
                    <thead>
                      <tr style={{background:"#F4F8FC"}}>
                        {[
                          {key:"name",  label:"COUNTRY",   w:120, align:"left"},
                          {key:"total", label:"TOTAL POP", w:80,  align:"right"},
                          ...ageColumns.map(c=>({key:c.key,label:c.label,w:64,align:"right",color:c.color})),
                          {key:"selected", label:"SELECTED", w:80, align:"right"},
                          {key:"agingPct",label:"65+ SHARE", w:72, align:"right"},
                          {key:"totalCagr", label:"TOTAL CAGR", w:88, align:"right"},
                          {key:"aging65Cagr", label:"65+ CAGR", w:88, align:"right"},
                          {key:"growth",  label:"POP GROWTH", w:80, align:"right"},
                          {key:"aging65growth",label:"65+ GROWTH", w:82, align:"right"},
                        ].map(col=>(
                          <th key={col.key}
                            onClick={()=>col.key!=="name"&&handleSort(col.key)}
                            style={{
                              padding:"8px 10px",textAlign:col.align,
                              fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1.5,
                              color:sortCol===col.key?C.teal:(col.color||C.sub),
                              cursor:col.key!=="name"?"pointer":"default",
                              whiteSpace:"nowrap",minWidth:col.w,
                              borderBottom:`2px solid ${sortCol===col.key?C.teal:C.border}`,
                              ...(col.key==="name"?{position:"sticky",left:0,background:"#F4F8FC",zIndex:3}:{}),
                            }}>
                            {col.label}<SortArrow col={col.key}/>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row,i)=>{
                        const totalInTable = tableRows.reduce((s,r)=>s+r.total,0);
                        const pctOfTotal = totalInTable>0?(row.total/totalInTable*100).toFixed(1):"-";
                        return (
                          <tr key={row.name} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#FAFCFF"}}>
                            <td onClick={()=>goToProfile(row.name)} title={`View ${row.name} profile`} style={{padding:"8px 10px",borderLeft:`3px solid ${row.color}`,cursor:"pointer",position:"sticky",left:0,background:i%2===0?"#fff":"#FAFCFF",zIndex:2}}>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{fontSize:13}}>{row.flag}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.navy,letterSpacing:0.5,lineHeight:1}}>{row.name}</div>
                                  <div style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>{row.region}</div>
                                </div>
                                <span style={{fontSize:13,color:C.teal,flexShrink:0}}>›</span>
                              </div>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.navy}}>{fmt(row.total)}</div>
                              <div style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>{pctOfTotal}%</div>
                            </td>
                            {ageColumns.map(c=>(
                              <td key={c.key} style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:C.navy}}>{fmt(row[c.key])}</td>
                            ))}
                            <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.navy,background:"#F4F8FC"}}>{fmt(row.selected)}</td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <div style={{
                                display:"inline-block",padding:"2px 8px",borderRadius:10,
                                background:parseFloat(row.agingPct)>20?`${C.red}22`:parseFloat(row.agingPct)>14?`${C.amber}22`:`${C.green}22`,
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
                                color:parseFloat(row.agingPct)>20?C.red:parseFloat(row.agingPct)>14?C.amber:C.green,
                              }}>{row.agingPct}%</div>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <CagrBadge value={row.totalCagr} size="sm"/>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <CagrBadge value={row.aging65Cagr} size="sm"/>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <span style={{
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                                color:row.growth>0?C.green:C.red,
                              }}>{row.growth>0?"+":""}{row.growth}%</span>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <span style={{
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:14,
                                color:row.aging65growth>50?C.red:row.aging65growth>20?C.amber:C.green,
                              }}>{row.aging65growth>0?"+":""}{row.aging65growth}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{background:"#F4F8FC",borderTop:`2px solid ${C.border}`}}>
                        <td style={{padding:"8px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,color:C.sub,position:"sticky",left:0,background:"#F4F8FC",zIndex:2}}>TOTAL ({sortedRows.length} COUNTRIES)</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.navy}}>{fmt(tableRows.reduce((s,r)=>s+r.total,0))}</td>
                        {ageColumns.map(c=>(
                          <td key={c.key} style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:13,color:C.navy}}>{fmt(tableRows.reduce((s,r)=>s+r[c.key],0))}</td>
                        ))}
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.teal,background:"#E8F7F5"}}>{fmt(grandTotal)}</td>
                        <td colSpan={5}/>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Colour key */}
                <div style={{padding:"8px 16px 12px",display:"flex",gap:12,flexWrap:"wrap"}}>
                  {[
                    {label:"65+ share > 20% — High Ageing",color:C.red},
                    {label:"14–20% — Moderate",color:C.amber},
                    {label:"< 14% — Young",color:C.green},
                  ].map(({label,color})=>(
                    <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                      <div style={{width:8,height:8,borderRadius:2,background:color}}/>
                      <span style={{fontFamily:"system-ui",fontSize:12,color:C.sub}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AGEING COMPARISON BAR CHART ── */}
            {sortedRows.length > 1 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"12px 12px",boxShadow:"0 1px 6px rgba(11,31,58,0.06)"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy,marginBottom:4}}>65+ AGEING INDEX COMPARISON</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,marginBottom:12}}>% OF TOTAL POPULATION AGED 65+</div>
                {[...sortedRows].sort((a,b)=>parseFloat(b.agingPct)-parseFloat(a.agingPct)).map(row=>{
                  const pct = parseFloat(row.agingPct);
                  const barColor = pct>20?C.red:pct>14?C.amber:C.green;
                  return (
                    <div key={row.name} style={{marginBottom:7}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                        <div style={{fontFamily:"system-ui",fontSize:13,color:C.text,display:"flex",alignItems:"center",gap:5}}>
                          <span>{row.flag}</span>{row.name}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <CagrBadge value={row.aging65Cagr} label="65+ CAGR" size="sm"/>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:barColor,letterSpacing:0.5}}>{row.agingPct}%</div>
                        </div>
                      </div>
                      <div style={{height:10,background:"#F0F4F8",borderRadius:5,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(pct/30*100,100)}%`,background:barColor,borderRadius:5,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ANNUAL PROJECTION TABLE 2026–2030 ── */}
            {sortedProjection.length > 0 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>
                <div style={{padding:"12px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>PROJECTED POPULATION 2026–2030</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub,marginTop:1}}>AGES {ageLabel} · {genderFilter.toUpperCase()} · CAGR-INTERPOLATED</div>
                  </div>
                  <div style={{background:C.amber,borderRadius:8,padding:"3px 9px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,color:"#fff"}}>PROJECTED</div>
                </div>

                <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,padding:"0 16px 6px"}}>← swipe to see all years →</div>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                  <table style={{width:"100%",tableLayout:"fixed",borderCollapse:"collapse",fontSize:14,minWidth:600}}>
                    <colgroup>
                      <col style={{width:"22%"}}/>
                      {PROJ_YEARS.map(y=><col key={y} style={{width:`${62/PROJ_YEARS.length}%`}}/>)}
                      <col style={{width:"16%"}}/>
                    </colgroup>
                    <thead>
                      <tr style={{background:"#FFF8EC"}}>
                        <th style={{padding:"8px 6px 8px 10px",textAlign:"left",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1.5,color:C.sub,borderBottom:`2px solid ${C.amber}`}}>COUNTRY</th>
                        {PROJ_YEARS.map(y=>(
                          <th key={y}
                            onClick={()=>y===2030&&setProjSortDesc(d=>!d)}
                            style={{padding:"8px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:0.5,color:y===2030?C.amber:C.sub,borderBottom:`2px solid ${C.amber}`,cursor:y===2030?"pointer":"default",whiteSpace:"nowrap"}}>
                            {y}{y===2030?(projSortDesc?" ▼":" ▲"):""}
                          </th>
                        ))}
                        <th style={{padding:"8px 10px 8px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:1,color:C.sub,borderBottom:`2px solid ${C.amber}`,whiteSpace:"nowrap"}}>CAGR %</th>
                      </tr>
                      <tr style={{background:"#FFFCF5"}}>
                        <th style={{padding:"2px 10px 4px",textAlign:"left",fontFamily:"system-ui",fontSize:11,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>pop / annual %</th>
                        {PROJ_YEARS.map(y=>(
                          <th key={y} style={{padding:"2px 6px 4px",textAlign:"center",fontFamily:"system-ui",fontSize:11,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>pop ▸ Δ%</th>
                        ))}
                        <th style={{padding:"2px 6px 4px",textAlign:"center",fontFamily:"system-ui",fontSize:11,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>26→30</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProjection.map((row,i)=>(
                        <tr key={row.name}
                          onClick={()=>goToProfile(row.name)}
                          style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"#fff":"#FFFCF5",cursor:"pointer",transition:"background 0.1s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#FFF1D6"}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#FFFCF5"}
                          title={`View ${row.name} profile`}>
                          <td style={{padding:"8px 6px 8px 10px",borderLeft:`3px solid ${row.color}`,overflow:"hidden"}}>
                            <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
                              <span style={{fontSize:13,flexShrink:0}}>{row.flag}</span>
                              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:C.navy,letterSpacing:0.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</span>
                              <span style={{fontSize:12,color:C.sub,flexShrink:0,marginLeft:"auto"}}>›</span>
                            </div>
                          </td>
                          {PROJ_YEARS.map(y=>{
                            const a = row.annual[y];
                            return (
                              <td key={y} style={{padding:"6px 6px",textAlign:"center"}}>
                                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:y===2030?C.amber:C.navy,lineHeight:1.1}}>{fmt(row.years[y])}</div>
                                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:a>0?C.green:a<0?C.red:C.sub,lineHeight:1.1,marginTop:1}}>{a>0?"+":""}{a.toFixed(2)}%</div>
                              </td>
                            );
                          })}
                          <td style={{padding:"6px 8px 6px 6px",textAlign:"center"}}>
                            <span style={{
                              display:"inline-block",padding:"2px 7px",borderRadius:10,
                              background:row.cagr>1?`${C.green}22`:row.cagr<0?`${C.red}22`:`${C.amber}22`,
                              fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
                              color:row.cagr>1?C.green2:row.cagr<0?C.red:C.gold2,
                            }}>{row.cagr>0?"+":""}{row.cagr.toFixed(2)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {(()=>{
                        const tot = {};
                        PROJ_YEARS.forEach(y=>{ tot[y]=sortedProjection.reduce((s,r)=>s+r.years[y],0); });
                        const t25 = sortedProjection.reduce((s,r)=>{
                          const cd=COUNTRIES[r.name];
                          return s + selectedBandsValue(getDataForYear(cd.data,2025));
                        },0);
                        const annual = {};
                        PROJ_YEARS.forEach(y=>{ const prev=y===2026?t25:tot[y-1]; annual[y]=prev>0?((tot[y]-prev)/prev*100):0; });
                        const c=tot[2026]>0?((Math.pow(tot[2030]/tot[2026],1/4)-1)*100):0;
                        return (
                          <tr style={{background:"#FFF8EC",borderTop:`2px solid ${C.amber}`}}>
                            <td style={{padding:"8px 6px 8px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:0.5,color:C.sub}}>TOTAL ({sortedProjection.length})</td>
                            {PROJ_YEARS.map(y=>{
                              const a=annual[y];
                              return (
                                <td key={y} style={{padding:"6px 6px",textAlign:"center"}}>
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:y===2030?C.amber:C.navy,lineHeight:1.1}}>{fmt(Math.round(tot[y]))}</div>
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:a>0?C.green2:a<0?C.red:C.sub,lineHeight:1.1,marginTop:1}}>{a>0?"+":""}{a.toFixed(2)}%</div>
                                </td>
                              );
                            })}
                            <td style={{padding:"6px 8px 6px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:c>0?C.green2:C.red}}>{c>0?"+":""}{c.toFixed(2)}%</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
                <div style={{padding:"8px 16px 12px",fontFamily:"system-ui",fontSize:12,color:C.sub,lineHeight:1.5}}>
                  Each cell shows projected population with the year-on-year annual growth % beneath it (2026 vs 2025). CAGR % = compound annual growth rate across 2026→2030. Intermediate years are compound-interpolated from the 2025 &amp; 2030 anchors.
                </div>
              </div>
            )}
          </>
        )}

        {/* ── COUNTRY PROFILES TAB ── */}
        {activeTab === "profiles" && (
          <>
            <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"10px 14px",boxShadow:"0 2px 8px rgba(11,31,58,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:2,color:C.navy}}>COUNTRY PROFILES</div>
                <div style={{background:C.teal,borderRadius:10,padding:"2px 8px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,color:"#fff"}}>{availableCountries.length}</div>
                <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                  {[{id:"size",label:"SIZE ▾"},{id:"alpha",label:"A–Z"}].map(o=>(
                    <button key={o.id} onClick={()=>setProfileSort(o.id)} style={{
                      border:profileSort===o.id?`1.5px solid ${C.teal}`:`1px solid ${C.border}`,
                      borderRadius:14,padding:"3px 10px",
                      background:profileSort===o.id?C.teal:"#fff",
                      fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,
                      color:profileSort===o.id?"#fff":C.sub,cursor:"pointer",
                    }}>{o.label}</button>
                  ))}
                </div>
              </div>
              <div style={{background:"#F4F8FC",borderRadius:10,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 12px"}}>
                <span style={{color:C.sub,marginRight:8,fontSize:13}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search countries…"
                  style={{flex:1,border:"none",outline:"none",fontFamily:"system-ui",fontSize:13,color:C.text,background:"transparent",padding:"10px 0"}}/>
              </div>
              {/* Selection summary + jump to comparison table */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                <span style={{fontFamily:"system-ui",fontSize:14,color:C.sub}}>
                  Use <span style={{color:C.teal,fontWeight:600}}>+</span> on any card to add it to your comparison list.
                </span>
                {activeCountries.length>0 && (
                  <button onClick={()=>setActiveTab("explorer")} style={{
                    marginLeft:"auto",border:`1px solid ${C.teal}`,background:C.teal,color:"#fff",
                    borderRadius:14,padding:"4px 11px",fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",
                  }}>VIEW TABLE · {activeCountries.length} ▸</button>
                )}
              </div>
            </div>

            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:10}}>
              {availableCountries
                .filter(n=>n.toLowerCase().includes(search.toLowerCase()))
                .slice()
                .sort((a,b)=>{
                  if (profileSort === "alpha") return a.localeCompare(b);
                  // size: by total population at the selected year, largest first
                  const ta = getDataForYear(COUNTRIES[a].data, selectedYear)?.total || 0;
                  const tb = getDataForYear(COUNTRIES[b].data, selectedYear)?.total || 0;
                  return tb - ta;
                })
                .map(name=>(
                  <CountryProfileCard
                    onZoom={openZoom}
                    key={focusCountry===name ? `${name}-focus` : name}
                    cardId={`profile-${name}`}
                    defaultOpen={focusCountry===name}
                    name={name}
                    year={selectedYear}
                    ageGroups={ageGroups}
                    genderFilter={genderFilter}
                    onSelect={toggleCountry}
                    isSelected={selectedCountries.includes(name)}
                    isFav={favCountries.includes(name)}
                    onToggleFav={toggleFav}
                  />
                ))
              }
            </div>
          </>
        )}

        <div style={{marginTop:32,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,color:C.sub}}>
          LIGHTHOUSE ORTHOPAEDICS · POPULATION ANALYTICS · 2025 VERIFIED (UN WPP 2024) FOR KEY MARKETS · OTHER YEARS MODELLED · 2026
        </div>
      </div>

      <ChartModal data={zoomData} onClose={()=>setZoomData(null)}/>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </div>
  );
}
