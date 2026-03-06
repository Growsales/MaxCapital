/**
 * Mock Supabase client that mimics the real Supabase API
 * but returns data from local mock-data.ts instead.
 */
import { mockDataMap, MOCK_USER_ID_EXPORT, mockProfiles } from './mock-data';

// ---- Mock Auth User ----
const mockUser = {
  id: MOCK_USER_ID_EXPORT,
  email: 'joao@maxcapital.com.br',
  app_metadata: {},
  user_metadata: { nome: 'João Silva', tipo: 'parceiro' },
  aud: 'authenticated',
  created_at: '2024-01-15T10:00:00Z',
  role: 'authenticated',
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};

type AuthCallback = (event: string, session: any) => void;
let authCallbacks: AuthCallback[] = [];

// ---- Query Builder ----
function createQueryBuilder(tableName: string) {
  let data = [...(mockDataMap[tableName] || [])];
  let filters: Array<{ type: string; args: any[] }> = [];
  let orderField: string | null = null;
  let orderAscending = true;
  let limitCount: number | null = null;
  let rangeStart: number | null = null;
  let rangeEnd: number | null = null;
  let selectFields: string = '*';
  let isSingle = false;
  let isMaybeSingle = false;
  let isHead = false;
  let isCount = false;
  let isInsert = false;
  let isUpdate = false;
  let isDelete = false;
  let insertData: any = null;
  let updateData: any = null;

  function applyFilters(items: any[]): any[] {
    let result = [...items];
    for (const filter of filters) {
      switch (filter.type) {
        case 'eq':
          result = result.filter(item => item[filter.args[0]] === filter.args[1]);
          break;
        case 'neq':
          result = result.filter(item => item[filter.args[0]] !== filter.args[1]);
          break;
        case 'gt':
          result = result.filter(item => item[filter.args[0]] > filter.args[1]);
          break;
        case 'gte':
          result = result.filter(item => item[filter.args[0]] >= filter.args[1]);
          break;
        case 'lt':
          result = result.filter(item => item[filter.args[0]] < filter.args[1]);
          break;
        case 'lte':
          result = result.filter(item => item[filter.args[0]] <= filter.args[1]);
          break;
        case 'like':
        case 'ilike': {
          const pattern = filter.args[1].replace(/%/g, '.*');
          const regex = new RegExp(pattern, filter.type === 'ilike' ? 'i' : '');
          result = result.filter(item => regex.test(String(item[filter.args[0]] || '')));
          break;
        }
        case 'in':
          result = result.filter(item => filter.args[1].includes(item[filter.args[0]]));
          break;
        case 'is':
          result = result.filter(item => item[filter.args[0]] === filter.args[1]);
          break;
        case 'contains':
          result = result.filter(item => {
            const val = item[filter.args[0]];
            if (Array.isArray(val)) return filter.args[1].every((v: any) => val.includes(v));
            return false;
          });
          break;
      }
    }
    return result;
  }

  const builder: any = {
    select(fields?: string, opts?: { count?: string; head?: boolean }) {
      if (fields) selectFields = fields;
      if (opts?.head) isHead = true;
      if (opts?.count) isCount = true;
      return builder;
    },
    insert(d: any) {
      isInsert = true;
      insertData = d;
      return builder;
    },
    upsert(d: any, _opts?: any) {
      isInsert = true;
      insertData = d;
      return builder;
    },
    update(d: any) {
      isUpdate = true;
      updateData = d;
      return builder;
    },
    delete() {
      isDelete = true;
      return builder;
    },
    eq(col: string, val: any) { filters.push({ type: 'eq', args: [col, val] }); return builder; },
    neq(col: string, val: any) { filters.push({ type: 'neq', args: [col, val] }); return builder; },
    gt(col: string, val: any) { filters.push({ type: 'gt', args: [col, val] }); return builder; },
    gte(col: string, val: any) { filters.push({ type: 'gte', args: [col, val] }); return builder; },
    lt(col: string, val: any) { filters.push({ type: 'lt', args: [col, val] }); return builder; },
    lte(col: string, val: any) { filters.push({ type: 'lte', args: [col, val] }); return builder; },
    like(col: string, val: any) { filters.push({ type: 'like', args: [col, val] }); return builder; },
    ilike(col: string, val: any) { filters.push({ type: 'ilike', args: [col, val] }); return builder; },
    in(col: string, val: any[]) { filters.push({ type: 'in', args: [col, val] }); return builder; },
    is(col: string, val: any) { filters.push({ type: 'is', args: [col, val] }); return builder; },
    contains(col: string, val: any) { filters.push({ type: 'contains', args: [col, val] }); return builder; },
    order(col: string, opts?: { ascending?: boolean }) {
      orderField = col;
      orderAscending = opts?.ascending ?? true;
      return builder;
    },
    limit(count: number) { limitCount = count; return builder; },
    range(start: number, end: number) { rangeStart = start; rangeEnd = end; return builder; },
    single() { isSingle = true; return builder; },
    maybeSingle() { isMaybeSingle = true; return builder; },
    then(resolve: any, reject?: any) {
      try {
        let result: any;

        if (isInsert) {
          const newItem = Array.isArray(insertData)
            ? insertData.map(item => ({ id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...item, created_at: new Date().toISOString() }))
            : [{ id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...insertData, created_at: new Date().toISOString() }];
          
          if (!mockDataMap[tableName]) mockDataMap[tableName] = [];
          mockDataMap[tableName].push(...newItem);

          if (isSingle) {
            result = { data: newItem[0], error: null, count: null };
          } else {
            result = { data: newItem, error: null, count: null };
          }
        } else if (isUpdate) {
          const filtered = applyFilters(mockDataMap[tableName] || []);
          filtered.forEach(item => {
            Object.assign(item, updateData, { updated_at: new Date().toISOString() });
          });
          if (isSingle && filtered.length > 0) {
            result = { data: filtered[0], error: null, count: null };
          } else {
            result = { data: filtered, error: null, count: null };
          }
        } else if (isDelete) {
          const before = (mockDataMap[tableName] || []).length;
          const toKeep = (mockDataMap[tableName] || []).filter(item => {
            return !applyFilters([item]).length;
          });
          mockDataMap[tableName] = toKeep;
          result = { data: null, error: null, count: before - toKeep.length };
        } else {
          // SELECT
          let items = applyFilters(mockDataMap[tableName] || []);

          if (orderField) {
            items.sort((a, b) => {
              const aVal = a[orderField!];
              const bVal = b[orderField!];
              if (aVal < bVal) return orderAscending ? -1 : 1;
              if (aVal > bVal) return orderAscending ? 1 : -1;
              return 0;
            });
          }

          if (rangeStart !== null && rangeEnd !== null) {
            items = items.slice(rangeStart, rangeEnd + 1);
          }

          if (limitCount !== null) {
            items = items.slice(0, limitCount);
          }

          if (isHead) {
            result = { data: null, error: null, count: items.length };
          } else if (isSingle) {
            result = { data: items[0] || null, error: items.length === 0 ? null : null, count: null };
          } else if (isMaybeSingle) {
            result = { data: items[0] || null, error: null, count: null };
          } else {
            result = { data: items, error: null, count: isCount ? items.length : null };
          }
        }

        resolve(result);
      } catch (err) {
        if (reject) reject(err);
        else resolve({ data: null, error: err, count: null });
      }
    },
  };

  return builder;
}

// ---- Mock Supabase Client ----
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
    getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    signInWithPassword: ({ email, password }: { email: string; password: string }) => {
      console.log('[Mock] signInWithPassword:', email);
      // Notify listeners
      setTimeout(() => authCallbacks.forEach(cb => cb('SIGNED_IN', mockSession)), 100);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signInWithOAuth: ({ provider }: { provider: string }) => {
      console.log('[Mock] signInWithOAuth:', provider);
      setTimeout(() => authCallbacks.forEach(cb => cb('SIGNED_IN', mockSession)), 100);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signUp: ({ email, password, options }: any) => {
      console.log('[Mock] signUp:', email);
      setTimeout(() => authCallbacks.forEach(cb => cb('SIGNED_IN', mockSession)), 100);
      return Promise.resolve({ data: { user: mockUser, session: mockSession }, error: null });
    },
    signOut: () => {
      console.log('[Mock] signOut');
      return Promise.resolve({ error: null });
    },
    onAuthStateChange: (callback: AuthCallback) => {
      authCallbacks.push(callback);
      // Immediately fire with current session
      setTimeout(() => callback('INITIAL_SESSION', mockSession), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authCallbacks = authCallbacks.filter(cb => cb !== callback);
            },
          },
        },
      };
    },
  },
  from: (tableName: string) => createQueryBuilder(tableName),
  functions: {
    invoke: (fnName: string, options?: any) => {
      console.log('[Mock] Edge function invoked:', fnName, options);
      return Promise.resolve({ data: { success: true }, error: null });
    },
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => {
        console.log('[Mock] Storage upload:', bucket, path);
        return Promise.resolve({ data: { path }, error: null });
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://mock-storage.local/${bucket}/${path}` },
      }),
      download: (path: string) => Promise.resolve({ data: new Blob(), error: null }),
      remove: (paths: string[]) => Promise.resolve({ data: paths, error: null }),
      list: (prefix?: string) => Promise.resolve({ data: [], error: null }),
    }),
  },
} as any;

// Helper to get current user
export const getCurrentUser = async () => mockUser;

// Helper to get current session  
export const getCurrentSession = async () => mockSession;
