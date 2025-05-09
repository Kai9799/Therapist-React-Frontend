import React, { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Users, Shield, UserMinus, UserPlus, Settings, AlertCircle } from 'lucide-react';

export const TeamManagement: React.FC = () => {
  const { 
    teams, 
    members, 
    invites,
    loading,
    error,
    removeMember,
    updateMemberRole
  } = useCompany();

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('member');

  const handleRoleUpdate = async () => {
    if (!selectedTeam || !selectedMember) return;
    
    try {
      await updateMemberRole(selectedTeam, selectedMember, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to update role:', error);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
      </div>

      {/* Team Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedTeam === team.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <h3 className="font-medium text-gray-900">{team.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {members.filter(m => m.team_id === team.id).length} members
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Team Members */}
      {selectedTeam && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <UserPlus size={18} />
                <span>Invite Member</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {members
              .filter(member => member.team_id === selectedTeam)
              .map(member => (
                <div key={member.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {(member as any).therapist?.full_name || 'Unknown Member'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {(member as any).therapist?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                      <Shield size={14} />
                      <span className="text-sm font-medium">{member.role}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMember(member.id);
                          setNewRole(member.role);
                          setShowRoleModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => removeMember(selectedTeam, member.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <UserMinus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pending Invites */}
          {invites.filter(invite => invite.team_id === selectedTeam).length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Pending Invitations</h3>
              <div className="space-y-4">
                {invites
                  .filter(invite => invite.team_id === selectedTeam)
                  .map(invite => (
                    <div key={invite.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        <p className="text-sm text-gray-500">Role: {invite.role}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role Update Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Member Role</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedMember(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};