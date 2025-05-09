import React, { useState, useEffect } from 'react';
import { Users, Brain, Timer, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

interface DashboardStats {
  totalClients: number;
  totalSessions: number;
  totalResources: number;
  timeSaved: number;
}

interface ActivityStats {
  sessionPlans: number;
  resources: number;
}

export const TherapistDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isSignedIn } = useUser();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalSessions: 0,
    totalResources: 0,
    timeSaved: 0
  });
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    sessionPlans: 0,
    resources: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        setLoading(true);
        setError(null);

        const supabaseClient = await createClerkSupabaseClient();
        
        // Fetch all stats in parallel
        const [
          { count: clientCount, error: clientError },
          { count: sessionCount, error: sessionError },
          { count: resourceCount, error: resourceError }
        ] = await Promise.all([
          supabaseClient
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabaseClient
            .from('session_plans')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabaseClient
            .from('resources')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
        ]);

        if (clientError) throw clientError;
        if (sessionError) throw sessionError;
        if (resourceError) throw resourceError;

        // Calculate time saved (15 minutes per plan/resource)
        const totalItems = (sessionCount || 0) + (resourceCount || 0);
        const minutesSaved = totalItems * 15;

        setStats({
          totalClients: clientCount || 0,
          totalSessions: sessionCount || 0,
          totalResources: resourceCount || 0,
          timeSaved: minutesSaved
        });

        // Set activity stats
        setActivityStats({
          sessionPlans: sessionCount || 0,
          resources: resourceCount || 0
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isSignedIn]);

  const hoursSaved = Math.floor(stats.timeSaved / 60);
  const minutesSaved = stats.timeSaved % 60;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {profile?.full_name || 'Therapist'}
          </h1>
          <div className="flex items-center space-x-2 text-gray-500">
            <span>{profile?.subscription_tier.charAt(0).toUpperCase() + profile?.subscription_tier.slice(1)} Plan</span>
            {profile?.subscription_seats > 1 && (
              <>
                <span>•</span>
                <span>{profile.subscription_seats} seats</span>
              </>
            )}
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              profile?.subscription_status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {profile?.subscription_status.charAt(0).toUpperCase() + profile?.subscription_status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Trial Status */}
      {profile?.trial_end && new Date(profile.trial_end) > new Date() && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar size={24} />
              <h2 className="text-lg font-semibold">Trial Period Active</h2>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">
                Trial ends on {new Date(profile.trial_end).toLocaleDateString()}
              </p>
              <p className="text-xs opacity-75">
                {Math.ceil((new Date(profile.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Saved Overview */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Timer size={24} className="mr-2" />
            <h2 className="text-lg font-semibold">Time Saved with AI Assistance</h2>
          </div>
          <div className="text-2xl font-bold">
            {hoursSaved}h {minutesSaved}m
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Session Plans Created</span>
              <span>{activityStats.sessionPlans} plans</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Resources Generated</span>
              <span>{activityStats.resources} resources</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients} 
          icon={<Users className="text-blue-500" />} 
          change={`${stats.totalClients} total clients`}
          onClick={() => onNavigate('clients')}
        />
        <StatCard 
          title="AI Plans Generated" 
          value={stats.totalSessions.toString()}
          icon={<Brain className="text-purple-500" />} 
          change={`${stats.totalSessions} plans created`}
          onClick={() => onNavigate('sessionPlanner')} />
        <StatCard 
          title="Resources Created" 
          value={stats.totalResources.toString()}
          icon={<BookOpen className="text-green-500" />} 
          change={`${stats.totalResources} resources created`}
          onClick={() => onNavigate('resourceGenerator')}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('sessionPlanner')}
              className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Brain size={24} className="text-indigo-600 mb-2" />
              <span className="font-medium">New Session Plan</span>
              <span className="text-sm text-gray-500 mt-1">Create AI-powered session plans</span>
            </button>
            <button 
              onClick={() => onNavigate('resourceGenerator')}
              className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <BookOpen size={24} className="text-green-600 mb-2" />
              <span className="font-medium">Create Resource</span>
              <span className="text-sm text-gray-500 mt-1">Generate therapy resources</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{change}</p>
    </div>
  );
};