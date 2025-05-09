import React, { useState, useEffect } from 'react';
import { Users, Building2, Settings, Plus, UserPlus, Edit2, Trash2, AlertCircle, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createPortalSession } from '../../lib/stripe';

interface Organization {
  id: string;
  name: string;
  seats_purchased: number;
  seats_used: number;
  admin_count: number;
  join_code: string;
}

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    subscription_status: string;
  };
}

export const CompanyDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchOrganizationData();
    }
  }, [profile]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch organization details
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile!.organization_id)
        .single();

      if (orgError) throw orgError;

      // Fetch organization members
      const [{ data: memberData, error: memberError }, { data: planData, error: planError }] = await Promise.all([
        supabase
        .from('organization_members')
        .select(`
          *,
          user:users (
            id,
            full_name,
            email,
            subscription_status
          )
        `)
        .eq('organization_id', profile!.organization_id),
        
        supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', 'clinic') // Default to clinic plan for organizations
      ]);

      if (memberError) throw memberError;
      if (planError) throw planError;

      setOrganization(org);
      setMembers(memberData || []);
      setSubscriptionPlan(planData?.[0] || null);

    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      // Get member details before deletion
      const memberToDelete = members.find(m => m.id === memberId);
      if (!memberToDelete) {
        throw new Error('Member not found');
      }

      // First update the user to remove organization association
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          organization_id: null,
          role: 'therapist' // Reset to default role
        })
        .eq('id', memberToDelete.user.id);

      if (userError) throw userError;

      // Then delete the organization member record
      // This will trigger the handle_member_removal trigger
      const { error: memberError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (memberError) throw memberError;

      // Refresh data
      fetchOrganizationData();
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const confirmRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const isAdmin = member.role === 'admin';
    const message = isAdmin
      ? 'Are you sure you want to remove this admin? This will not affect their seat count.'
      : 'Are you sure you want to remove this member? This will free up one seat.';

    if (window.confirm(message)) {
      handleRemoveMember(memberId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Organization Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
            <p className="text-gray-500">Organization Dashboard</p>
          </div>
          <div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Settings size={20} />
            </button>
          </div>
        </div>
        
        {/* Usage Stats */}
        <div className="border-t border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-900">Seats</h3>
            <div className="mt-2 space-y-1">
              <p className="text-indigo-700 flex justify-between">
                <span>Regular Seats:</span>
                <span>{organization?.seats_used} / {organization?.seats_purchased}</span>
              </p>
              <p className="text-indigo-700 flex justify-between">
                <span>Admin Seats:</span>
                <span>{organization?.admin_count}</span>
              </p>
              <div className="border-t border-indigo-200 mt-2 pt-2">
                <p className="text-indigo-700 flex justify-between font-medium">
                  <span>Total Members:</span>
                  <span>{(organization?.seats_used || 0) + (organization?.admin_count || 0)}</span>
                </p>
              </div>
            </div>
            <p className="text-sm text-indigo-600">
              {organization?.seats_purchased - (organization?.seats_used || 0)} regular seats available
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">Active Members</h3>
            <div className="mt-2 space-y-1">
              <p className="text-green-700 flex justify-between">
                <span>Admins:</span>
                <span>{members.filter(m => m.role === 'admin').length}</span>
              </p>
              <p className="text-green-700 flex justify-between">
                <span>Regular Members:</span>
                <span>{members.filter(m => m.role !== 'admin').length}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-purple-900">Join Code</h3>
            <p className="text-purple-700">{organization?.join_code}</p>
            <p className="text-sm text-purple-600">Share to invite members</p>
          </div>
        </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <span className="font-medium">Join Code:</span>
              <span className="font-mono">{organization?.join_code}</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <div className="text-indigo-600 font-medium">
                    {member.user?.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {member.user?.full_name || 'Unknown Member'}
                  </h3>
                  <p className="text-sm text-gray-500">{member.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  member.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMember(member.id);
                      setNewRole(member.role);
                      setShowRoleModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => confirmRemoveMember(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by inviting your team members.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-50 to-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Subscription & Billing</h2>
            </div>
            <button
              onClick={() => createPortalSession()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              <span>Manage Subscription</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
              <p className="mt-2 text-xl font-bold text-gray-900">{subscriptionPlan?.name || 'Clinic Plan'}</p>
              <div className="mt-1 flex items-center">
                <CheckCircle size={14} className="text-green-500 mr-1" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-indigo-100 col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Billing Period</h3>
              <p className="mt-2 text-gray-900">
                {organization?.current_period_start ? (
                  <>
                    {new Date(organization.current_period_start).toLocaleDateString()} - {' '}
                    {organization?.current_period_end ? new Date(organization.current_period_end).toLocaleDateString() : 'N/A'}
                  </>
                ) : (
                  'Not available'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};