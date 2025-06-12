import React, { useState, useEffect } from 'react';
import { Upload, Image, X, ChevronDown, ChevronRight, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { api } from '../../services/api';

interface SiteImage {
  id: number;
  title: string;
  image_url: string;
  thumbnail_url: string;
  category: string;
  notes?: string;
  uploaded_by_name: string;
  uploaded_at: string;
  file_size_mb?: number;
  tags?: string[];
  related_object_type?: string;
  related_object_id?: number;
}

interface CategoryData {
  display_name: string;
  count: number;
  images: SiteImage[];
}

interface ImageGridData {
  categories: Record<string, CategoryData>;
  total_images: number;
  total_size_mb?: number;
}

interface ImagesTabProps {
  siteId: number;
}

const CATEGORY_OPTIONS = [
  { value: 'meter_change', label: 'Meter Change' },
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'damage', label: 'Damage' },
  { value: 'repair', label: 'Repair' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
];

const ImagesTab: React.FC<ImagesTabProps> = ({ siteId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageGridData | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['meter_change']));
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedImage, setSelectedImage] = useState<SiteImage | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadNotes, setUploadNotes] = useState('');

  useEffect(() => {
    fetchImageData();
  }, [siteId]);

  // Get all images in a flat array for navigation
  const getAllImages = (): SiteImage[] => {
    if (!imageData) return [];
    const allImages: SiteImage[] = [];
    Object.values(imageData.categories).forEach(category => {
      allImages.push(...category.images);
    });
    return allImages;
  };

  // Get current image index
  const getCurrentImageIndex = (): number => {
    if (!selectedImage) return -1;
    const allImages = getAllImages();
    return allImages.findIndex(img => img.id === selectedImage.id);
  };

  // Navigate to previous/next image
  const navigateImage = (direction: 'prev' | 'next') => {
    const allImages = getAllImages();
    const currentIndex = getCurrentImageIndex();
    
    if (currentIndex === -1 || allImages.length === 0) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
    } else {
      newIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage(allImages[newIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateImage('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, imageData]);

  const fetchImageData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/images/site-images-grid/grid_data/?site_id=${siteId}`);
      setImageData(response.data);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('site_id', siteId.toString());
      formData.append('category', uploadCategory);
      formData.append('notes', uploadNotes);
      
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      await api.post('/images/site-images/bulk_upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset and refresh
      setSelectedImages([]);
      setUploadNotes('');
      setShowUploadDialog(false);
      await fetchImageData();
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (mb: number | undefined | null) => {
    if (!mb || mb === undefined || mb === null) return 'Unknown size';
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold dark:text-gray-100">Site Images</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {imageData?.total_images || 0} images • {formatFileSize(imageData?.total_size_mb || 0)} total
          </p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Images
        </Button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {imageData && Object.entries(imageData.categories).map(([category, data]) => (
          <div key={category} className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium dark:text-gray-100">{data.display_name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">({data.count})</span>
              </div>
            </button>

            {expandedCategories.has(category) && data.images.length > 0 && (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
                      <img
                        src={image.thumbnail_url || image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity relative z-10"
                        loading="lazy"
                        onLoad={(e) => {
                          // Hide the placeholder when image loads
                          const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                          if (placeholder) {
                            (placeholder as HTMLElement).style.display = 'none';
                          }
                        }}
                        onError={(e) => {
                          console.error('Failed to load image:', image.thumbnail_url || image.image_url);
                          // Hide the placeholder
                          const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                          if (placeholder) {
                            (placeholder as HTMLElement).style.display = 'none';
                          }
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Cpath d="M30 40 L50 20 L70 40 L70 60 L50 80 L30 60 Z" fill="%239ca3af"/%3E%3Ccircle cx="50" cy="35" r="8" fill="%239ca3af"/%3E%3C/svg%3E';
                        }}
                      />
                      {/* Loading placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <Image className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                        View
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {formatDate(image.uploaded_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {(!imageData || Object.keys(imageData.categories).length === 0) && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No images uploaded for this site yet.
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-100">Category</label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium dark:text-gray-100">Notes (optional)</label>
              <textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                className="w-full mt-1 px-3 py-2 border dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Add any notes about these images..."
              />
            </div>

            <div>
              <label className="text-sm font-medium dark:text-gray-100">Select Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1 w-full"
              />
              {selectedImages.length > 0 && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedImages.length} image(s) selected
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || selectedImages.length === 0}
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedImage.title}</DialogTitle>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getCurrentImageIndex() + 1} / {getAllImages().length}
                  </span>
                </div>
              </DialogHeader>
              <div className="mt-4 relative">
                {/* Navigation buttons */}
                {getAllImages().length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('prev');
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImage('next');
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load full image:', selectedImage.image_url);
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="200" y="150" font-family="Arial" font-size="16" fill="%236b7280" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="mt-4 space-y-2 text-sm">
                  <p className="dark:text-gray-300">
                    <span className="font-medium">Uploaded by:</span> {selectedImage.uploaded_by_name}
                  </p>
                  <p className="dark:text-gray-300">
                    <span className="font-medium">Date:</span> {formatDate(selectedImage.uploaded_at)}
                  </p>
                  <p className="dark:text-gray-300">
                    <span className="font-medium">Size:</span> {formatFileSize(selectedImage.file_size_mb)}
                  </p>
                  {selectedImage.notes && (
                    <p className="dark:text-gray-300">
                      <span className="font-medium">Notes:</span> {selectedImage.notes}
                    </p>
                  )}
                  {selectedImage.tags && Array.isArray(selectedImage.tags) && selectedImage.tags.length > 0 && (
                    <div className="flex gap-2 items-center">
                      <span className="font-medium">Tags:</span>
                      {selectedImage.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Use arrow keys to navigate • Press Esc to close
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagesTab;