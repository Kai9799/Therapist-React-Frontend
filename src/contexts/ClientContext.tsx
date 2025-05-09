import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchClients, createClient, updateClient as updateClientApi, deleteClient as deleteClientApi } from '../lib/api';
import { useAuth } from './AuthContext';

const isDev = import.meta.env.MODE === 'development';
const mockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  auth_id: 'dev-auth-id'
};

export interface Client {
  id: string;
  name: string;
  age: string;
  hobbies: string[];
  therapyType: string;
  focusAreas: string[];
  shortTermGoals: string;
  longTermGoals: string;
  notes: string;
  lastSession: string;
  sessionHistory: {
    id: string;
    date: string;
    topic: string;
    plan: {
      overview: string;
      structure: {
        title: string;
        duration: string;
        description: string;
      }[];
      techniques: {
        name: string;
        description: string;
      }[];
      homework: string[];
      therapistNotes: string;
    };
  }[];
  resources: {
    id: string;
    date: string;
    title: string;
    type: string;
    content: any;
  }[];
}

interface ActivityStats {
  sessionPlans: number;
  resources: number;
}

interface ClientContextType {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  activityStats: ActivityStats;
  incrementSessionPlans: () => void;
  incrementResources: () => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  loading: boolean;
  error: string | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    sessionPlans: 0,
    resources: 0
  });

  // Fetch clients on mount
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!profile?.id) {
          throw new Error('User profile not found');
        }

        const { data, error: clientsError } = await supabase.from('clients')
          .select(`
            *,
            session_plans (
              id,
              topic,
              session_date,
              overview,
              structure,
              techniques,
              homework,
              therapist_notes,
              resources
            ),
            resources (
              id,
              title,
              type,
              content,
              formatted_content
            )
          `)
          .eq('outseta_id', profile.outseta_id);

        if (clientsError) throw clientsError;

        setClients(data || []);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    if (profile?.outseta_id) {
      loadClients();
    }
  }, []);

  const incrementSessionPlans = () => {
    setActivityStats(prev => ({
      ...prev,
      sessionPlans: prev.sessionPlans + 1
    }));
  };

  const incrementResources = () => {
    setActivityStats(prev => ({
      ...prev,
      resources: prev.resources + 1
    }));
  };
  
  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      if (!profile?.outseta_id) {
        throw new Error('User profile not found');
      }

      const { data: newClient, error } = await supabase
        .from('clients')
        .insert([{
          ...client,
          outseta_id: profile.outseta_id,
          outseta_id: profile.outseta_id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setClients(prev => [...prev, newClient]);
    } catch (err) {
      console.error('Error adding client:', err);
      throw err;
    }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      const updated = await updateClientApi(updatedClient.id, updatedClient);
      setClients(prev => 
        prev.map(client => 
          client.id === updatedClient.id ? updated : client
        )
      );
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  };

  const removeClient = async (id: string) => {
    try {
      await deleteClientApi(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('Error removing client:', err);
      throw err;
    }
  };

  const getClient = (id: string) => {
    return clients.find(client => client.id === id);
  };

  return (
    <ClientContext.Provider value={{
      clients,
      setClients,
      loading,
      error,
      activityStats,
      incrementSessionPlans,
      incrementResources,
      addClient,
      updateClient,
      removeClient,
      getClient
    }}>
      {children}
    </ClientContext.Provider>
  );
};