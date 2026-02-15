import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Compass, Heart, Tag, Star, Settings, Search, MapPin, X, ChevronDown,
    ChevronLeft, ChevronRight, Menu, Utensils, Home, Car, Stethoscope,
    Plane, MoreHorizontal, Scissors, Wrench, Dumbbell, Music, ShoppingBag,
    Coffee, Pizza, Truck, Flame, Waves, Tent, Bike, Hotel, Sparkles, Zap,
    BookOpen, Flower2, TreePine, Dog, Building2, GraduationCap, Award,
    Phone, Globe, Droplets, Wind, Hammer, PaintBucket, Plug, Key,
    Thermometer, Sofa, Package, Leaf, Shirt, Bath, Eye, Footprints,
    HandMetal, Gamepad2, Church, Ticket, Landmark, Shell, ParkingCircle,
    Baby, Loader2, AlertCircle, Navigation, Glasses, Bone, PersonStanding,
    Clock, Wifi, ExternalLink, Filter, Navigation2
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const light = {
    bg:'#fff',bgAlt:'#f9f9f9',sidebar:'#f7f7f7',sidebarBorder:'#ebebeb',
    text:'#1a1a1a',textSecondary:'#555',textMuted:'#999',border:'#e8e8e8',
    cardBg:'#fff',accent:'#1a1a1a',accentText:'#fff',hoverBg:'#f0f0f0',
    activeBg:'#e8e8e8',activeAccent:'#1a1a1a',badgeBg:'#f0f0f0',inputBg:'#f5f5f5',
    dropdownBg:'#fff',categoryBar:'#fafafa',categoryBorder:'#eee',
};
const dark = {
    bg:'#0a0a0a',bgAlt:'#0f0f0f',sidebar:'#0f0f0f',sidebarBorder:'#1e1e1e',
    text:'#f0f0f0',textSecondary:'#aaa',textMuted:'#666',border:'#222',
    cardBg:'#141414',accent:'#f0f0f0',accentText:'#0a0a0a',hoverBg:'#1a1a1a',
    activeBg:'#222',activeAccent:'#f0f0f0',badgeBg:'#1e1e1e',inputBg:'#141414',
    dropdownBg:'#161616',categoryBar:'#111',categoryBorder:'#222',
};

const mainCategories = [
    {id:'restaurants',label:'Restaurants',icon:Utensils,subs:[
        {name:'Takeout',icon:ShoppingBag},{name:'Lunch',icon:Utensils},{name:'Mexican',icon:Flame},
        {name:'Delivery',icon:Truck},{name:'Dinner',icon:Star},{name:'Bakeries',icon:Award},
        {name:'Hot & Trendy',icon:Zap},{name:'Coffee & Cafes',icon:Coffee},{name:'Italian',icon:Pizza},
        {name:'New Restaurants',icon:Sparkles},{name:'Pizza',icon:Pizza},{name:'Food Trucks',icon:Truck},
        {name:'Breakfast & Brunch',icon:Coffee},{name:'Chinese',icon:Utensils},{name:'Sports Bars',icon:Gamepad2},
    ]},
    {id:'home',label:'Home & Garden',icon:Home,subs:[
        {name:'Contractors',icon:Hammer},{name:'Roofing',icon:Home},{name:'Florists',icon:Flower2},
        {name:'Plumbers',icon:Droplets},{name:'Locksmiths',icon:Key},{name:'Tree Services',icon:TreePine},
        {name:'Electricians',icon:Plug},{name:'Painters',icon:PaintBucket},{name:'Home Cleaning',icon:Bath},
        {name:'HVAC',icon:Thermometer},{name:'Landscaping',icon:Leaf},{name:'Furniture',icon:Sofa},
        {name:'Appliance Repair',icon:Wrench},{name:'Nurseries',icon:Flower2},{name:'Movers',icon:Package},
    ]},
    {id:'auto',label:'Auto Services',icon:Car,subs:[
        {name:'Auto Repair',icon:Wrench},{name:'Car Wash',icon:Droplets},
        {name:'Body Shops',icon:Car},{name:'Auto Detailing',icon:Sparkles},
        {name:'Oil Change',icon:Droplets},{name:'Parking',icon:ParkingCircle},
        {name:'Tires',icon:Car},{name:'Car Dealers',icon:Car},
        {name:'Towing',icon:Truck},{name:'Junkyards',icon:Wrench},
    ]},
    {id:'health',label:'Health & Beauty',icon:Stethoscope,subs:[
        {name:'Dentists',icon:PersonStanding},{name:'Dermatologists',icon:Eye},{name:'Nail Salons',icon:HandMetal},
        {name:'Doctors',icon:Stethoscope},{name:'Podiatrists',icon:Footprints},{name:'Barbers',icon:Scissors},
        {name:'Chiropractors',icon:Bone},{name:'Massage',icon:HandMetal},{name:'Spas',icon:Waves},
        {name:'Optometrists',icon:Glasses},{name:'Hair Salons',icon:Scissors},{name:'Physical Therapy',icon:Dumbbell},
    ]},
    {id:'travel',label:'Travel & Activities',icon:Plane,subs:[
        {name:'Things to Do',icon:Compass},{name:'Bookstores',icon:BookOpen},{name:'Bike Rentals',icon:Bike},
        {name:'Kids Activities',icon:Baby},{name:'Mini Golf',icon:Gamepad2},{name:'Campgrounds',icon:Tent},
        {name:'Venues & Events',icon:Ticket},{name:'Bowling',icon:Gamepad2},{name:'Beaches',icon:Shell},
        {name:'Churches',icon:Church},{name:'Hotels',icon:Hotel},{name:'Swimming Pools',icon:Waves},
        {name:'Shopping Malls',icon:ShoppingBag},{name:'Taxis',icon:Car},{name:'Nightlife',icon:Music},
    ]},
    {id:'more',label:'More',icon:MoreHorizontal,subs:[
        {name:'Dry Cleaning',icon:Wind},{name:'Apartments',icon:Building2},{name:'Pet Groomers',icon:Dog},
        {name:'Laundromats',icon:Shirt},{name:'Junk Removal',icon:Truck},{name:'Banks',icon:Landmark},
        {name:'Thrift Stores',icon:ShoppingBag},{name:'Gyms',icon:Dumbbell},{name:'Real Estate',icon:Home},
        {name:'Tailors',icon:Scissors},{name:'Yoga & Pilates',icon:PersonStanding},{name:'Parking',icon:ParkingCircle},
    ]},
];
const navTabs = [
    {id:'discover',label:'Discover',icon:Compass},{id:'favorites',label:'Favorites',icon:Heart},
    {id:'deals',label:'Deals',icon:Tag},{id:'reviews',label:'My Reviews',icon:Star},
];

function pinIcon(hov){
    const c=hov?'#ef4444':'#1a1a1a', s=hov?30:22;
    return L.divIcon({className:'mp',html:`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="#fff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`,iconSize:[s,s],iconAnchor:[s/2,s],popupAnchor:[0,-s]});
}
function LocUser({onLoc}){
    const m=useMapEvents({locationfound(e){onLoc(e.latlng);m.flyTo(e.latlng,14)}});
    useEffect(()=>{m.locate({setView:false})},[m]); return null;
}
function FlyTo({c,z}){const m=useMap();useEffect(()=>{if(c)m.flyTo(c,z||14,{duration:1})},[c,z,m]);return null;}

// ─── Category Bar ─────────────────────────────────────────────
const CatBar=({th,onSel,sel})=>{
    const[h,sH]=useState(null),t=useRef(null);
    return(
    <div style={{backgroundColor:th.categoryBar,borderBottom:`1px solid ${th.categoryBorder}`,position:'relative',zIndex:60}}>
    <div style={{display:'flex',padding:'0 1rem'}}>
    {mainCategories.map(c=>{const o=h===c.id;return(
        <div key={c.id} onMouseEnter={()=>{clearTimeout(t.current);sH(c.id)}} onMouseLeave={()=>{t.current=setTimeout(()=>sH(null),200)}} style={{position:'relative'}}>
        <button style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.7rem 0.8rem',fontSize:'0.82rem',fontWeight:'500',color:o?th.text:th.textSecondary,backgroundColor:'transparent',border:'none',cursor:'pointer',fontFamily:"'Poppins',sans-serif",whiteSpace:'nowrap',borderBottom:o?`2px solid ${th.accent}`:'2px solid transparent'}}>
            {c.label}<ChevronDown size={12} style={{transform:o?'rotate(180deg)':'',transition:'0.2s'}}/>
        </button>
        {o&&<div onMouseEnter={()=>{clearTimeout(t.current);sH(c.id)}} onMouseLeave={()=>{t.current=setTimeout(()=>sH(null),200)}} style={{position:'absolute',top:'100%',left:0,backgroundColor:th.dropdownBg,border:`1px solid ${th.border}`,borderRadius:'12px',padding:'0.65rem',boxShadow:'0 12px 40px rgba(0,0,0,0.12)',zIndex:100,minWidth:'420px',display:'grid',gridTemplateColumns:c.subs.length>10?'repeat(3,1fr)':'repeat(2,1fr)',gap:'0.08rem'}}>
            {c.subs.map(s=>{const I=s.icon,sl=sel===s.name;return(
                <button key={s.name} onClick={()=>{onSel(sl?null:s.name);sH(null)}} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.45rem 0.55rem',borderRadius:'7px',border:'none',cursor:'pointer',backgroundColor:sl?th.activeBg:'transparent',fontFamily:"'Poppins',sans-serif",fontSize:'0.8rem',fontWeight:sl?'600':'450',color:sl?th.text:th.textSecondary,transition:'0.1s',textAlign:'left',width:'100%'}}
                    onMouseEnter={e=>{if(!sl){e.currentTarget.style.backgroundColor=th.hoverBg;e.currentTarget.style.color=th.text}}}
                    onMouseLeave={e=>{if(!sl){e.currentTarget.style.backgroundColor='transparent';e.currentTarget.style.color=th.textSecondary}}}
                ><I size={16} strokeWidth={1.5}/><span>{s.name}</span></button>
            )})}
        </div>}
        </div>
    )})}
    </div></div>);
};

// ─── Autocomplete Dropdown ────────────────────────────────────
const AutoDrop=({th,items,onPick,type})=>(
    <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:'4px',backgroundColor:th.dropdownBg,border:`1px solid ${th.border}`,borderRadius:'10px',boxShadow:'0 10px 32px rgba(0,0,0,0.12)',zIndex:200,overflow:'hidden',maxHeight:'320px',overflowY:'auto'}}>
    {type==='search' && items.length>0 && <div style={{padding:'0.5rem 0.7rem 0.2rem',fontSize:'0.68rem',fontWeight:'600',color:th.textMuted,textTransform:'uppercase',letterSpacing:'0.5px'}}>Popular</div>}
    {type==='location' && items.length>0 && items[0].type==='current' && null}
    {items.map((it,i)=>(
        <button key={i} onClick={()=>onPick(it)} style={{display:'flex',alignItems:'center',gap:'0.55rem',padding:'0.5rem 0.75rem',width:'100%',border:'none',cursor:'pointer',backgroundColor:'transparent',fontFamily:"'Poppins',sans-serif",fontSize:'0.82rem',color:it.type==='current'?'#3b82f6':th.text,fontWeight:it.type==='current'?'600':'450',textAlign:'left'}}
            onMouseEnter={e=>e.currentTarget.style.backgroundColor=th.hoverBg}
            onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
            {type==='location' ? (it.type==='current'?<Navigation2 size={15} color="#3b82f6"/>:<Clock size={14} color={th.textMuted}/>) : <Search size={14} color={th.textMuted}/>}
            <span>{it.label}</span>
        </button>
    ))}
    </div>
);

// ─── Rich Business Card ───────────────────────────────────────
const BizCard=({biz,th,hov,onHov,onFav,isFav})=>(
    <div onMouseEnter={()=>onHov(biz.id)} onMouseLeave={()=>onHov(null)} style={{display:'flex',gap:'0.85rem',padding:'0.85rem',borderBottom:`1px solid ${th.border}`,backgroundColor:hov?th.hoverBg:'transparent',transition:'0.1s'}}>
        {/* Image */}
        <div style={{width:'200px',minWidth:'200px',height:'145px',borderRadius:'8px',overflow:'hidden',position:'relative',backgroundColor:th.badgeBg}}>
            <img src={biz.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" onError={e=>{e.target.style.display='none'}}/>
            {biz.features?.includes('Website') && <div style={{position:'absolute',top:'6px',right:'6px',backgroundColor:'rgba(0,0,0,0.6)',borderRadius:'5px',padding:'0.15rem 0.3rem',display:'flex',alignItems:'center',gap:'0.15rem'}}><Globe size={10} color="#fff"/><span style={{fontSize:'0.58rem',color:'#fff'}}>Web</span></div>}
        </div>
        {/* Info */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:'0.3rem',marginBottom:'0.2rem'}}>
                <h3 style={{fontSize:'0.95rem',fontWeight:'600',color:th.text,margin:0,lineHeight:'1.2'}}>{biz.name}</h3>
                {biz.isVerified&&<div style={{width:'15px',height:'15px',borderRadius:'50%',backgroundColor:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'2px'}}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
                <button onClick={e=>{e.stopPropagation();onFav(biz.id)}} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',padding:'0.1rem',flexShrink:0}}>
                    <Heart size={17} fill={isFav?'#ef4444':'none'} color={isFav?'#ef4444':th.textMuted}/>
                </button>
            </div>
            {/* Tags */}
            <div style={{display:'flex',gap:'0.2rem',flexWrap:'wrap',marginBottom:'0.2rem'}}>
                {biz.tagLabels?.map((t,i)=><span key={i} style={{fontSize:'0.65rem',padding:'0.1rem 0.4rem',borderRadius:'4px',border:`1px solid ${th.border}`,color:th.textSecondary}}>{t}</span>)}
            </div>
            {/* Location + phone */}
            <div style={{display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.15rem',flexWrap:'wrap'}}>
                {biz.location!=='Nearby'&&<span style={{fontSize:'0.7rem',color:th.textMuted,display:'flex',alignItems:'center',gap:'0.15rem'}}><MapPin size={11}/>{biz.location}</span>}
                {biz.phone&&<span style={{fontSize:'0.7rem',color:th.textMuted,display:'flex',alignItems:'center',gap:'0.15rem'}}><Phone size={11}/>{biz.phone}</span>}
            </div>
            {/* Hours */}
            {biz.openingHours&&<div style={{fontSize:'0.67rem',color:th.textMuted,display:'flex',alignItems:'center',gap:'0.2rem',marginBottom:'0.15rem'}}><Clock size={10}/>{biz.openingHours.substring(0,50)}{biz.openingHours.length>50?'...':''}</div>}
            {/* Features */}
            {biz.features?.length>0&&<div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap',marginBottom:'0.15rem'}}>
                {biz.features.filter(f=>f!=='Phone'&&f!=='Website').slice(0,3).map((f,i)=><span key={i} style={{fontSize:'0.6rem',padding:'0.08rem 0.3rem',borderRadius:'4px',backgroundColor:th.badgeBg,color:th.textSecondary}}>{f}</span>)}
            </div>}
            {/* Description */}
            {biz.description&&<p style={{fontSize:'0.7rem',color:th.textMuted,margin:'0.1rem 0 0',lineHeight:'1.4',overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{biz.description}</p>}
            {/* Distance */}
            <div style={{fontSize:'0.65rem',color:th.textMuted,marginTop:'auto',paddingTop:'0.15rem'}}>
                {biz.distanceMeters<1000?`${biz.distanceMeters}m away`:`${(biz.distanceMeters/1000).toFixed(1)}km away`}
            </div>
        </div>
    </div>
);

// ─── Pagination ───────────────────────────────────────────────
const Pager=({page,total,onPage,th})=>{
    if(total<=1) return null;
    const pages=[];
    for(let i=1;i<=Math.min(total,5);i++) pages.push(i);
    if(total>5&&!pages.includes(total)) pages.push(total);
    return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.3rem',padding:'1rem',borderTop:`1px solid ${th.border}`}}>
        <button disabled={page<=1} onClick={()=>onPage(page-1)} style={{width:'32px',height:'32px',borderRadius:'6px',border:`1px solid ${th.border}`,backgroundColor:'transparent',cursor:page<=1?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:th.textMuted,opacity:page<=1?0.3:1}}><ChevronLeft size={16}/></button>
        {pages.map(p=>(
            <button key={p} onClick={()=>onPage(p)} style={{minWidth:'32px',height:'32px',borderRadius:'6px',border:p===page?'none':`1px solid ${th.border}`,backgroundColor:p===page?th.accent:'transparent',color:p===page?th.accentText:th.text,cursor:'pointer',fontWeight:p===page?'700':'500',fontSize:'0.82rem',fontFamily:"'Poppins',sans-serif"}}>{p}</button>
        ))}
        <button disabled={page>=total} onClick={()=>onPage(page+1)} style={{width:'32px',height:'32px',borderRadius:'6px',border:`1px solid ${th.border}`,backgroundColor:'transparent',cursor:page>=total?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:th.textMuted,opacity:page>=total?0.3:1}}><ChevronRight size={16}/></button>
    </div>);
};

// ─── Filter Panel ─────────────────────────────────────────────
const FilterPanel=({th,show,onClose,onApply,filters,setFilters})=>{
    if(!show) return null;
    const toggle=(key)=>setFilters(p=>({...p,[key]:!p[key]}));
    return(
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'280px',backgroundColor:th.dropdownBg,borderLeft:`1px solid ${th.border}`,zIndex:100,overflowY:'auto',boxShadow:'-4px 0 20px rgba(0,0,0,0.08)',padding:'1.2rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
            <h3 style={{fontSize:'1rem',fontWeight:'700',color:th.text,margin:0}}>Filters</h3>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:th.textMuted}}><X size={18}/></button>
        </div>
        {/* Suggested */}
        <div style={{marginBottom:'1rem'}}>
            <h4 style={{fontSize:'0.78rem',fontWeight:'600',color:th.text,marginBottom:'0.5rem'}}>Suggested</h4>
            {['Open Now','Accepts Cards','Free Wi-Fi','Wheelchair Accessible','Outdoor Seating','Delivery'].map(f=>(
                <label key={f} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 0',cursor:'pointer',fontSize:'0.8rem',color:th.textSecondary}}>
                    <input type="checkbox" checked={!!filters[f]} onChange={()=>toggle(f)} style={{accentColor:th.accent}}/>
                    {f}
                </label>
            ))}
        </div>
        {/* Distance */}
        <div style={{marginBottom:'1rem'}}>
            <h4 style={{fontSize:'0.78rem',fontWeight:'600',color:th.text,marginBottom:'0.5rem'}}>Distance</h4>
            {[{l:"Bird's-eye View",v:5000},{l:'Driving (5 mi)',v:8000},{l:'Biking (2 mi)',v:3200},{l:'Walking (1 mi)',v:1600},{l:'Within 4 blocks',v:400}].map(d=>(
                <label key={d.l} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 0',cursor:'pointer',fontSize:'0.8rem',color:th.textSecondary}}>
                    <input type="radio" name="dist" checked={filters.distance===d.v} onChange={()=>setFilters(p=>({...p,distance:d.v}))} style={{accentColor:th.accent}}/>
                    {d.l}
                </label>
            ))}
        </div>
        <button onClick={onApply} style={{width:'100%',padding:'0.55rem',borderRadius:'8px',backgroundColor:th.accent,color:th.accentText,border:'none',cursor:'pointer',fontWeight:'600',fontSize:'0.85rem',fontFamily:"'Poppins',sans-serif"}}>Apply Filters</button>
    </div>);
};

// ═══════════════════════════════════════════════════════════════
// ─── DISCOVER CONTENT ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const DiscoverContent=({th,favs,toggleFav})=>{
    const[biz,setBiz]=useState([]);
    const[loading,setLoad]=useState(false);
    const[err,setErr]=useState('');
    const[sq,setSq]=useState('');
    const[lq,setLq]=useState('');
    const[selCat,setSelCat]=useState(null);
    const[hovBiz,setHovBiz]=useState(null);
    const[mapC,setMapC]=useState(null);
    const[uLoc,setULoc]=useState(null);
    const[searched,setSearched]=useState(false);
    const[page,setPage]=useState(1);
    const[totalPages,setTotalPages]=useState(1);
    const[total,setTotal]=useState(0);

    // Autocomplete
    const[showSearchDrop,setShowSearchDrop]=useState(false);
    const[searchSugg,setSearchSugg]=useState([]);
    const[showLocDrop,setShowLocDrop]=useState(false);
    const[locSugg,setLocSugg]=useState([]);
    const searchRef=useRef(null);
    const locRef=useRef(null);
    const suggestTimer=useRef(null);

    // Filters
    const[showFilters,setShowFilters]=useState(false);
    const[filters,setFilters]=useState({distance:5000});

    // Close dropdowns on outside click
    useEffect(()=>{
        const h=e=>{
            if(searchRef.current&&!searchRef.current.contains(e.target)) setShowSearchDrop(false);
            if(locRef.current&&!locRef.current.contains(e.target)) setShowLocDrop(false);
        };
        document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
    },[]);

    // Fetch search suggestions
    const fetchSugg=useCallback(async(q)=>{
        try{const r=await fetch(`${API}/suggest?q=${encodeURIComponent(q)}`);
        if(r.ok){const d=await r.json();setSearchSugg(d.suggestions||[])}}catch{}
    },[]);

    // Fetch location suggestions
    const fetchLocSugg=useCallback(async(q)=>{
        try{const r=await fetch(`${API}/locations?q=${encodeURIComponent(q)}`);
        if(r.ok){const d=await r.json();setLocSugg(d.locations||[])}}catch{}
    },[]);

    const onSearchInput=(v)=>{setSq(v);clearTimeout(suggestTimer.current);
        suggestTimer.current=setTimeout(()=>fetchSugg(v),200);setShowSearchDrop(true);};
    const onLocInput=(v)=>{setLq(v);clearTimeout(suggestTimer.current);
        suggestTimer.current=setTimeout(()=>fetchLocSugg(v),300);setShowLocDrop(true);};

    // Main search
    const doSearch=useCallback(async(opts={})=>{
        const q=opts.query??sq, cat=opts.category??selCat, loc=opts.location??lq, pg=opts.page||1;
        let lat=mapC?.lat||uLoc?.lat, lng=mapC?.lng||uLoc?.lng;
        if(loc&&loc.trim()){
            setLoad(true);
            try{const r=await fetch(`${API}/geocode?q=${encodeURIComponent(loc)}`);
            if(r.ok){const g=await r.json();lat=g.lat;lng=g.lng;setMapC({lat,lng});setLq(g.displayName?.split(',').slice(0,2).join(',')||loc)}}catch{}}
        if(!lat||!lng){setErr('Allow location access or enter a location');setLoad(false);return}
        setLoad(true);setErr('');setSearched(true);setShowSearchDrop(false);setShowLocDrop(false);
        try{
            const p=new URLSearchParams({lat,lng,radius:filters.distance||5000,page:pg,per_page:15});
            if(q)p.set('q',q);if(cat)p.set('category',cat);
            const r=await fetch(`${API}/search?${p}`);if(!r.ok)throw new Error();
            const d=await r.json();
            setBiz(d.businesses||[]);setTotal(d.total||0);setTotalPages(d.totalPages||1);setPage(d.page||1);
            if(!mapC)setMapC({lat,lng});
        }catch{setErr('Could not fetch. Is backend running?');setBiz([])}
        setLoad(false);
    },[sq,selCat,lq,mapC,uLoc,filters.distance]);

    const handleLocate=useCallback(ll=>{setULoc(ll);if(!mapC)setMapC(ll)},[mapC]);
    const handleCatSel=useCallback(c=>{setSelCat(c);if(c){doSearch({category:c,query:''});setSq('')}},[doSearch]);
    const handlePage=useCallback(p=>{doSearch({page:p});window.scrollTo(0,0)},[doSearch]);
    const handleSearchPick=useCallback(it=>{setSq(it.label);setShowSearchDrop(false);doSearch({query:it.label})},[doSearch]);
    const handleLocPick=useCallback(it=>{
        if(it.type==='current'){if(uLoc){setMapC(uLoc);setLq('Current Location');doSearch({location:''})}return}
        setLq(it.label);setShowLocDrop(false);
        if(it.lat){setMapC({lat:it.lat,lng:it.lng});doSearch({location:it.label})}
    },[uLoc,doSearch]);
    const submit=()=>doSearch();
    const kd=e=>{if(e.key==='Enter')doSearch()};

    return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',position:'relative'}}>
        <CatBar th={th} onSel={handleCatSel} sel={selCat}/>
        {/* Search bar */}
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center',padding:'0.6rem 1rem',borderBottom:`1px solid ${th.border}`,backgroundColor:th.bg,zIndex:55}}>
            {/* Search input with autocomplete */}
            <div ref={searchRef} style={{position:'relative',flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem',backgroundColor:th.inputBg,borderRadius:'10px',padding:'0.45rem 0.65rem',border:`1.5px solid ${th.border}`}}>
                    <Search size={15} color={th.textMuted}/>
                    <input value={sq} onChange={e=>onSearchInput(e.target.value)} onFocus={()=>{fetchSugg(sq);setShowSearchDrop(true)}} onKeyDown={kd}
                        placeholder="Restaurants, plumbers, dentists..."
                        style={{flex:1,border:'none',background:'transparent',fontSize:'0.84rem',fontFamily:"'Poppins',sans-serif",color:th.text,outline:'none'}}/>
                    {(sq||selCat)&&<button onClick={()=>{setSq('');setSelCat(null)}} style={{background:'none',border:'none',cursor:'pointer',color:th.textMuted,display:'flex',padding:0}}><X size={14}/></button>}
                </div>
                {showSearchDrop&&searchSugg.length>0&&<AutoDrop th={th} items={searchSugg} onPick={handleSearchPick} type="search"/>}
            </div>
            {/* Location input with autocomplete */}
            <div ref={locRef} style={{position:'relative',width:'210px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem',backgroundColor:th.inputBg,borderRadius:'10px',padding:'0.45rem 0.65rem',border:`1.5px solid ${th.border}`}}>
                    <MapPin size={15} color={th.textMuted}/>
                    <input value={lq} onChange={e=>onLocInput(e.target.value)} onFocus={()=>{fetchLocSugg(lq);setShowLocDrop(true)}} onKeyDown={kd}
                        placeholder={uLoc?'Current location':'City, ZIP...'}
                        style={{flex:1,border:'none',background:'transparent',fontSize:'0.84rem',fontFamily:"'Poppins',sans-serif",color:th.text,outline:'none'}}/>
                </div>
                {showLocDrop&&locSugg.length>0&&<AutoDrop th={th} items={locSugg} onPick={handleLocPick} type="location"/>}
            </div>
            <button onClick={submit} style={{padding:'0.45rem 0.9rem',borderRadius:'10px',backgroundColor:th.accent,color:th.accentText,border:'none',cursor:'pointer',fontWeight:'600',fontSize:'0.84rem',fontFamily:"'Poppins',sans-serif"}}><Search size={15}/></button>
        </div>

        {/* Filter bar */}
        {searched&&<div style={{display:'flex',gap:'0.3rem',padding:'0.45rem 1rem',borderBottom:`1px solid ${th.border}`,backgroundColor:th.bg,alignItems:'center',zIndex:50}}>
            {selCat&&<span style={{fontSize:'0.76rem',fontWeight:'600',color:th.text,display:'flex',alignItems:'center',gap:'0.2rem',marginRight:'0.3rem'}}>
                {selCat}<button onClick={()=>{setSelCat(null);doSearch({category:null})}} style={{background:'none',border:'none',cursor:'pointer',color:th.textMuted,display:'flex',padding:0}}><X size={12}/></button>
            </span>}
            <button onClick={()=>setShowFilters(!showFilters)} style={{padding:'0.28rem 0.6rem',borderRadius:'7px',fontSize:'0.74rem',fontWeight:'500',cursor:'pointer',fontFamily:"'Poppins',sans-serif",border:`1.5px solid ${th.border}`,backgroundColor:showFilters?th.accent:'transparent',color:showFilters?th.accentText:th.textSecondary,display:'flex',alignItems:'center',gap:'0.2rem'}}>
                <Filter size={12}/>Filters
            </button>
            <span style={{marginLeft:'auto',fontSize:'0.72rem',color:th.textMuted}}>{total} results</span>
        </div>}

        {/* Main: map + listings */}
        <div style={{flex:1,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,zIndex:1}}>
                <MapContainer center={[40.56,-111.93]} zoom={12} style={{width:'100%',height:'100%'}} zoomControl>
                    <TileLayer attribution='&copy; OSM' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <LocUser onLoc={handleLocate}/>
                    {mapC&&<FlyTo c={[mapC.lat,mapC.lng]} z={14}/>}
                    {uLoc&&<Marker position={[uLoc.lat,uLoc.lng]} icon={L.divIcon({className:'ud',html:'<div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.5)"></div>',iconSize:[12,12],iconAnchor:[6,6]})}><Popup><span style={{fontFamily:'Poppins',fontSize:'0.8rem'}}>You are here</span></Popup></Marker>}
                    {/* Only current page markers */}
                    {biz.map(b=>(
                        <Marker key={b.id} position={[b.lat,b.lng]} icon={pinIcon(hovBiz===b.id)}
                            eventHandlers={{mouseover:()=>setHovBiz(b.id),mouseout:()=>setHovBiz(null)}}>
                            <Popup maxWidth={260}>
                                <div style={{fontFamily:"'Poppins',sans-serif",width:'230px'}}>
                                    <img src={b.image} alt="" style={{width:'100%',height:'100px',objectFit:'cover',borderRadius:'6px',marginBottom:'0.4rem'}} onError={e=>{e.target.style.display='none'}}/>
                                    <strong style={{fontSize:'0.88rem',display:'block',marginBottom:'0.15rem'}}>{b.name}</strong>
                                    <div style={{fontSize:'0.72rem',color:'#555',marginBottom:'0.1rem'}}>{b.tagLabels?.join(', ')}</div>
                                    <div style={{fontSize:'0.7rem',color:'#777'}}>{b.location}</div>
                                    {b.phone&&<div style={{fontSize:'0.7rem',color:'#777'}}>{b.phone}</div>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Listings panel */}
            <div style={{position:'absolute',top:0,left:0,bottom:0,width:'460px',zIndex:10,backgroundColor:th.bg,overflowY:'auto',borderRight:`1px solid ${th.border}`,boxShadow:'4px 0 20px rgba(0,0,0,0.05)',display:'flex',flexDirection:'column'}}>
                {/* Empty state */}
                {!searched&&!loading&&(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'3rem 2rem',textAlign:'center'}}>
                        <div style={{width:'80px',height:'80px',borderRadius:'50%',backgroundColor:th.badgeBg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1.5rem'}}>
                            <Search size={36} color={th.textMuted} style={{opacity:0.5}}/>
                        </div>
                        <h2 style={{fontSize:'1.1rem',fontWeight:'600',color:th.text,marginBottom:'0.4rem'}}>Search to discover</h2>
                        <p style={{fontSize:'0.84rem',color:th.textMuted,lineHeight:'1.5',maxWidth:'260px'}}>Search for businesses or browse categories above to get started</p>
                        <button onClick={()=>doSearch({query:''})} style={{marginTop:'1.5rem',padding:'0.55rem 1.4rem',borderRadius:'10px',backgroundColor:th.accent,color:th.accentText,border:'none',cursor:'pointer',fontWeight:'600',fontSize:'0.86rem',fontFamily:"'Poppins',sans-serif",display:'flex',alignItems:'center',gap:'0.35rem'}}>
                            <Navigation size={15}/>Explore nearby
                        </button>
                    </div>
                )}
                {loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'0.8rem'}}>
                    <Loader2 size={30} color={th.textMuted} style={{animation:'spin 1s linear infinite'}}/><p style={{fontSize:'0.85rem',color:th.textMuted}}>Searching...</p>
                </div>}
                {err&&!loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'2rem',textAlign:'center'}}>
                    <AlertCircle size={34} color="#ef4444" style={{marginBottom:'0.8rem',opacity:0.6}}/><p style={{fontSize:'0.88rem',color:th.text,fontWeight:'500'}}>{err}</p>
                </div>}
                {searched&&!loading&&!err&&(
                    <div style={{display:'flex',flexDirection:'column',flex:1}}>
                        <div style={{padding:'0.5rem 0.8rem 0.3rem'}}>
                            <span style={{fontSize:'0.76rem',fontWeight:'600',color:th.text}}>{selCat||'All Results'}</span>
                            <span style={{fontSize:'0.7rem',color:th.textMuted,marginLeft:'0.3rem'}}>· Page {page} of {totalPages}</span>
                        </div>
                        <div style={{flex:1,overflowY:'auto'}}>
                            {biz.map(b=><BizCard key={b.id} biz={b} th={th} hov={hovBiz===b.id} onHov={setHovBiz} onFav={toggleFav} isFav={favs.has(b.id)}/>)}
                            {biz.length===0&&<div style={{textAlign:'center',padding:'3rem'}}><p style={{color:th.textMuted}}>No businesses found</p></div>}
                        </div>
                        <Pager page={page} total={totalPages} onPage={handlePage} th={th}/>
                    </div>
                )}

                {/* Filter panel overlay */}
                <FilterPanel th={th} show={showFilters} onClose={()=>setShowFilters(false)} filters={filters} setFilters={setFilters} onApply={()=>{setShowFilters(false);doSearch({page:1})}}/>
            </div>
        </div>
    </div>);
};

// ─── Other tabs (placeholder) ─────────────────────────────────
const Placeholder=({th,icon:I,title,desc})=>(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'3rem',textAlign:'center'}}><I size={44} color={th.textMuted} style={{marginBottom:'1rem',opacity:0.4}}/><h2 style={{fontSize:'1.1rem',fontWeight:'600',color:th.text,marginBottom:'0.3rem'}}>{title}</h2><p style={{fontSize:'0.85rem',color:th.textMuted}}>{desc}</p></div>);
const FavoritesContent=({th})=><Placeholder th={th} icon={Heart} title="Favorites" desc="Heart businesses to save them here"/>;
const DealsContent=({th})=><Placeholder th={th} icon={Tag} title="Deals" desc="Deals will appear here"/>;
const ReviewsContent=({th})=><Placeholder th={th} icon={Star} title="My Reviews" desc="Your reviews will show here"/>;
const SettingsContent=({th,isDark,setDark})=>(
    <div style={{padding:'2rem 2.5rem',maxWidth:'500px',margin:'0 auto',overflowY:'auto',height:'100%'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:th.text,marginBottom:'1.5rem'}}>Settings</h1>
        {[{title:'Dark Mode',desc:'Switch themes',isOn:isDark,onToggle:()=>setDark(!isDark)},
          {title:'Notifications',desc:'Deal & review alerts',isOn:true},
          {title:'Location Tracking',desc:'Show nearby businesses',isOn:true}].map((it,i)=>(
            <div key={i} style={{backgroundColor:th.cardBg,border:`1px solid ${th.border}`,borderRadius:'12px',padding:'1rem',marginBottom:'0.6rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><h3 style={{fontSize:'0.88rem',fontWeight:'600',color:th.text,margin:'0 0 0.1rem'}}>{it.title}</h3><p style={{fontSize:'0.72rem',color:th.textMuted,margin:0}}>{it.desc}</p></div>
                <button onClick={it.onToggle} style={{width:'42px',height:'24px',borderRadius:'12px',border:'none',backgroundColor:it.isOn?th.accent:th.border,cursor:'pointer',position:'relative'}}>
                    <div style={{width:'18px',height:'18px',borderRadius:'50%',backgroundColor:it.isOn?th.accentText:'#fff',position:'absolute',top:'3px',left:it.isOn?'21px':'3px',transition:'0.3s',boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}/>
                </button>
            </div>
        ))}
    </div>
);

// ═══════════════════════════════════════════════════════════════
// ─── MAIN ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const DashboardPage=()=>{
    const{user}=useUser();const nav=useNavigate();
    const[isDark,setDark]=useState(false);
    const[tab,setTab]=useState('discover');
    const[sbOpen,setSbOpen]=useState(false);
    const[favs,setFavs]=useState(new Set());
    const th=isDark?dark:light;const sw=sbOpen?230:58;
    const toggleFav=useCallback(id=>{setFavs(p=>{const n=new Set(p);if(n.has(id))n.delete(id);else n.add(id);return n})},[]);

    const content=()=>{switch(tab){
        case'discover':return<DiscoverContent th={th} favs={favs} toggleFav={toggleFav}/>;
        case'favorites':return<FavoritesContent th={th}/>;
        case'deals':return<DealsContent th={th}/>;
        case'reviews':return<ReviewsContent th={th}/>;
        case'settings':return<SettingsContent th={th} isDark={isDark} setDark={setDark}/>;
        default:return<DiscoverContent th={th} favs={favs} toggleFav={toggleFav}/>}};

    return(
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',fontFamily:"'Poppins',-apple-system,sans-serif",backgroundColor:th.bg,color:th.text}}>
        <aside style={{width:`${sw}px`,minWidth:`${sw}px`,backgroundColor:th.sidebar,borderRight:`1px solid ${th.sidebarBorder}`,display:'flex',flexDirection:'column',padding:sbOpen?'0.9rem 0.5rem':'0.9rem 0.3rem',transition:'all 0.22s cubic-bezier(0.4,0,0.2,1)',overflow:'hidden',zIndex:70}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:sbOpen?'space-between':'center',padding:sbOpen?'0.3rem 0.4rem':'0.3rem 0',marginBottom:'1.2rem'}}>
                {sbOpen?<div style={{cursor:'pointer'}} onClick={()=>nav('/')}><img src={isDark?'/logo_dark.png':'/logo_light.png'} alt="Spark" style={{height:'24px'}}/></div>
                :<div style={{cursor:'pointer'}} onClick={()=>nav('/')}><Sparkles size={22} color="#3b82f6"/></div>}
                {sbOpen&&<button onClick={()=>setSbOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:th.textMuted,display:'flex',padding:'0.2rem'}}><ChevronLeft size={17}/></button>}
            </div>
            <nav style={{display:'flex',flexDirection:'column',gap:'0.15rem',flex:1}}>
                {!sbOpen&&<button onClick={()=>setSbOpen(true)} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'0.5rem',borderRadius:'9px',border:'none',cursor:'pointer',backgroundColor:'transparent',color:th.textMuted,marginBottom:'0.4rem'}} onMouseEnter={e=>e.currentTarget.style.backgroundColor=th.hoverBg} onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}><Menu size={18}/></button>}
                {navTabs.map(t=>{const a=tab===t.id,I=t.icon;return(
                    <button key={t.id} onClick={()=>setTab(t.id)} title={!sbOpen?t.label:undefined} style={{display:'flex',alignItems:'center',justifyContent:sbOpen?'flex-start':'center',gap:'0.6rem',padding:sbOpen?'0.5rem 0.6rem':'0.5rem',borderRadius:'9px',border:'none',cursor:'pointer',fontFamily:"'Poppins',sans-serif",fontSize:'0.83rem',fontWeight:a?'600':'450',color:a?th.activeAccent:th.textSecondary,backgroundColor:a?th.activeBg:'transparent',transition:'0.12s',width:'100%'}}
                        onMouseEnter={e=>{if(!a)e.currentTarget.style.backgroundColor=th.hoverBg}} onMouseLeave={e=>{if(!a)e.currentTarget.style.backgroundColor='transparent'}}
                    ><I size={18}/>{sbOpen&&<span>{t.label}</span>}</button>)})}
            </nav>
            <div style={{display:'flex',flexDirection:'column',gap:'0.1rem'}}>
                <button onClick={()=>setTab('settings')} title={!sbOpen?'Settings':undefined} style={{display:'flex',alignItems:'center',justifyContent:sbOpen?'flex-start':'center',gap:'0.6rem',padding:sbOpen?'0.5rem 0.6rem':'0.5rem',borderRadius:'9px',border:'none',cursor:'pointer',color:tab==='settings'?th.activeAccent:th.textMuted,backgroundColor:tab==='settings'?th.activeBg:'transparent',fontFamily:"'Poppins',sans-serif",fontSize:'0.8rem',width:'100%',fontWeight:tab==='settings'?'600':'450'}}
                    onMouseEnter={e=>{if(tab!=='settings')e.currentTarget.style.backgroundColor=th.hoverBg}} onMouseLeave={e=>{if(tab!=='settings')e.currentTarget.style.backgroundColor='transparent'}}
                ><Settings size={18}/>{sbOpen&&<span>Settings</span>}</button>
                <div style={{borderTop:`1px solid ${th.sidebarBorder}`,paddingTop:'0.5rem',marginTop:'0.2rem',display:'flex',alignItems:'center',justifyContent:sbOpen?'flex-start':'center',gap:'0.4rem',padding:sbOpen?'0.5rem 0.6rem 0.2rem':'0.5rem 0 0.2rem'}}>
                    <UserButton afterSignOutUrl="/" appearance={{elements:{avatarBox:{width:'28px',height:'28px'}}}}/>
                    {sbOpen&&<p style={{fontSize:'0.74rem',fontWeight:'600',color:th.text,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.fullName||user?.firstName||'User'}</p>}
                </div>
            </div>
        </aside>
        <main style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',backgroundColor:tab==='discover'?th.bg:th.bgAlt}}>{content()}</main>
    </div>);
};

const ds=document.createElement('style');
ds.textContent=`
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;450;500;600;700;800&display=swap');
::placeholder{color:#999!important}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
.mp,.ud{background:none!important;border:none!important}
.leaflet-control-attribution{font-size:9px!important;opacity:0.5}
.leaflet-popup-content-wrapper{border-radius:10px!important;padding:0!important}
.leaflet-popup-content{margin:8px!important}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
document.head.appendChild(ds);

export default DashboardPage;