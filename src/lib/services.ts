import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';

export const createService = (collectionName: string) => {
  const colRef = collection(db, collectionName);

  return {
    async getAll(uid: string) {
      if (!uid) return [];
      const q = query(colRef, where('ownerId', '==', uid));
      
      // Failsafe: Promise.race between the query and a 4s timeout
      const fetchPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_FETCH')), 4000)
      );

      try {
        const snap = await Promise.race([fetchPromise, timeoutPromise]) as any;
        return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      } catch (err) {
        console.error(`[Service] Error in getAll (${collectionName}):`, err);
        return []; // Return empty list on timeout or error
      }
    },
    async add(data: any, uid: string) {
      if (!uid) throw new Error('User UID is required');
      
      const savePromise = addDoc(colRef, { ...data, ownerId: uid, createdAt: new Date().toISOString() });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_SAVE')), 6000)
      );

      const docRef = await Promise.race([savePromise, timeoutPromise]) as any;
      return { id: docRef.id, ...data };
    },
    async update(id: string, data: any) {
      const docRef = doc(db, collectionName, id);
      const updatePromise = updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_UPDATE')), 6000)
      );
      await Promise.race([updatePromise, timeoutPromise]);
    },
    async remove(id: string) {
      const docRef = doc(db, collectionName, id);
      const deletePromise = deleteDoc(docRef);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_DELETE')), 6000)
      );
      await Promise.race([deletePromise, timeoutPromise]);
    }
  };
};

export const providersService = createService('proveedores');
export const clientsService = createService('clientes');
export const quotesService = createService('cotizaciones');
export const productsService = createService('productos');
export const servicesService = createService('servicios');
