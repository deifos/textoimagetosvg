export interface GalleryItem {
  id: string;
  type: 'image' | 'svg';
  url: string;
  prompt: string;
  createdAt: string;
  thumbnail?: string;
}

const GALLERY_STORAGE_KEY = 'textoimagetosvg_gallery';

/**
 * Retrieves all gallery items from local storage
 */
export function getGalleryItems(): GalleryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving gallery items:', error);
    return [];
  }
}

/**
 * Saves a new gallery item to local storage
 */
export function saveGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): GalleryItem {
  const newItem: GalleryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existingItems = getGalleryItems();
    const updatedItems = [newItem, ...existingItems].slice(0, 50); // Keep only last 50 items
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updatedItems));
    return newItem;
  } catch (error) {
    console.error('Error saving gallery item:', error);
    throw error;
  }
}

/**
 * Removes a gallery item by ID
 */
export function removeGalleryItem(id: string): void {
  try {
    const existingItems = getGalleryItems();
    const filteredItems = existingItems.filter(item => item.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(filteredItems));
  } catch (error) {
    console.error('Error removing gallery item:', error);
  }
}

/**
 * Clears all gallery items
 */
export function clearGallery(): void {
  try {
    localStorage.removeItem(GALLERY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing gallery:', error);
  }
}
