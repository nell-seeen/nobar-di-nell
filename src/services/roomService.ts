import { doc, getDoc, setDoc, serverTimestamp, updateDoc, runTransaction, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { RoomDocument } from '../store/roomStore';
import { generateRoomId } from '../utils/helpers';

export const createRoom = async (hostId: string): Promise<string> => {
  const roomId = generateRoomId(6);
  const roomRef = doc(db, 'rooms', roomId);
  
  const roomData: Omit<RoomDocument, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    id: roomId,
    name: `Room ${roomId}`,
    hostId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    locked: false,
    maxUsers: 50,
    isPublic: true,
    settings: {
      chatEnabled: true,
      reactionEnabled: true,
      viewerControl: false,
      playlistModification: false,
    },
    bannedUsers: []
  };

  await setDoc(roomRef, roomData);

  // Initialize playback state
  const playbackRef = doc(db, `rooms/${roomId}/playback`, 'state');
  await setDoc(playbackRef, {
    mediaUrl: '',
    mediaType: 'video',
    currentIndex: 0,
    isPlaying: false,
    position: 0,
    updatedAt: serverTimestamp(),
    playbackVersion: 1,
    commandId: crypto.randomUUID(),
    command: 'CHANGE_MEDIA',
    updatedBy: hostId
  });

  return roomId;
};

export const getPublicRooms = async (): Promise<RoomDocument[]> => {
  const roomsRef = collection(db, 'rooms');
  const q = query(
    roomsRef,
    where('isPublic', '==', true),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  const rooms = snapshot.docs.map(doc => doc.data() as RoomDocument);
  
  // Filter and sort in memory to avoid requiring Firestore composite indexes
  return rooms
    .filter(r => !r.locked)
    .sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
};

export const updateRoomLock = async (roomId: string, locked: boolean) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { locked });
};

export const updateRoomSettings = async (roomId: string, settings: Partial<RoomDocument['settings']>, name?: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  
  Object.keys(settings).forEach(key => {
    updates[`settings.${key}`] = (settings as any)[key];
  });
  
  await updateDoc(roomRef, updates);
};

export const banUser = async (roomId: string, currentHostId: string, uidToBan: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists()) throw new Error('Room not found');
    if (roomDoc.data().hostId !== currentHostId) throw new Error('Not authorized');
    
    const bannedUsers = roomDoc.data().bannedUsers || [];
    if (!bannedUsers.includes(uidToBan)) {
      transaction.update(roomRef, { 
        bannedUsers: [...bannedUsers, uidToBan],
        updatedAt: serverTimestamp() 
      });
    }
  });
};

export const transferHost = async (roomId: string, currentHostId: string, newHostId: string) => {
  const roomRef = doc(db, 'rooms', roomId);
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists()) throw new Error('Room not found');
    if (roomDoc.data().hostId !== currentHostId) throw new Error('Not authorized');
    transaction.update(roomRef, { hostId: newHostId, updatedAt: serverTimestamp() });
  });
};
