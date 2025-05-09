import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Calendar, FileText, BookOpen, ChevronRight, Download, Clock, AlertTriangle, History, PenTool, FolderOpen, Timer, CheckCircle, Search } from 'lucide-react';
import { useClients } from '../contexts/ClientContext';
import { useUser } from '@clerk/clerk-react';
import jsPDF from 'jspdf';

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

const generateSessionPDF = (session: any) => {
  const pdf = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const lineHeight = 7;
  const pageWidth = pdf.internal.pageSize.width;
  
  // Helper function to add wrapped text
  const addWrappedText = (text: string, y: number, fontSize = 12) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    pdf.text(lines, margin, y);
    return y + (lines.length * lineHeight);
  };
  
  // Title and Date
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText(session.topic, yPos, 18);
  pdf.setFont('helvetica', 'normal');
  yPos = addWrappedText(new Date(session.date).toLocaleDateString(), yPos + 5);
  yPos += 10;
  
  // Overview
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText('Overview', yPos);
  pdf.setFont('helvetica', 'normal');
  yPos = addWrappedText(session.plan.overview, yPos + 5);
  yPos += 10;
  
  // Structure
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText('Session Structure', yPos);
  pdf.setFont('helvetica', 'normal');
  session.plan.structure.forEach((item: any, index: number) => {
    yPos = addWrappedText(`${index + 1}. ${item.title} (${item.duration})`, yPos + 5);
    yPos = addWrappedText(item.description, yPos + 3);
  });
  yPos += 10;
  
  // Techniques
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText('Therapeutic Techniques', yPos);
  pdf.setFont('helvetica', 'normal');
  session.plan.techniques.forEach((technique: any) => {
    yPos = addWrappedText(technique.name, yPos + 5);
    yPos = addWrappedText(technique.description, yPos + 3);
  });
  yPos += 10;
  
  // Homework
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText('Homework Assignments', yPos);
  pdf.setFont('helvetica', 'normal');
  session.plan.homework.forEach((item: string) => {
    yPos = addWrappedText(`• ${item}`, yPos + 5);
  });
  yPos += 10;
  
  // Therapist Notes
  pdf.setFont('helvetica', 'bold');
  yPos = addWrappedText('Therapist Notes', yPos);
  pdf.setFont('helvetica', 'normal');
  yPos = addWrappedText(session.plan.therapistNotes, yPos + 5);
  
  // Save the PDF
  pdf.save(`session-plan-${session.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

interface SessionPlanPopupProps {
  session: {
    id: string;
    topic: string;
    date: string;
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
  };
  onClose: () => void;
}

interface SessionNotePopupProps {
  note: {
    id: string;
    date: string;
    content: {
      overview: string;
      keyTopics: string[];
      emotionalState: string;
      interventions: string[];
      progress: string;
      plan: string;
      homework: string[];
      sectionMarkers?: {
        title: string;
        content: string;
      }[];
    };
  };
  onClose: () => void;
}

const SessionNotePopup: React.FC<SessionNotePopupProps> = ({ note, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Session Notes</h3>
            <p className="text-indigo-100 text-sm">{new Date(note.date).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-indigo-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
              <p className="text-gray-600">{note.content.overview}</p>
            </div>
            
            {note.content.sectionMarkers?.map((section, index) => (
              <div key={index}>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h4>
                <p className="text-gray-600">{section.content}</p>
              </div>
            ))}
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Key Topics</h4>
              <div className="flex flex-wrap gap-2">
                {note.content.keyTopics?.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Emotional State</h4>
              <p className="text-gray-600">{note.content.emotionalState}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Interventions Used</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {note.content.interventions?.map((intervention, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{intervention}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Progress Notes</h4>
              <p className="text-gray-600">{note.content.progress}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Plan</h4>
              <p className="text-gray-600">{note.content.plan}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Homework</h4>
              <ul className="space-y-2">
                {note.content.homework?.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2"></span>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionPlanPopup: React.FC<SessionPlanPopupProps> = ({ session, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{session.topic}</h3>
            <p className="text-indigo-100 text-sm">{new Date(session.date).toLocaleDateString()}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-indigo-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
              <p className="text-gray-600">{session.plan.overview}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Session Structure</h4>
              <div className="space-y-4">
                {session.plan.structure.map((item, index) => (
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
                {session.plan.techniques.map((technique, index) => (
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
                {session.plan.homework.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 mr-2"></span>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-yellow-800 mb-2">Therapist Notes</h4>
              <p className="text-yellow-800">{session.plan.therapistNotes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ClientProfileProps {
  clientId: string | null;
  isNewClient: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const ClientProfile: React.FC<ClientProfileProps> = ({ clientId, isNewClient, onSave, onCancel }) => {
  const { clients, addClient, updateClient, removeClient } = useClients();
  const { user } = useUser();
  const [focusAreaInput, setFocusAreaInput] = useState('');
  
  const emptyClient = {
    id: '',
    name: '',
    age: '0',
    hobbies: [],
    therapyType: '',
    focusAreas: [],
    shortTermGoals: '',
    longTermGoals: '',
    notes: '',
    lastSession: '',
    sessionHistory: [],
    sessionNotes: [],
    resources: []
  };

  const [formData, setFormData] = useState(emptyClient);
  const [hobbyInput, setHobbyInput] = useState('');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState('info');
  const [customTherapyType, setCustomTherapyType] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [therapyTypeSearch, setTherapyTypeSearch] = useState('');
  const [showTherapyTypes, setShowTherapyTypes] = useState(false);

  const filteredTherapyTypes = therapyTypes.filter(type =>
    type.toLowerCase().includes(therapyTypeSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!clientId) return;
    
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (clientId) {
      updateClient({
        ...formData,
        user_id: user.id
      });
    } else {
      addClient({
        ...formData,
        id: Date.now().toString(),
        user_id: user.id
      });
    }
    
    onSave();
  };

  useEffect(() => {
    if (clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setFormData(client);
      }
    } else if (isNewClient) {
      setFormData(emptyClient);
    } else {
      setFormData(emptyClient);
    }
  }, [clientId, clients, isNewClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'therapyType' && value !== 'Other') {
      setCustomTherapyType('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value === 'Other' && name === 'therapyType' 
        ? customTherapyType || 'Other'
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (clientId) {
      updateClient({
        ...formData,
        user_id: user.id
      });
    } else {
      addClient({
        ...formData,
        id: Date.now().toString(),
        user_id: user.id
      });
    }
    
    onSave();
  };

  const addHobby = () => {
    if (hobbyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), hobbyInput.trim()]
      }));
      setHobbyInput('');
    }
  };

  const removeHobby = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter(h => h !== hobby)
    }));
  };

  const addFocusArea = () => {
    if (focusAreaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...(prev.focusAreas || []), focusAreaInput.trim()]
      }));
      setFocusAreaInput('');
    }
  };

  const removeFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: (prev.focusAreas || []).filter(a => a !== area)
    }));
  };

  const generateResourcePDF = (resource: any) => {
    const pdf = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = pdf.internal.pageSize.width;
    
    const addWrappedText = (text: string, y: number, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      pdf.text(lines, margin, y);
      return y + (lines.length * lineHeight);
    };
    
    pdf.setFont('helvetica', 'bold');
    yPos = addWrappedText(resource.title, yPos, 18);
    yPos += 10;
    
    pdf.setFont('helvetica', 'normal');
    yPos = addWrappedText(`Type: ${resource.type}`, yPos);
    yPos += 10;
    
    if (resource.content.purpose) {
      pdf.setFont('helvetica', 'bold');
      yPos = addWrappedText('Purpose:', yPos);
      pdf.setFont('helvetica', 'normal');
      yPos = addWrappedText(resource.content.purpose, yPos + 5);
      yPos += 10;
    }
    
    if (resource.content.instructions) {
      pdf.setFont('helvetica', 'bold');
      yPos = addWrappedText('Instructions:', yPos);
      pdf.setFont('helvetica', 'normal');
      yPos = addWrappedText(resource.content.instructions, yPos + 5);
      yPos += 10;
    }
    
    if (resource.content.sections) {
      resource.content.sections.forEach((section: any) => {
        if (yPos > pdf.internal.pageSize.height - 50) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        yPos = addWrappedText(section.title, yPos);
        pdf.setFont('helvetica', 'normal');
        yPos += 5;
        
        if (section.content) {
          yPos = addWrappedText(section.content, yPos);
        }
        
        if (section.items) {
          section.items.forEach((item: string) => {
            yPos = addWrappedText(`• ${item}`, yPos + 3);
          });
        }
        
        yPos += 10;
      });
    }
    
    pdf.save(`${resource.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 shadow-xl rounded-xl max-w-6xl mx-auto border border-gray-100">
      <div className="border-b border-gray-100 bg-white rounded-t-xl">
        <div className="px-8 py-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {isNewClient ? 'New Client Profile' : 'Edit Client Profile'}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center transition-colors shadow-sm"
            >
              <Save size={18} className="mr-2" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Trash2 size={18} />
              <span>Delete Client</span>
            </button>
          </div>
        </div>

        <div className="px-8 -mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('info')}
            className={`py-4 border-b-2 font-medium text-sm ${
              selectedTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Basic Information</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`py-4 border-b-2 font-medium text-sm ${
              selectedTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center space-x-2">
              <History size={16} />
              <span>Session History</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('resources')}
            className={`py-4 border-b-2 font-medium text-sm ${
              selectedTab === 'resources'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } transition-colors`}
          >
            <div className="flex items-center space-x-2">
              <FolderOpen size={16} />
              <span>Resources</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-8">
        {selectedTab === 'info' && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};