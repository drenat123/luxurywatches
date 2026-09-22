import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
function readIds(key: string): string[] {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))].slice(0,200) : []; } catch { return []; }
}
interface Preferences { favourites: string[]; recent: string[]; toggleFavourite: (id: string) => void; remember: (id: string) => void }
const Context = createContext<Preferences | null>(null);
export function ShoppingPreferencesProvider({ children }: { children: ReactNode }) {
  const [favourites,setFavourites] = useState(()=>readIds('lw_favourites'));
  const [recent,setRecent] = useState(()=>readIds('lw_recent').slice(0,12));
  useEffect(()=>{try {localStorage.setItem('lw_favourites',JSON.stringify(favourites));}catch{/* Optional storage. */}},[favourites]);
  useEffect(()=>{try {localStorage.setItem('lw_recent',JSON.stringify(recent));}catch{/* Optional storage. */}},[recent]);
  const toggleFavourite=useCallback((id:string)=>setFavourites(ids=>ids.includes(id)?ids.filter(item=>item!==id):[id,...ids].slice(0,200)),[]);
  const remember=useCallback((id:string)=>setRecent(ids=>ids[0]===id?ids:[id,...ids.filter(item=>item!==id)].slice(0,12)),[]);
  return <Context.Provider value={{favourites,recent,toggleFavourite,remember}}>{children}</Context.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useShoppingPreferences(){const value=useContext(Context);if(!value)throw new Error('ShoppingPreferencesProvider is missing');return value;}
