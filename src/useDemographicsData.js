import { useState, useEffect, useCallback } from "react";

const SHEET_KEY = "2PACX-1vQSae0_Tg5B1vZqiIkuhOC-u33XW3joTZZW3fc2Tx2G4qXMrYl1RQD9rmO42HN9LLB8aZsK30t2MoqK";
const TABS = {
  countries: { gid: "0" },
  states: { gid: "55874397" },
};
const csvUrl = gid => `https://docs.google.com/spreadsheets/d/e/${SHEET_KEY}/pub?gid=${gid}&single=true&output=csv`;

export const BAND_DEFS = [
  { key: "under18",  label: "Under 18" },
  { key: "age18_49", label: "18-49" },
  { key: "age50_64", label: "50-64" },
  { key: "age65_79", label: "65-79" },
  { key: "age80plus", label: "80+" },
];

const BAND_KEYS = ["under18","age18_49","age50_64","age65_79","age80plus"];

const HEADER_ALIASES = {
  country:  ["country","countryname","name"],
  state:    ["state","statename"],
  year:     ["year","yr"],
  under18:  ["under18","a18","u18"],
  age18_49: ["a18to49","age18to49","18to49","1849"],
  age50_64: ["a50to64","age50to64","50to64","5064"],
  age65_79: ["a65to79","age65to79","65to79","6579"],
  age80plus:["over80","age80plus","80plus","80"],
  total:    ["total","totalpopulation","population"],
  lat:      ["lat","latitude"],
  lng:      ["lng","lon","longitude"],
};

function parseCsv(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')inQ=false;else field+=c; continue; }
    if (c==='"') inQ=true;
    else if (c===',') { row.push(field); field=""; }
    else if (c==='\n'||c==='\r') {
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(field); field="";
      if(row.length>1||row[0]!=="") rows.push(row);
      row=[];
    } else field+=c;
  }
  if(field!==""||row.length){row.push(field);if(row.length>1||row[0]!=="")rows.push(row);}
  if(!rows.length) return [];
  const headers = rows[0].map(h=>h.trim());
  return rows.slice(1).map(cells=>{
    const obj={};
    headers.forEach((h,i)=>{obj[h]=cells[i]!==undefined?cells[i].trim():"";});
    return obj;
  });
}

const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g,"");

function buildMap(headers) {
  const lookup={};
  for(const [canon,aliases] of Object.entries(HEADER_ALIASES))
    aliases.forEach(a=>(lookup[norm(a)]=canon));
  const map={};
  headers.forEach(h=>{const c=lookup[norm(h)];if(c)map[h]=c;});
  return map;
}

function toNum(v) {
  if(v==null||v==="") return null;
  const n=Number(String(v).replace(/,/g,"").trim());
  return Number.isFinite(n)?n:null;
}

function transform(rows, defaultCountry) {
  if(!rows.length) return {records:[],byCode:{},years:[]};
  const hmap = buildMap(Object.keys(rows[0]));
  const inv={};
  Object.entries(hmap).forEach(([a,c])=>(inv[c]=a));
  const get=(row,canon)=>inv[canon]!==undefined?row[inv[canon]]:undefined;
  const byCode={}, yearSet=new Set();
  for(const row of rows) {
    const name = get(row,"country")||get(row,"state");
    if(!name) continue;
    const code = name.trim();
    const year = toNum(get(row,"year"));
    if(year==null) continue;
    yearSet.add(year);
    if(!byCode[code]) byCode[code]={code,name:name.trim(),byYear:{},lat:toNum(get(row,"lat")),lng:toNum(get(row,"lng"))};
    if(defaultCountry) byCode[code].country=defaultCountry;
    const bands={};
    BAND_KEYS.forEach(k=>(bands[k]=toNum(get(row,k))||0));
    const tot=toNum(get(row,"total"))||BAND_KEYS.reduce((s,k)=>s+bands[k],0)||null;
    byCode[code].byYear[year]={...bands,total:tot};
  }
  return {records:Object.values(byCode),byCode,years:[...yearSet].sort((a,b)=>a-b)};
}

let cache=null, inflight=null;

async function load(force=false) {
  if(cache&&!force) return cache;
  if(inflight&&!force) return inflight;
  inflight=(async()=>{
    const crow = await fetch(csvUrl(TABS.countries.gid)).then(r=>r.text()).then(parseCsv);
    const countries = transform(crow);
    let states={records:[],byCode:{},years:[]};
    try {
      const srow = await fetch(csvUrl(TABS.states.gid)).then(r=>r.text()).then(parseCsv);
      states = transform(srow,"USA");
    } catch(e){ console.warn("states fetch failed",e.message); }
    const data={
      meta:{years:countries.years,bands:BAND_DEFS,fetchedAt:new Date().toISOString()},
      countries:countries.records, countriesByCode:countries.byCode,
      states:states.records, statesByCode:states.byCode,
    };
    cache=data; inflight=null; return data;
  })();
  try{return await inflight;}catch(e){inflight=null;throw e;}
}

export function useDemographicsData() {
  const [state,setState]=useState({data:cache,loading:!cache,error:null});
  useEffect(()=>{
    let alive=true;
    load().then(d=>alive&&setState({data:d,loading:false,error:null}))
          .catch(e=>alive&&setState({data:null,loading:false,error:e}));
    return()=>{alive=false;};
  },[]);
  const refetch=useCallback(()=>{
    cache=null;inflight=null;
    setState(s=>({...s,loading:true}));
    return load(true).then(d=>setState({data:d,loading:false,error:null}))
                     .catch(e=>setState({data:null,loading:false,error:e}));
  },[]);
  return {...state,refetch};
}

export const getYears = d=>d?.meta?.years||[];
export const getCountry = (d,name)=>d?.countriesByCode?.[name]||d?.countries?.find(c=>c.name===name)||null;
