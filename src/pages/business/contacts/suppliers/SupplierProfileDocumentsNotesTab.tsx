import { useState, useMemo } from 'react';
import { 
  FileText, 
  StickyNote, 
  Paperclip, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Lock,
  Unlock,
  User,
  Calendar,
  Clock,
  X,
  File,
  Image,
  FileSpreadsheet,
  FileArchive,
  MoreVertical,
  Filter,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import type { SupplierProfileData } from './supplierProfileTypes';
import { useBusinessCurrency } from '@/business/businessStore';

type Props = {
  supplier: SupplierProfileData;
};

type DocumentNote = {
  id: string;
  heading: string;
  description: string;
  type: 'document' | 'note';
  addedBy: string;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  attachments: Attachment[];
  category?: string;
  tags?: string[];
};

type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
};

// Mock data
const mockDocumentsNotes: DocumentNote[] = [
  {
    id: '1',
    heading: 'Supplier Agreement 2026',
    description: 'Annual supplier agreement including terms and conditions, pricing structure, and delivery schedules for the fiscal year 2026.',
    type: 'document',
    addedBy: 'John Doe',
    addedByUserId: 'user-1',
    createdAt: '2026-05-01T10:30:00',
    updatedAt: '2026-05-01T10:30:00',
    isPrivate: false,
    category: 'Contract',
    tags: ['agreement', 'legal', 'pricing'],
    attachments: [
      { id: 'att-1', name: 'Supplier_Agreement_2026.pdf', size: 2450000, type: 'application/pdf', url: '#', uploadedAt: '2026-05-01T10:30:00' }
    ]
  },
  {
    id: '2',
    heading: 'KRA PIN Certificate',
    description: 'Tax compliance certificate for the supplier. Valid until December 2026.',
    type: 'document',
    addedBy: 'Jane Smith',
    addedByUserId: 'user-2',
    createdAt: '2026-05-12T14:15:00',
    updatedAt: '2026-05-12T14:15:00',
    isPrivate: true,
    category: 'Compliance',
    tags: ['tax', 'certificate', 'kra'],
    attachments: [
      { id: 'att-2', name: 'KRA_PIN_Certificate_2026.pdf', size: 1800000, type: 'application/pdf', url: '#', uploadedAt: '2026-05-12T14:15:00' }
    ]
  },
  {
    id: '3',
    heading: 'Delivery Terms & Conditions',
    description: 'Standard delivery terms including lead times, delivery windows, and penalties for late delivery.',
    type: 'document',
    addedBy: 'Mike Johnson',
    addedByUserId: 'user-3',
    createdAt: '2026-06-04T09:45:00',
    updatedAt: '2026-06-15T11:30:00',
    isPrivate: false,
    category: 'Policy',
    tags: ['delivery', 'terms', 'logistics'],
    attachments: [
      { id: 'att-3', name: 'Delivery_Terms.docx', size: 850000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', url: '#', uploadedAt: '2026-06-04T09:45:00' },
      { id: 'att-4', name: 'Delivery_Schedule.xlsx', size: 1200000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', url: '#', uploadedAt: '2026-06-04T09:45:00' }
    ]
  },
  {
    id: '4',
    heading: 'Quality Control Checklist',
    description: 'Internal quality control checklist for products supplied. Includes testing procedures and acceptance criteria.',
    type: 'document',
    addedBy: 'Sarah Wilson',
    addedByUserId: 'user-4',
    createdAt: '2026-06-20T16:20:00',
    updatedAt: '2026-06-20T16:20:00',
    isPrivate: true,
    category: 'Quality',
    tags: ['quality', 'checklist', 'testing'],
    attachments: [
      { id: 'att-5', name: 'QC_Checklist_2026.pdf', size: 950000, type: 'application/pdf', url: '#', uploadedAt: '2026-06-20T16:20:00' }
    ]
  },
  {
    id: '5',
    heading: 'Follow-up on Payment',
    description: 'Need to follow up with supplier regarding outstanding payment for PO-2405. Payment due date is approaching.',
    type: 'note',
    addedBy: 'John Doe',
    addedByUserId: 'user-1',
    createdAt: '2026-07-10T08:00:00',
    updatedAt: '2026-07-10T08:00:00',
    isPrivate: false,
    attachments: []
  },
  {
    id: '6',
    heading: 'Supplier Meeting Notes',
    description: 'Key points from supplier meeting on July 15: discussed new product lines, pricing adjustments, and delivery improvements.',
    type: 'note',
    addedBy: 'Jane Smith',
    addedByUserId: 'user-2',
    createdAt: '2026-07-15T13:45:00',
    updatedAt: '2026-07-15T13:45:00',
    isPrivate: true,
    attachments: []
  }
];

export default function SupplierProfileDocumentsNotesTab({ supplier }: Props) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'document' | 'note'>('all');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'private' | 'public'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DocumentNote | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<DocumentNote | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<DocumentNote>>({
    heading: '',
    description: '',
    type: 'note',
    isPrivate: false,
    attachments: [],
    category: '',
    tags: []
  });
  
  // Filter documents and notes
  const filteredItems = useMemo(() => {
    let items = [...mockDocumentsNotes];
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.heading.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.addedBy.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter(item => item.type === typeFilter);
    }
    
    // Privacy filter
    if (privacyFilter !== 'all') {
      items = items.filter(item => 
        privacyFilter === 'private' ? item.isPrivate : !item.isPrivate
      );
    }
    
    // Sort by updated date (most recent first)
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return items;
  }, [searchTerm, typeFilter, privacyFilter]);
  
  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (fileType.includes('image')) return <Image className="h-4 w-4" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <FileArchive className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle add/edit
  const handleSubmit = () => {
    // In a real app, this would save to the backend
    console.log('Saving document/note:', formData);
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      heading: '',
      description: '',
      type: 'note',
      isPrivate: false,
      attachments: [],
      category: '',
      tags: []
    });
  };
  
  const handleEdit = (item: DocumentNote) => {
    setEditingItem(item);
    setFormData({
      heading: item.heading,
      description: item.description,
      type: item.type,
      isPrivate: item.isPrivate,
      attachments: item.attachments,
      category: item.category || '',
      tags: item.tags || []
    });
    setShowModal(true);
    setShowActions(null);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      console.log('Deleting item:', id);
      setShowActions(null);
    }
  };
  
  const handleView = (item: DocumentNote) => {
    setViewingItem(item);
  };
  
  const handleDownload = (attachment: Attachment) => {
    // In a real app, this would download the file
    console.log('Downloading:', attachment.name);
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setPrivacyFilter('all');
  };
  
  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Documents & Notes</h4>
            <p className="text-sm text-muted-foreground">
              Manage all documents and notes related to {supplier.name}. Upload contracts, agreements, compliance documents,
              and maintain internal notes. Mark sensitive documents as private for business-only visibility.
            </p>
          </div>
        </div>
      </div>
      
      {/* Header with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormData({
                heading: '',
                description: '',
                type: 'note',
                isPrivate: false,
                attachments: [],
                category: '',
                tags: []
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search documents & notes..."
                className="rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground w-64"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="note">Notes</option>
            </select>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value as typeof privacyFilter)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All Privacy</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} items found
          </span>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface-alt">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Heading</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Added By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Created At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Updated At</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Privacy</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-alt/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.type === 'document' ? (
                          <FileText className="h-4 w-4 text-primary" />
                        ) : (
                          <StickyNote className="h-4 w-4 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.heading}</p>
                          {item.category && (
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.map(tag => (
                                <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.type === 'document' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {item.type === 'document' ? 'Document' : 'Note'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        {item.addedBy}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(item.updatedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.isPrivate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          <Unlock className="h-3 w-3" />
                          Public
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowActions(showActions === item.id ? null : item.id)}
                          className="rounded-lg p-1.5 hover:bg-surface-alt transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {showActions === item.id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg">
                            <div className="divide-y divide-border p-1">
                              <button
                                onClick={() => handleView(item)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-surface-alt"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No documents or notes found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[80%] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {editingItem ? 'Edit' : 'Add New'} {formData.type === 'document' ? 'Document' : 'Note'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'note' })}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                        formData.type === 'note'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <StickyNote className="h-5 w-5" />
                      Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'document' })}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
                        formData.type === 'document'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                      Document
                    </button>
                  </div>
                </div>
                
                {/* Heading */}
                <div>
                  <label className="text-sm font-medium text-foreground">Heading *</label>
                  <input
                    type="text"
                    value={formData.heading || ''}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                    placeholder="Enter heading..."
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description..."
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Contract, Compliance, Policy..."
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Tags */}
                <div>
                  <label className="text-sm font-medium text-foreground">Tags</label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setFormData({ ...formData, tags });
                    }}
                    placeholder="Enter tags separated by commas..."
                    className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                {/* Document Upload */}
                {formData.type === 'document' && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Documents</label>
                    <div className="mt-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 transition-colors">
                      <Paperclip className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports: PDF, DOCX, XLSX, Images (Max 10MB)
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                      >
                        <Plus className="h-4 w-4" />
                        Upload Files
                      </button>
                    </div>
                    {formData.attachments && formData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                            <div className="flex items-center gap-3">
                              {getFileIcon(att.type)}
                              <div>
                                <p className="text-sm font-medium text-foreground">{att.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const attachments = formData.attachments?.filter(a => a.id !== att.id) || [];
                                setFormData({ ...formData, attachments });
                              }}
                              className="rounded-lg p-1 hover:bg-destructive/10 text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Privacy Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Private Document</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.isPrivate 
                        ? 'Only visible to your business team' 
                        : 'Visible to both business and supplier'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formData.isPrivate ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-alt"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[60%] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {viewingItem.type === 'document' ? (
                    <FileText className="h-6 w-6 text-primary" />
                  ) : (
                    <StickyNote className="h-6 w-6 text-amber-500" />
                  )}
                  <h2 className="text-xl font-bold text-foreground">{viewingItem.heading}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="rounded-lg p-2 hover:bg-surface-alt transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium text-foreground capitalize">{viewingItem.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium text-foreground">{viewingItem.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Added By</p>
                  <p className="text-sm font-medium text-foreground">{viewingItem.addedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Privacy</p>
                  <p className="text-sm font-medium text-foreground">
                    {viewingItem.isPrivate ? '🔒 Private' : '🔓 Public'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(viewingItem.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Updated At</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(viewingItem.updatedAt)}</p>
                </div>
              </div>
              
              {viewingItem.tags && viewingItem.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingItem.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm text-foreground">{viewingItem.description}</p>
              </div>
              
              {viewingItem.attachments && viewingItem.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Attachments</p>
                  <div className="mt-2 space-y-2">
                    {viewingItem.attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(att.type)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{att.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(att)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-alt"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
