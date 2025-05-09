import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Search, Plus, Clock, FileText, BookOpen, ChevronRight, Calendar, AlertCircle, CheckCircle, X, Timer } from 'lucide-react';
import { supabase, createClerkSupabaseClient } from '../lib/supabase';

export const ClientProfiles2: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    therapyType: 'Cognitive Behavioral Therapy',
    diagnosis: '',
    hobbies: [] as string[],
    focusAreas: [] as string[],
    shortTermGoals: '',
    longTermGoals: '',
    notes: ''
  });
  const [hobbyInput, setHobbyInput] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'sessions'>('info');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const therapyTypes = [
    'Cognitive Behavioral Therapy',
    'Dialectical Behavior Therapy',
    'Trauma Focused Therapy',
    'Acceptance Commitment Therapy',
    'Mindfulness Based Therapy',
    'Solution Focused Brief Therapy',
    'Psychodynamic Therapy',
    'Person Centered Therapy',
    'Motivational Interviewing',
    'Gestalt Therapy',
    'Exposure Therapy',
    'Family Therapy',
    'Couples Therapy',
    'Narrative Therapy',
    'Existential Therapy',
    'Art Therapy',
    'Play Therapy',
    'EMDR Therapy',
    'Interpersonal Therapy',
    'Behavioral Therapy',
    'Occupational Therapy'
  ];

  useEffect(() => {
    let mounted = true;

    const loadClients = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        setIsLoading(true);
        setError(null);

        const supabaseClient = await createClerkSupabaseClient();
        
        const { data, error: clientsError } = await supabaseClient
          .from('clients')
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
          `);

        if (clientsError) throw clientsError;
        
        if (mounted) {
          setClients(data || []);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load clients');
          setClients([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadClients();

    return () => {
      mounted = false;
    };
  }, [user, isSignedIn, refreshTrigger]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.therapy_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.focus_areas?.some(area => area.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      age: client.age || '',
      therapyType: client.therapy_type || 'Cognitive Behavioral Therapy',
      diagnosis: client.diagnosis || '',
      hobbies: client.hobbies || [],
      focusAreas: client.focus_areas || [],
      shortTermGoals: client.short_term_goals || '',
      longTermGoals: client.long_term_goals || '',
      notes: client.notes || ''
    });
    setIsEditing(false);
    setActiveTab('info');
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      age: '',
      therapyType: 'Cognitive Behavioral Therapy',
      diagnosis: '',
      hobbies: [],
      focusAreas: [],
      shortTermGoals: '',
      longTermGoals: '',
      notes: ''
    });
    setIsEditing(true);
    setActiveTab('info');
  };

  const addHobby = () => {
    if (hobbyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...prev.hobbies, hobbyInput.trim()]
      }));
      setHobbyInput('');
    }
  };

  const removeHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter(h => h !== hobby)
    }));
  };

  const addFocusArea = () => {
    if (focusAreaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, focusAreaInput.trim()]
      }));
      setFocusAreaInput('');
    }
  };

  const removeFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter(a => a !== area)
    }));
  };

  const handleSave = async () => {
    try {
      if (!isSignedIn || !user) {
        throw new Error('Please sign in to save client information');
      }

      setSaving(true);
      setError(null);

      const supabaseClient = await createClerkSupabaseClient();
      
      const clientData = {
        user_id: user.id,
        name: formData.name.trim(),
        age: formData.age?.trim() || null,
        diagnosis: formData.diagnosis?.trim() || null,
        therapy_type: formData.therapyType,
        focus_areas: formData.focusAreas,
        hobbies: formData.hobbies,
        short_term_goals: formData.shortTermGoals?.trim() || null,
        long_term_goals: formData.longTermGoals?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      if (selectedClient?.id) {
        const { error: updateError } = await supabaseClient
          .from('clients')
          .update(clientData)
          .eq('id', selectedClient.id);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabaseClient
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setSelectedClient(data);
      }

      setRefreshTrigger(prev => prev + 1);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error saving client:', err);
      setError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Client Profiles</h1>
        <button
          onClick={handleNewClient}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Client</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Client List */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleClientSelect(client)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                  selectedClient?.id === client.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.therapy_type}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {client.focus_areas?.slice(0, 2).map((area, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                    >
                      {area}
                    </span>
                  ))}
                  {client.focus_areas?.length > 2 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                      +{client.focus_areas.length - 2} more
                    </span>
                  )}
                </div>
              </button>
            ))}
            {filteredClients.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No clients found
              </div>
            )}
          </div>
        </div>

        {/* Client Details */}
        <div className="col-span-8">
          {(selectedClient || isEditing) ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="border-b border-gray-200">
                <div className="p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      {isEditing ? (selectedClient ? 'Edit Client' : 'New Client') : selectedClient?.name}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    {success && (
                      <span className="text-green-600 flex items-center bg-green-50 px-3 py-1 rounded-lg">
                        <CheckCircle size={16} className="mr-1" />
                        Saved
                      </span>
                    )}
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!selectedClient?.id) return;
                            if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
                              try {
                                const supabaseClient = await createClerkSupabaseClient();
                                const { error } = await supabaseClient
                                  .from('clients')
                                  .delete()
                                  .eq('id', selectedClient.id);
                                
                                if (error) throw error;
                                
                                setClients(prev => prev.filter(c => c.id !== selectedClient.id));
                                setSelectedClient(null);
                                setIsEditing(false);
                              } catch (err) {
                                console.error('Error deleting client:', err);
                                setError(err instanceof Error ? err.message : 'Failed to delete client');
                              }
                            }
                          }}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete Client
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-6 -mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`py-4 border-b-2 font-medium text-sm ${
                      activeTab === 'info'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } transition-colors`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText size={16} />
                      <span>Basic Information</span>
                    </div>
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className={`py-4 border-b-2 font-medium text-sm ${
                        activeTab === 'sessions'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } transition-colors`}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>Sessions History</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                    <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g., 25, mid-30s, etc."
                          value={formData.age}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Diagnosis
                        </label>
                        <textarea
                          value={formData.diagnosis}
                          onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                          disabled={!isEditing}
                          rows={3}
                          placeholder="Enter client's diagnosis..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Therapy Type
                        </label>
                        <select
                          value={formData.therapyType}
                          onChange={(e) => setFormData(prev => ({ ...prev, therapyType: e.target.value }))}
                          disabled={!isEditing}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          {therapyTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hobbies
                        </label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={hobbyInput}
                                onChange={(e) => setHobbyInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addHobby()}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Add hobby..."
                              />
                              <button
                                onClick={addHobby}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.hobbies.map((hobby, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center"
                                >
                                  {hobby}
                                  <button
                                    onClick={() => removeHobby(hobby)}
                                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                                  >
                                    <X size={14} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {formData.hobbies.map((hobby, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                              >
                                {hobby}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Focus Areas
                        </label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={focusAreaInput}
                                onChange={(e) => setFocusAreaInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addFocusArea()}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Add focus area..."
                              />
                              <button
                                onClick={addFocusArea}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.focusAreas.map((area, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center"
                                >
                                  {area}
                                  <button
                                    onClick={() => removeFocusArea(area)}
                                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                                  >
                                    <X size={14} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {formData.focusAreas.map((area, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short-Term Goals
                      </label>
                      <textarea
                        value={formData.shortTermGoals}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortTermGoals: e.target.value }))}
                        disabled={!isEditing}
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-base leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Long-Term Goals
                      </label>
                      <textarea
                        value={formData.longTermGoals}
                        onChange={(e) => setFormData(prev => ({ ...prev, longTermGoals: e.target.value }))}
                        disabled={!isEditing}
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-base leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        disabled={!isEditing}
                        rows={10}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 text-base leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && selectedClient && (
                  <div className="space-y-4">
                    {selectedClient.session_plans?.length > 0 ? (
                      selectedClient.session_plans.sort((a: any, b: any) =>
                        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
                      ).map((session: any) => (
                        <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{session.topic}</h3>
                              <p className="text-sm text-gray-500">
                                <Clock size={14} className="inline mr-1" />
                                {new Date(session.session_date).toLocaleDateString()}
                              </p>
                            </div>
                            <button 
                              onClick={() => setSelectedSession(session)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View Session Details
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by planning a new session.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No client selected</h3>
              <p className="mt-1 text-sm text-gray-500">Select a client from the list or create a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{selectedSession.topic}</h3>
                <p className="text-indigo-100 text-sm">
                  {new Date(selectedSession.session_date).toLocaleDateString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-white hover:text-indigo-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
                  <p className="text-gray-600">{selectedSession.overview}</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Session Structure</h4>
                  <div className="space-y-4">
                    {selectedSession.structure?.map((item: any, index: number) => (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0 mr-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h5 className="font-medium text-gray-800">{item.title}</h5>
                            <div className="ml-2 flex items-center text-gray-500 text-sm">
                
                              <Timer size={14} className="mr-1" />
                              <span>{item.duration}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Therapeutic Techniques</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSession.techniques?.map((technique: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-800">{technique.name}</h5>
                        <p className="text-gray-600 text-sm mt-1">{technique.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Homework Assignments</h4>
                  <ul className="space-y-2">
                    {selectedSession.homework?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2"></span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-yellow-800 mb-2">Therapist Notes</h4>
                  <p className="text-yellow-800">{selectedSession.therapist_notes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};