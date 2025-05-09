import React, { useState, useEffect } from 'react';
import { Brain, Save, AlertCircle, CheckCircle, Download, Edit2, X, Plus, Trash2, ChevronUp, ChevronDown, Clock, Timer } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { supabase, createClerkSupabaseClient } from '../lib/supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const SessionPlanner: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionDuration, setSessionDuration] = useState(50); // Default 50 minutes
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [regeneratingStep, setRegeneratingStep] = useState<number | null>(null);
  const [editedPlan, setEditedPlan] = useState<SessionPlan | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedPreviousSession, setSelectedPreviousSession] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch clients when component mounts
  useEffect(() => {
    let mounted = true;
    
    const loadClients = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        const supabaseClient = await createClerkSupabaseClient();
        
        const { data, error: clientsError } = await supabaseClient
          .from('clients')
          .select(`
            id,
            name,
            therapy_type,
            diagnosis,
            focus_areas,
            age
          `);

        if (clientsError) throw clientsError;
        
        if (mounted) {
          setClients(data || []);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };

    loadClients();
    return () => { mounted = false; };
  }, [user, isSignedIn]);
  
  const selectedClient = clients.find(client => client.id === selectedClientId);

  const handleGenerate = async () => {
    if (!selectedClientId || !sessionTopic) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      if (!openai.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const prompt = `
        Create a detailed therapy session plan for a client with the following information:
        
        Client Name: ${selectedClient?.name}
        Client Age: ${selectedClient?.age || 'Not specified'}
        Therapy Type: ${selectedClient?.therapyType}
        Diagnosis: ${selectedClient?.diagnosis || 'Not specified'}
        Session Topic/Goal: ${sessionTopic}
        Session Duration: ${sessionDuration} minutes
        
        ${selectedClient?.hobbies?.length && selectedClient?.focusAreas?.length ? `
        Client Hobbies: ${selectedClient.hobbies.join(', ')}
        
        Hobby Integration Guidelines:
        Where appropriate, consider incorporating relevant client interests or preferred activities as a supportive tool — but only when clinically suitable and not central to the intervention.
        - Focus Areas: ${selectedClient.focusAreas.join(', ')}
        ` : ''}

        ${selectedClient?.age ? `
        Age-Specific Considerations:
        - Ensure all language and explanations are appropriate for a ${selectedClient.age}-year-old
        - Use age-appropriate metaphors and examples
        - Adjust activity complexity for this age group
        - Consider developmental stage and cognitive abilities
        - Use appropriate communication style and vocabulary
        - Include age-appropriate rewards and motivation strategies
        ` : ''}

        Create a comprehensive, evidence-based session plan that includes specific activities,
        interventions, and discussion points. The plan should be tailored to the client's therapy
        type${selectedClient?.age ? ` and age-appropriate for a ${selectedClient.age}-year-old client` : ''}, with clear, actionable 
        steps and examples. ${selectedClient?.diagnosis ? `Consider the client's diagnosis of ${selectedClient.diagnosis} when designing interventions and activities.` : ''}
        
        Format the response as a JSON object with the following structure:
        {
          "overview": "Detailed overview including:
            - Main therapeutic goals for this session
            - Connection to previous sessions or homework
            - Expected outcomes and progress markers
            - Overall session approach and rationale
            - Required preparation and resources",
          "structure": [
            {
              "title": "Section title",
              "duration": "Estimated duration (e.g., '10 minutes')",
              "description": "Detailed description including specific:
                - Clear, actionable step-by-step instructions
                - Example scripts or key phrases to use
                - Discussion prompts and follow-up questions
                - Materials or resources needed
                - Expected client responses and how to handle them
                - Therapeutic rationale and evidence base
                - Modifications for different client needs
                - Transition points and energy management
                - Success indicators for this section"
            }
          ],
          "techniques": [
            {
              "name": "Technique name",
              "description": "Detailed description including specific:
                - Step-by-step implementation guide
                - Clinical evidence and therapeutic benefits
                - Timing and context for optimal use
                - Example scripts and prompts
                - Common challenges and solutions
                - Signs of effective implementation
                - Contraindications or cautions
                - Variations for different client needs"
            }
          ],
          "homework": ["List of specific, actionable homework assignments with clear instructions"],
          "therapistNotes": "Clinical considerations and preparation notes",
          "resources": {
            "materials": ["List of physical materials needed for the session"],
            "worksheets": ["List of worksheets or handouts to prepare"],
            "equipment": ["List of any special equipment needed"],
            "preparation": ["List of preparation tasks before the session"]
          }
        }
        
        Guidelines for the response:
        1. Be specific and practical - include real examples, scripts, and activities
        2. Match techniques to the therapy type (${selectedClient?.therapyType})
        3. Design activities that directly target therapeutic goals${selectedClient?.diagnosis ? ` and are appropriate for the client's diagnosis` : ''}
        4. ${selectedClient?.age ? 
             `Ensure all activities and language are age-appropriate for a ${selectedClient.age}-year-old` : 
             'Keep activities and language adaptable for various age groups'}
        5. Include both discussion-based and experiential interventions
        6. Provide clear success indicators for each section
        7. Consider session pacing and energy management
        8. Include specific examples of:
           - Opening questions and prompts
           - Transition statements
           - Intervention scripts
           - Processing questions
           - Closing statements
        9. Suggest modifications for common challenges
        10. ${selectedClient?.age ? 
             `Keep homework practical and achievable for a ${selectedClient.age}-year-old` :
             'Keep homework adaptable and adjustable based on client capabilities'}
        11. ${selectedClient?.age ?
              `Use evidence-based techniques appropriate for ${selectedClient.age}-year-olds` :
              'Use evidence-based techniques that can be adapted to different age groups'}
        12. Consider cultural factors and individual needs
        13. Include specific markers for progress monitoring
        14. Ensure total duration of structure sections adds up to ${sessionDuration} minutes
        15. ${selectedClient?.diagnosis ? `Ensure all interventions and activities are safe and appropriate for a client with ${selectedClient.diagnosis}` : 'Consider any contraindications or safety concerns for planned activities'}
        16. List all required resources and preparation materials needed for:
            - Activities and exercises
            - Therapeutic techniques
            - Homework assignments
            - Session documentation
      `;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional therapy session planner with expertise in creating structured therapy sessions.' },
          { role: 'user', content: prompt + '\n\nPlease ensure your response is a valid JSON object following the structure specified above.' }
        ]
      });
      
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content was generated. Please try again.');
      }
      
      try {
        const plan = JSON.parse(content) as SessionPlan;
        setSessionPlan(plan);
        setEditedPlan(plan);
        incrementSessionPlans();
      } catch (parseError) {
        throw new Error('Failed to parse the generated content. Please try again.');
      }
      
      // Reset save status when generating new plan
      setSaveSuccess(false);
      
    } catch (err) {
      console.error('Error generating session plan:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the session plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = async () => {
    if (!sessionPlan || !selectedClient) return;
    
    try {
      if (!isSignedIn || !user) {
        throw new Error('Please sign in to save session plans');
      }

      setSaving(true);
      setError(null);
      
      const supabaseClient = await createClerkSupabaseClient();

      // Save session plan to Supabase
      const { error: saveError } = await supabaseClient
        .from('session_plans')
        .insert({
          client_id: selectedClient.id,
          user_id: user.id,
          session_date: new Date().toISOString(),
          topic: sessionTopic,
          overview: sessionPlan.overview,
          structure: sessionPlan.structure,
          techniques: sessionPlan.techniques,
          homework: sessionPlan.homework,
          therapist_notes: sessionPlan.therapistNotes,
          resources: {
            materials: sessionPlan.resources?.materials || [],
            worksheets: sessionPlan.resources?.worksheets || [],
            equipment: sessionPlan.resources?.equipment || [],
            preparation: sessionPlan.resources?.preparation || []
          }
        });

      if (saveError) throw saveError;

      setSaveSuccess(true);
      
      // Update last session date for client
      const { error: updateError } = await supabaseClient
        .from('clients')
        .update({ last_session_date: new Date().toISOString() })
        .eq('id', selectedClient.id);

      if (updateError) {
        console.error('Error updating client last session date:', updateError);
      }

    } catch (err) {
      console.error('Error saving session plan:', err);
      if (err instanceof Error && err.message === 'Not authenticated') {
        setError('Please sign in to save session plans');
        navigate('/auth/signin');
      } else {
        setError('Failed to save session plan. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  const regenerateStep = async (stepIndex: number) => {
    if (!sessionPlan || !selectedClient) return;
    
    setRegeneratingStep(stepIndex);
    setError(null);
    
    try {
      const prompt = `
        Generate a new step for a therapy session plan. The step should be different from but complementary to the existing plan.
        
        Client Information:
        - Name: ${selectedClient.name}
        - Therapy Type: ${selectedClient.therapyType}
        - Focus Areas: ${selectedClient.focusAreas.join(', ')}
        
        Session Topic: ${sessionTopic}
        Current Step Position: ${stepIndex + 1} of ${sessionPlan.structure.length}
        
        Format the response as a JSON object with the following structure:
        {
          "title": "Step title",
          "duration": "Estimated duration (e.g., '15 minutes')",
          "description": "Detailed description of the step"
        }
        
        Make the step professional, evidence-based, and clinically appropriate.
      `;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a professional therapy session planner with expertise in creating structured therapy sessions.' },
          { role: 'user', content: prompt + '\n\nPlease ensure your response is a valid JSON object following the structure specified above.' }
        ]
      });
      
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }
      
      const newStep = JSON.parse(content);
      
      // Update the session plan with the new step
      const updatedStructure = [...sessionPlan.structure];
      updatedStructure[stepIndex] = newStep;
      
      setSessionPlan({
        ...sessionPlan,
        structure: updatedStructure
      });
      
      // Reset save status when modifying plan
      setSaveSuccess(false);
      
    } catch (err) {
      console.error('Error regenerating step:', err);
      setError('Failed to regenerate step. Please try again.');
    } finally {
      setRegeneratingStep(null);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">AI Session Planner</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create a New Session Plan</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
              Select Client
            </label>
            <select
              id="client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedClient && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-2">Client Profile Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Therapy Type:</p>
                  <p className="font-medium">{selectedClient.therapyType}</p>
                  <p className="text-gray-600 mt-2">
                    Age: <span className="font-medium">{selectedClient.age || 'Not specified'}</span>
                  </p>
                  <p className="text-gray-600 mt-2">
                    Diagnosis: <span className="font-medium">{selectedClient.diagnosis || 'Not specified'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Focus Areas:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClient.focusAreas?.map((area, index) => (
                      <span key={index} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedClient.sessionHistory && Array.isArray(selectedClient.sessionHistory) && selectedClient.sessionHistory.length > 0 && (
                <div className="border-t border-indigo-100 pt-4 mt-4">
                  <h4 className="text-sm font-medium text-indigo-800 mb-2">Last Session Overview</h4>
                  <div className="bg-white rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{selectedClient.sessionHistory[0].topic}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedClient.sessionHistory[0].date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedClient.sessionHistory[0].plan.overview}
                    </p>
                    <button
                      onClick={() => setSelectedPreviousSession(selectedClient.sessionHistory[0])}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <Clock size={14} className="mr-1" />
                      View full session plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {selectedPreviousSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedPreviousSession.topic}</h3>
                    <p className="text-indigo-100 text-sm">
                      {new Date(selectedPreviousSession.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedPreviousSession(null)}
                    className="text-white hover:text-indigo-100"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
                      <p className="text-gray-600">{selectedPreviousSession.plan.overview}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Session Structure</h4>
                      <div className="space-y-4">
                        {selectedPreviousSession.plan.structure.map((item: any, index: number) => (
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
                        {selectedPreviousSession.plan.techniques.map((technique: any, index: number) => (
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
                        {selectedPreviousSession.plan.homework.map((item: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2"></span>
                            <span className="text-gray-600">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-yellow-800 mb-2">Therapist Notes</h4>
                      <p className="text-yellow-800">{selectedPreviousSession.plan.therapistNotes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="sessionTopic" className="block text-sm font-medium text-gray-700 mb-1">
              Session Topic or Goal
            </label>
            <input
              type="text"
              id="sessionTopic"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="E.g., Managing workplace anxiety, Building healthy boundaries..."
            />
          </div>

          <div>
            <label htmlFor="sessionDuration" className="block text-sm font-medium text-gray-700 mb-1">
              Session Duration (minutes)
            </label>
            <input
              type="number"
              id="sessionDuration"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(parseInt(e.target.value))}
              min="15"
              max="180"
              step="5"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!selectedClientId || !sessionTopic || isGenerating}
            className={`flex items-center justify-center space-x-2 w-full py-3 rounded-lg text-white font-medium ${
              !selectedClientId || !sessionTopic || isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Plan...</span>
              </>
            ) : (
              <>
                <Brain size={20} />
                <span>Generate Session Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {sessionPlan && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Session Plan for {selectedClient?.name}</h2>
              <p className="text-indigo-100">Topic: {sessionTopic}</p>
            </div>
            <div className="flex items-center space-x-2">
              {saveSuccess && (
                <span className="text-green-100 flex items-center">
                  <CheckCircle size={16} className="mr-1" />
                  Saved
                </span>
              )}
              <button
                onClick={() => {
                  if (isEditing) {
                    setSessionPlan(editedPlan);
                    setIsEditing(false);
                  } else {
                    setEditedPlan(sessionPlan);
                    setIsEditing(true);
                  }
                }}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30"
              >
                {isEditing ? <CheckCircle size={18} /> : <Edit2 size={18} />}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saveSuccess}
                className={`p-2 rounded-lg bg-white ${
                  saving || saveSuccess
                    ? 'bg-opacity-10 cursor-not-allowed'
                    : 'bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <Save size={18} className="text-white" />
              </button>
              <button className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30">
                <Download size={18} className="text-white" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Session Overview</h3>
              {isEditing ? (
                <textarea
                  value={editedPlan?.overview}
                  onChange={(e) => setEditedPlan(prev => ({ ...prev!, overview: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600">{sessionPlan.overview}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Session Structure</h3>
              <div className="space-y-4">
                {(isEditing ? editedPlan?.structure : sessionPlan.structure).map((item, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                        {regeneratingStep === index ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-800"></div>
                        ) : (
                          index + 1
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={item.title}
                            onChange={(e) => {
                              const newStructure = [...editedPlan!.structure];
                              newStructure[index] = { ...item, title: e.target.value };
                              setEditedPlan(prev => ({ ...prev!, structure: newStructure }));
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <input
                            value={item.duration}
                            onChange={(e) => {
                              const newStructure = [...editedPlan!.structure];
                              newStructure[index] = { ...item, duration: e.target.value };
                              setEditedPlan(prev => ({ ...prev!, structure: newStructure }));
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const newStructure = [...editedPlan!.structure];
                              newStructure[index] = { ...item, description: e.target.value };
                              setEditedPlan(prev => ({ ...prev!, structure: newStructure }));
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={3}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-800">{item.title}</h4>
                            <div className="ml-2 flex items-center space-x-2 text-gray-500 text-sm">
                              <span>{item.duration}</span>
                              <button
                                onClick={() => regenerateStep(index)}
                                disabled={regeneratingStep !== null}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                title="Generate new idea for this step"
                              >
                                <svg
                                  className="w-4 h-4 text-indigo-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582  9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-1">{item.description}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Therapeutic Techniques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isEditing ? editedPlan?.techniques : sessionPlan.techniques).map((technique, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={technique.name}
                          onChange={(e) => {
                            const newTechniques = [...editedPlan!.techniques];
                            newTechniques[index] = { ...technique, name: e.target.value };
                            setEditedPlan(prev => ({ ...prev!, techniques: newTechniques }));
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <textarea
                          value={technique.description}
                          onChange={(e) => {
                            const newTechniques = [...editedPlan!.techniques];
                            newTechniques[index] = { ...technique, description: e.target.value };
                            setEditedPlan(prev => ({ ...prev!, techniques: newTechniques }));
                          }}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-gray-800">{technique.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{technique.description}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Homework Assignments</h3>
              <ul className="space-y-2">
                {(isEditing ? editedPlan?.homework : sessionPlan.homework).map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2"></span>
                    {isEditing ? (
                      <input
                        value={item}
                        onChange={(e) => {
                          const newHomework = [...editedPlan!.homework];
                          newHomework[index] = e.target.value;
                          setEditedPlan(prev => ({ ...prev!, homework: newHomework }));
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-gray-600">{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Session Resources & Preparation</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Materials Needed</h4>
                    <textarea
                      value={editedPlan?.resources?.materials?.join('\n')}
                      onChange={(e) => setEditedPlan(prev => ({
                        ...prev!,
                        resources: {
                          ...prev!.resources,
                          materials: e.target.value.split('\n').filter(Boolean)
                        }
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter each material on a new line"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Worksheets & Handouts</h4>
                    <textarea
                      value={editedPlan?.resources?.worksheets?.join('\n')}
                      onChange={(e) => setEditedPlan(prev => ({
                        ...prev!,
                        resources: {
                          ...prev!.resources,
                          worksheets: e.target.value.split('\n').filter(Boolean)
                        }
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter each worksheet on a new line"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Equipment</h4>
                    <textarea
                      value={editedPlan?.resources?.equipment?.join('\n')}
                      onChange={(e) => setEditedPlan(prev => ({
                        ...prev!,
                        resources: {
                          ...prev!.resources,
                          equipment: e.target.value.split('\n').filter(Boolean)
                        }
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={2}
                      placeholder="Enter each equipment item on a new line"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Preparation Tasks</h4>
                    <textarea
                      value={editedPlan?.resources?.preparation?.join('\n')}
                      onChange={(e) => setEditedPlan(prev => ({
                        ...prev!,
                        resources: {
                          ...prev!.resources,
                          preparation: e.target.value.split('\n').filter(Boolean)
                        }
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter each preparation task on a new line"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessionPlan.resources?.materials?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Materials Needed</h4>
                      <ul className="space-y-1">
                        {sessionPlan.resources.materials.map((item, index) => (
                          <li key={index} className="flex items-start text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sessionPlan.resources?.worksheets?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Worksheets & Handouts</h4>
                      <ul className="space-y-1">
                        {sessionPlan.resources.worksheets.map((item, index) => (
                          <li key={index} className="flex items-start text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sessionPlan.resources?.equipment?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Equipment</h4>
                      <ul className="space-y-1">
                        {sessionPlan.resources.equipment.map((item, index) => (
                          <li key={index} className="flex items-start text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {sessionPlan.resources?.preparation?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Preparation Tasks</h4>
                      <ul className="space-y-1">
                        {sessionPlan.resources.preparation.map((item, index) => (
                          <li key={index} className="flex items-start text-yellow-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Therapist Notes</h3>
              {isEditing ? (
                <textarea
                  value={editedPlan?.therapistNotes}
                  onChange={(e) => setEditedPlan(prev => ({ ...prev!, therapistNotes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={4}
                />
              ) : (
                <p className="text-yellow-800">{sessionPlan.therapistNotes}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SessionPlan {
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
  resources: {
    materials: string[];
    worksheets: string[];
    equipment: string[];
    preparation: string[];
  };
}