import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { canonicalizeProducts } from './productIdentity';
import type { Product } from '@/types';

// Persist IDs only; prices and availability always come from the current catalogue.
export function useSavedProducts(ids: string[]) {
  const key=ids.join(',');
  const [products,setProducts]=useState<Product[]>([]);
  const [loading,setLoading]=useState(Boolean(key));
  const [error,setError]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    const wanted=key?key.split(','):[];
    setError(false);setLoading(Boolean(wanted.length));
    if(!wanted.length){setProducts([]);return;}
    void(async()=>{
      try {
        const {data,error:queryError}=await supabase.from('products').select('*').eq('is_active',true).in('id',wanted).abortSignal(controller.signal);
        if(queryError)throw queryError;
        const {byId}=canonicalizeProducts((data||[]) as Product[]);
        const ordered=wanted.map(id=>byId.get(id)).filter((p):p is Product=>Boolean(p));
        if(!controller.signal.aborted)setProducts([...new Map(ordered.map(p=>[p.id,p])).values()]);
      }catch{if(!controller.signal.aborted)setError(true);}
      finally{if(!controller.signal.aborted)setLoading(false);}
    })();
    return()=>controller.abort();
  },[key,attempt]);
  return {products,loading,error,retry:()=>setAttempt(value=>value+1)};
}
