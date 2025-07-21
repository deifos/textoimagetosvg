"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getGalleryItems, 
  removeGalleryItem, 
  clearGallery, 
  type GalleryItem 
} from "@/lib/gallery-storage";
import { 
  Trash2, 
  Download, 
  Eye, 
  Calendar, 
  Image as ImageIcon, 
  FileImage,
  Trash
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GalleryProps {
  onRefresh?: () => void;
}

export function Gallery({ onRefresh }: GalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Load gallery items on component mount and when onRefresh changes
  useEffect(() => {
    loadItems();
  }, [onRefresh]);

  const loadItems = () => {
    const galleryItems = getGalleryItems();
    setItems(galleryItems);
  };

  const handleRemoveItem = (id: string) => {
    removeGalleryItem(id);
    loadItems();
  };

  const handleClearAll = () => {
    clearGallery();
    loadItems();
  };

  const handleDownload = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.type}-${item.id}.${item.type === 'svg' ? 'svg' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (items.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gallery
        </h2>
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No images or SVGs saved yet.</p>
          <p className="text-sm">Generated images and SVGs will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Gallery ({items.length})
        </h2>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Gallery</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all {items.length} items from your gallery? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <div className="aspect-square relative bg-muted overflow-hidden">
              <Image
                src={item.url}
                alt={`Generated ${item.type}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedItem(item)}
                    className="bg-white/90 hover:bg-white text-black"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(item)}
                    className="bg-white/90 hover:bg-white text-black"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleRemoveItem(item.id)}
                    className="bg-red-500/90 hover:bg-red-500 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={item.type === 'svg' ? 'default' : 'secondary'} className="text-xs">
                  {item.type === 'svg' ? (
                    <><FileImage className="w-3 h-3 mr-1" /> SVG</>
                  ) : (
                    <><ImageIcon className="w-3 h-3 mr-1" /> Image</>
                  )}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(item.createdAt)}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2" title={item.prompt}>
                {item.prompt}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal for viewing full-size image */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={selectedItem.type === 'svg' ? 'default' : 'secondary'}>
                    {selectedItem.type.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(selectedItem.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedItem)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <p className="text-sm mt-2">{selectedItem.prompt}</p>
            </div>
            <div className="p-4 max-h-[80vh] overflow-auto flex justify-center">
              <div className="relative max-w-full max-h-full">
                <Image
                  src={selectedItem.url}
                  alt={`Generated ${selectedItem.type}`}
                  width={800}
                  height={600}
                  className="max-w-full h-auto object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
