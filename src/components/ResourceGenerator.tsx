import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TextStyle from '@tiptap/extension-text-style';
import { FontSize } from '../lib/extensions/FontSize';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Save, Download, FileText, Share, Undo, Redo, Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered, CheckSquare, Heading1, Heading2, Heading3, X, Check, AlertCircle, AlignLeft, AlignCenter, AlignRight, TextSelect } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { supabase, createClerkSupabaseClient } from '../lib/supabase';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const resourceTypes = ['worksheet', 'handout', 'exercise', 'journal', 'checklist', 'assessment'] as const;
type ResourceType = typeof resourceTypes[number];

export const ResourceGenerator: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType>('worksheet');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'bullet-list'
          }
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'ordered-list'
          }
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'bulletList', 'orderedList']
      }),
      TextStyle,
      FontSize,
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item'
        }
      }),
      Placeholder.configure({
        placeholder: 'Your resource content will appear here...'
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none max-w-none [&_.task-list]:list-none [&_.task-item]:flex [&_.task-item]:items-start [&_.task-item]:gap-2 [&>ul]:list-disc [&>ol]:list-decimal [&>ul>li]:ml-4 [&>ol>li]:ml-4 [&_.bullet-list]:list-disc [&_.ordered-list]:list-decimal [&_.ProseMirror-selectednode]:outline-none'
      }
    },
    onUpdate: ({ editor }) => {
      // Handle auto-save
      setAutoSaveStatus('saving');
      handleAutoSave(editor.getHTML());
    }
  });

  const handleAutoSave = async (content: string) => {
    try {
      // Save to local storage for backup
      localStorage.setItem('resource_draft', content);
      
      // TODO: Implement auto-save to backend
      setAutoSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  };

  const handleGenerate = async () => {
    if (!title || !prompt) {
      setError('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const selectedClient = clients.find(c => c.id === selectedClientId);

      let systemPrompt = '';
      
      if (selectedType === 'worksheet') {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapy worksheets.

${selectedClient?.age ? `This worksheet should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

Create a structured therapy worksheet on: ${prompt}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

${selectedClient?.age ? `
Age-Specific Guidelines:
- Use language appropriate for ${selectedClient.age}-year-old clients
- Include age-appropriate examples and metaphors
- Adjust complexity level to match developmental stage
- Use engaging formats that resonate with this age group
- Consider attention span and cognitive abilities
- Include visual elements if helpful for this age
` : ''}

CRITICAL: You MUST follow this EXACT format and structure:

<strong><h1 style="text-align: center;">${title}</h1> (H1, bold, centered)</strong>
[Add blank line after title]

<strong><h2>💡 Introduction Section </h2> </strong>
[Add blank line after heading]

Brief explanation of worksheet's purpose (2-3 sentences)
Connect to therapeutic goals
[Add blank line before next section]

<strong><h2>🔹 Worksheet Instructions </h2> </strong>
[Add blank line after heading]

Clearly explain how to complete the worksheet
Include step-by-step guidance 
Example:
• Read the prompt carefully. <br />
• Write your response in the space provided. <br />
• Reflect on what you've written. <br />
[Add blank line before next section]

<strong><h2>🖊️ Interactive Exercises </h2></strong>
[Add blank line after heading]

<strong>Exercise 1: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong>Exercise 2: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong>Exercise 3: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong><h2>📋 Checklist & Reflection</h2></strong>
[Add blank line after heading]

☐ Did I complete all worksheet sections? <br />
☐ Have I thought deeply about my responses? <br />
☐ What was the most important takeaway from this worksheet? <br />
[Add blank line before next section]

<strong><h2>🌅 Final Reflection & Encouragement</h2></strong>
[Add blank line after heading]

<strong>What is one action step I can take based on what I've learned in this worksheet?</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

[Include encouraging statement to promote continued self-reflection]

FORMAT REQUIREMENTS:
1. Title MUST be centered using style="text-align: center;"
2. Each section MUST be separated by <br /> tags exactly as shown
3. Use bullet points (•) and checkboxes (☐) exactly as shown
4. Include all emojis exactly as shown
5. Follow the exact order of sections
6. Use the exact heading structure shown
7. Maintain all spacing and formatting exactly as shown
8. Use three underscores followed by <br /> for writing spaces
9. Add <br /><br /> after writing spaces

The worksheet should be professional, evidence-based, and therapeutically sound.`;
      } else if (selectedType === 'handout') {
        systemPrompt = `You are an expert therapist assistant specializing in creating educational therapy handouts.

${selectedClient?.age ? `This handout should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

Create a structured therapy handout on: ${prompt}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

CRITICAL: You MUST follow this EXACT format and structure:

<strong> <h1 style="text-align: center;">${title}</h1> </strong>
[Add blank line after title]

<strong><h2>💡 Introduction</h2> </strong>
[Add blank line after heading]

Brief overview of the handout's purpose (2-3 sentences)
Explain why this topic is important in therapy
Connect the topic to practical therapeutic applications
[Add blank line before next section]

<strong><h2>📚 Key Information Section</h2> </strong>
[Add blank line after heading]

Provide 3-4 key points about the topic
Use bullet points for clarity
Example:
• What is the topic about? <br />
• Why is it important? <br />
• Common misconceptions and facts <br />
• How can it be applied in therapy? <br />
[Add blank line before next section]

<strong><h2>🛠️ Practical Strategies & Tips</h2> </strong>
[Add blank line after heading]

List actionable strategies or coping techniques
Use checkboxes (☐) to create an interactive checklist <br />
☐ Strategy 1: Describe it clearly <br />
☐ Strategy 2: Give examples <br />
☐ Strategy 3: Encourage implementation <br />
Keep strategies brief and actionable
[Add blank line before next section]

<strong><h2>💬 Common Myths vs. Facts</h2> </strong>
[Add blank line after heading]

Present 3-4 myths and facts to correct misunderstandings
Example format:
❌ Myth: [Common misconception] <br />
✅ Fact: [Truth and explanation] <br />
[Add blank line before next section] 

<strong><h2>📋 Final Takeaway & Reflection</h2> </strong>
[Add blank line after heading]

<strong>How will you apply this information in your daily life?</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

[Include encouraging statement to promote continued growth and practice]

FORMAT REQUIREMENTS:
1. Title MUST be centered using style="text-align: center;"
2. Each section MUST be separated by <br /> tags exactly as shown
3. Use bullet points (•) and checkboxes (☐) exactly as shown
4. Include all emojis exactly as shown
5. Follow the exact order of sections
6. Use the exact heading structure shown
7. Maintain all spacing and formatting exactly as shown
8. Use three underscores followed by <br /> for writing spaces
9. Add <br /><br /> after writing spaces

${selectedClient?.age ? `
Age-Appropriate Guidelines:
- Use language suitable for ${selectedClient.age}-year-old clients
- Include examples that resonate with this age group
- Adjust complexity to match developmental level
- Keep explanations clear and relatable
- Use age-appropriate metaphors and comparisons
` : ''}

The handout should be professional, evidence-based, and therapeutically sound.`;

      } else if (selectedType === 'exercise') {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapeutic exercises.

${selectedClient?.age ? `This exercise should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

Create a structured therapy exercise on: ${prompt}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

CRITICAL: You MUST follow this EXACT format and structure:

<strong><h1 style="text-align: center;">${title}</h1></strong>
[Add blank line after title]

<strong><h2>💡 Introduction</h2></strong>
[Add blank line after heading]

Brief overview of the exercise's purpose (2-3 sentences)
How this exercise supports therapeutic goals
What the client will gain from completing it
[Add blank line before next section]

<strong><h2>📋 Preparation & Materials Needed</h2></strong>
[Add blank line after heading]

List any materials or setup needed to complete the exercise <br />
Example:
• Pen & Paper<br />
• Quiet Space for Reflection<br />
• Worksheet Printout (if applicable)<br />
[Add blank line before next section]

<strong><h2>🔄 Step-by-Step Instructions</h2></strong>
[Add blank line after heading]

Clearly outline the exercise process in numbered steps <br />
Example:
1. Find a quiet and comfortable space to complete this exercise.<br />
2. Read through each reflection question carefully before responding.<br />
3. Write your responses in the provided spaces.<br />
4. Take a moment to pause and reflect before moving to the next section.<br />
[Add blank line before next section]

<strong><h2>✍ Interactive Exercise Prompts</h2></strong>
[Add blank line after heading]

<strong>Exercise 1: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong>Exercise 2: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong>Exercise 3: [Question/Prompt]</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong><h2>🌱 Reflection & Application</h2></strong> <br />
[Add blank line after heading]

☐ How did this exercise help me understand my emotions?<br />
☐ What insights did I gain from this process?<br />
☐ How can I apply this exercise in daily life?<br />
[Add blank line before next section]

<strong><h2>🌅 Final Encouragement & Takeaway</h2></strong>
[Add blank line after heading]

[Add a final motivational statement]
Example: "Remember, growth takes time—small steps lead to big changes!"

FORMAT REQUIREMENTS:
1. Title MUST be centered using style="text-align: center;"
2. Each section MUST be separated by <br /> tags exactly as shown
3. Use bullet points (•) and checkboxes (☐) exactly as shown
4. Include all emojis exactly as shown
5. Follow the exact order of sections
6. Use the exact heading structure shown
7. Maintain all spacing and formatting exactly as shown
8. Use three underscores followed by <br /> for writing spaces
9. Add <br /><br /> after writing spaces

${selectedClient?.age ? `
Age-Specific Guidelines:
- Design activities suitable for ${selectedClient.age}-year-old clients
- Use age-appropriate instructions and language
- Consider physical and cognitive abilities
- Include modifications for developmental level
- Ensure safety guidelines are age-appropriate
- Make it engaging for this age group
` : ''}

The exercise should be safe, effective, and therapeutically appropriate.`;
      } else if (selectedType === 'journal') {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapeutic journal prompts.

Create a structured therapy journal prompt on: ${prompt}

${selectedClient?.age ? `This journal prompt should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

${selectedClient?.age ? `
Age-Specific Guidelines:
- Adjust language and prompts for ${selectedClient.age}-year-old clients
- Match reflection depth to developmental stage
- Use age-appropriate examples and metaphors
- Consider emotional maturity level
- Structure length based on attention span
` : ''}

FORMAT IT AS FOLLOWS:

${title}
[Add blank line after title]

📝 Title (H1, centered, bold)
💭 Introduction Section (H2, bold, left-aligned)
[Add blank line after heading]
- Brief explanation of journal's purpose (2-3 sentences)
- Create supportive, reflective tone
- Connect to therapeutic goals
[Add blank line before next section]


💫 Main Prompts (H2, bold, left-aligned)
[Add blank line after heading]
- Each reflection question in <strong> tags followed by:
  - Use <br />
  ______________________________________________________________________________________________
  <br />
  ______________________________________________________________________________________________
  <br />
  ______________________________________________________________________________________________
  <br /><br /> for writing spaces
- Use open-ended questions for deeper reflection
- Include 3-4 main reflection prompts
[Add blank line before next section]


🌿 Mindful Awareness Section (H2, bold, left-aligned)<br />
[Add blank line after heading]
- Include checklist format:
  ☐ Notice your breathing
  ☐ Observe your current emotions
  ☐ Notice physical sensations
  ☐ Be aware of your thoughts
[Add blank line before next section]


🌅 Final Prompt & Statement (H2, bold, left-aligned)<br />
[Add blank line after heading]
- Add summarizing reflection question
- Include encouraging statement
[Add blank line after section]

FORMAT REQUIREMENTS:
- Use <h1> for Title (centered)
- Use <h2> for Section Headings
- Add <br /> after each heading for spacing
- Use <strong> tags for reflection questions
- Add three full-width lines after each question or in the excercise section:
  ______________________________________________________________________________________________
  ______________________________________________________________________________________________
  ______________________________________________________________________________________________
- Add double line break (<br /><br />) after writing space
- Use ☐ for mindful observation checklist
- Add <br /> between major sections
- Keep formatting consistent throughout
- Ensure adequate spacing for readability

The journal should be structured, reflective, and therapeutically meaningful.`;
      } else if (selectedType === 'checklist') {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapeutic checklists.

${selectedClient?.age ? `This checklist should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

Create a structured therapy checklist on: ${prompt}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

CRITICAL: You MUST follow this EXACT format and structure:

<strong><h1 style="text-align: center;">${title}</h1></strong>
[Add blank line after title]

<strong><h2>💡 Introduction</h2></strong>
[Add blank line after heading]

Brief overview of the checklist's purpose (2-3 sentences)
How this checklist supports therapeutic goals
What the client will gain from completing it
[Add blank line before next section]

<strong><h2>📋 Checklist Instructions</h2>
[Add blank line after heading]

Explain how to use the checklist effectively<br />
Example:
• Review each item carefully<br />
• Check off (☐) items as you complete them<br />
• Use the notes section to track your progress<br />
[Add blank line before next section]

<strong><h2>✅ Step-by-Step Checklist</h2></strong>
[Add blank line after heading]

<strong>Morning Mindfulness Routine:</strong><br />
☐ Take 3 deep breaths to start the day calmly<br />
☐ Stretch for 5 minutes to wake up the body<br />
☐ Set an intention for the day<br />
<br />

<strong>Daily Anxiety Management:</strong><br />
☐ Identify one emotion you are feeling today<br />
☐ Use a grounding technique (5-4-3-2-1 method)<br />
☐ Take a 10-minute mindful break<br />
[Add blank line before next section]

<strong><h2>📓 Progress Tracking</h2></strong>
[Add blank line after heading]

Date: ______________________________
<br /><br />

What worked well today?
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

What can I improve?
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

<strong><h2>🌅 Final Encouragement & Reflection</h2></strong>
[Add blank line after heading]

[Add a motivational statement for consistency and reflection]
Example: "Every small step counts. Keep moving forward!"

<strong>Final Self-Check:</strong><br />
☐ I completed today's checklist items<br />
☐ I tracked my progress honestly<br />
☐ I identified areas for improvement<br />

FORMAT REQUIREMENTS:
1. Title MUST be centered using style="text-align: center;"
2. Each section MUST be separated by <br /> tags exactly as shown
3. Use bullet points (•) and checkboxes (☐) exactly as shown
4. Include all emojis exactly as shown
5. Follow the exact order of sections
6. Use the exact heading structure shown
7. Maintain all spacing and formatting exactly as shown
8. Use underscores followed by <br /> for writing spaces
9. Add <br /><br /> after writing spaces

${selectedClient?.age ? `
Age-Specific Guidelines:
- Create tasks appropriate for ${selectedClient.age}-year-old clients
- Use clear, age-appropriate language
- Include achievable goals for this age
- Consider developmental capabilities
- Make tracking suitable for this age group
- Use engaging format and presentation
` : ''}

The checklist should be practical, motivating, and therapeutically relevant.`;
      } else if (selectedType === 'assessment') {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapeutic assessments.

${selectedClient?.age ? `This assessment should be age-appropriate for a ${selectedClient.age}-year-old client.` : ''}

Create a structured therapy assessment on: ${prompt}

${selectedClient ? `Client Context: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

CRITICAL: You MUST follow this EXACT format and structure:

<strong><h1 style="text-align: center;">${title}</h1></strong>
[Add blank line after title]

<strong><h2>💡 Introduction</h2></strong>
[Add blank line after heading]

Brief overview of the assessment's purpose (2-3 sentences)
How this assessment helps with therapeutic goals
Instructions on how to complete the assessment
[Add blank line before next section]

<strong><h2>📋 Assessment Instructions</h2></strong>
[Add blank line after heading]

Explain how to complete the assessment effectively<br />
Example:
• Read each statement carefully<br />
• Rate yourself on a scale from 0-4 (0 = Never, 4 = Always)<br />
• Check the box (☐) that best represents your response<br />
[Add blank line before next section]

<strong><h2>📝 Assessment Items</h2></strong>
[Add blank line after heading]

<strong>Category 1: Emotional Regulation</strong>
<br />
1. I can identify and name my emotions.
☐ Never (0) ☐ Rarely (1) ☐ Sometimes (2) ☐ Often (3) ☐ Always (4)
<br /><br />

2. When I feel overwhelmed, I use a coping strategy.
☐ Never (0) ☐ Rarely (1) ☐ Sometimes (2) ☐ Often (3) ☐ Always (4)
<br /><br />

<strong>Category 2: Social Interactions</strong>
<br />
3. I feel comfortable expressing my thoughts to others.
☐ Never (0) ☐ Rarely (1) ☐ Sometimes (2) ☐ Often (3) ☐ Always (4)
<br /><br />

4. I maintain eye contact during conversations.
☐ Never (0) ☐ Rarely (1) ☐ Sometimes (2) ☐ Often (3) ☐ Always (4)
<br /><br />
[Add blank line before next section]

<strong><h2>📊 Scoring & Interpretation</h2></strong>
[Add blank line after heading]

<strong>Total Score Range: 0-40</strong>
<br />
Score Interpretations:
<br />
• 0-10: Minimal symptoms – No intervention needed
• 11-20: Mild symptoms – Self-guided coping strategies recommended
• 21-30: Moderate symptoms – Consider therapy sessions
• 31-40: High symptoms – Professional intervention strongly advised
[Add blank line before next section]

<strong><h2>🌅 Final Recommendations & Next Steps</h2></strong>
[Add blank line after heading]

<strong>Based on your score:</strong>
<br />
If your score was above 20, consider seeking professional support.
<br /><br />

<strong>Additional Notes & Observations:</strong>
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br />
______________________________________________________________________________________________
<br /><br />

FORMAT REQUIREMENTS:
1. Title MUST be centered using style="text-align: center;"
2. Each section MUST be separated by <br /> tags exactly as shown
3. Use bullet points (•) and checkboxes (☐) exactly as shown
4. Include all emojis exactly as shown
5. Follow the exact order of sections
6. Use the exact heading structure shown
7. Maintain all spacing and formatting exactly as shown
8. Use underscores followed by <br /> for writing spaces
9. Add <br /><br /> after writing spaces

${selectedClient?.age ? `
Age-Specific Guidelines:
- Design questions appropriate for ${selectedClient.age}-year-old clients
- Use age-appropriate language and concepts
- Consider developmental stage in scoring
- Adjust complexity for cognitive level
- Include age-appropriate examples
- Make rating scales understandable for this age
` : ''}

The assessment should be evidence-based, clinically valid, and therapeutically useful.`;
      } else {
        systemPrompt = `You are an expert therapist assistant specializing in creating therapy resources. Create a professional ${selectedType} with the following specifications:

Title: ${title}
Type: ${selectedType}
${selectedClient ? `Client Focus: ${selectedClient.therapyType} therapy, focusing on ${selectedClient.focusAreas.join(', ')}` : ''}

Format the response as a well-structured document with:
1. Clear headings and sections
2. Professional therapeutic language
3. Evidence-based content
4. Interactive elements where appropriate
5. Clear instructions and guidance

The content should be formatted in HTML with appropriate tags for:
- Headings (<h1>, <h2>, <h3>)
- Lists (<ul>, <ol>)
- Checkboxes where needed
- Paragraphs with proper spacing
- Tables if required

User's Request: ${prompt}`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: selectedType === 'worksheet' ? 
            'Please create the worksheet following the exact format specified, ensuring all sections and formatting requirements are met.' : 
            prompt 
          }
        ]
      });

      const generatedContent = completion.choices[0].message.content;
      if (generatedContent && editor) {
        // Center the title for worksheets
        if (selectedType === 'worksheet' || selectedType === 'handout' || selectedType === 'exercise' || selectedType === 'journal' || selectedType === 'checklist' || selectedType === 'assessment') {
          const processedContent = generatedContent.replace(
            /<h1>/g, 
            '<h1 style="text-align: center;">'
          );
          editor.commands.setContent(processedContent);
        } else {
          editor.commands.setContent(generatedContent);
        }
      }

    } catch (err) {
      console.error('Error generating resource:', err);
      setError('Failed to generate resource. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editor || !title) return;

    try {
      if (!isSignedIn || !user) {
        throw new Error('Please sign in to save resources');
      }

      setSaving(true);
      setError(null);

      const supabaseClient = await createClerkSupabaseClient();

      // Save resource
      const { error: saveError } = await supabaseClient
        .from('resources')
        .insert({
          user_id: user.id,
          client_id: selectedClientId || null,
          title: title,
          type: selectedType,
          content: {
            html: editor.getHTML(),
            raw: editor.getText()
          },
          formatted_content: {
            sections: [],
            styles: {},
            metadata: {}
          }
        });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportWord = () => {
    if (!editor) return;
    
    // Create HTML content with styling
    const htmlContent = `
      <html xmlns:w="urn:schemas-microsoft-com:office:word">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <style>
            @page {
              size: A4;
              margin: 2.54cm;
              mso-page-orientation: portrait;
            }
            @page Section1 {
              mso-header-margin: 1.0cm;
              mso-footer-margin: 1.0cm;
              mso-title-page: yes;
            }
            div.Section1 { page: Section1; }
            body {
              font-family: "Calibri", sans-serif;
              line-height: 1.5;
              font-size: 11pt;
            }
            h1 {
              text-align: center;
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 24pt;
              color: #333333;
              mso-style-next: Normal;
              mso-outline-level: 1;
            }
            h2 {
              font-size: 18pt;
              font-weight: bold;
              margin-top: 24pt;
              margin-bottom: 12pt;
              color: #444444;
              mso-style-next: Normal;
              mso-outline-level: 2;
            }
            p {
              margin: 12pt 0;
              line-height: 1.5;
            }
            ul, ol {
              margin: 12pt 0;
              padding-left: 24pt;
            }
            li {
              margin: 6pt 0;
            }
            .checkbox {
              font-family: "Segoe UI Symbol", sans-serif;
              mso-font-charset: 0;
            }
            .writing-space {
              border-bottom: 1pt solid #999999;
              padding-bottom: 24pt;
              margin: 12pt 0;
              display: block;
              mso-element: para-border-div;
            }
            .emoji {
              font-family: "Segoe UI Emoji", sans-serif;
              mso-font-charset: 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12pt 0;
            }
            td, th {
              border: 1pt solid #999999;
              padding: 6pt;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="Section1">
            ${processContentForWord(editor.getHTML())}
          </div>
        </body>
      </html>
    `;
    
    // Create Blob as MS Word document
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.ms-word;charset=utf-8' 
    });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Process content for Word compatibility
  const processContentForWord = (html: string): string => {
    return html
      // Replace checkboxes with Word-compatible symbols
      .replace(/☐/g, '□')
      // Replace writing lines with Word-compatible underlines
      .replace(/_{40,}/g, '<span class="writing-space">&nbsp;</span>')
      // Ensure proper Word formatting for emojis
      .replace(/([^\u0000-\u007F])/g, '<span class="emoji">$1</span>')
      // Add Word-specific attributes to tables
      .replace(/<table/g, '<table style="mso-table-lspace:0pt;mso-table-rspace:0pt"')
      // Ensure proper line breaks
      .replace(/<br\s*\/?>/g, '<br style="mso-special-character:line-break">');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Resource</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client (Optional)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No specific client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Client Preview */}
          {selectedClientId && clients.find(c => c.id === selectedClientId) && (
            <div className="md:col-span-2 bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-800 mb-2">Client Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-indigo-900">
                    <span className="font-medium">Name:</span>{' '}
                    {clients.find(c => c.id === selectedClientId)?.name}
                  </p>
                  {clients.find(c => c.id === selectedClientId)?.age && (
                    <p className="text-sm text-indigo-900">
                      <span className="font-medium">Age:</span>{' '}
                      {clients.find(c => c.id === selectedClientId)?.age}
                    </p>
                  )}
                  <p className="text-sm text-indigo-900">
                    <span className="font-medium">Therapy Type:</span>{' '}
                    {clients.find(c => c.id === selectedClientId)?.therapyType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-indigo-900 font-medium mb-1">Focus Areas:</p>
                  <div className="flex flex-wrap gap-1">
                    {clients.find(c => c.id === selectedClientId)?.focusAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter resource title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating || !title || !prompt}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText size={18} className="mr-2" />
                <span>Generate Resource</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Section */}
      <div className="bg-white rounded-lg shadow">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="p-4 flex items-center space-x-2 bg-gray-50 rounded-lg m-4 border border-gray-200">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('bold') ? 'bg-white text-indigo-600' : ''
              }`}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('italic') ? 'bg-white text-indigo-600' : ''
              }`}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('underline') ? 'bg-white text-indigo-600' : ''
              }`}
              title="Underline"
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('strike') ? 'bg-white text-indigo-600' : ''
              }`}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
            
            <select
              onChange={(e) => {
                const size = e.target.value;
                editor?.chain().focus().setFontSize(size).run();
              }}
              className="h-8 px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              title="Font Size"
            >
              <option value="12px">12px</option>
              <option value="14px">14px</option>
              <option value="16px">16px</option>
              <option value="18px">18px</option>
              <option value="20px">20px</option>
              <option value="24px">24px</option>
              <option value="28px">28px</option>
              <option value="32px">32px</option>
            </select>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive({ textAlign: 'left' }) ? 'bg-white text-indigo-600' : ''
              }`}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive({ textAlign: 'center' }) ? 'bg-white text-indigo-600' : ''
              }`}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive({ textAlign: 'right' }) ? 'bg-white text-indigo-600' : ''
              }`}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('bulletList') ? 'bg-white text-indigo-600 shadow-sm' : ''
              }`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('orderedList') ? 'bg-white text-indigo-600 shadow-sm' : ''
              }`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleTaskList().run()}
              className={`p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all ${
                editor?.isActive('taskList') ? 'bg-white text-indigo-600 shadow-sm' : ''
              }`}
              title="Checklist"
            >
              <CheckSquare size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all disabled:opacity-30"
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all disabled:opacity-30"
              title="Redo"
            >
              <Redo size={16} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .insertContent('<br/>______________________________________________________________________________________________<br/>______________________________________________________________________________________________<br/>______________________________________________________________________________________________<br/><br/>')
                    .run();
                }
              }}
              className="p-2 rounded-lg hover:bg-white text-gray-600 hover:text-indigo-600 transition-all"
              title="Add Writing Lines"
            >
              <TextSelect size={16} />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="p-6 flex justify-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 min-h-[297mm] w-[210mm] mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  <span>Save</span>
                </>
              )}
            </button>
            {success && (
              <span className="text-green-600 flex items-center">
                <Check size={18} className="mr-1" />
                Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}