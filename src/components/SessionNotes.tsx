import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Save, Clock, FileText, Trash2, Copy, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useClients, incrementSessionNotes } from '../contexts/ClientContext';
import { transcribeAudio, formatTherapyNotes } from '../services/openai';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';
import type { FormattedNote } from '../services/openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});
import { useAuth } from '../contexts/AuthContext';

const isDev = import.meta.env.MODE === 'development';
const mockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  auth_id: 'dev-auth-id'
};

export const SessionNotes: React.FC = () => {
  const { clients, incrementSessionNotes } = useClients();
  const { profile } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [processingTranscription, setProcessingTranscription] = useState(false);
  const [sections, setSections] = useState<Array<{ id: string; title: string }>>([
    { id: 'overview', title: 'Session Overview' },
    { id: 'content', title: 'Session Content' },
    { id: 'observations', title: 'Clinical Observations' },
    { id: 'plan', title: 'Treatment Plan' },
    { id: 'homework', title: 'Homework' }
  ]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [currentMarker, setCurrentMarker] = useState<string | null>(null);
  const [recordedContent, setRecordedContent] = useState('');
  const [markerTimestamps, setMarkerTimestamps] = useState<Array<{ time: number; section: string }>>([]);
  const [isFormatting, setIsFormatting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const selectedClient = clients.find(client => client.id === selectedClientId);

  const setupRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Unable to access microphone. Please check your browser permissions.');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setProcessingTranscription(true);
    
    try {
      const result = await transcribeAudio(audioBlob);
      
      if (result.success) {
        const text = result.text.trim();
        setRecordedContent(text);
        
        // Process markers and split content into sections
        const sectionedContent = processMarkers(text, markerTimestamps);
        setTranscribedText(sectionedContent);
      } else {
        setError(`Transcription failed: ${result.error || 'Unknown error'}`);
        if (selectedClient) {
          const mockText = generateMockTranscription(selectedClient);
          setRecordedContent(mockText);
          const sectionedContent = processMarkers(mockText, markerTimestamps);
          setTranscribedText(sectionedContent);
        }
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('An error occurred while processing the audio. Please try again.');
      if (selectedClient) {
        const mockText = generateMockTranscription(selectedClient);
        setRecordedContent(mockText);
        const sectionedContent = processMarkers(mockText, markerTimestamps);
        setTranscribedText(sectionedContent);
      }
    } finally {
      setProcessingTranscription(false);
    }
  };

  const processMarkers = (text: string, markers: Array<{ time: number; section: string }>) => {
    // Sort markers by timestamp
    const sortedMarkers = [...markers].sort((a, b) => a.time - b.time);
    
    // Split text into sections based on markers
    let sectionedContent = '';
    let lastIndex = 0;
    
    sortedMarkers.forEach((marker, index) => {
      const section = sections.find(s => s.id === marker.section);
      if (section) {
        sectionedContent += `\n\n### ${section.title}\n\n`;
        if (index < sortedMarkers.length - 1) {
          const nextMarker = sortedMarkers[index + 1];
          const wordsPerSecond = 3; // Approximate words per second in speech
          const approximateWordCount = (nextMarker.time - marker.time) * wordsPerSecond;
          const words = text.split(' ');
          const sectionText = words.slice(lastIndex, lastIndex + approximateWordCount).join(' ');
          sectionedContent += sectionText;
          lastIndex += approximateWordCount;
        } else {
          sectionedContent += text.split(' ').slice(lastIndex).join(' ');
        }
      }
    });
    
    return sectionedContent;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setProcessingTranscription(true);
      setCurrentMarker(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
    } else {
      if (!selectedClientId) return;
      
      audioChunksRef.current = [];
      await setupRecording();
      
      if (mediaRecorderRef.current) {
        setIsRecording(true);
        setRecordingTime(0);
        setTranscribedText('');
        setMarkerTimestamps([]);
        setError(null);
        
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        mediaRecorderRef.current.start();
      }
    }
  };
  
  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const id = newSectionTitle.toLowerCase().replace(/\s+/g, '_');
    setSections(prev => [...prev, { id, title: newSectionTitle.trim() }]);
    setNewSectionTitle('');
  };
  
  const markSection = (sectionId: string) => {
    if (!isRecording) return;
    setCurrentMarker(sectionId);
    setMarkerTimestamps(prev => [...prev, { time: recordingTime, section: sectionId }]);
  };
  
  const removeSection = (id: string) => {
    setSections(prev => prev.filter(section => section.id !== id));
    setMarkerTimestamps(prev => prev.filter(marker => marker.section !== id));
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleSave = async () => {
    if (!selectedClientId || !transcribedText) return;
    
    setSaving(true);
    setError(null);
    
    try {
      if (!profile?.id) {
        throw new Error('User profile not found');
      }

      // Format notes using OpenAI
      const formattedNotes = await formatTherapyNotes(
        transcribedText,
        {
          name: selectedClient?.name || '',
          therapyType: selectedClient?.therapyType || '',
          focusAreas: selectedClient?.focusAreas || []
        }
      );

      // Save session notes to Supabase
      const { error: saveError } = await supabase
        .from('session_notes')
        .insert({
          client_id: selectedClientId,
          user_id: profile.id,
          session_date: new Date().toISOString(),
          overview: formattedNotes.overview,
          summary: formattedNotes.summary,
          key_topics: formattedNotes.keyTopics,
          emotional_state: formattedNotes.emotionalState,
          interventions: formattedNotes.interventions,
          progress_notes: formattedNotes.progress,
          plan: formattedNotes.plan,
          homework: formattedNotes.homework,
          section_markers: formattedNotes.sectionMarkers,
          formatted_content: formattedNotes,
          template_type: 'ai_structured'
        });

      if (saveError) throw saveError;

      setSaveSuccess(true);
      incrementSessionNotes();
      
      // Update last session date for client
      await supabase
        .from('clients')
        .update({ last_session_date: new Date().toISOString() })
        .eq('id', selectedClientId);

    } catch (err) {
      console.error('Error saving session notes:', err);
      setError('Failed to save session notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatNotes = async () => {
    if (!selectedClient || !recordedContent) return;
    
    setIsFormatting(true);
    setError(null);
    
    try {
      const prompt = `
        Format the following therapy session transcription into professional clinical notes.
        
        Client Information:
        - Name: ${selectedClient.name}
        - Therapy Type: ${selectedClient.therapyType}
        - Focus Areas: ${selectedClient.focusAreas.join(', ')}
        
        The transcription is divided into sections with markers. Please format each section professionally,
        using appropriate clinical language and maintaining a professional therapeutic tone.
        
        Original Transcription:
        ${recordedContent}
        
        Section Markers:
        ${markerTimestamps.map(marker => {
          const section = sections.find(s => s.id === marker.section);
          return `- ${section?.title} (at ${formatTime(marker.time)})`;
        }).join('\n')}
        
        Please format the notes in a clear, professional structure following these guidelines:
        1. Use appropriate clinical terminology while maintaining clarity
        2. Focus on objective observations and clinical assessments
        3. Maintain a professional, therapeutic tone
        4. Include relevant therapeutic interventions and client responses
        5. Structure the content clearly using the provided section markers
        
        Format the response maintaining the section headers and adding professional clinical content.
      `;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert clinical therapist with extensive experience in writing professional therapy notes. Format the provided transcription into clear, professional clinical notes.'
          },
          { role: 'user', content: prompt }
        ]
      });
      
      const formattedContent = completion.choices[0].message.content;
      if (formattedContent) {
        setTranscribedText(formattedContent);
      }
    } catch (err) {
      console.error('Error formatting notes:', err);
      setError('Failed to format notes. Please try again.');
    } finally {
      setIsFormatting(false);
    }
  };

  useEffect(() => {
    return () => {
      setIsRecording(false);
      setCurrentMarker(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Voice-to-Text Note Taking</h2>
        
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
              disabled={isRecording}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
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
                </div>
                <div>
                  <p className="text-gray-600">Focus Areas:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClient.focusAreas.map((area, index) => (
                      <span key={index} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 space-y-6">
            {/* Recording Controls */}
            <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleRecording} 
                  disabled={!selectedClientId || processingTranscription}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {isRecording ? (
                    <>
                      <MicOff size={20} />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic size={20} />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>
                {isRecording && (
                  <div className="flex items-center space-x-2 text-red-500">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                )}
                {processingTranscription && !isRecording && (
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span>Transcribing audio...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Section Markers */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Section Markers</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="New section title"
                    className="w-48 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addSection}
                    disabled={!newSectionTitle.trim()}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  >
                    <Plus size={14} className="mr-1" />
                    Add
                  </button>
                </div>
              </div>
              
              {/* Section List */}
              <div className="flex flex-wrap gap-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`group flex items-center px-3 py-1.5 rounded-full border transition-colors ${
                      currentMarker === section.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{section.title}</span>
                    {markerTimestamps.find(m => m.section === section.id) && (
                      <span className="ml-1.5 text-xs text-gray-500">
                        ({formatTime(markerTimestamps.find(m => m.section === section.id)!.time)})
                      </span>
                    )}
                    <div className="ml-2 flex items-center space-x-1">
                      <button
                        onClick={() => markSection(section.id)}
                        disabled={!isRecording}
                        className={`p-1 rounded-full transition-colors ${
                          isRecording
                            ? 'text-indigo-600 hover:bg-indigo-100'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={isRecording ? 'Mark section' : 'Start recording to mark sections'}
                      >
                        <Clock size={14} />
                      </button>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove section"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Raw Transcribed Text */}
            {recordedContent && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Raw Transcription</h3>
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                  {recordedContent}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={formatNotes}
                    disabled={isFormatting || !recordedContent}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isFormatting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Formatting...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        <span>Format Note</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Transcribed Content */}
            {transcribedText && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Session Notes</h3>
                <textarea
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Note</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};