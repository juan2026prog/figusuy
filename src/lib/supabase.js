import { createClient } from '@supabase/supabase-js'
import { sanitizeObject } from '../utils/sanitize'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Critical: Supabase environment variables are missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env or platform settings.')
}

const rawClient = createClient(supabaseUrl, supabaseAnonKey)

function wrapBuilder(builder) {
  if (!builder || typeof builder !== 'object') return builder;
  return new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        return (onFulfilled, onRejected) => {
          return target.then((res) => {
            if (res && res.data) {
              res.data = sanitizeObject(res.data);
            }
            if (onFulfilled) return onFulfilled(res);
            return res;
          }, onRejected);
        };
      }
      const val = target[prop];
      if (typeof val === 'function') {
        return (...args) => {
          let sanitizedArgs = args;
          if (['insert', 'update', 'upsert'].includes(prop)) {
            sanitizedArgs = args.map(arg => sanitizeObject(arg));
          }
          const result = val.apply(target, sanitizedArgs);
          if (result && typeof result === 'object' && 'then' in result) {
            return wrapBuilder(result);
          }
          return result;
        };
      }
      return val;
    }
  });
}

// Global sanitization proxy to ensure all text is NFC normalized
export const supabase = new Proxy(rawClient, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (table) => {
        const qb = target.from(table);
        return wrapBuilder(qb);
      }
    }
    if (prop === 'rpc') {
      return (fn, args, ...rest) => {
        const sanitizedArgs = args !== undefined ? sanitizeObject(args) : args;
        const result = target.rpc(fn, sanitizedArgs, ...rest);
        if (result && typeof result === 'object' && 'then' in result) {
          return wrapBuilder(result);
        }
        return result;
      }
    }
    if (prop === 'functions') {
      const fnObj = target.functions;
      return new Proxy(fnObj, {
        get(fnTarget, fnProp) {
          if (fnProp === 'invoke') {
            return (fnName, options, ...rest) => {
              if (options && options.body) {
                options.body = sanitizeObject(options.body);
              }
              const result = fnTarget.invoke(fnName, options, ...rest);
              if (result && typeof result === 'object' && 'then' in result) {
                return wrapBuilder(result);
              }
              return result;
            }
          }
          if (typeof fnTarget[fnProp] === 'function') {
            return fnTarget[fnProp].bind(fnTarget);
          }
          return fnTarget[fnProp];
        }
      });
    }
    return Reflect.get(target, prop, receiver);
  }
});

