import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

// Types
export interface UserProfile {
    name: string;
    image: string;
    userId: string;
}

export interface UserData {
  profile: UserProfile;
  balance: number;
  silverBalance: number;
  lastClaimTimestamp: number | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MicSlotData {
    user: UserProfile | null;
    isMuted: boolean;
    isLocked: boolean;
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  image: string;
  userCount: number;
  micSlots: MicSlotData[];
  isRoomMuted: boolean;
  attendees: UserProfile[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessageData {
  id: string;
  roomId: string;
  user: UserProfile;
  text: string;
  createdAt: Timestamp;
}

export interface GameHistoryData {
  roundId: number;
  winner: string;
  createdAt: Timestamp;
}

export interface UserBetData {
  userId: string;
  roundId: number;
  bets: Record<string, number>;
  createdAt: Timestamp;
}

export interface RoomSupporterData {
  roomId: string;
  userId: string;
  user: UserProfile;
  totalGiftValue: number;
  updatedAt: Timestamp;
}

// User Services
export const userServices = {
  async saveUser(userData: Omit<UserData, 'createdAt' | 'updatedAt' | 'profile'> & { profile: UserProfile }): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userData.profile.userId);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      throw error;
    }
  },

  async getUser(userId: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      throw error;
    }
  },

  async updateUserBalance(userId: string, balance: number, silverBalance: number): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        balance,
        silverBalance,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user balance in Firestore:', error);
      throw error;
    }
  },

  onUserChange(userId: string, callback: (userData: UserData | null) => void) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      return onSnapshot(userRef, (doc) => {
        callback(doc.exists() ? doc.data() as UserData : null);
      }, (error) => {
        console.error('Firebase user listener error:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up Firebase user listener:', error);
      return () => {};
    }
  }
};

const INITIAL_MIC_SLOTS: MicSlotData[] = Array(15).fill(null).map((_, i) => ({
    user: i === 0 ? { name: "روكي", image: "https://placehold.co/100x100/A755F7/FFFFFF.png", userId: "bot-001" } : null,
    isMuted: i === 0,
    isLocked: false
}));

// Room Services
export const roomServices = {
  async createRoom(roomData: Omit<RoomData, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'micSlots' | 'isRoomMuted' | 'attendees'>): Promise<void> {
    try {
      const roomRef = doc(collection(db, COLLECTIONS.ROOMS));
      const newRoom: Omit<RoomData, 'createdAt' | 'updatedAt'> = {
          ...roomData,
          id: roomRef.id,
          userCount: 0,
          micSlots: INITIAL_MIC_SLOTS,
          isRoomMuted: false,
          attendees: [],
      }
      await setDoc(roomRef, {
        ...newRoom,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating room in Firestore:', error);
      throw error;
    }
  },
  
  async getRoom(roomId: string): Promise<RoomData | null> {
    try {
        const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
        const docSnap = await getDoc(roomRef);
        return docSnap.exists() ? docSnap.data() as RoomData : null;
    } catch (error) {
        console.error('Error getting room:', error);
        return null;
    }
  },

  async updateRoomData(roomId: string, updates: Partial<RoomData>): Promise<void> {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
  },

  async joinRoom(roomId: string, user: UserProfile): Promise<void> {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
        attendees: arrayUnion(user),
        userCount: increment(1),
        updatedAt: serverTimestamp(),
    });
  },

  async leaveRoom(roomId: string, user: UserProfile): Promise<void> {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
        attendees: arrayRemove(user),
        userCount: increment(-1),
        updatedAt: serverTimestamp(),
    });
  },

  async loadRooms(): Promise<RoomData[]> {
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as RoomData);
  },
  
  onRoomsChange(callback: (rooms: RoomData[], error?: Error) => void) {
    try {
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (querySnapshot) => {
        const rooms = querySnapshot.docs.map(doc => doc.data() as RoomData);
        callback(rooms);
      }, (error) => {
        console.error('Firebase rooms listener error:', error);
        callback([], error);
      });
    } catch (error) {
      console.error('Error setting up Firebase rooms listener:', error);
      callback([], error as Error);
      return () => {};
    }
  }
};

// Chat Services
export const chatServices = {
  async sendMessage(messageData: Omit<ChatMessageData, 'id' | 'createdAt'>): Promise<void> {
    const messageRef = doc(collection(db, COLLECTIONS.CHAT_MESSAGES));
    await setDoc(messageRef, {
      ...messageData,
      id: messageRef.id,
      createdAt: serverTimestamp()
    });
  },

  onRoomMessagesChange(roomId: string, callback: (messages: ChatMessageData[]) => void) {
    const messagesRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => doc.data() as ChatMessageData).reverse();
      callback(messages);
    });
  }
};

// Game Services
export const gameServices = {
  async saveGameHistory(historyData: Omit<GameHistoryData, 'createdAt'>): Promise<void> {
    const historyRef = doc(collection(db, COLLECTIONS.GAME_HISTORY));
    await setDoc(historyRef, {
      ...historyData,
      createdAt: serverTimestamp()
    });
  },

  async getGameHistory(limitCount: number = 10): Promise<GameHistoryData[]> {
    const historyRef = collection(db, COLLECTIONS.GAME_HISTORY);
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as GameHistoryData);
  },

  async saveUserBets(betData: Omit<UserBetData, 'createdAt'>): Promise<void> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${betData.userId}_${betData.roundId}`);
    await setDoc(betRef, {
      ...betData,
      createdAt: serverTimestamp()
    });
  },

  async getUserBets(userId: string, roundId: number): Promise<UserBetData | null> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${userId}_${roundId}`);
    const betSnap = await getDoc(betRef);
    return betSnap.exists() ? betSnap.data() as UserBetData : null;
  }
};

// Room Supporters Services
export const supporterServices = {
  async updateRoomSupporter(supporterData: Omit<RoomSupporterData, 'updatedAt'>): Promise<void> {
    const supporterRef = doc(db, COLLECTIONS.ROOM_SUPPORTERS, `${supporterData.roomId}_${supporterData.userId}`);
    await setDoc(supporterRef, {
      ...supporterData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  onRoomSupportersChange(roomId: string, callback: (supporters: RoomSupporterData[]) => void) {
    const supportersRef = collection(db, COLLECTIONS.ROOM_SUPPORTERS);
    const q = query(
      supportersRef,
      where('roomId', '==', roomId),
      orderBy('totalGiftValue', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const supporters = querySnapshot.docs.map(doc => doc.data() as RoomSupporterData);
      callback(supporters);
    });
  }
};
