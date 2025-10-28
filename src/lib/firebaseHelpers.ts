// Firebase Helper Functions
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  UploadTask
} from 'firebase/storage';
import { db, storage } from './firebase';

// ==================== FIRESTORE HELPERS ====================

/**
 * Get a single document by ID
 */
export async function getDocument<T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get multiple documents with optional filters
 */
export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Create or update a document
 */
export async function setDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  merge = true
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update specific fields in a document
 */
export async function updateDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data as any);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// ==================== STORAGE HELPERS ====================

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    if (onProgress) {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // Simple upload
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
}

// ==================== QUERY BUILDERS ====================

/**
 * Build a Firestore query with common filters
 */
export function buildQuery(
  filters: {
    where?: Array<[string, any, any]>;
    orderBy?: Array<[string, 'asc' | 'desc']>;
    limit?: number;
    startAfter?: any;
  }
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.where) {
    filters.where.forEach(([field, operator, value]) => {
      constraints.push(where(field, operator, value));
    });
  }

  if (filters.orderBy) {
    filters.orderBy.forEach(([field, direction]) => {
      constraints.push(orderBy(field, direction));
    });
  }

  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  if (filters.startAfter) {
    constraints.push(startAfter(filters.startAfter));
  }

  return constraints;
}

// ==================== BATCH OPERATIONS ====================

/**
 * Get collection reference
 */
export function getCollectionRef(collectionName: string): CollectionReference {
  return collection(db, collectionName);
}

/**
 * Get document reference
 */
export function getDocRef(collectionName: string, docId: string): DocumentReference {
  return doc(db, collectionName, docId);
}
