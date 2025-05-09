import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, FileText, Trash2, X, AlertCircle, CheckCircle, Download, Timer, Edit2, Type, Heading1, Heading2, ArrowLeft, List, CheckSquare, ListOrdered, Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, Table as TableIcon, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Text as TextSelect, Save } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TextStyle from '@tiptap/extension-text-style';
import { FontSize } from '../lib/extensions/FontSize';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { supabase, createClerkSupabaseClient } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useUser } from '@clerk/clerk-react';

type Resource = Database['public']['Tables']['resources']['Row'];

export const ResourceLibrary: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Create editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      }),
      Heading.configure({
        levels: [1, 2, 3]
      }),
      Placeholder.configure({
        placeholder: 'Start editing...'
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
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
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none [&>ul]:list-disc [&>ol]:list-decimal [&>ul>li]:ml-4 [&>ol>li]:ml-4 [&>ul]:pl-0 [&>ol]:pl-0 [&_.task-list]:list-none [&_.task-list]:pl-0 [&_.task-item]:flex [&_.task-item]:items-start [&_.task-item]:gap-2 [&_.task-list>li]:list-none [&_.task-list>li]:pl-0'
      }
    }
  });

  // Update editor content when selected resource changes
  useEffect(() => {
    if (editor && selectedResource) {
      // Use formatted HTML content if available, fallback to raw content
      const content = selectedResource.formatted_content?.html || 
                     selectedResource.content?.html ||
                     selectedResource.content?.raw || '';
      editor.commands.setContent(content);
    }
  }, [editor, selectedResource]);

  useEffect(() => {
    let mounted = true;
    
    const loadResources = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        setLoading(true);
        setError(null);

        const supabaseClient = await createClerkSupabaseClient();
        
        const { data, error: resourcesError } = await supabaseClient
          .from('resources')
          .select(`
            id,
            title,
            type,
            content,
            created_at,
            client_id,
            clients (
              name
            ),
            content_format,
            content_version
          `)
          .eq('user_id', user.id);

        if (resourcesError) throw resourcesError;
        
        if (mounted) {
          setResources(data || []);
        }
      } catch (err) {
        console.error('Error loading resources:', err);
        if (mounted) {
          setError('Failed to load resources');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (isSignedIn && user) {
      loadResources();
    }
    
    return () => {
      mounted = false;
    };
  }, [isSignedIn, user]);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      setError(null);

      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setResources(prev => prev.filter(resource => resource.id !== id));
      setDeleteSuccess(true);

      // Reset success message after 2 seconds
      setTimeout(() => {
        setDeleteSuccess(false);
        setDeleting(null);
      }, 2000);

    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Failed to delete resource. Please try again.');
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    if (!selectedResource || !editor) return;
    
    if (!isSignedIn || !user) {
      throw new Error('User not authenticated');
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const supabaseClient = await createClerkSupabaseClient();
      
      const { error } = await supabaseClient
        .from('resources')
        .update({
          content: {
            html: editor.getHTML(),
            raw: editor.getText()
          },
          formatted_content: {
            html: editor.getHTML(),
            text: editor.getText(),
            sections: selectedResource.formatted_content?.sections || [],
            metadata: {
              version: 1,
              format: 'html',
              lastModified: new Date().toISOString()
            }
          },
          content_format: 'html',
          content_version: selectedResource.content_version ? selectedResource.content_version + 1 : 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('id', selectedResource.id);

      if (error) throw error;

      // Update local state
      setResources(prev => prev.map(resource => 
        resource.id === selectedResource.id 
          ? {
              ...resource,
              formatted_content: {
                html: editor.getHTML(),
                text: editor.getText(),
                sections: selectedResource.formatted_content?.sections || [],
                metadata: {
                  version: 1,
                  format: 'html',
                  lastModified: new Date().toISOString()
                }
              },
              content: {
                html: editor.getHTML(),
                raw: editor.getText()
              },
              content_format: 'html',
              content_version: resource.content_version ? resource.content_version + 1 : 1,
              updated_at: new Date().toISOString()
            }
          : resource
      ));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Update local storage backup
      localStorage.setItem('resource_draft', editor.getHTML());

    } catch (err) {
      console.error('Error saving resource:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (resource: Resource) => {
    // Get the A4-sized content container
    const content = document.querySelector('.prose[style*="210mm"]') as HTMLElement;
    if (!content) return;

    // Clone the content to avoid modifying the original
    const clonedContent = content.cloneNode(true) as HTMLElement;

    // Remove page break indicators
    const pageBreaks = clonedContent.querySelectorAll('.page-break-indicator');
    pageBreaks.forEach(el => el.remove());

    // Configure html2pdf options
    const opt = {
      margin: 0, // No additional margins since we have padding in the container
      filename: `${resource.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 210 * 3.78, // Convert mm to px (1mm ≈ 3.78px)
        width: 210 * 3.78, // Convert mm to px (1mm ≈ 3.78px)
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        enableLinks: true,
        hotfixes: ['px_scaling']
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['tr', 'td', 'li', '.no-break'],
        afterCss: {
          'margin-top': '30mm',
          'padding-top': '20mm'
        }
      }
    };

    // Generate PDF
    html2pdf().set(opt).from(clonedContent).save();
  };

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

  const filteredResources = resources
    .filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resource.content?.raw?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'title') {
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      if (sortBy === 'type') {
        return sortOrder === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      return 0;
    });

  const resourceTypes = ['worksheet', 'handout', 'exercise', 'journal', 'checklist', 'assessment'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Resource Library</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {resourceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                  className="border-0 focus:outline-none focus:ring-0 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="type">Type</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{resource.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {resource.type}
                      </span>
                      {resource.clients?.name && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {resource.clients.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Created on {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                    {resource.description && (
                      <p className="mt-2 text-sm text-gray-600">{resource.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedResource(resource)}
                      className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                      title="View resource"
                    >
                      <Eye size={20} />
                    </button>
                  
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleting === resource.id}
                      className={`p-2 rounded-lg ${
                        deleting === resource.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title="Delete resource"
                    >
                      {deleting === resource.id ? (
                        deleteSuccess ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                        )
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first resource'}
            </p>
          </div>
        )}
      </div>

      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedResource.title}</h3>
                <div className="flex items-center gap-2 text-indigo-100 text-sm">
                  <span className="px-2 py-0.5 bg-white bg-opacity-20 rounded-full">
                    {selectedResource.type}
                  </span>
                  <span>{new Date(selectedResource.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(selectedResource)}
                  className="px-3 py-1.5 rounded-lg flex items-center space-x-1 bg-indigo-500 text-white hover:bg-indigo-600"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg flex items-center space-x-1 bg-indigo-500 text-white hover:bg-indigo-600"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
                {saveSuccess && (
                  <span className="text-green-400 flex items-center bg-green-900 bg-opacity-20 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={16} className="mr-1" />
                    Saved
                  </span>
                )}
               
                <button 
                  onClick={() => {
                    setSelectedResource(null);
                    editor?.commands.clearContent();
                  }}
                  className="text-white hover:text-indigo-100"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
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
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none bg-white rounded-lg shadow-sm border border-gray-200 mx-auto" style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '20mm',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                margin: '0 auto',
                position: 'relative'
              }}>
                {/* A4 Page Break Indicators */}
                {Array.from({ length: 10 }).map((_, index) => (
                  <div 
                    key={index}
                    className="absolute left-0 right-0 border-b border-dashed border-indigo-300 pointer-events-none print:hidden page-break-indicator"
                    style={{
                      top: `${297 * (index + 1)}mm`,
                      marginLeft: '-20mm',
                      marginRight: '-20mm'
                    }}
                  />
                ))}
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};