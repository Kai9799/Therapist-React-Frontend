import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  isOrgAdmin: boolean;
}

export const DashboardLayout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, isOrgAdmin }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} onNavigate={onNavigate} isOrgAdmin={isOrgAdmin} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onNavigateToProfile={() => onNavigate('userProfile')} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};