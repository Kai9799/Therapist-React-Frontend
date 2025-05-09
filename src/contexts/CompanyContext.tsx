import React, { createContext, useContext, useState } from 'react';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  billing_email: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_seats: number;
  settings: any;
}

interface Team {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  settings: any;
}

interface TeamMember {
  id: string;
  team_id: string;
  therapist_id: string;
  role: string;
  joined_at: string;
  settings: any;
}

interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: string;
  invited_by: string | null;
  token: string;
  expires_at: string;
}

interface CompanyContextType {
  company: Company | null;
  teams: Team[];
  members: TeamMember[];
  invites: TeamInvite[];
  loading: boolean;
  error: string | null;
  createTeam: (name: string, description?: string) => Promise<void>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  inviteMember: (teamId: string, email: string, role: string) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberId: string, role: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeam = async (name: string, description?: string) => {
    try {
      const newTeam: Team = {
        id: Date.now().toString(),
        company_id: company?.id || '',
        name,
        description,
        settings: {}
      };
      setTeams(prev => [...prev, newTeam]);
    } catch (err) {
      console.error('Error creating team:', err);
      throw err;
    }
  };

  const updateTeam = async (id: string, data: Partial<Team>) => {
    try {
      setTeams(prev => prev.map(team => 
        team.id === id ? { ...team, ...data } : team
      ));
    } catch (err) {
      console.error('Error updating team:', err);
      throw err;
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      setTeams(prev => prev.filter(team => team.id !== id));
      setMembers(prev => prev.filter(member => member.team_id !== id));
      setInvites(prev => prev.filter(invite => invite.team_id !== id));
    } catch (err) {
      console.error('Error deleting team:', err);
      throw err;
    }
  };

  const inviteMember = async (teamId: string, email: string, role: string) => {
    try {
      const newInvite: TeamInvite = {
        id: Date.now().toString(),
        team_id: teamId,
        email,
        role,
        invited_by: null,
        token: Math.random().toString(36).substring(7),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      setInvites(prev => [...prev, newInvite]);
    } catch (err) {
      console.error('Error inviting member:', err);
      throw err;
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      setMembers(prev => prev.filter(member => 
        !(member.team_id === teamId && member.id === memberId)
      ));
    } catch (err) {
      console.error('Error removing member:', err);
      throw err;
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, role: string) => {
    try {
      setMembers(prev => prev.map(member =>
        member.id === memberId && member.team_id === teamId
          ? { ...member, role }
          : member
      ));
    } catch (err) {
      console.error('Error updating member role:', err);
      throw err;
    }
  };

  return (
    <CompanyContext.Provider value={{
      company,
      teams,
      members,
      invites,
      loading,
      error,
      createTeam,
      updateTeam,
      deleteTeam,
      inviteMember,
      removeMember,
      updateMemberRole
    }}>
      {children}
    </CompanyContext.Provider>
  );
};