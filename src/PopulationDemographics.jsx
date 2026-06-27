import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
    color:"#0B1F3A", flag:"🌍",
    data:[
      {y:2005,total:6542000,under18:1980000,a18to64:4140000,a65to79:345000,over80:77000},
      {y:2010,total:6957000,under18:2010000,a18to64:4460000,a65to79:392000,over80:95000},
      {y:2015,total:7383000,under18:2050000,a18to64:4820000,a65to79:430000,over80:110000},
      {y:2020,total:7795000,under18:2090000,a18to64:5150000,a65to79:435000,over80:120000},
      {y:2025,total:8200000,under18:2120000,a18to64:5430000,a65to79:510000,over80:140000},
      {y:2030,total:8548000,under18:2090000,a18to64:5700000,a65to79:600000,over80:158000},
      {y:2035,total:8875000,under18:2050000,a18to64:5890000,a65to79:720000,over80:215000},
    ],
    countries:["United Kingdom","Germany","France","United States","Japan","China","India","Brazil","Nigeria","South Africa","Australia","Canada"],
  },
  "Europe": {
    color:"#1A5BBD", flag:"🇪🇺",
    data:[
      {y:2005,total:728000,under18:141000,a18to64:484000,a65to79:84000,over80:19000},
      {y:2010,total:736000,under18:137000,a18to64:489000,a65to79:89000,over80:21000},
      {y:2015,total:743000,under18:134000,a18to64:488000,a65to79:98000,over80:23000},
      {y:2020,total:748000,under18:132000,a18to64:484000,a65to79:106000,over80:26000},
      {y:2025,total:749000,under18:129000,a18to64:476000,a65to79:114000,over80:30000},
      {y:2030,total:746000,under18:125000,a18to64:462000,a65to79:127000,over80:32000},
      {y:2035,total:740000,under18:120000,a18to64:445000,a65to79:142000,over80:33000},
    ],
    countries:["United Kingdom","Germany","France","Italy","Spain","Netherlands","Poland","Sweden","Norway","Denmark","Switzerland","Belgium","Portugal","Austria","Ireland","Finland"],
  },
  "Americas": {
    color:"#E05252", flag:"🌎",
    data:[
      {y:2005,total:882000,under18:268000,a18to64:559000,a65to79:46000,over80:9000},
      {y:2010,total:938000,under18:272000,a18to64:602000,a65to79:53000,over80:11000},
      {y:2015,total:993000,under18:277000,a18to64:645000,a65to79:59000,over80:12000},
      {y:2020,total:1041000,under18:277000,a18to64:683000,a65to79:66000,over80:15000},
      {y:2025,total:1086000,under18:276000,a18to64:714000,a65to79:77000,over80:19000},
      {y:2030,total:1127000,under18:272000,a18to64:740000,a65to79:91000,over80:24000},
      {y:2035,total:1163000,under18:265000,a18to64:762000,a65to79:107000,over80:29000},
    ],
    countries:["United States","Canada","Brazil","Mexico","Colombia","Argentina","Chile","Peru"],
  },
  "Asia-Pacific": {
    color:"#00C4B4", flag:"🌏",
    data:[
      {y:2005,total:3938000,under18:1272000,a18to64:2470000,a65to79:168000,over80:28000},
      {y:2010,total:4164000,under18:1280000,a18to64:2660000,a65to79:196000,over80:28000},
      {y:2015,total:4393000,under18:1290000,a18to64:2820000,a65to79:242000,over80:41000},
      {y:2020,total:4641000,under18:1310000,a18to64:3010000,a65to79:273000,over80:48000},
      {y:2025,total:4864000,under18:1300000,a18to64:3210000,a65to79:302000,over80:52000},
      {y:2030,total:5060000,under18:1270000,a18to64:3380000,a65to79:345000,over80:65000},
      {y:2035,total:5220000,under18:1230000,a18to64:3490000,a65to79:410000,over80:90000},
    ],
    countries:["Japan","China","India","Australia","South Korea","Indonesia","Philippines","Vietnam","Thailand","Malaysia","Singapore","New Zealand","Pakistan","Bangladesh"],
  },
  "Africa": {
    color:"#F5A623", flag:"🌍",
    data:[
      {y:2005,total:913000,under18:440000,a18to64:455000,a65to79:16000,over80:2000},
      {y:2010,total:1045000,under18:497000,a18to64:527000,a65to79:19000,over80:2000},
      {y:2015,total:1189000,under18:557000,a18to64:610000,a65to79:20000,over80:2000},
      {y:2020,total:1360000,under18:625000,a18to64:706000,a65to79:27000,over80:2000},
      {y:2025,total:1530000,under18:690000,a18to64:808000,a65to79:29000,over80:3000},
      {y:2030,total:1710000,under18:750000,a18to64:921000,a65to79:35000,over80:4000},
      {y:2035,total:1925000,under18:830000,a18to64:1050000,a65to79:41000,over80:4000},
    ],
    countries:["Nigeria","South Africa","Ethiopia","Egypt","Kenya","Ghana","Tanzania","Morocco","Mozambique","Uganda"],
  },
  "Middle East": {
    color:"#7C3AED", flag:"🕌",
    data:[
      {y:2005,total:193000,under18:68000,a18to64:116000,a65to79:7400,over80:1600},
      {y:2010,total:222000,under18:73000,a18to64:139000,a65to79:8500,over80:1500},
      {y:2015,total:255000,under18:78000,a18to64:166000,a65to79:9300,over80:1700},
      {y:2020,total:284000,under18:79000,a18to64:192000,a65to79:11000,over80:2000},
      {y:2025,total:310000,under18:79000,a18to64:215000,a65to79:13000,over80:3000},
      {y:2030,total:338000,under18:79000,a18to64:239000,a65to79:17000,over80:3000},
      {y:2035,total:363000,under18:78000,a18to64:261000,a65to79:21000,over80:3000},
    ],
    countries:["Saudi Arabia","UAE","Iran","Iraq","Israel","Jordan","Kuwait","Qatar","Bahrain","Oman"],
  },
};

const COUNTRIES = {
  // Europe
  "United Kingdom":{ region:"Europe", flag:"🇬🇧", color:"#003087",
    data:[
      {y:2005,total:60300,under18:13200,a18to64:38700,a65to79:6600,over80:1800},
      {y:2010,total:62800,under18:13500,a18to64:40500,a65to79:6900,over80:1900},
      {y:2015,total:65200,under18:14000,a18to64:41800,a65to79:7300,over80:2100},
      {y:2020,total:67200,under18:14200,a18to64:43000,a65to79:7600,over80:2400},
      {y:2025,total:69551,under18:14329,a18to64:41519,a65to79:9945,over80:3758},
      {y:2030,total:70400,under18:13900,a18to64:44100,a65to79:9400,over80:3000},
      {y:2035,total:71700,under18:13600,a18to64:44300,a65to79:10500,over80:3300},
    ]},
  "Germany":{ region:"Europe", flag:"🇩🇪", color:"#1A1A1A",
    data:[
      {y:2005,total:82500,under18:14100,a18to64:56100,a65to79:9800,over80:2500},
      {y:2010,total:81800,under18:13300,a18to64:55400,a65to79:10200,over80:2900},
      {y:2015,total:81700,under18:13000,a18to64:54000,a65to79:11300,over80:3400},
      {y:2020,total:83200,under18:13600,a18to64:54300,a65to79:11900,over80:3400},
      {y:2025,total:84075,under18:13996,a18to64:50151,a65to79:13630,over80:6298},
      {y:2030,total:84900,under18:13400,a18to64:51800,a65to79:15300,over80:4400},
      {y:2035,total:84200,under18:12700,a18to64:49900,a65to79:17100,over80:4500},
    ]},
  "France":{ region:"Europe", flag:"🇫🇷", color:"#0055A4",
    data:[
      {y:2005,total:63000,under18:14500,a18to64:40800,a65to79:6100,over80:1600},
      {y:2010,total:64800,under18:15000,a18to64:41900,a65to79:6100,over80:1800},
      {y:2015,total:66800,under18:15300,a18to64:42700,a65to79:6700,over80:2100},
      {y:2020,total:67900,under18:15400,a18to64:42900,a65to79:7000,over80:2600},
      {y:2025,total:66651,under18:13309,a18to64:38318,a65to79:10793,over80:4232},
      {y:2030,total:69300,under18:14800,a18to64:42700,a65to79:8700,over80:3100},
      {y:2035,total:69800,under18:14400,a18to64:42300,a65to79:9800,over80:3300},
    ]},
  "Italy":{ region:"Europe", flag:"🇮🇹", color:"#009246",
    data:[
      {y:2005,total:58600,under18:9800,a18to64:40100,a65to79:7000,over80:1700},
      {y:2010,total:59600,under18:9800,a18to64:40600,a65to79:7200,over80:2000},
      {y:2015,total:60800,under18:9700,a18to64:40700,a65to79:8000,over80:2400},
      {y:2020,total:59600,under18:9200,a18to64:39200,a65to79:8800,over80:2400},
      {y:2025,total:59146,under18:8639,a18to64:35663,a65to79:10169,over80:4675},
      {y:2030,total:58200,under18:8300,a18to64:36200,a65to79:11000,over80:2700},
      {y:2035,total:57100,under18:7800,a18to64:34400,a65to79:11900,over80:3000},
    ]},
  "Spain":{ region:"Europe", flag:"🇪🇸", color:"#AA151B",
    data:[
      {y:2005,total:43900,under18:8500,a18to64:29800,a65to79:4600,over80:1000},
      {y:2010,total:46700,under18:9200,a18to64:31700,a65to79:4700,over80:1100},
      {y:2015,total:46400,under18:8800,a18to64:31200,a65to79:5200,over80:1200},
      {y:2020,total:47400,under18:8800,a18to64:31400,a65to79:5700,over80:1500},
      {y:2025,total:47890,under18:7592,a18to64:29934,a65to79:7258,over80:3107},
      {y:2030,total:48000,under18:8200,a18to64:30700,a65to79:7100,over80:2000},
      {y:2035,total:47900,under18:7700,a18to64:30100,a65to79:7900,over80:2200},
    ]},
  "Sweden":{ region:"Europe", flag:"🇸🇪", color:"#006AA7",
    data:[
      {y:2005,total:9050,under18:1890,a18to64:5710,a65to79:1100,over80:350},
      {y:2010,total:9380,under18:1930,a18to64:5920,a65to79:1140,over80:390},
      {y:2015,total:9800,under18:2050,a18to64:6150,a65to79:1200,over80:400},
      {y:2020,total:10360,under18:2180,a18to64:6490,a65to79:1290,over80:400},
      {y:2025,total:10800,under18:2230,a18to64:6730,a65to79:1390,over80:450},
      {y:2030,total:11200,under18:2260,a18to64:6920,a65to79:1580,over80:440},
      {y:2035,total:11500,under18:2270,a18to64:7050,a65to79:1740,over80:440},
    ]},
  "Netherlands":{ region:"Europe", flag:"🇳🇱", color:"#AE1C28",
    data:[
      {y:2005,total:16300,under18:3400,a18to64:10900,a65to79:1700,over80:300},
      {y:2010,total:16600,under18:3300,a18to64:11100,a65to79:1850,over80:350},
      {y:2015,total:16900,under18:3300,a18to64:11200,a65to79:2000,over80:400},
      {y:2020,total:17500,under18:3400,a18to64:11400,a65to79:2200,over80:500},
      {y:2025,total:18347,under18:3347,a18to64:11171,a65to79:2879,over80:949},
      {y:2030,total:18300,under18:3400,a18to64:11600,a65to79:2800,over80:500},
      {y:2035,total:18600,under18:3300,a18to64:11600,a65to79:3100,over80:600},
    ]},
  "Poland":{ region:"Europe", flag:"🇵🇱", color:"#DC143C",
    data:[
      {y:2005,total:38200,under18:7400,a18to64:26600,a65to79:3500,over80:700},
      {y:2010,total:38100,under18:7000,a18to64:26500,a65to79:3800,over80:800},
      {y:2015,total:38000,under18:6900,a18to64:26000,a65to79:4200,over80:900},
      {y:2020,total:37900,under18:7000,a18to64:25500,a65to79:4500,over80:900},
      {y:2025,total:37200,under18:6600,a18to64:24500,a65to79:5200,over80:900},
      {y:2030,total:36100,under18:6100,a18to64:23500,a65to79:5700,over80:800},
      {y:2035,total:34800,under18:5700,a18to64:22200,a65to79:6200,over80:700},
    ]},
  "Norway":{ region:"Europe", flag:"🇳🇴", color:"#EF2B2D",
    data:[
      {y:2005,total:4620,under18:1020,a18to64:2930,a65to79:500,over80:170},
      {y:2010,total:4890,under18:1070,a18to64:3120,a65to79:520,over80:180},
      {y:2015,total:5190,under18:1140,a18to64:3330,a65to79:550,over80:170},
      {y:2020,total:5380,under18:1180,a18to64:3450,a65to79:600,over80:150},
      {y:2025,total:5550,under18:1200,a18to64:3550,a65to79:640,over80:160},
      {y:2030,total:5700,under18:1220,a18to64:3610,a65to79:720,over80:150},
      {y:2035,total:5850,under18:1230,a18to64:3660,a65to79:800,over80:160},
    ]},
  "Denmark":{ region:"Europe", flag:"🇩🇰", color:"#C60C30",
    data:[
      {y:2005,total:5430,under18:1110,a18to64:3530,a65to79:620,over80:170},
      {y:2010,total:5550,under18:1120,a18to64:3590,a65to79:650,over80:190},
      {y:2015,total:5690,under18:1170,a18to64:3660,a65to79:660,over80:200},
      {y:2020,total:5840,under18:1210,a18to64:3750,a65to79:680,over80:200},
      {y:2025,total:5970,under18:1230,a18to64:3820,a65to79:730,over80:190},
      {y:2030,total:6100,under18:1250,a18to64:3860,a65to79:800,over80:190},
      {y:2035,total:6220,under18:1260,a18to64:3870,a65to79:890,over80:200},
    ]},
  "Switzerland":{ region:"Europe", flag:"🇨🇭", color:"#FF0000",
    data:[
      {y:2005,total:7440,under18:1440,a18to64:4870,a65to79:880,over80:250},
      {y:2010,total:7790,under18:1460,a18to64:5120,a65to79:940,over80:270},
      {y:2015,total:8280,under18:1540,a18to64:5440,a65to79:1010,over80:290},
      {y:2020,total:8640,under18:1570,a18to64:5650,a65to79:1100,over80:320},
      {y:2025,total:9000,under18:1600,a18to64:5840,a65to79:1220,over80:340},
      {y:2030,total:9300,under18:1610,a18to64:5940,a65to79:1390,over80:360},
      {y:2035,total:9550,under18:1610,a18to64:6010,a65to79:1570,over80:360},
    ]},
  "Belgium":{ region:"Europe", flag:"🇧🇪", color:"#FAE042",
    data:[
      {y:2005,total:10480,under18:2200,a18to64:6900,a65to79:1150,over80:230},
      {y:2010,total:10900,under18:2280,a18to64:7160,a65to79:1220,over80:240},
      {y:2015,total:11250,under18:2350,a18to64:7330,a65to79:1320,over80:250},
      {y:2020,total:11590,under18:2440,a18to64:7470,a65to79:1430,over80:250},
      {y:2025,total:11800,under18:2460,a18to64:7540,a65to79:1550,over80:250},
      {y:2030,total:12000,under18:2460,a18to64:7560,a65to79:1730,over80:250},
      {y:2035,total:12200,under18:2450,a18to64:7530,a65to79:1970,over80:250},
    ]},
  "Portugal":{ region:"Europe", flag:"🇵🇹", color:"#006600",
    data:[
      {y:2005,total:10560,under18:1800,a18to64:7200,a65to79:1300,over80:260},
      {y:2010,total:10630,under18:1740,a18to64:7200,a65to79:1400,over80:290},
      {y:2015,total:10350,under18:1650,a18to64:6940,a65to79:1500,over80:260},
      {y:2020,total:10200,under18:1600,a18to64:6750,a65to79:1580,over80:270},
      {y:2025,total:10000,under18:1540,a18to64:6530,a65to79:1680,over80:250},
      {y:2030,total:9750,under18:1470,a18to64:6260,a65to79:1780,over80:240},
      {y:2035,total:9470,under18:1380,a18to64:5970,a65to79:1880,over80:240},
    ]},
  "Austria":{ region:"Europe", flag:"🇦🇹", color:"#ED2939",
    data:[
      {y:2005,total:8230,under18:1660,a18to64:5500,a65to79:870,over80:200},
      {y:2010,total:8380,under18:1620,a18to64:5630,a65to79:920,over80:210},
      {y:2015,total:8640,under18:1640,a18to64:5780,a65to79:1000,over80:220},
      {y:2020,total:9010,under18:1740,a18to64:5990,a65to79:1040,over80:240},
      {y:2025,total:9200,under18:1760,a18to64:6040,a65to79:1170,over80:230},
      {y:2030,total:9380,under18:1760,a18to64:6040,a65to79:1340,over80:240},
      {y:2035,total:9520,under18:1750,a18to64:6010,a65to79:1530,over80:230},
    ]},
  "Ireland":{ region:"Europe", flag:"🇮🇪", color:"#169B62",
    data:[
      {y:2005,total:4140,under18:950,a18to64:2870,a65to79:270,over80:50},
      {y:2010,total:4560,under18:1070,a18to64:3150,a65to79:290,over80:50},
      {y:2015,total:4630,under18:1120,a18to64:3170,a65to79:300,over80:60},
      {y:2020,total:4990,under18:1190,a18to64:3430,a65to79:320,over80:50},
      {y:2025,total:5300,under18:1230,a18to64:3640,a65to79:380,over80:50},
      {y:2030,total:5550,under18:1260,a18to64:3770,a65to79:470,over80:50},
      {y:2035,total:5780,under18:1280,a18to64:3880,a65to79:570,over80:50},
    ]},
  "Finland":{ region:"Europe", flag:"🇫🇮", color:"#003580",
    data:[
      {y:2005,total:5250,under18:1040,a18to64:3390,a65to79:640,over80:180},
      {y:2010,total:5370,under18:1060,a18to64:3450,a65to79:670,over80:190},
      {y:2015,total:5490,under18:1080,a18to64:3520,a65to79:710,over80:180},
      {y:2020,total:5530,under18:1080,a18to64:3500,a65to79:770,over80:180},
      {y:2025,total:5570,under18:1070,a18to64:3470,a65to79:840,over80:190},
      {y:2030,total:5580,under18:1060,a18to64:3430,a65to79:920,over80:170},
      {y:2035,total:5570,under18:1040,a18to64:3370,a65to79:1000,over80:160},
    ]},
  // Americas
  "United States":{ region:"Americas", flag:"🇺🇸", color:"#3C3B6E",
    data:[
      {y:2005,total:296100,under18:72900,a18to64:191700,a65to79:24400,over80:7100},
      {y:2010,total:309300,under18:73700,a18to64:200800,a65to79:25800,over80:9000},
      {y:2015,total:321400,under18:73900,a18to64:208900,a65to79:28400,over80:10200},
      {y:2020,total:331400,under18:72900,a18to64:214200,a65to79:33100,over80:11200},
      {y:2025,total:347276,under18:73078,a18to64:210343,a65to79:49277,over80:14577},
      {y:2030,total:347800,under18:72100,a18to64:221900,a65to79:42700,over80:11100},
      {y:2035,total:354900,under18:71400,a18to64:224400,a65to79:47200,over80:11900},
    ]},
  "Canada":{ region:"Americas", flag:"🇨🇦", color:"#FF0000",
    data:[
      {y:2005,total:32300,under18:7100,a18to64:21600,a65to79:3000,over80:600},
      {y:2010,total:34000,under18:7200,a18to64:22800,a65to79:3200,over80:800},
      {y:2015,total:35600,under18:7400,a18to64:23800,a65to79:3600,over80:800},
      {y:2020,total:37700,under18:7700,a18to64:24900,a65to79:4200,over80:900},
      {y:2025,total:40127,under18:7333,a18to64:24664,a65to79:6128,over80:2002},
      {y:2030,total:42000,under18:8200,a18to64:27200,a65to79:5600,over80:1000},
      {y:2035,total:43800,under18:8400,a18to64:28100,a65to79:6300,over80:1000},
    ]},
  "Brazil":{ region:"Americas", flag:"🇧🇷", color:"#009C3B",
    data:[
      {y:2005,total:188400,under18:60200,a18to64:119500,a65to79:7200,over80:1500},
      {y:2010,total:196800,under18:57600,a18to64:128500,a65to79:9200,over80:1500},
      {y:2015,total:204500,under18:54100,a18to64:137400,a65to79:11500,over80:1500},
      {y:2020,total:213200,under18:51200,a18to64:145200,a65to79:14700,over80:2100},
      {y:2025,total:219000,under18:48900,a18to64:150800,a65to79:16800,over80:2500},
      {y:2030,total:224000,under18:46600,a18to64:155200,a65to79:19600,over80:2600},
      {y:2035,total:228000,under18:44100,a18to64:158500,a65to79:23000,over80:2400},
    ]},
  "Mexico":{ region:"Americas", flag:"🇲🇽", color:"#006847",
    data:[
      {y:2005,total:103900,under18:35900,a18to64:62500,a65to79:4500,over80:1000},
      {y:2010,total:112300,under18:36500,a18to64:69700,a65to79:5200,over80:900},
      {y:2015,total:121000,under18:36800,a18to64:77400,a65to79:5900,over80:900},
      {y:2020,total:128900,under18:36800,a18to64:84400,a65to79:6900,over80:800},
      {y:2025,total:134900,under18:36300,a18to64:90000,a65to79:7700,over80:900},
      {y:2030,total:140800,under18:35700,a18to64:95300,a65to79:9000,over80:800},
      {y:2035,total:146200,under18:35000,a18to64:100000,a65to79:10400,over80:800},
    ]},
  "Argentina":{ region:"Americas", flag:"🇦🇷", color:"#74ACDF",
    data:[
      {y:2005,total:38600,under18:11600,a18to64:23900,a65to79:2600,over80:500},
      {y:2010,total:40700,under18:11800,a18to64:25300,a65to79:2900,over80:700},
      {y:2015,total:43400,under18:12100,a18to64:27400,a65to79:3200,over80:700},
      {y:2020,total:45600,under18:12400,a18to64:28900,a65to79:3600,over80:700},
      {y:2025,total:47700,under18:12600,a18to64:30500,a65to79:3900,over80:700},
      {y:2030,total:49700,under18:12700,a18to64:32000,a65to79:4300,over80:700},
      {y:2035,total:51800,under18:12800,a18to64:33600,a65to79:4700,over80:700},
    ]},
  "Colombia":{ region:"Americas", flag:"🇨🇴", color:"#FCD116",
    data:[
      {y:2005,total:43100,under18:15200,a18to64:25700,a65to79:1900,over80:300},
      {y:2010,total:46000,under18:15200,a18to64:28100,a65to79:2200,over80:500},
      {y:2015,total:48200,under18:14700,a18to64:30400,a65to79:2600,over80:500},
      {y:2020,total:50900,under18:14500,a18to64:32800,a65to79:3100,over80:500},
      {y:2025,total:53000,under18:14200,a18to64:34600,a65to79:3700,over80:500},
      {y:2030,total:54900,under18:13700,a18to64:36200,a65to79:4400,over80:600},
      {y:2035,total:56500,under18:13200,a18to64:37500,a65to79:5200,over80:600},
    ]},
  "Chile":{ region:"Americas", flag:"🇨🇱", color:"#D52B1E",
    data:[
      {y:2005,total:16300,under18:4400,a18to64:10600,a65to79:1100,over80:200},
      {y:2010,total:17100,under18:4300,a18to64:11200,a65to79:1300,over80:300},
      {y:2015,total:17900,under18:4200,a18to64:12000,a65to79:1500,over80:200},
      {y:2020,total:19100,under18:4200,a18to64:13000,a65to79:1700,over80:200},
      {y:2025,total:19600,under18:4000,a18to64:13400,a65to79:1900,over80:300},
      {y:2030,total:20100,under18:3800,a18to64:13800,a65to79:2300,over80:200},
      {y:2035,total:20500,under18:3700,a18to64:14100,a65to79:2500,over80:200},
    ]},
  "Peru":{ region:"Americas", flag:"🇵🇪", color:"#D91023",
    data:[
      {y:2005,total:27800,under18:9700,a18to64:16500,a65to79:1400,over80:200},
      {y:2010,total:29300,under18:9600,a18to64:17900,a65to79:1600,over80:200},
      {y:2015,total:31400,under18:9700,a18to64:19600,a65to79:1900,over80:200},
      {y:2020,total:33000,under18:9800,a18to64:21000,a65to79:2000,over80:200},
      {y:2025,total:34400,under18:9700,a18to64:22300,a65to79:2200,over80:200},
      {y:2030,total:35700,under18:9500,a18to64:23500,a65to79:2500,over80:200},
      {y:2035,total:36900,under18:9200,a18to64:24700,a65to79:2800,over80:200},
    ]},
  // Asia-Pacific
  "Japan":{ region:"Asia-Pacific", flag:"🇯🇵", color:"#BC002D",
    data:[
      {y:2005,total:127700,under18:20700,a18to64:84800,a65to79:16500,over80:5700},
      {y:2010,total:128100,under18:19000,a18to64:82100,a65to79:19400,over80:7600},
      {y:2015,total:126900,under18:17400,a18to64:78600,a65to79:21100,over80:9800},
      {y:2020,total:125700,under18:16300,a18to64:73700,a65to79:24600,over80:11100},
      {y:2025,total:123103,under18:17230,a18to64:68950,a65to79:23788,over80:13136},
      {y:2030,total:122000,under18:14200,a18to64:68000,a65to79:27500,over80:12300},
      {y:2035,total:119100,under18:13100,a18to64:64700,a65to79:29800,over80:11500},
    ]},
  "China":{ region:"Asia-Pacific", flag:"🇨🇳", color:"#DE2910",
    data:[
      {y:2005,total:1304500,under18:314000,a18to64:893000,a65to79:81000,over80:16500},
      {y:2010,total:1340900,under18:297000,a18to64:936000,a65to79:91000,over80:16900},
      {y:2015,total:1371200,under18:281000,a18to64:980000,a65to79:91000,over80:19200},
      {y:2020,total:1411100,under18:283000,a18to64:986000,a65to79:116000,over80:26100},
      {y:2025,total:1408000,under18:268000,a18to64:980000,a65to79:122000,over80:38000},
      {y:2030,total:1399000,under18:252000,a18to64:960000,a65to79:148000,over80:39000},
      {y:2035,total:1383000,under18:240000,a18to64:924000,a65to79:180000,over80:39000},
    ]},
  "India":{ region:"Asia-Pacific", flag:"🇮🇳", color:"#FF9933",
    data:[
      {y:2005,total:1147000,under18:420000,a18to64:672000,a65to79:48000,over80:7000},
      {y:2010,total:1230000,under18:430000,a18to64:737000,a65to79:55000,over80:8000},
      {y:2015,total:1310000,under18:431000,a18to64:808000,a65to79:61000,over80:10000},
      {y:2020,total:1380000,under18:427000,a18to64:876000,a65to79:66000,over80:11000},
      {y:2025,total:1441000,under18:419000,a18to64:939000,a65to79:71000,over80:12000},
      {y:2030,total:1497000,under18:402000,a18to64:1000000,a65to79:82000,over80:13000},
      {y:2035,total:1550000,under18:387000,a18to64:1057000,a65to79:95000,over80:11000},
    ]},
  "Australia":{ region:"Asia-Pacific", flag:"🇦🇺", color:"#00008B",
    data:[
      {y:2005,total:20400,under18:4900,a18to64:13500,a65to79:1700,over80:300},
      {y:2010,total:22300,under18:5100,a18to64:14800,a65to79:2000,over80:400},
      {y:2015,total:24000,under18:5500,a18to64:15900,a65to79:2200,over80:400},
      {y:2020,total:25700,under18:5900,a18to64:17000,a65to79:2500,over80:300},
      {y:2025,total:26974,under18:5765,a18to64:16329,a65to79:3620,over80:1260},
      {y:2030,total:28700,under18:6500,a18to64:18800,a65to79:3100,over80:300},
      {y:2035,total:30000,under18:6700,a18to64:19700,a65to79:3300,over80:300},
    ]},
  "South Korea":{ region:"Asia-Pacific", flag:"🇰🇷", color:"#CD2E3A",
    data:[
      {y:2005,total:48100,under18:10200,a18to64:33700,a65to79:3700,over80:500},
      {y:2010,total:49410,under18:9800,a18to64:34500,a65to79:4400,over80:710},
      {y:2015,total:51010,under18:9200,a18to64:36100,a65to79:4800,over80:910},
      {y:2020,total:51840,under18:8300,a18to64:36800,a65to79:5700,over80:1040},
      {y:2025,total:52000,under18:7500,a18to64:36400,a65to79:6900,over80:1200},
      {y:2030,total:51800,under18:6900,a18to64:35400,a65to79:7900,over80:1500},
      {y:2035,total:51300,under18:6200,a18to64:33800,a65to79:9700,over80:1600},
    ]},
  "Singapore":{ region:"Asia-Pacific", flag:"🇸🇬", color:"#EF3340",
    data:[
      {y:2005,total:4270,under18:840,a18to64:3080,a65to79:310,over80:40},
      {y:2010,total:5080,under18:950,a18to64:3720,a65to79:360,over80:50},
      {y:2015,total:5540,under18:960,a18to64:4100,a65to79:420,over80:60},
      {y:2020,total:5690,under18:980,a18to64:4180,a65to79:490,over80:40},
      {y:2025,total:5910,under18:1000,a18to64:4310,a65to79:570,over80:30},
      {y:2030,total:6130,under18:1010,a18to64:4410,a65to79:680,over80:30},
      {y:2035,total:6290,under18:1000,a18to64:4460,a65to79:800,over80:30},
    ]},
  "New Zealand":{ region:"Asia-Pacific", flag:"🇳🇿", color:"#00247D",
    data:[
      {y:2005,total:4110,under18:1010,a18to64:2690,a65to79:350,over80:60},
      {y:2010,total:4370,under18:1040,a18to64:2880,a65to79:380,over80:70},
      {y:2015,total:4600,under18:1100,a18to64:3020,a65to79:420,over80:60},
      {y:2020,total:5090,under18:1160,a18to64:3390,a65to79:490,over80:50},
      {y:2025,total:5240,under18:1180,a18to64:3470,a65to79:550,over80:40},
      {y:2030,total:5440,under18:1200,a18to64:3570,a65to79:630,over80:40},
      {y:2035,total:5620,under18:1210,a18to64:3650,a65to79:720,over80:40},
    ]},
  "Indonesia":{ region:"Asia-Pacific", flag:"🇮🇩", color:"#CE1126",
    data:[
      {y:2005,total:222000,under18:78000,a18to64:135000,a65to79:8100,over80:900},
      {y:2010,total:241800,under18:79000,a18to64:152000,a65to79:9700,over80:1100},
      {y:2015,total:259100,under18:78000,a18to64:169000,a65to79:11000,over80:1100},
      {y:2020,total:273500,under18:76000,a18to64:184000,a65to79:12500,over80:1000},
      {y:2025,total:285000,under18:73000,a18to64:198000,a65to79:13000,over80:1000},
      {y:2030,total:296000,under18:70000,a18to64:210000,a65to79:15000,over80:1000},
      {y:2035,total:305000,under18:66000,a18to64:222000,a65to79:16000,over80:1000},
    ]},
  "Thailand":{ region:"Asia-Pacific", flag:"🇹🇭", color:"#2D2A4A",
    data:[
      {y:2005,total:65900,under18:16400,a18to64:44900,a65to79:4100,over80:500},
      {y:2010,total:67300,under18:15100,a18to64:46400,a65to79:5200,over80:600},
      {y:2015,total:68400,under18:14000,a18to64:47300,a65to79:6500,over80:600},
      {y:2020,total:69800,under18:13300,a18to64:48100,a65to79:7700,over80:700},
      {y:2025,total:71700,under18:12800,a18to64:49200,a65to79:9000,over80:700},
      {y:2030,total:72500,under18:12200,a18to64:49200,a65to79:10300,over80:800},
      {y:2035,total:72800,under18:11500,a18to64:48600,a65to79:12000,over80:700},
    ]},
  "Malaysia":{ region:"Asia-Pacific", flag:"🇲🇾", color:"#CC0001",
    data:[
      {y:2005,total:26100,under18:8800,a18to64:16200,a65to79:970,over80:130},
      {y:2010,total:28300,under18:9000,a18to64:18100,a65to79:1100,over80:100},
      {y:2015,total:31000,under18:9400,a18to64:20300,a65to79:1200,over80:100},
      {y:2020,total:32700,under18:9600,a18to64:21600,a65to79:1400,over80:100},
      {y:2025,total:34400,under18:9700,a18to64:23000,a65to79:1600,over80:100},
      {y:2030,total:36100,under18:9700,a18to64:24500,a65to79:1800,over80:100},
      {y:2035,total:37700,under18:9600,a18to64:26000,a65to79:2000,over80:100},
    ]},
  "Vietnam":{ region:"Asia-Pacific", flag:"🇻🇳", color:"#DA251D",
    data:[
      {y:2005,total:83300,under18:25500,a18to64:52900,a65to79:4400,over80:500},
      {y:2010,total:87800,under18:24200,a18to64:57300,a65to79:5700,over80:600},
      {y:2015,total:92700,under18:24100,a18to64:62100,a65to79:6000,over80:500},
      {y:2020,total:97300,under18:24300,a18to64:66200,a65to79:6200,over80:600},
      {y:2025,total:101300,under18:24300,a18to64:70200,a65to79:6300,over80:500},
      {y:2030,total:104800,under18:24200,a18to64:73700,a65to79:6400,over80:500},
      {y:2035,total:107900,under18:23800,a18to64:77100,a65to79:6500,over80:500},
    ]},
  "Philippines":{ region:"Asia-Pacific", flag:"🇵🇭", color:"#0038A8",
    data:[
      {y:2005,total:84200,under18:33000,a18to64:48200,a65to79:2600,over80:400},
      {y:2010,total:93400,under18:35200,a18to64:54900,a65to79:2900,over80:400},
      {y:2015,total:103200,under18:37200,a18to64:62300,a65to79:3300,over80:400},
      {y:2020,total:113900,under18:39600,a18to64:71000,a65to79:2900,over80:400},
      {y:2025,total:122000,under18:40700,a18to64:77900,a65to79:3000,over80:400},
      {y:2030,total:130200,under18:41400,a18to64:84500,a65to79:4000,over80:300},
      {y:2035,total:138300,under18:42000,a18to64:91300,a65to79:4700,over80:300},
    ]},
  "Pakistan":{ region:"Asia-Pacific", flag:"🇵🇰", color:"#01411C",
    data:[
      {y:2005,total:155000,under18:69000,a18to64:80000,a65to79:5500,over80:500},
      {y:2010,total:177000,under18:77000,a18to64:93000,a65to79:6400,over80:600},
      {y:2015,total:199000,under18:84000,a18to64:107000,a65to79:7400,over80:600},
      {y:2020,total:221000,under18:88000,a18to64:124000,a65to79:8200,over80:800},
      {y:2025,total:245000,under18:93000,a18to64:142000,a65to79:9400,over80:600},
      {y:2030,total:269000,under18:97000,a18to64:160000,a65to79:11000,over80:600},
      {y:2035,total:294000,under18:101000,a18to64:179000,a65to79:13000,over80:600},
    ]},
  "Bangladesh":{ region:"Asia-Pacific", flag:"🇧🇩", color:"#006A4E",
    data:[
      {y:2005,total:146000,under18:58000,a18to64:82000,a65to79:5400,over80:600},
      {y:2010,total:156000,under18:57000,a18to64:92000,a65to79:6400,over80:600},
      {y:2015,total:162000,under18:54000,a18to64:101000,a65to79:6500,over80:500},
      {y:2020,total:167000,under18:51000,a18to64:109000,a65to79:6600,over80:400},
      {y:2025,total:174000,under18:49000,a18to64:117000,a65to79:7500,over80:500},
      {y:2030,total:180000,under18:47000,a18to64:125000,a65to79:7500,over80:500},
      {y:2035,total:186000,under18:45000,a18to64:133000,a65to79:7500,over80:500},
    ]},
  // Africa
  "Nigeria":{ region:"Africa", flag:"🇳🇬", color:"#008751",
    data:[
      {y:2005,total:140500,under18:68000,a18to64:69000,a65to79:3100,over80:400},
      {y:2010,total:162500,under18:79000,a18to64:79500,a65to79:3600,over80:400},
      {y:2015,total:186000,under18:90000,a18to64:92000,a65to79:3600,over80:400},
      {y:2020,total:213400,under18:103000,a18to64:106000,a65to79:4000,over80:400},
      {y:2025,total:242000,under18:115000,a18to64:122000,a65to79:4600,over80:400},
      {y:2030,total:274000,under18:128000,a18to64:140000,a65to79:5600,over80:400},
      {y:2035,total:310000,under18:143000,a18to64:161000,a65to79:5700,over80:300},
    ]},
  "South Africa":{ region:"Africa", flag:"🇿🇦", color:"#007A4D",
    data:[
      {y:2005,total:48100,under18:18300,a18to64:27400,a65to79:2200,over80:200},
      {y:2010,total:51200,under18:19000,a18to64:29200,a65to79:2700,over80:300},
      {y:2015,total:55400,under18:20100,a18to64:32600,a65to79:2500,over80:200},
      {y:2020,total:59300,under18:21200,a18to64:35300,a65to79:2500,over80:300},
      {y:2025,total:62700,under18:22000,a18to64:37700,a65to79:2700,over80:300},
      {y:2030,total:66300,under18:22500,a18to64:40700,a65to79:2900,over80:200},
      {y:2035,total:70200,under18:23200,a18to64:43600,a65to79:3200,over80:200},
    ]},
  "Ethiopia":{ region:"Africa", flag:"🇪🇹", color:"#078930",
    data:[
      {y:2005,total:80100,under18:38000,a18to64:39200,a65to79:2500,over80:400},
      {y:2010,total:92700,under18:43000,a18to64:46500,a65to79:2900,over80:300},
      {y:2015,total:107500,under18:48000,a18to64:56000,a65to79:3200,over80:300},
      {y:2020,total:118000,under18:50000,a18to64:64500,a65to79:3200,over80:300},
      {y:2025,total:131000,under18:53000,a18to64:73000,a65to79:4700,over80:300},
      {y:2030,total:145000,under18:57000,a18to64:83000,a65to79:4700,over80:300},
      {y:2035,total:162000,under18:62000,a18to64:94000,a65to79:5700,over80:300},
    ]},
  "Egypt":{ region:"Africa", flag:"🇪🇬", color:"#CE1126",
    data:[
      {y:2005,total:74000,under18:26000,a18to64:44000,a65to79:3600,over80:400},
      {y:2010,total:82500,under18:27000,a18to64:51000,a65to79:4000,over80:500},
      {y:2015,total:92200,under18:28000,a18to64:59000,a65to79:4700,over80:500},
      {y:2020,total:102000,under18:30000,a18to64:67000,a65to79:4500,over80:500},
      {y:2025,total:112000,under18:31000,a18to64:76000,a65to79:4600,over80:400},
      {y:2030,total:122000,under18:32000,a18to64:84000,a65to79:5600,over80:400},
      {y:2035,total:132000,under18:33000,a18to64:93000,a65to79:5600,over80:400},
    ]},
  "Kenya":{ region:"Africa", flag:"🇰🇪", color:"#006600",
    data:[
      {y:2005,total:36500,under18:16500,a18to64:18600,a65to79:1300,over80:100},
      {y:2010,total:41800,under18:18500,a18to64:21600,a65to79:1500,over80:200},
      {y:2015,total:48500,under18:21000,a18to64:25600,a65to79:1700,over80:200},
      {y:2020,total:54000,under18:23000,a18to64:29000,a65to79:1800,over80:200},
      {y:2025,total:59500,under18:25000,a18to64:32500,a65to79:1800,over80:200},
      {y:2030,total:65500,under18:27000,a18to64:36300,a65to79:2000,over80:200},
      {y:2035,total:71800,under18:29000,a18to64:40500,a65to79:2100,over80:200},
    ]},
  "Ghana":{ region:"Africa", flag:"🇬🇭", color:"#006B3F",
    data:[
      {y:2005,total:21500,under18:9700,a18to64:10900,a65to79:800,over80:100},
      {y:2010,total:24700,under18:10600,a18to64:13100,a65to79:900,over80:100},
      {y:2015,total:28000,under18:11500,a18to64:15400,a65to79:1000,over80:100},
      {y:2020,total:31000,under18:12300,a18to64:17400,a65to79:1200,over80:100},
      {y:2025,total:34000,under18:13000,a18to64:19700,a65to79:1200,over80:100},
      {y:2030,total:37200,under18:13700,a18to64:22100,a65to79:1300,over80:100},
      {y:2035,total:40600,under18:14500,a18to64:24700,a65to79:1300,over80:100},
    ]},
  "Morocco":{ region:"Africa", flag:"🇲🇦", color:"#C1272D",
    data:[
      {y:2005,total:30500,under18:9900,a18to64:18800,a65to79:1600,over80:200},
      {y:2010,total:32600,under18:9900,a18to64:20600,a65to79:1900,over80:200},
      {y:2015,total:35000,under18:10100,a18to64:22600,a65to79:2000,over80:300},
      {y:2020,total:37000,under18:10200,a18to64:24200,a65to79:2300,over80:300},
      {y:2025,total:38800,under18:10300,a18to64:25700,a65to79:2500,over80:300},
      {y:2030,total:40500,under18:10200,a18to64:27200,a65to79:2900,over80:200},
      {y:2035,total:42100,under18:10000,a18to64:28700,a65to79:3200,over80:200},
    ]},
  "Tanzania":{ region:"Africa", flag:"🇹🇿", color:"#1EB53A",
    data:[
      {y:2005,total:38800,under18:19000,a18to64:18600,a65to79:1100,over80:100},
      {y:2010,total:45000,under18:21000,a18to64:22600,a65to79:1200,over80:200},
      {y:2015,total:53500,under18:24000,a18to64:28000,a65to79:1300,over80:200},
      {y:2020,total:61700,under18:28000,a18to64:32000,a65to79:1600,over80:100},
      {y:2025,total:70200,under18:31000,a18to64:37400,a65to79:1700,over80:100},
      {y:2030,total:80000,under18:34000,a18to64:43600,a65to79:2100,over80:300},
      {y:2035,total:91200,under18:38000,a18to64:51000,a65to79:2000,over80:200},
    ]},
  "Uganda":{ region:"Africa", flag:"🇺🇬", color:"#FCDC04",
    data:[
      {y:2005,total:27300,under18:14700,a18to64:11700,a65to79:800,over80:100},
      {y:2010,total:32900,under18:17300,a18to64:14600,a65to79:900,over80:100},
      {y:2015,total:39700,under18:20000,a18to64:18400,a65to79:1200,over80:100},
      {y:2020,total:46000,under18:22700,a18to64:21900,a65to79:1300,over80:100},
      {y:2025,total:52900,under18:25300,a18to64:26200,a65to79:1300,over80:100},
      {y:2030,total:60500,under18:28100,a18to64:30800,a65to79:1500,over80:100},
      {y:2035,total:69500,under18:31600,a18to64:36300,a65to79:1500,over80:100},
    ]},
  "Mozambique":{ region:"Africa", flag:"🇲🇿", color:"#009A44",
    data:[
      {y:2005,total:19700,under18:9500,a18to64:9400,a65to79:700,over80:100},
      {y:2010,total:23000,under18:10900,a18to64:11200,a65to79:800,over80:100},
      {y:2015,total:27200,under18:12600,a18to64:13500,a65to79:1000,over80:100},
      {y:2020,total:31300,under18:14200,a18to64:15900,a65to79:1100,over80:100},
      {y:2025,total:35700,under18:15900,a18to64:18700,a65to79:1000,over80:100},
      {y:2030,total:41000,under18:17800,a18to64:22000,a65to79:1100,over80:100},
      {y:2035,total:47200,under18:20200,a18to64:25700,a65to79:1200,over80:100},
    ]},
  // Middle East
  "Saudi Arabia":{ region:"Middle East", flag:"🇸🇦", color:"#006C35",
    data:[
      {y:2005,total:24200,under18:7800,a18to64:15700,a65to79:600,over80:100},
      {y:2010,total:28300,under18:7900,a18to64:19500,a65to79:800,over80:100},
      {y:2015,total:31600,under18:7700,a18to64:22900,a65to79:900,over80:100},
      {y:2020,total:35000,under18:7600,a18to64:26100,a65to79:1200,over80:100},
      {y:2025,total:37400,under18:7500,a18to64:28600,a65to79:1200,over80:100},
      {y:2030,total:40000,under18:7500,a18to64:31000,a65to79:1400,over80:100},
      {y:2035,total:42200,under18:7500,a18to64:33100,a65to79:1500,over80:100},
    ]},
  "UAE":{ region:"Middle East", flag:"🇦🇪", color:"#00732F",
    data:[
      {y:2005,total:4800,under18:850,a18to64:3820,a65to79:120,over80:10},
      {y:2010,total:7900,under18:1100,a18to64:6640,a65to79:140,over80:20},
      {y:2015,total:9100,under18:1100,a18to64:7820,a65to79:170,over80:10},
      {y:2020,total:9900,under18:1300,a18to64:8390,a65to79:200,over80:10},
      {y:2025,total:10400,under18:1400,a18to64:8770,a65to79:220,over80:10},
      {y:2030,total:11200,under18:1500,a18to64:9430,a65to79:260,over80:10},
      {y:2035,total:12100,under18:1600,a18to64:10200,a65to79:290,over80:10},
    ]},
  "Iran":{ region:"Middle East", flag:"🇮🇷", color:"#239F40",
    data:[
      {y:2005,total:70500,under18:24000,a18to64:43000,a65to79:3100,over80:400},
      {y:2010,total:74300,under18:22000,a18to64:48000,a65to79:3900,over80:400},
      {y:2015,total:79100,under18:20000,a18to64:54000,a65to79:4600,over80:500},
      {y:2020,total:84000,under18:19000,a18to64:59000,a65to79:5300,over80:700},
      {y:2025,total:88000,under18:19000,a18to64:63000,a65to79:5600,over80:400},
      {y:2030,total:92000,under18:19000,a18to64:66000,a65to79:6600,over80:400},
      {y:2035,total:96000,under18:19000,a18to64:69000,a65to79:7600,over80:400},
    ]},
  "Israel":{ region:"Middle East", flag:"🇮🇱", color:"#003399",
    data:[
      {y:2005,total:6900,under18:2100,a18to64:4200,a65to79:500,over80:100},
      {y:2010,total:7600,under18:2300,a18to64:4600,a65to79:600,over80:100},
      {y:2015,total:8400,under18:2600,a18to64:5100,a65to79:600,over80:100},
      {y:2020,total:9200,under18:2900,a18to64:5600,a65to79:600,over80:100},
      {y:2025,total:9800,under18:3100,a18to64:5900,a65to79:700,over80:100},
      {y:2030,total:10500,under18:3300,a18to64:6400,a65to79:700,over80:100},
      {y:2035,total:11200,under18:3500,a18to64:6800,a65to79:800,over80:100},
    ]},
  "Iraq":{ region:"Middle East", flag:"🇮🇶", color:"#CE1126",
    data:[
      {y:2005,total:28000,under18:13000,a18to64:13900,a65to79:1000,over80:100},
      {y:2010,total:32100,under18:14000,a18to64:16900,a65to79:1100,over80:100},
      {y:2015,total:37400,under18:15000,a18to64:21000,a65to79:1300,over80:100},
      {y:2020,total:41200,under18:15000,a18to64:24500,a65to79:1500,over80:100},
      {y:2025,total:44800,under18:15000,a18to64:28300,a65to79:1400,over80:100},
      {y:2030,total:48400,under18:15300,a18to64:31400,a65to79:1600,over80:100},
      {y:2035,total:52200,under18:15800,a18to64:34500,a65to79:1800,over80:100},
    ]},
  "Jordan":{ region:"Middle East", flag:"🇯🇴", color:"#007A3D",
    data:[
      {y:2005,total:5700,under18:2300,a18to64:3200,a65to79:180,over80:20},
      {y:2010,total:6500,under18:2300,a18to64:4000,a65to79:190,over80:10},
      {y:2015,total:7600,under18:2500,a18to64:4800,a65to79:270,over80:30},
      {y:2020,total:10200,under18:3300,a18to64:6600,a65to79:270,over80:30},
      {y:2025,total:10600,under18:3300,a18to64:6900,a65to79:370,over80:30},
      {y:2030,total:11100,under18:3300,a18to64:7400,a65to79:370,over80:30},
      {y:2035,total:11700,under18:3400,a18to64:7800,a65to79:470,over80:30},
    ]},
  "Kuwait":{ region:"Middle East", flag:"🇰🇼", color:"#007A3D",
    data:[
      {y:2005,total:2600,under18:700,a18to64:1850,a65to79:45,over80:5},
      {y:2010,total:3000,under18:700,a18to64:2250,a65to79:45,over80:5},
      {y:2015,total:3900,under18:900,a18to64:2950,a65to79:45,over80:5},
      {y:2020,total:4200,under18:1000,a18to64:3140,a65to79:55,over80:5},
      {y:2025,total:4400,under18:1000,a18to64:3310,a65to79:85,over80:5},
      {y:2030,total:4700,under18:1100,a18to64:3490,a65to79:105,over80:5},
      {y:2035,total:5000,under18:1100,a18to64:3750,a65to79:145,over80:5},
    ]},
  "Qatar":{ region:"Middle East", flag:"🇶🇦", color:"#8D1B3D",
    data:[
      {y:2005,total:850,under18:200,a18to64:630,a65to79:20,over80:0},
      {y:2010,total:1750,under18:280,a18to64:1440,a65to79:30,over80:0},
      {y:2015,total:2240,under18:350,a18to64:1860,a65to79:30,over80:0},
      {y:2020,total:2780,under18:500,a18to64:2240,a65to79:40,over80:0},
      {y:2025,total:2900,under18:520,a18to64:2340,a65to79:40,over80:0},
      {y:2030,total:3100,under18:550,a18to64:2490,a65to79:60,over80:0},
      {y:2035,total:3300,under18:580,a18to64:2660,a65to79:60,over80:0},
    ]},
  "Bahrain":{ region:"Middle East", flag:"🇧🇭", color:"#CE1126",
    data:[
      {y:2005,total:760,under18:200,a18to64:540,a65to79:20,over80:0},
      {y:2010,total:1100,under18:250,a18to64:820,a65to79:30,over80:0},
      {y:2015,total:1400,under18:300,a18to64:1070,a65to79:30,over80:0},
      {y:2020,total:1700,under18:360,a18to64:1300,a65to79:40,over80:0},
      {y:2025,total:1770,under18:370,a18to64:1360,a65to79:40,over80:0},
      {y:2030,total:1840,under18:380,a18to64:1410,a65to79:50,over80:0},
      {y:2035,total:1920,under18:390,a18to64:1480,a65to79:50,over80:0},
    ]},
  "Oman":{ region:"Middle East", flag:"🇴🇲", color:"#DB161B",
    data:[
      {y:2005,total:2500,under18:930,a18to64:1510,a65to79:55,over80:5},
      {y:2010,total:3100,under18:900,a18to64:2150,a65to79:45,over80:5},
      {y:2015,total:4200,under18:1000,a18to64:3130,a65to79:65,over80:5},
      {y:2020,total:4500,under18:1100,a18to64:3330,a65to79:65,over80:5},
      {y:2025,total:4900,under18:1200,a18to64:3600,a65to79:95,over80:5},
      {y:2030,total:5200,under18:1300,a18to64:3790,a65to79:105,over80:5},
      {y:2035,total:5500,under18:1400,a18to64:3990,a65to79:105,over80:5},
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
  const mod = genderFilter === "All" ? { u18:1, w:1, s:1, e:1 } :
    genderFilter === "Male" ? { u18:0.51, w:0.49, s:0.44, e:0.38 } :
    { u18:0.49, w:0.51, s:0.56, e:0.62 };
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
  const w    = Math.round(row.a18to64  * mod.w);
  const s    = Math.round(row.a65to79  * mod.s);
  const e    = Math.round(row.over80   * mod.e);
  const over65 = s + e;
  let total = 0;
  if (ageGroups.includes("under18")) total += u18;
  if (ageGroups.includes("18to64"))  total += w;
  if (ageGroups.includes("65to79"))  total += s;
  if (ageGroups.includes("over80"))  total += e;
  const breakdown = { under18:u18, a18to64:w, a65to79:s, over80:e, over65 };
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
          fontSize:11, color:C.sub, lineHeight:1, padding:0,
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
        background:"rgba(11,31,58,0.55)", backdropFilter:"blur(2px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:16,
      }}
    >
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:16, border:`1px solid ${C.border}`,
          boxShadow:"0 20px 60px rgba(11,31,58,0.4)",
          width:"100%", maxWidth:680, maxHeight:"88vh", overflowY:"auto",
          padding:"16px 18px 20px",
        }}
      >
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, color:C.navy}}>{data.title || "CHART"}</div>
          <button onClick={onClose} style={{
            border:`1px solid ${C.border}`, background:"#F4F8FC", borderRadius:8,
            width:30, height:30, cursor:"pointer", fontSize:16, color:C.sub, lineHeight:1,
          }}>×</button>
        </div>
        <div>{data.node}</div>
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
        <div style={{textAlign:"center",fontFamily:"system-ui",fontSize:9,color:C.sub,marginTop:6}}>Tap a slice for detail</div>
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
            <div style={{fontFamily:"system-ui",fontSize:11,color:"rgba(255,255,255,0.5)",lineHeight:1.5}}>Tap any slice of the donut to see its population, share of mix, 2030 projection and growth rate.</div>
            {/* mini legend */}
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px 10px",justifyContent:"center",marginTop:12}}>
              {slices.map(s=>(
                <div key={s.seg.label} onClick={()=>setActive(s.idx)} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                  <span style={{width:8,height:8,borderRadius:2,background:s.seg.color}}/>
                  <span style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.7)"}}>{s.seg.label}</span>
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
                <div style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2}}>{act.seg.range||"age band"}</div>
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
                <span style={{fontFamily:"system-ui",fontSize:11,color:"rgba(255,255,255,0.6)"}}>{row.k}</span>
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
  const H = big ? 300 : 90, barMax = big ? 250 : 72, lblFs = big ? 11 : 7, valFs = big ? 11 : 7, valTop = big ? -20 : -16;
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
              <text x={padL-4} y={y+3} textAnchor="end" fontSize="7.5" fill={C.sub} fontFamily="system-ui">{fmt(v)}</text>
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
              <text x={w-padR+4} y={lastY-1} fontSize="9" fontWeight="700" fill={col} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.3">{g>0?"+":""}{g.toFixed(2)}%</text>
              <text x={w-padR+4} y={lastY+7} fontSize="5.5" fill={C.sub} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">CAGR→30</text>
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
          <text key={y} x={toX(i)} y={h-padB+12} textAnchor="middle" fontSize="7.5" fill={hv&&hv.i===i?C.navy:C.sub} fontWeight={hv&&hv.i===i?700:400} fontFamily="system-ui">{y}</text>
        ))}
        {/* Projection label */}
        {years.includes(2025) && (
          <text x={toX(years.indexOf(2025))+4} y={padT+8} fontSize="6" fill={C.amber} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">PROJECTED ▶</text>
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
                <span style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.6)"}}>Series</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:"#fff"}}>{hv.s.label}</span>
              </div>
            )}
            {[
              {k:"Year", v:years[hv.i], c:"#fff"},
              {k:"Population", v:fmt(hv.s.values[hv.i]), c:"#fff"},
              {k:"CAGR → 2030", v:`${g>0?"+":""}${g.toFixed(2)}%`, c:gc},
            ].map(row=>(
              <div key={row.k} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:14,marginBottom:3}}>
                <span style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.6)"}}>{row.k}</span>
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
                <span style={{fontFamily:"system-ui",fontSize:10,color:C.sub}}>{s.label}</span>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:0.3,color:col}}>{g>0?"+":""}{g.toFixed(2)}% CAGR→30</span>
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
  const { under18, a18to64, a65to79, over80 } = dataRow;
  const groups = [
    { label:"80+",   total:over80,  mPct:0.38, fPct:0.62, color:C.red },
    { label:"65–79", total:a65to79, mPct:0.44, fPct:0.56, color:C.amber },
    { label:"18–64", total:a18to64, mPct:0.49, fPct:0.51, color:C.teal },
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
    { key:"a18to64", label:"18–64", color:C.teal  },
    { key:"a65to79", label:"65–79", color:C.amber },
    { key:"over80",  label:"80+",   color:C.red   },
  ];
  const valOf = (row, b) => row ? (row[b.key] || 0) : 0;
  const maxV = Math.max(1, ...valid.flatMap(s => BANDS.map(b => valOf(s.row, b))));

  const primary = valid.find(s => s.primary) || valid[0];
  const compares = valid.filter(s => !s.primary);

  const w = 320, h = height, padL = 38, padR = 8, padT = 14, padB = 30;
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
      {title && <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,textAlign:"center",marginBottom:4}}>{title}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
        {/* y gridlines (positioned on sqrt scale, labelled with true values) */}
        {[0,0.25,0.5,0.75,1].map(p=>{
          const val = maxV * p * p;            // invert sqrt for an evenly-spaced look
          const y = toY(val);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={w-padR} y2={y} stroke={C.border} strokeWidth="0.5"/>
              <text x={padL-5} y={y+3} textAnchor="end" fontSize="9" fill={C.sub} fontFamily="system-ui">{fmt(Math.round(val))}</text>
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
              <text x={cx(i)} y={inside ? baseY-7 : y-6} textAnchor="middle" fontSize="11" fontWeight="700"
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
                    <text x={cx(i)} y={labelY} textAnchor="middle" fontSize="9.5" fontWeight="700" fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.3"
                      fill={up?C.green2:pct<0?C.red:C.sub}>{up?"+":""}{pct.toFixed(1)}%</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* x-axis band labels */}
        {BANDS.map((b,i)=>(
          <text key={b.key} x={cx(i)} y={h-padB+15} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.navy} fontFamily="'Bebas Neue',sans-serif" letterSpacing="0.5">{b.label}</text>
        ))}
        <text x={padL+plotW/2} y={h-2} textAnchor="middle" fontSize="8.5" fill={C.sub} fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">AGE BAND · √ SCALE</text>
      </svg>
      {/* legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",justifyContent:"center",marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:14,height:11,borderRadius:2,background:`linear-gradient(90deg,${C.green},${C.teal},${C.amber},${C.red})`,opacity:0.85}}/>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:0.5,color:C.navy}}>{primary.year} (selected)</span>
        </div>
        {compares.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:18,height:0,borderTop:`2.5px solid ${s.color}`}}/>
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:0.5,color:C.sub}}>{s.year} · Δ% vs {primary.year}</span>
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
  const w_now    = Math.round(rowNow.a18to64 * mod.w);
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
  const bandKey = { "<18":"under18", "18-64":"a18to64", "65-79":"a65to79", "80+":"over80" };
  const bandRange = { "<18":"0–17 yrs", "18-64":"18–64 yrs", "65-79":"65–79 yrs", "80+":"80+ yrs" };
  const rawDonut = [
    { label:"<18",   value:u18_now,  color:C.green },
    { label:"18-64", value:w_now,    color:C.teal  },
    { label:"65-79", value:s_now,    color:C.amber },
    { label:"80+",   value:e_now,    color:C.red   },
  ].filter(s => s.value > 0);
  const donutTotal = rawDonut.reduce((a,b)=>a+b.value,0);
  const donutSegs = rawDonut.map(s => {
    const k = bandKey[s.label];
    const v2025 = row2025[k] * (mod[k==="under18"?"u18":k==="a18to64"?"w":k==="a65to79"?"s":"e"]);
    const v2030 = row2030[k] * (mod[k==="under18"?"u18":k==="a18to64"?"w":k==="a65to79"?"s":"e"]);
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
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1.5,color:color,marginTop:1}}>{countryData.region}</div>
          </div>
          {/* Aging index badge */}
          <div style={{textAlign:"center",marginRight:4}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:parseFloat(agingIndex)>18?C.red:parseFloat(agingIndex)>12?C.amber:C.green,lineHeight:1}}>{agingIndex}%</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1,color:C.sub}}>65+</div>
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
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.sub,letterSpacing:1}}>{expanded?"▲":"▼"}</div>
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1.5,color:C.sub,marginBottom:2}}>{label}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:c,letterSpacing:0.5,lineHeight:1}}>{value}</div>
            </div>
          ))}
        </div>

        {/* CAGR strip — highly visible growth rates (2025→2035) */}
        <div style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1.5,color:C.sub,flexShrink:0}}>CAGR 25–35</span>
          <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>Total</span>
              <CagrBadge value={totalCagr} size="sm"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>65+</span>
              <CagrBadge value={aging65Cagr} size="sm"/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>80+</span>
              <CagrBadge value={over80Cagr} size="sm"/>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED DETAIL */}
      {expanded && (
        <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 14px 18px"}}>
          {/* Donut + Pyramid side by side */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,alignItems:"start"}}>
            <Zoomable
              title={`${name} · Age Distribution ${year}`}
              onZoom={onZoom}
              renderLarge={()=>(
                <div>
                  <Donut interactive year={year} segments={donutSegs} size={240} centerLabel={agingIndex+"%"} centerSub="aged 65+"/>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:12}}>
                    {[{l:"<18",c:C.green},{l:"18-64",c:C.teal},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:11,height:11,borderRadius:3,background:c}}/>
                        <span style={{fontFamily:"system-ui",fontSize:12,color:C.sub}}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            >
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:6,textAlign:"center"}}>AGE DISTRIBUTION {year}</div>
                <Donut
                  segments={donutSegs}
                  size={110}
                  centerLabel={agingIndex+"%"}
                  centerSub="aged 65+"
                />
                <div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center",marginTop:8}}>
                  {[{l:"<18",c:C.green},{l:"18-64",c:C.teal},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
                      <div style={{width:7,height:7,borderRadius:2,background:c}}/>
                      <span style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Zoomable>
            <Zoomable
              title={`${name} · Population Pyramid ${year}`}
              onZoom={onZoom}
              renderLarge={()=><div style={{padding:"8px 0"}}><PopPyramid big dataRow={rowNow} title={`PYRAMID ${year}`}/></div>}
            >
              <PopPyramid dataRow={rowNow} title={`PYRAMID ${year}`}/>
            </Zoomable>
          </div>

          {/* Age distribution curve */}
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,flexWrap:"wrap",gap:6}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub}}>AGE DISTRIBUTION {[year,...compareYears].length>1 ? `${Math.min(year,...compareYears)}–${Math.max(year,...compareYears)}` : year}</div>
              <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1,color:C.sub}}>COMPARE:</span>
                {YEARS.filter(y=>y!==year).map(y=>{
                  const on = compareYears.includes(y);
                  return (
                    <button key={y} onClick={(e)=>{e.stopPropagation();setCompareYears(prev=>prev.includes(y)?prev.filter(x=>x!==y):[...prev,y]);}}
                      style={{
                        border:on?`1.5px solid ${C.navy}`:`1px solid ${C.border}`,
                        borderRadius:12,padding:"2px 8px",
                        background:on?C.navy:"#fff",
                        fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:0.5,
                        color:on?"#fff":C.sub,cursor:"pointer",
                      }}>{y}</button>
                  );
                })}
              </div>
            </div>
            {(()=>{
              const distSeries = [
                { year, row:rowNow, color, primary:true },
                ...compareYears.sort((a,b)=>a-b).map((y,i)=>({
                  year:y,
                  row:getDataForYear(countryData.data, y),
                  color:[C.purple,C.pink,"#3C7AC6",C.green2,C.red2,C.gold2][i%6],
                })),
              ];
              const yrLabel = [year,...compareYears].length>1 ? `${Math.min(year,...compareYears)}–${Math.max(year,...compareYears)}` : `${year}`;
              return (
                <Zoomable
                  title={`${name} · Age Distribution ${yrLabel}`}
                  onZoom={onZoom}
                  renderLarge={()=><AgeDistributionCurve height={340} series={distSeries}/>}
                >
                  <AgeDistributionCurve height={175} series={distSeries}/>
                </Zoomable>
              );
            })()}
          </div>

          {/* Trend line */}
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:6}}>POPULATION TREND 2005–2035</div>
            <Zoomable
              title={`${name} · Population Trend 2005–2035`}
              onZoom={onZoom}
              renderLarge={()=><TrendLine series={trendSeries} years={YEARS} height={360} width={640} showLegend={true}/>}
            >
              <TrendLine series={trendSeries} years={YEARS} height={110} showLegend={true}/>
            </Zoomable>
          </div>

          {/* Key stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <div style={{background:"#FFF8EC",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.amber}33`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1.5,color:C.amber,marginBottom:4}}>65+ AGEING GROWTH 2025→2035</div>
              <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.amber,lineHeight:1}}>{agingTrend}%</div>
                <CagrBadge value={aging65Cagr} label="CAGR" size="sm"/>
              </div>
              <div style={{fontFamily:"system-ui",fontSize:9,color:C.sub,marginTop:3}}>total change · {aging65Cagr.toFixed(2)}% per yr</div>
            </div>
            <div style={{background:"#F0FAF5",borderRadius:10,padding:"10px 12px",border:`1px solid ${C.green}33`}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1.5,color:C.green,marginBottom:4}}>80+ POPULATION {year}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:C.green,lineHeight:1}}>{fmt(Math.round(rowNow.over80 * mod.e))}</div>
              <div style={{fontFamily:"system-ui",fontSize:9,color:C.sub,marginTop:2}}>
                {((rowNow.over80/rowNow.total)*100).toFixed(1)}% of total
              </div>
            </div>
          </div>

          {/* Select for comparison */}
          <button onClick={e=>{e.stopPropagation();onSelect&&onSelect(name);}} style={{
            width:"100%",padding:"9px",borderRadius:10,
            border:`1.5px solid ${isSelected?C.red:C.teal}`,
            background:isSelected?C.red:C.teal,
            fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,
            color:"#fff",cursor:"pointer",
          }}>
            {isSelected?"✓ SELECTED FOR TABLE":"+ ADD TO COMPARISON"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── DEMOGRAPHIC MAP (Mapbox GL) ─────────────────────────────────────────────
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
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,alignSelf:"center"}}>SHADE BY</span>
        {[{id:"aging",l:"65+ Share"},{id:"total",l:"Total Pop"},{id:"cagr",l:"65+ CAGR"}].map(m=>(
          <button key={m.id} onClick={()=>onMetricChange(m.id)} style={{
            border:metric===m.id?`1.5px solid ${C.teal}`:`1px solid ${C.border}`,
            borderRadius:20,padding:"4px 12px",background:metric===m.id?C.teal:"#fff",
            fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,
            color:metric===m.id?"#fff":C.sub,cursor:"pointer",
          }}>{m.l}</button>
        ))}
      </div>

      <div style={{borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`}}>
        <div ref={containerRef} style={{width:"100%",height:340}}/>
      </div>

      {/* legend */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1,color:C.sub}}>{metricCfg.fmtV(lo)}</span>
        <div style={{flex:1,height:8,borderRadius:4,background:"linear-gradient(90deg,rgb(0,196,180),rgb(245,166,35),rgb(224,82,82))"}}/>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1,color:C.sub}}>{metricCfg.fmtV(hi)}</span>
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1.5,color:C.navy,marginLeft:4}}>{metricCfg.label}</span>
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
              <div style={{fontFamily:"system-ui",fontSize:9,color:"rgba(255,255,255,0.55)",marginTop:2}}>{COUNTRIES[hv.name]?.region} · {year}</div>
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
              <span style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.6)"}}>{row.k}</span>
              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,letterSpacing:0.5,color:row.c}}>{row.v}</span>
            </div>
          ))}
          {pinned && onPick && (
            <button onClick={(e)=>{e.stopPropagation();onPick(pinned);}} style={{
              width:"100%",marginTop:8,border:`1px solid ${C.teal}`,background:"transparent",color:C.teal,
              borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,cursor:"pointer",
            }}>OPEN FULL PROFILE ▸</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function PopulationDemographics() {

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("explorer"); // explorer | profiles
  const [region, setRegion]       = useState("Global");
  const [genderFilter, setGender] = useState("All");
  const [ageGroups, setAgeGroups] = useState(["under18","18to64","65to79","over80"]);
  const [selectedYear, setYear]   = useState(2025);
  const [selectedCountries, setSelectedCountries] = useState(["United Kingdom","Germany","Japan","United States"]);
  const [favCountries, setFavCountries] = useState([]);
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
        const w      = Math.round(rowNow.a18to64 * mod.w);
        const s      = Math.round(rowNow.a65to79 * mod.s);
        const e      = Math.round(rowNow.over80  * mod.e);
        const over65 = s + e;
        let selected = 0;
        if (ageGroups.includes("under18")) selected += u18;
        if (ageGroups.includes("18to64"))  selected += w;
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
          total:rowNow.total, under18:u18, a18to64:w, a65to79:s, over80:e, over65,
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
    if (ageGroups.includes("18to64"))  v += row.a18to64 * mod.w;
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
      a18to64: d.a18to64,
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
    const BL = { under18:"<18", "18to64":"18–64", "65to79":"65–79", over80:"80+" };
    const aLabel = ["under18","18to64","65to79","over80"].filter(b=>ageGroups.includes(b)).map(b=>BL[b]).join(" + ");
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
          if (ageGroups.includes("18to64"))  v += row.a18to64 * mod.w;
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
      { label:"18-64", key:"a18to64", range:"18–64 yrs", value:regionNow.a18to64, color:C.teal  },
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
    { id:"18to64",  label:"18 – 64",   color:C.teal,   bands:["18to64"] },
    { id:"over65",  label:"65+ (all)", color:C.amber,  bands:["65to79","over80"] },
    { id:"65to79",  label:"65 – 79",   color:C.gold2,  bands:["65to79"] },
    { id:"over80",  label:"80+",       color:C.red,    bands:["over80"] },
  ];

  const GENDER_CHIPS = ["All","Male","Female"];

  // Dynamic table age columns — reflect the currently selected age bands.
  // If both 65-79 and 80+ are on, also surface a combined 65+ column.
  const AGE_COL_DEFS = [
    { key:"under18", label:"<18",    color:C.green, band:"under18" },
    { key:"a18to64", label:"18–64",  color:C.teal,  band:"18to64"  },
    { key:"over65",  label:"65+",    color:C.amber, band:"__both65" },
    { key:"a65to79", label:"65–79",  color:C.gold2, band:"65to79"  },
    { key:"over80",  label:"80+",    color:C.red,   band:"over80"   },
  ];
  const ageColumns = AGE_COL_DEFS.filter(c => {
    if (c.band === "__both65") return ageGroups.includes("65to79") && ageGroups.includes("over80");
    return ageGroups.includes(c.band);
  });
  const BAND_LABELS = { under18:"<18", "18to64":"18–64", "65to79":"65–79", over80:"80+" };
  const ageLabel = ["under18","18to64","65to79","over80"]
    .filter(b => ageGroups.includes(b)).map(b => BAND_LABELS[b]).join(" + ");

  const SortArrow = ({col}) => sortCol===col
    ? <span style={{color:C.teal,fontSize:9,marginLeft:2}}>{sortDir==="desc"?"▼":"▲"}</span>
    : <span style={{color:C.border,fontSize:9,marginLeft:2}}>▼</span>;

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
              <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:4, color:C.teal, lineHeight:1.2, marginTop:1}}>POPULATION ANALYTICS</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2, color:"rgba(255,255,255,0.85)"}}>GLOBAL DEMOGRAPHICS</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:9, letterSpacing:2, color:C.teal, marginTop:1}}>2005 – 2035</div>
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
              fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:1.5,
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
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:6}}>REGION</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.keys(REGIONS).map(r=>{
                const active = region===r;
                return (
                  <button key={r} onClick={()=>{setRegion(r);}} style={{
                    border: active?`1.5px solid ${REGIONS[r].color}`:`1px solid ${C.border}`,
                    borderRadius:20, padding:"4px 12px",
                    background: active?REGIONS[r].color:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,
                    color:active?"#fff":C.sub,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",
                  }}>
                    <span style={{fontSize:11}}>{REGIONS[r].flag}</span>{r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Gender */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:6}}>GENDER</div>
            <div style={{display:"flex",gap:6}}>
              {GENDER_CHIPS.map(g=>{
                const active=genderFilter===g;
                const gc = g==="Male"?"#3C7AC6":g==="Female"?C.pink:C.navy;
                return (
                  <button key={g} onClick={()=>setGender(g)} style={{
                    border:active?`1.5px solid ${gc}`:`1px solid ${C.border}`,
                    borderRadius:20,padding:"4px 14px",
                    background:active?gc:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,
                    color:active?"#fff":C.sub,cursor:"pointer",
                  }}>{g}</button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Age Groups */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:6}}>AGE GROUPS</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {AGE_CHIPS.map(a=>{
                const active=chipActive(a);
                return (
                  <button key={a.id} onClick={()=>toggleAge(a)} style={{
                    border:active?`1.5px solid ${a.color}`:`1px solid ${C.border}`,
                    borderRadius:20,padding:"4px 14px",
                    background:active?a.color:"#fff",
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,
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
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub}}>YEAR</div>
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
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:0.5,
                    color:active?"#fff":future?C.amber:C.sub,cursor:"pointer",
                    textAlign:"center",
                  }}>{y}</button>
                );
              })}
            </div>
          </div>
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
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:2,color:C.teal,marginTop:1}}>POPULATION OVERVIEW · {selectedYear}</div>
                </div>
                {selectedYear > 2025 && (
                  <div style={{marginLeft:"auto",background:C.amber,borderRadius:8,padding:"3px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:"#fff"}}>PROJECTED</div>
                )}
              </div>

              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
                {[
                  {label:"TOTAL",   value:fmt(regionNow.total), color:REGIONS[region]?.color||C.teal},
                  {label:"< 18",    value:fmt(regionNow.under18), color:C.green},
                  {label:"18–64",   value:fmt(regionNow.a18to64), color:C.teal},
                  {label:"65–79",   value:fmt(regionNow.over65 - regionNow.over80), color:C.amber},
                  {label:"80+",     value:fmt(regionNow.over80), color:C.red},
                ].map(({label,value,color})=>(
                  <div key={label} style={{background:"rgba(255,255,255,0.07)",borderRadius:8,padding:"8px 4px",textAlign:"center",borderTop:`2px solid ${color}`}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1.5,color:"rgba(255,255,255,0.5)",marginBottom:2}}>{label}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color,letterSpacing:0.5,lineHeight:1}}>{value}</div>
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
                          {[{l:"<18",c:C.green},{l:"18-64",c:C.teal},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:11,height:11,borderRadius:3,background:c}}/>
                              <span style={{fontFamily:"system-ui",fontSize:12,color:C.sub}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )})}
                    title="Enlarge chart"
                    style={{position:"absolute",top:-2,right:-2,zIndex:2,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.12)",borderRadius:7,width:20,height:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",lineHeight:1,padding:0}}
                  >⤢</button>
                  <div onClick={()=>openZoom({title:`${region} · Age Distribution ${selectedYear}`, node:(
                      <div>
                        <Donut interactive year={selectedYear} segments={regionDonut} size={240} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
                        <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginTop:12}}>
                          {[{l:"<18",c:C.green},{l:"18-64",c:C.teal},{l:"65-79",c:C.amber},{l:"80+",c:C.red}].map(({l,c})=>(
                            <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
                              <div style={{width:11,height:11,borderRadius:3,background:c}}/>
                              <span style={{fontFamily:"system-ui",fontSize:12,color:C.sub}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )})} style={{cursor:"zoom-in"}}>
                    <Donut segments={regionDonut} size={100} centerLabel={agingPct+"%"} centerSub="aged 65+"/>
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:8}}>KEY INDICATORS</div>
                  {[
                    {label:"65+ Population", value:fmt(regionNow.over65), color:C.amber},
                    {label:"80+ Population", value:fmt(regionNow.over80), color:C.red},
                    {label:"Ageing Index",   value:agingPct+"%", color:parseFloat(agingPct)>20?C.red:C.amber},
                    {label:"Working Age",    value:((regionNow.a18to64/regionNow.total)*100).toFixed(1)+"%", color:C.teal},
                  ].map(({label,value,color})=>(
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"system-ui",fontSize:10,color:"rgba(255,255,255,0.6)"}}>{label}</span>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color,letterSpacing:0.5}}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regional trend bar */}
            <div style={{background:"rgba(0,0,0,0.2)",padding:"10px 16px 4px",borderTop:`1px solid rgba(255,255,255,0.08)`,position:"relative"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:"rgba(255,255,255,0.4)",marginBottom:4}}>65+ TREND</div>
              <button
                onClick={()=>openZoom({title:`${region} · 65+ Population Trend`, node:(
                  <PopBarChart big data={REGIONS[region]?.data.map(d=>({year:d.y,value:d.a65to79+d.over80,color:C.amber}))||[]} highlightYear={selectedYear}/>
                )})}
                title="Enlarge chart"
                style={{position:"absolute",top:8,right:10,zIndex:2,border:"1px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.12)",borderRadius:7,width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",lineHeight:1,padding:0}}
              >⤢</button>
              <div onClick={()=>openZoom({title:`${region} · 65+ Population Trend`, node:(
                  <PopBarChart big data={REGIONS[region]?.data.map(d=>({year:d.y,value:d.a65to79+d.over80,color:C.amber}))||[]} highlightYear={selectedYear}/>
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
          <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 16px",boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>DEMOGRAPHIC MAP</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginTop:1}}>{region.toUpperCase()} · {selectedYear} · CHANGE REGION ABOVE TO ZOOM</div>
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
            <div style={{fontFamily:"system-ui",fontSize:10,color:C.sub,marginTop:10,lineHeight:1.5}}>
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
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>SELECT COUNTRIES</div>
                  {activeCountries.length>0 ? (
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                      {activeCountries.slice(0,6).map(n=>{
                        const cd=COUNTRIES[n];
                        return (
                          <span key={n} style={{display:"inline-flex",alignItems:"center",gap:3,background:`${cd.color}18`,border:`1px solid ${cd.color}55`,borderRadius:14,padding:"2px 7px",fontFamily:"system-ui",fontSize:10,color:C.navy}}>
                            <span style={{fontSize:11}}>{cd.flag}</span>{n}
                            <span onClick={e=>{e.stopPropagation();toggleCountry(n);}} style={{marginLeft:1,color:cd.color,fontWeight:700,cursor:"pointer"}}>×</span>
                          </span>
                        );
                      })}
                      {activeCountries.length>6 && (
                        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:0.5,color:C.sub,alignSelf:"center"}}>+{activeCountries.length-6} more</span>
                      )}
                    </div>
                  ) : (
                    <div style={{fontFamily:"system-ui",fontSize:11,color:C.sub,marginTop:4}}>Tap to choose countries…</div>
                  )}
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:C.teal,lineHeight:1}}>{activeCountries.length}</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:7,letterSpacing:1,color:C.sub}}>SHOWN</div>
                </div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:C.sub}}>{selectorOpen?"▲":"▼"}</div>
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
                      <button onClick={selectAllVisible} style={{flex:1,border:`1px solid ${C.teal}`,background:allVisibleSelected?C.teal:"#fff",color:allVisibleSelected?"#fff":C.teal,borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,cursor:"pointer"}}>
                        ✓ SELECT ALL{countrySearch?` (${filteredCountriesList.length})`:""}
                      </button>
                      <button onClick={clearAllVisible} style={{flex:1,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,borderRadius:8,padding:"6px",fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,cursor:"pointer"}}>
                        ✕ CLEAR
                      </button>
                    </div>
                    {/* Checkbox list */}
                    <div style={{maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:2}}>
                      {filteredCountriesList.length===0 && (
                        <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,textAlign:"center",padding:"16px"}}>No countries match “{countrySearch}”.</div>
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
                              color:"#fff",fontSize:12,fontWeight:700,
                            }}>{checked?"✓":""}</span>
                            <span style={{fontSize:15}}>{cd.flag}</span>
                            <span style={{flex:1,fontFamily:"system-ui",fontSize:13,color:C.navy}}>{name}</span>
                            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:0.5,color:C.sub}}>{cd.region}</span>
                          </label>
                        );
                      })}
                    </div>
                    {/* Done */}
                    <button onClick={()=>setSelectorOpen(false)} style={{width:"100%",marginTop:8,border:"none",background:C.navy,color:"#fff",borderRadius:10,padding:"9px",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,letterSpacing:2,cursor:"pointer"}}>
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
                <div style={{fontFamily:"system-ui",fontSize:12,color:C.sub,marginTop:6}}>
                  {selectedCountries.length>0
                    ? "Your selections sit outside this region — pick countries below or switch region."
                    : "Tap countries below to add them to the table and charts."}
                </div>
              </div>
            )}

            {/* ── TREND CHART ── */}
            {trendSeries.length > 0 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 16px",boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>POPULATION TREND</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginTop:1}}>
                      {ageLabel} · {genderFilter.toUpperCase()}
                    </div>
                  </div>
                </div>
                <Zoomable
                  title="Population Trend 2005–2035"
                  onZoom={openZoom}
                  renderLarge={()=><TrendLine series={trendSeries} years={YEARS} height={360} width={640} showLegend={true}/>}
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
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>COMPARISON TABLE</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginTop:1}}>{selectedYear} · {region.toUpperCase()} · {genderFilter.toUpperCase()} · AGES {ageLabel}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:10,letterSpacing:1,color:C.teal}}>TOTAL: {fmt(grandTotal)}</div>
                </div>

                <div style={{fontFamily:"system-ui",fontSize:9,color:C.sub,padding:"0 16px 6px"}}>← swipe to see all columns →</div>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                  <table style={{borderCollapse:"collapse",fontSize:11,minWidth:"100%",whiteSpace:"nowrap"}}>
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
                              fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1.5,
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
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.navy,letterSpacing:0.5,lineHeight:1}}>{row.name}</div>
                                  <div style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>{row.region}</div>
                                </div>
                                <span style={{fontSize:10,color:C.teal,flexShrink:0}}>›</span>
                              </div>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.navy}}>{fmt(row.total)}</div>
                              <div style={{fontFamily:"system-ui",fontSize:8,color:C.sub}}>{pctOfTotal}%</div>
                            </td>
                            {ageColumns.map(c=>(
                              <td key={c.key} style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:c.color}}>{fmt(row[c.key])}</td>
                            ))}
                            <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.navy,background:"#F4F8FC"}}>{fmt(row.selected)}</td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <div style={{
                                display:"inline-block",padding:"2px 8px",borderRadius:10,
                                background:parseFloat(row.agingPct)>20?`${C.red}22`:parseFloat(row.agingPct)>14?`${C.amber}22`:`${C.green}22`,
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:10,
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
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:11,
                                color:row.growth>0?C.green:C.red,
                              }}>{row.growth>0?"+":""}{row.growth}%</span>
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right"}}>
                              <span style={{
                                fontFamily:"'Bebas Neue',sans-serif",fontSize:11,
                                color:row.aging65growth>50?C.red:row.aging65growth>20?C.amber:C.green,
                              }}>{row.aging65growth>0?"+":""}{row.aging65growth}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{background:"#F4F8FC",borderTop:`2px solid ${C.border}`}}>
                        <td style={{padding:"8px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:C.sub,position:"sticky",left:0,background:"#F4F8FC",zIndex:2}}>TOTAL ({sortedRows.length} COUNTRIES)</td>
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.navy}}>{fmt(tableRows.reduce((s,r)=>s+r.total,0))}</td>
                        {ageColumns.map(c=>(
                          <td key={c.key} style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:c.color}}>{fmt(tableRows.reduce((s,r)=>s+r[c.key],0))}</td>
                        ))}
                        <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.teal,background:"#E8F7F5"}}>{fmt(grandTotal)}</td>
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
                      <span style={{fontFamily:"system-ui",fontSize:9,color:C.sub}}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── AGEING COMPARISON BAR CHART ── */}
            {sortedRows.length > 1 && (
              <div style={{marginTop:12,background:"#fff",borderRadius:14,border:`1px solid ${C.border}`,padding:"14px 16px",boxShadow:"0 2px 10px rgba(11,31,58,0.06)"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy,marginBottom:4}}>65+ AGEING INDEX COMPARISON</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginBottom:12}}>% OF TOTAL POPULATION AGED 65+</div>
                {[...sortedRows].sort((a,b)=>parseFloat(b.agingPct)-parseFloat(a.agingPct)).map(row=>{
                  const pct = parseFloat(row.agingPct);
                  const barColor = pct>20?C.red:pct>14?C.amber:C.green;
                  return (
                    <div key={row.name} style={{marginBottom:7}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                        <div style={{fontFamily:"system-ui",fontSize:10,color:C.text,display:"flex",alignItems:"center",gap:5}}>
                          <span>{row.flag}</span>{row.name}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <CagrBadge value={row.aging65Cagr} label="65+ CAGR" size="sm"/>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:barColor,letterSpacing:0.5}}>{row.agingPct}%</div>
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
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>PROJECTED POPULATION 2026–2030</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub,marginTop:1}}>AGES {ageLabel} · {genderFilter.toUpperCase()} · CAGR-INTERPOLATED</div>
                  </div>
                  <div style={{background:C.amber,borderRadius:8,padding:"3px 9px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:"#fff"}}>PROJECTED</div>
                </div>

                <div style={{fontFamily:"system-ui",fontSize:9,color:C.sub,padding:"0 16px 6px"}}>← swipe to see all years →</div>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
                  <table style={{width:"100%",tableLayout:"fixed",borderCollapse:"collapse",fontSize:11,minWidth:600}}>
                    <colgroup>
                      <col style={{width:"22%"}}/>
                      {PROJ_YEARS.map(y=><col key={y} style={{width:`${62/PROJ_YEARS.length}%`}}/>)}
                      <col style={{width:"16%"}}/>
                    </colgroup>
                    <thead>
                      <tr style={{background:"#FFF8EC"}}>
                        <th style={{padding:"8px 6px 8px 10px",textAlign:"left",fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1.5,color:C.sub,borderBottom:`2px solid ${C.amber}`}}>COUNTRY</th>
                        {PROJ_YEARS.map(y=>(
                          <th key={y}
                            onClick={()=>y===2030&&setProjSortDesc(d=>!d)}
                            style={{padding:"8px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:0.5,color:y===2030?C.amber:C.sub,borderBottom:`2px solid ${C.amber}`,cursor:y===2030?"pointer":"default",whiteSpace:"nowrap"}}>
                            {y}{y===2030?(projSortDesc?" ▼":" ▲"):""}
                          </th>
                        ))}
                        <th style={{padding:"8px 10px 8px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:1,color:C.sub,borderBottom:`2px solid ${C.amber}`,whiteSpace:"nowrap"}}>CAGR %</th>
                      </tr>
                      <tr style={{background:"#FFFCF5"}}>
                        <th style={{padding:"2px 10px 4px",textAlign:"left",fontFamily:"system-ui",fontSize:7,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>pop / annual %</th>
                        {PROJ_YEARS.map(y=>(
                          <th key={y} style={{padding:"2px 6px 4px",textAlign:"center",fontFamily:"system-ui",fontSize:7,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>pop ▸ Δ%</th>
                        ))}
                        <th style={{padding:"2px 6px 4px",textAlign:"center",fontFamily:"system-ui",fontSize:7,color:C.sub,fontWeight:400,borderBottom:`1px solid ${C.border}`}}>26→30</th>
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
                              <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:C.navy,letterSpacing:0.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.name}</span>
                              <span style={{fontSize:9,color:C.sub,flexShrink:0,marginLeft:"auto"}}>›</span>
                            </div>
                          </td>
                          {PROJ_YEARS.map(y=>{
                            const a = row.annual[y];
                            return (
                              <td key={y} style={{padding:"6px 6px",textAlign:"center"}}>
                                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:y===2030?C.amber:C.navy,lineHeight:1.1}}>{fmt(row.years[y])}</div>
                                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,color:a>0?C.green:a<0?C.red:C.sub,lineHeight:1.1,marginTop:1}}>{a>0?"+":""}{a.toFixed(2)}%</div>
                              </td>
                            );
                          })}
                          <td style={{padding:"6px 8px 6px 6px",textAlign:"center"}}>
                            <span style={{
                              display:"inline-block",padding:"2px 7px",borderRadius:10,
                              background:row.cagr>1?`${C.green}22`:row.cagr<0?`${C.red}22`:`${C.amber}22`,
                              fontFamily:"'Bebas Neue',sans-serif",fontSize:10,
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
                            <td style={{padding:"8px 6px 8px 10px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:0.5,color:C.sub}}>TOTAL ({sortedProjection.length})</td>
                            {PROJ_YEARS.map(y=>{
                              const a=annual[y];
                              return (
                                <td key={y} style={{padding:"6px 6px",textAlign:"center"}}>
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:y===2030?C.amber:C.navy,lineHeight:1.1}}>{fmt(Math.round(tot[y]))}</div>
                                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:9,color:a>0?C.green2:a<0?C.red:C.sub,lineHeight:1.1,marginTop:1}}>{a>0?"+":""}{a.toFixed(2)}%</div>
                                </td>
                              );
                            })}
                            <td style={{padding:"6px 8px 6px 6px",textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:11,color:c>0?C.green2:C.red}}>{c>0?"+":""}{c.toFixed(2)}%</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
                <div style={{padding:"8px 16px 12px",fontFamily:"system-ui",fontSize:9,color:C.sub,lineHeight:1.5}}>
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
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,letterSpacing:2,color:C.navy}}>COUNTRY PROFILES</div>
                <div style={{background:C.teal,borderRadius:10,padding:"2px 8px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,color:"#fff"}}>{availableCountries.length}</div>
                <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                  {[{id:"size",label:"SIZE ▾"},{id:"alpha",label:"A–Z"}].map(o=>(
                    <button key={o.id} onClick={()=>setProfileSort(o.id)} style={{
                      border:profileSort===o.id?`1.5px solid ${C.teal}`:`1px solid ${C.border}`,
                      borderRadius:14,padding:"3px 10px",
                      background:profileSort===o.id?C.teal:"#fff",
                      fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,
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
                <span style={{fontFamily:"system-ui",fontSize:11,color:C.sub}}>
                  Use <span style={{color:C.teal,fontWeight:600}}>+</span> on any card to add it to your comparison list.
                </span>
                {activeCountries.length>0 && (
                  <button onClick={()=>setActiveTab("explorer")} style={{
                    marginLeft:"auto",border:`1px solid ${C.teal}`,background:C.teal,color:"#fff",
                    borderRadius:14,padding:"4px 11px",fontFamily:"'Bebas Neue',sans-serif",fontSize:9,letterSpacing:1,cursor:"pointer",whiteSpace:"nowrap",
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

        <div style={{marginTop:32,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif",fontSize:8,letterSpacing:2,color:C.sub}}>
          LIGHTHOUSE ORTHOPAEDICS · POPULATION ANALYTICS · 2025 VERIFIED (UN WPP 2024) FOR KEY MARKETS · OTHER YEARS MODELLED · 2026
        </div>
      </div>

      <ChartModal data={zoomData} onClose={()=>setZoomData(null)}/>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
    </div>
  );
}
