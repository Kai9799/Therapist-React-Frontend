import React from 'react';
import { Brain, Users, Calendar, LayoutDashboard, FileText, BookOpen, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOrgAdmin: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isOrgAdmin }) => {

  const therapistItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={20} /> },
    { id: 'planner', label: 'Session Planner', icon: <Calendar size={20} /> },
    { id: 'resourceGenerator', label: 'Resource Generator', icon: <BookOpen size={20} /> },
    { id: 'resourceLibrary', label: 'Resource Library', icon: <FileText size={20} /> }
  ];

  const companyItems = [
    { id: 'dashboard', label: 'Company Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'userProfile', label: 'My Profile', icon: <UserCircle size={20} /> }
  ];

  const navItems = isOrgAdmin ? companyItems : therapistItems;

  return (
    <div className="w-64 bg-indigo-800 text-white flex flex-col">
      <div className="p-4 flex items-center space-x-2">
        <Brain size={28} />
        <Link to="/" className="text-xl font-bold">
          TheraPlan
        </Link>
      </div>

      <nav className="flex-1 mt-6">
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left ${activeView === item.id
                  ? 'bg-indigo-900 border-l-4 border-white'
                  : 'hover:bg-indigo-700'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-700">
        <div className="flex items-center space-x-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm text-white">My Profile</span>
        </div>
      </div>
    </div>
  );
};
