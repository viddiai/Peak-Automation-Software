import { useState, useCallback, useEffect } from 'react';
import type { SaaSService, ServiceUser, AppSettings, AppData } from '@/types';
import { mockServices, mockUsers, defaultSettings } from '@/data/mockData';

const STORAGE_KEY = 'saas-oversikt-data';

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // corrupt data, reset
  }
  const initial: AppData = {
    services: mockServices,
    users: mockUsers,
    settings: defaultSettings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateServices = useCallback((fn: (services: SaaSService[]) => SaaSService[]) => {
    setData(prev => ({ ...prev, services: fn(prev.services) }));
  }, []);

  const updateUsers = useCallback((fn: (users: ServiceUser[]) => ServiceUser[]) => {
    setData(prev => ({ ...prev, users: fn(prev.users) }));
  }, []);

  const updateSettings = useCallback((settings: AppSettings) => {
    setData(prev => ({ ...prev, settings }));
  }, []);

  const addService = useCallback((service: SaaSService) => {
    updateServices(prev => [...prev, service]);
  }, [updateServices]);

  const editService = useCallback((id: string, updates: Partial<SaaSService>) => {
    updateServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, [updateServices]);

  const deleteService = useCallback((id: string) => {
    updateServices(prev => prev.filter(s => s.id !== id));
    updateUsers(prev => prev.filter(u => u.serviceId !== id));
  }, [updateServices, updateUsers]);

  const addUser = useCallback((user: ServiceUser) => {
    updateUsers(prev => [...prev, user]);
  }, [updateUsers]);

  const editUser = useCallback((id: string, updates: Partial<ServiceUser>) => {
    updateUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, [updateUsers]);

  const deleteUser = useCallback((id: string) => {
    updateUsers(prev => prev.filter(u => u.id !== id));
  }, [updateUsers]);

  const resetData = useCallback(() => {
    const initial: AppData = {
      services: mockServices,
      users: mockUsers,
      settings: defaultSettings,
    };
    setData(initial);
  }, []);

  const getUsersForService = useCallback((serviceId: string) => {
    return data.users.filter(u => u.serviceId === serviceId);
  }, [data.users]);

  return {
    services: data.services,
    users: data.users,
    settings: data.settings,
    addService,
    editService,
    deleteService,
    addUser,
    editUser,
    deleteUser,
    updateSettings,
    getUsersForService,
    resetData,
  };
}
