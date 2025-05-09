import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made from a backend
});

export interface FormattedNote {
  overview: string;
  summary: string;
  keyTopics: string[];
  emotionalState: string;
  interventions: string[];
  progress: string;
  plan: string;
  homework: string[];
  sectionMarkers: {
    title: string;
    content: string;
  }[];
}

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Transcribes audio to text using OpenAI's Whisper model
 * @param audioBlob The audio blob to transcribe
 * @returns The transcription result
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    // Make the API call
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
    });
    
    return {
      text: response.text,
      success: true
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during transcription'
    };
  }
}

/**
 * Formats transcribed text into structured therapy notes using OpenAI's GPT model
 * @param transcription The transcribed text
 * @param clientInfo Client information to provide context
 * @returns Formatted therapy notes
 */
export async function formatTherapyNotes(
  transcription: string, 
  clientInfo: { name: string; therapyType: string; focusAreas: string[] }
): Promise<FormattedNote> {
  try {
    // Default formatted note structure in case of error
    const defaultNote: FormattedNote = {
      overview: 'Unable to generate overview.',
      keyTopics: ['Unable to identify key topics.'],
      emotionalState: 'Unable to assess emotional state.',
      interventions: ['Unable to identify interventions.'],
      progress: 'Unable to assess progress.',
      plan: 'Unable to generate plan.',
      homework: ['Unable to identify homework.']
    };
    
    if (!transcription.trim()) {
      return defaultNote;
    }
    
    // Create the prompt for the GPT model
    const prompt = `
      You are an expert therapist assistant. Format the following therapy session transcription into structured clinical notes.
      
      Client Information:
      - Name: ${clientInfo.name}
      - Therapy Type: ${clientInfo.therapyType}
      - Focus Areas: ${clientInfo.focusAreas.join(', ')}
      
      Transcription:
      ${transcription}
      
      Format the notes into the following JSON structure:
      {
        "overview": "A concise summary of the session (2-3 sentences)",
        "summary": "A brief one-line summary for quick preview",
        "keyTopics": ["List of 3-5 main topics discussed"],
        "emotionalState": "Assessment of client's emotional presentation during session",
        "interventions": ["List of therapeutic techniques or interventions used"],
        "progress": "Assessment of client's progress and engagement",
        "plan": "Plan for next session",
        "homework": ["List of assignments for client to complete before next session"],
        "sectionMarkers": [
          {
            "title": "Section title",
            "content": "Content for this section"
          }
        ]
      }
      
      Ensure the notes are:
      1. Professional and clinically appropriate
      2. Concise and well-structured
      3. Based only on information from the transcription
      4. Organized into clear, logical sections
      5. Include a brief summary for quick reference
    `;
    
    // Make the API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional therapy note assistant that helps format session transcriptions into structured clinical notes.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    // Parse the response
    const content = completion.choices[0].message.content;
    if (!content) {
      return defaultNote;
    }
    
    const formattedNote = JSON.parse(content) as FormattedNote;
    return formattedNote;
    
  } catch (error) {
    console.error('Error formatting therapy notes:', error);
    
    // Return a default formatted note structure
    return {
      overview: 'Session notes could not be generated due to an error. Please try again or format manually.',
      keyTopics: ['Error processing transcription'],
      emotionalState: 'Unable to assess',
      interventions: ['Unable to identify'],
      progress: 'Unable to assess',
      plan: 'Please review the transcription and create a plan manually',
      homework: ['Please assign homework manually']
    };
  }
}