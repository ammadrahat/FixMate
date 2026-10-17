import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { JobOrder, JobStatus, ProviderService } from '@/types';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/Theme';

// Storage keys
const STORAGE_KEYS = {
  ORDERS: '@fixmate_orders',
  PROVIDER_SERVICES: '@fixmate_provider_services',
  SYNC_QUEUE: '@fixmate_sync_queue',
  DELETED_SERVICES: '@fixmate_deleted_services',
};

// Queue operation types
export type SyncOperationType =
  | 'CREATE_ORDER'
  | 'CANCEL_ORDER'
  | 'POSTPONE_ORDER'
  | 'ACCEPT_ORDER'
  | 'COMPLETE_ORDER'
  | 'CREATE_SERVICE'
  | 'TOGGLE_SERVICE'
  | 'DELETE_SERVICE';

export interface SyncQueueItem {
  id: string;
  type: SyncOperationType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// Initial demo orders for fallback/offline presentation with realistic distinct addresses
const INITIAL_DEMO_ORDERS: JobOrder[] = [
  {
    id: 'ord-101',
    customer_id: 'cust-1',
    customer_name: 'Ahmed Khan',
    customer_phone: '+92 300 1234567',
    service_title: 'Bathroom Leakage & Angle Valve Repair',
    category: 'Plumbing',
    status: 'in_progress',
    provider_name: 'Usman Ghani (Plumber)',
    scheduled_date: 'Today, 2:30 PM',
    address: 'House # 18-A, Street 4, Sector F-11/2',
    city: 'Islamabad',
    amount: 1200,
    created_at: '2026-10-09T10:00:00Z',
  },
  {
    id: 'ord-102',
    customer_id: 'cust-1',
    customer_name: 'Ahmed Khan',
    customer_phone: '+92 300 1234567',
    service_title: 'Ceiling Fan & LED Chandelier Installation',
    category: 'Electrical Work',
    status: 'completed',
    provider_name: 'Tariq Mehmood (Electrician)',
    scheduled_date: 'Yesterday, 11:00 AM',
    address: 'Flat 304, Clifton Pearl, Block 5, Clifton',
    city: 'Karachi',
    amount: 1800,
    created_at: '2026-10-08T09:30:00Z',
  },
];

// Initial demo provider services
const INITIAL_DEMO_SERVICES: ProviderService[] = [
  {
    id: 'srv-101',
    provider_id: 'prov-1',
    title: 'Emergency Pipe Leakage & Sanitary Repair',
    category: 'Plumbing',
    description: 'Quick response pipe fixing, mixer installation, and drain unblocking.',
    price: 1500,
    duration: '1-2 Hours',
    is_active: true,
    created_at: '2026-10-08T08:00:00Z',
  },
  {
    id: 'srv-102',
    provider_id: 'prov-1',
    title: 'Water Tank Overhaul & Motor Connection',
    category: 'Plumbing',
    description: 'Complete water storage cleaning, float switch wiring, and pressure check.',
    price: 2500,
    duration: '2-3 Hours',
    is_active: true,
    created_at: '2026-10-09T12:00:00Z',
  },
];

// SyncContext Interface
export interface SyncContextType {
  isOnline: boolean;
  pendingCount: number;
  isLoading: boolean;
  orders: JobOrder[];
  services: ProviderService[];
  syncNow: () => Promise<{ success: boolean; syncedCount: number; errors: any[] }>;
  createOrder: (orderData: Partial<JobOrder>) => Promise<{ success: boolean; order: JobOrder; isOffline: boolean }>;
  cancelOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; isOffline: boolean }>;
  postponeOrder: (orderId: string, newDate: string, reason?: string) => Promise<{ success: boolean; isOffline: boolean }>;
  acceptOrder: (orderId: string, providerId?: string, providerName?: string) => Promise<{ success: boolean; isOffline: boolean }>;
  completeOrder: (orderId: string) => Promise<{ success: boolean; isOffline: boolean }>;
  createService: (serviceData: Partial<ProviderService>) => Promise<{ success: boolean; service: ProviderService; isOffline: boolean }>;
  toggleService: (serviceId: string, requesterId?: string) => Promise<{ success: boolean; isOffline: boolean }>;
  deleteService: (serviceId: string, requesterId?: string) => Promise<{ success: boolean; isOffline: boolean }>;
  refreshOrders: () => Promise<void>;
  refreshServices: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Safe helper to read useAuth if AuthProvider is an ancestor
function useSafeAuth() {
  try {
    return useAuth();
  } catch {
    return null;
  }
}

// SSR safe storage helpers
const isServer = typeof window === 'undefined';

async function safeGetItem(key: string): Promise<string | null> {
  if (isServer) return null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  if (isServer) return;
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

export function SyncProvider({
  children,
  userId: propUserId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const auth = useSafeAuth();
  const currentUserId = propUserId || auth?.user?.id || auth?.profile?.id || 'guest-user';

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<JobOrder[]>([]);
  const [services, setServices] = useState<ProviderService[]>([]);

  const isSyncingRef = useRef<boolean>(false);
  const previousOnlineRef = useRef<boolean>(true);

  // 1. Connectivity Check (Fetch-based ping)
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://clients3.google.com/generate_204?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok || res.status === 204 || res.status === 200;
    } catch {
      // Fallback check to public DNS or Supabase if available
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const fallbackRes = await fetch(`https://1.1.1.1?_=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return fallbackRes.ok || fallbackRes.status < 500;
      } catch {
        return false;
      }
    }
  }, []);

  // 2. Queue Management
  const getQueue = useCallback(async (): Promise<SyncQueueItem[]> => {
    const raw = await safeGetItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SyncQueueItem[];
    } catch {
      return [];
    }
  }, []);

  const saveQueue = useCallback(async (queue: SyncQueueItem[]): Promise<void> => {
    await safeSetItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    setPendingCount(queue.length);
  }, []);

  const addToQueue = useCallback(
    async (type: SyncOperationType, payload: any): Promise<void> => {
      const currentQueue = await getQueue();
      const newItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
      };
      const updatedQueue = [...currentQueue, newItem];
      await saveQueue(updatedQueue);
    },
    [getQueue, saveQueue]
  );

  const clearQueue = useCallback(async () => {
    await saveQueue([]);
  }, [saveQueue]);

  // 3. Cache Management for Orders
  const loadOrdersFromCache = useCallback(async (): Promise<JobOrder[]> => {
    const raw = await safeGetItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    // Initialize default demo orders if cache empty
    await safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_DEMO_ORDERS));
    return INITIAL_DEMO_ORDERS;
  }, []);

  const saveOrdersToCache = useCallback(async (newOrders: JobOrder[]): Promise<void> => {
    setOrders(newOrders);
    await safeSetItem(STORAGE_KEYS.ORDERS, JSON.stringify(newOrders));
  }, []);

  // Helper to read deleted service IDs so ads live until explicit deletion
  const getDeletedServiceIds = useCallback(async (): Promise<Set<string>> => {
    const raw = await safeGetItem(STORAGE_KEYS.DELETED_SERVICES);
    if (!raw) return new Set();
    try {
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }, []);

  const markServiceAsDeleted = useCallback(async (serviceId: string): Promise<void> => {
    const ids = await getDeletedServiceIds();
    ids.add(serviceId);
    await safeSetItem(STORAGE_KEYS.DELETED_SERVICES, JSON.stringify(Array.from(ids)));
  }, [getDeletedServiceIds]);

  // 4. Cache Management for Services
  const loadServicesFromCache = useCallback(async (): Promise<ProviderService[]> => {
    const deletedIds = await getDeletedServiceIds();
    const raw = await safeGetItem(STORAGE_KEYS.PROVIDER_SERVICES);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: ProviderService) => !deletedIds.has(s.id));
        }
      } catch {}
    }
    // Initialize default demo services if cache empty (excluding deleted)
    const filteredDemo = INITIAL_DEMO_SERVICES.filter((s) => !deletedIds.has(s.id));
    await safeSetItem(STORAGE_KEYS.PROVIDER_SERVICES, JSON.stringify(filteredDemo));
    return filteredDemo;
  }, [getDeletedServiceIds]);

  const saveServicesToCache = useCallback(async (newServices: ProviderService[]): Promise<void> => {
    setServices(newServices);
    await safeSetItem(STORAGE_KEYS.PROVIDER_SERVICES, JSON.stringify(newServices));
  }, []);

  // 5. Data Refreshing
  const refreshOrders = useCallback(async () => {
    // If online & Supabase configured, try fetching remote orders
    if (isOnline && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('job_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          await saveOrdersToCache(data as JobOrder[]);
          return;
        }
      } catch {
        // Fallback to cache on remote query failure
      }
    }
    const cached = await loadOrdersFromCache();
    setOrders(cached);
  }, [isOnline, loadOrdersFromCache, saveOrdersToCache]);

  const refreshServices = useCallback(async () => {
    const deletedIds = await getDeletedServiceIds();
    const localCached = await loadServicesFromCache();

    if (isOnline && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('provider_services')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Smart merge: preserve all locally created services + remote services (minus deleted)
          const serviceMap = new Map<string, ProviderService>();

          // 1. Remote services
          for (const item of data as ProviderService[]) {
            if (!deletedIds.has(item.id)) {
              serviceMap.set(item.id, item);
            }
          }

          // 2. Local services that might not be synced yet
          for (const item of localCached) {
            if (!deletedIds.has(item.id) && !serviceMap.has(item.id)) {
              serviceMap.set(item.id, item);
              // Back up to Supabase in background
              Promise.resolve(supabase.from('provider_services').upsert(item)).catch(() => {});
            }
          }

          const merged = Array.from(serviceMap.values());
          await saveServicesToCache(merged);
          return;
        }
      } catch {
        // Fallback to cache
      }
    }
    setServices(localCached);
  }, [isOnline, getDeletedServiceIds, loadServicesFromCache, saveServicesToCache]);

  // 6. Queue Processing / Synchronization
  const syncNow = useCallback(async (): Promise<{
    success: boolean;
    syncedCount: number;
    errors: any[];
  }> => {
    if (isSyncingRef.current) {
      return { success: false, syncedCount: 0, errors: ['Sync already in progress'] };
    }

    isSyncingRef.current = true;
    const errors: any[] = [];
    let syncedCount = 0;

    try {
      const online = await checkConnectivity();
      setIsOnline(online);

      if (!online) {
        return { success: false, syncedCount: 0, errors: ['Network offline'] };
      }

      const queue = await getQueue();
      if (queue.length === 0) {
        setPendingCount(0);
        return { success: true, syncedCount: 0, errors: [] };
      }

      const remainingQueue: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          if (isSupabaseConfigured) {
            switch (item.type) {
              case 'CREATE_ORDER': {
                const { error } = await supabase
                  .from('job_orders')
                  .upsert([item.payload], { onConflict: 'id' });
                if (error) throw error;
                break;
              }
              case 'CANCEL_ORDER': {
                const { error } = await supabase
                  .from('job_orders')
                  .update({ status: 'cancelled' })
                  .eq('id', item.payload.orderId);
                if (error) throw error;
                break;
              }
              case 'POSTPONE_ORDER': {
                const { error } = await supabase
                  .from('job_orders')
                  .update({
                    status: 'postponed',
                    scheduled_date: item.payload.newDate,
                  })
                  .eq('id', item.payload.orderId);
                if (error) throw error;
                break;
              }
              case 'ACCEPT_ORDER': {
                const { error } = await supabase
                  .from('job_orders')
                  .update({
                    status: 'accepted',
                    provider_id: item.payload.providerId,
                    provider_name: item.payload.providerName,
                  })
                  .eq('id', item.payload.orderId);
                if (error) throw error;
                break;
              }
              case 'COMPLETE_ORDER': {
                const { error } = await supabase
                  .from('job_orders')
                  .update({ status: 'completed' })
                  .eq('id', item.payload.orderId);
                if (error) throw error;
                break;
              }
              case 'CREATE_SERVICE': {
                const { error } = await supabase
                  .from('provider_services')
                  .upsert([item.payload], { onConflict: 'id' });
                if (error) throw error;
                break;
              }
              case 'TOGGLE_SERVICE': {
                const { error } = await supabase
                  .from('provider_services')
                  .update({ is_active: item.payload.is_active })
                  .eq('id', item.payload.serviceId);
                if (error) throw error;
                break;
              }
              case 'DELETE_SERVICE': {
                const { error } = await supabase
                  .from('provider_services')
                  .delete()
                  .eq('id', item.payload.serviceId);
                if (error) throw error;
                break;
              }
            }
          }
          // Synced successfully (or mocked when Supabase not configured)
          syncedCount++;
        } catch (err: any) {
          errors.push({ item, error: err?.message || 'Sync failed' });
          item.retryCount += 1;
          // Retain item for subsequent retry
          remainingQueue.push(item);
        }
      }

      await saveQueue(remainingQueue);

      // Refresh data
      await refreshOrders();
      await refreshServices();

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
      };
    } finally {
      isSyncingRef.current = false;
    }
  }, [
    checkConnectivity,
    getQueue,
    saveQueue,
    refreshOrders,
    refreshServices,
  ]);

  // 7. Operations with Offline-First Fallback
  const createOrder = useCallback(
    async (
      orderData: Partial<JobOrder>
    ): Promise<{ success: boolean; order: JobOrder; isOffline: boolean }> => {
      const now = new Date().toISOString();
      const newOrder: JobOrder = {
        id: orderData.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        customer_id: orderData.customer_id || currentUserId,
        customer_name: orderData.customer_name || 'Valued Customer',
        customer_phone: orderData.customer_phone || '',
        customer_phone_verified: orderData.customer_phone_verified ?? false,
        provider_id: orderData.provider_id || null,

        provider_name: orderData.provider_name || 'Assigned FixMate Provider',
        service_title: orderData.service_title || 'General Maintenance Service',
        category: orderData.category || 'Maintenance',
        status: orderData.status || 'pending',
        description: orderData.description || '',
        scheduled_date: orderData.scheduled_date || 'Today, Flexible',
        address: orderData.address || 'Standard Address',
        city: orderData.city || 'Lahore',
        amount: orderData.amount || 1000,
        created_at: orderData.created_at || now,
      };

      // 1. Optimistically update local cache
      const currentOrders = await loadOrdersFromCache();
      const updatedOrders = [newOrder, ...currentOrders.filter((o) => o.id !== newOrder.id)];
      await saveOrdersToCache(updatedOrders);

      // 2. Try online sync if available
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('job_orders').insert([newOrder]);
          if (!error) {
            isOffline = false;
          } else {
            // Queue on database failure
            await addToQueue('CREATE_ORDER', newOrder);
          }
        } catch {
          await addToQueue('CREATE_ORDER', newOrder);
        }
      } else {
        // Offline or unconfigured -> queue for auto sync
        await addToQueue('CREATE_ORDER', newOrder);
      }

      return { success: true, order: newOrder, isOffline };
    },
    [currentUserId, isOnline, loadOrdersFromCache, saveOrdersToCache, addToQueue]
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason?: string): Promise<{ success: boolean; isOffline: boolean }> => {
      // 1. Optimistically update local cache
      const currentOrders = await loadOrdersFromCache();
      const updatedOrders = currentOrders.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'cancelled' as JobStatus } : ord
      );
      await saveOrdersToCache(updatedOrders);

      // 2. Try online sync
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('job_orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('CANCEL_ORDER', { orderId, reason });
          }
        } catch {
          await addToQueue('CANCEL_ORDER', { orderId, reason });
        }
      } else {
        await addToQueue('CANCEL_ORDER', { orderId, reason });
      }

      return { success: true, isOffline };
    },
    [isOnline, loadOrdersFromCache, saveOrdersToCache, addToQueue]
  );

  const postponeOrder = useCallback(
    async (
      orderId: string,
      newDate: string,
      reason?: string
    ): Promise<{ success: boolean; isOffline: boolean }> => {
      // 1. Optimistically update local cache
      const currentOrders = await loadOrdersFromCache();
      const updatedOrders = currentOrders.map((ord) =>
        ord.id === orderId
          ? { ...ord, status: 'postponed' as JobStatus, scheduled_date: newDate }
          : ord
      );
      await saveOrdersToCache(updatedOrders);

      // 2. Try online sync
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('job_orders')
            .update({ status: 'postponed', scheduled_date: newDate })
            .eq('id', orderId);

          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('POSTPONE_ORDER', { orderId, newDate, reason });
          }
        } catch {
          await addToQueue('POSTPONE_ORDER', { orderId, newDate, reason });
        }
      } else {
        await addToQueue('POSTPONE_ORDER', { orderId, newDate, reason });
      }

      return { success: true, isOffline };
    },
    [isOnline, loadOrdersFromCache, saveOrdersToCache, addToQueue]
  );

  const acceptOrder = useCallback(
    async (
      orderId: string,
      providerId?: string,
      providerName?: string
    ): Promise<{ success: boolean; isOffline: boolean }> => {
      const assignedProviderId = providerId || currentUserId;
      const assignedProviderName = providerName || 'Verified Provider';

      // 1. Optimistically update local cache
      const currentOrders = await loadOrdersFromCache();
      const updatedOrders = currentOrders.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'accepted' as JobStatus,
              provider_id: assignedProviderId,
              provider_name: assignedProviderName,
            }
          : ord
      );
      await saveOrdersToCache(updatedOrders);

      // 2. Try online sync
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('job_orders')
            .update({
              status: 'accepted',
              provider_id: assignedProviderId,
              provider_name: assignedProviderName,
            })
            .eq('id', orderId);

          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('ACCEPT_ORDER', {
              orderId,
              providerId: assignedProviderId,
              providerName: assignedProviderName,
            });
          }
        } catch {
          await addToQueue('ACCEPT_ORDER', {
            orderId,
            providerId: assignedProviderId,
            providerName: assignedProviderName,
          });
        }
      } else {
        await addToQueue('ACCEPT_ORDER', {
          orderId,
          providerId: assignedProviderId,
          providerName: assignedProviderName,
        });
      }

      return { success: true, isOffline };
    },
    [currentUserId, isOnline, loadOrdersFromCache, saveOrdersToCache, addToQueue]
  );

  const completeOrder = useCallback(
    async (orderId: string): Promise<{ success: boolean; isOffline: boolean }> => {
      // 1. Optimistically update local cache
      const currentOrders = await loadOrdersFromCache();
      const updatedOrders = currentOrders.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'completed' as JobStatus } : ord
      );
      await saveOrdersToCache(updatedOrders);

      // 2. Try online sync
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('job_orders')
            .update({ status: 'completed' })
            .eq('id', orderId);

          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('COMPLETE_ORDER', { orderId });
          }
        } catch {
          await addToQueue('COMPLETE_ORDER', { orderId });
        }
      } else {
        await addToQueue('COMPLETE_ORDER', { orderId });
      }

      return { success: true, isOffline };
    },
    [isOnline, loadOrdersFromCache, saveOrdersToCache, addToQueue]
  );

  const createService = useCallback(
    async (
      serviceData: Partial<ProviderService>
    ): Promise<{ success: boolean; service: ProviderService; isOffline: boolean }> => {
      const now = new Date().toISOString();
      const newService: ProviderService = {
        id: serviceData.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        provider_id: serviceData.provider_id || currentUserId,
        provider_name: serviceData.provider_name || 'FixMate Verified Pro',
        title: serviceData.title || 'Professional Handyman Service',
        category: serviceData.category || 'General Repair',
        description: serviceData.description || 'Quality repair and maintenance guaranteed.',
        price: serviceData.price || 1500,
        duration: serviceData.duration || '1-2 Hours',
        is_active: serviceData.is_active ?? true,
        created_at: serviceData.created_at || now,
      };

      // 1. Optimistically update local cache
      const currentServices = await loadServicesFromCache();
      const updatedServices = [newService, ...currentServices.filter((s) => s.id !== newService.id)];
      await saveServicesToCache(updatedServices);

      // 2. Try online sync
      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('provider_services').insert([newService]);
          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('CREATE_SERVICE', newService);
          }
        } catch {
          await addToQueue('CREATE_SERVICE', newService);
        }
      } else {
        await addToQueue('CREATE_SERVICE', newService);
      }

      return { success: true, service: newService, isOffline };
    },
    [currentUserId, isOnline, loadServicesFromCache, saveServicesToCache, addToQueue]
  );

  const toggleService = useCallback(
    async (serviceId: string, requesterId?: string): Promise<{ success: boolean; isOffline: boolean }> => {
      const currentServices = await loadServicesFromCache();
      const existing = currentServices.find((s) => s.id === serviceId);
      if (existing && requesterId && existing.provider_id && existing.provider_id !== requesterId) {
        throw new Error('Unauthorized: You can only edit services you created.');
      }

      let targetService: ProviderService | undefined;
      const updatedServices = currentServices.map((s) => {
        if (s.id === serviceId) {
          targetService = { ...s, is_active: !s.is_active };
          return targetService;
        }
        return s;
      });
      await saveServicesToCache(updatedServices);

      let isOffline = true;
      if (isOnline && isSupabaseConfigured && targetService) {
        try {
          const { error } = await supabase
            .from('provider_services')
            .update({ is_active: (targetService as ProviderService).is_active })
            .eq('id', serviceId);
          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('TOGGLE_SERVICE', {
              serviceId,
              is_active: (targetService as ProviderService).is_active,
            });
          }
        } catch {
          await addToQueue('TOGGLE_SERVICE', {
            serviceId,
            is_active: (targetService as ProviderService).is_active,
          });
        }
      } else if (targetService) {
        await addToQueue('TOGGLE_SERVICE', {
          serviceId,
          is_active: (targetService as ProviderService).is_active,
        });
      }

      return { success: true, isOffline };
    },
    [isOnline, loadServicesFromCache, saveServicesToCache, addToQueue]
  );

  const deleteService = useCallback(
    async (serviceId: string, requesterId?: string): Promise<{ success: boolean; isOffline: boolean }> => {
      const isRootAdmin = requesterId === 'root' || requesterId === 'root-admin' || requesterId === 'admin';
      const currentServices = await loadServicesFromCache();
      const existing = currentServices.find((s) => s.id === serviceId);
      if (existing && requesterId && !isRootAdmin && existing.provider_id && existing.provider_id !== requesterId) {
        throw new Error('Unauthorized: You can only delete services you created.');
      }

      // Mark in deleted set so it never reappears on reload or sync
      await markServiceAsDeleted(serviceId);

      const updatedServices = currentServices.filter((s) => s.id !== serviceId);
      await saveServicesToCache(updatedServices);

      let isOffline = true;
      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('provider_services')
            .delete()
            .eq('id', serviceId);
          if (!error) {
            isOffline = false;
          } else {
            await addToQueue('DELETE_SERVICE', { serviceId });
          }
        } catch {
          await addToQueue('DELETE_SERVICE', { serviceId });
        }
      } else {
        await addToQueue('DELETE_SERVICE', { serviceId });
      }

      return { success: true, isOffline };
    },
    [isOnline, loadServicesFromCache, saveServicesToCache, addToQueue]
  );

  // 8. Initialization & Polling Lifecycle
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      setIsLoading(true);
      const online = await checkConnectivity();
      if (isMounted) {
        setIsOnline(online);
        previousOnlineRef.current = online;
      }

      const q = await getQueue();
      if (isMounted) {
        setPendingCount(q.length);
      }

      const cachedOrders = await loadOrdersFromCache();
      if (isMounted) {
        setOrders(cachedOrders);
      }

      const cachedServices = await loadServicesFromCache();
      if (isMounted) {
        setServices(cachedServices);
        setIsLoading(false);
      }

      // Initial sync if online and has pending operations
      if (online && q.length > 0) {
        syncNow();
      }
    }

    initialize();

    // Periodic connectivity ping & auto-sync (every 12 seconds)
    const interval = setInterval(async () => {
      const online = await checkConnectivity();
      if (!isMounted) return;

      setIsOnline(online);

      // Auto-sync when reconnecting or if pending operations exist while online
      const justCameOnline = !previousOnlineRef.current && online;
      previousOnlineRef.current = online;

      if (online) {
        const q = await getQueue();
        if (q.length > 0 && (justCameOnline || !isSyncingRef.current)) {
          syncNow();
        }
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkConnectivity, getQueue, loadOrdersFromCache, loadServicesFromCache, syncNow]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        isLoading,
        orders,
        services,
        syncNow,
        createOrder,
        cancelOrder,
        postponeOrder,
        acceptOrder,
        completeOrder,
        createService,
        toggleService,
        deleteService,
        refreshOrders,
        refreshServices,
        clearQueue,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

// Global context hook
export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// Hook for orders with offline sync & actions
export function useSyncedOrders(filterCustomerId?: string) {
  const sync = useSync();

  const filteredOrders = filterCustomerId
    ? sync.orders.filter(
        (o) => o.customer_id === filterCustomerId || o.customer_id === 'guest-user'
      )
    : sync.orders;

  return {
    orders: filteredOrders,
    allOrders: sync.orders,
    isLoading: sync.isLoading,
    isOnline: sync.isOnline,
    pendingCount: sync.pendingCount,
    createOrder: sync.createOrder,
    cancelOrder: sync.cancelOrder,
    postponeOrder: sync.postponeOrder,
    acceptOrder: sync.acceptOrder,
    completeOrder: sync.completeOrder,
    refreshOrders: sync.refreshOrders,
    syncNow: sync.syncNow,
  };
}

// Hook for provider services/ads with offline sync & actions
export function useSyncedServices(filterProviderId?: string, isRootAdmin = false) {
  const sync = useSync();

  const filteredServices = isRootAdmin || !filterProviderId
    ? sync.services
    : sync.services.filter(
        (s) =>
          s.provider_id === filterProviderId ||
          s.provider_id === 'guest-user' ||
          s.provider_id === 'mock-prov-1' ||
          s.provider_id === 'prov-1'
      );

  return {
    services: filteredServices,
    providerServices: filteredServices,
    allServices: sync.services,
    isLoading: sync.isLoading,
    isOnline: sync.isOnline,
    pendingCount: sync.pendingCount,
    createService: sync.createService,
    toggleService: sync.toggleService,
    deleteService: sync.deleteService,
    refreshServices: sync.refreshServices,
    syncNow: sync.syncNow,
  };
}

// Visual sync status indicator component
export function SyncStatusBadge() {
  const { isOnline, pendingCount, syncNow } = useSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.syncBadge,
        !isOnline ? styles.offlineBadge : styles.pendingBadge,
      ]}
    >
      <Ionicons
        name={!isOnline ? 'cloud-offline-outline' : 'sync-outline'}
        size={14}
        color={!isOnline ? Colors.warning : Colors.primary}
      />
      <Text
        style={[
          styles.syncBadgeText,
          !isOnline ? styles.offlineText : styles.pendingText,
        ]}
      >
        {!isOnline
          ? `Offline ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}`
          : `Syncing ${pendingCount} pending...`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  offlineBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  offlineText: {
    color: '#C2410C',
  },
  pendingText: {
    color: Colors.primary,
  },
});

export default useSyncedOrders;
