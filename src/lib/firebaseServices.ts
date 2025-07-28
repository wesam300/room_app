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
  increment,
  writeBatch
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
  isBanned?: boolean;
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

export type DifficultyLevel = 'very_easy' | 'easy' | 'medium' | 'medium_hard' | 'hard' | 'very_hard' | 'impossible';

export interface GameSettingsData {
    difficulty: DifficultyLevel;
    updatedAt: Timestamp;
}

export interface GiftItem {
    id: string;
    name: string;
    price: number;
    image: string;
}

// User Services
export const userServices = {
  async saveUser(userData: UserData): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userData.profile.userId);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
         await setDoc(userRef, {
           ...userData,
           createdAt: serverTimestamp(),
           updatedAt: serverTimestamp(),
         });
      } else {
        await updateDoc(userRef, {
           ...userData,
           updatedAt: serverTimestamp(),
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
  
  async getAllUsers(): Promise<UserData[]> {
    try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const querySnapshot = await getDocs(usersRef);
        return querySnapshot.docs.map(doc => doc.data() as UserData);
    } catch (error) {
        console.error('Error getting all users from Firestore:', error);
        throw error;
    }
  },

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        balance: increment(amount),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
       if ((error as any).code === 'not-found') {
         console.warn(`User ${userId} not found for balance update. Ignoring.`);
         return;
       }
      console.error('Error updating user balance in Firestore:', error);
      throw error;
    }
  },

  async updateUserSilverBalance(userId: string, amount: number): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        silverBalance: increment(amount),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
       if ((error as any).code === 'not-found') {
         // If the user doesn't exist, we can't add silver balance. This might happen in rare cases.
         console.warn(`User ${userId} not found for silver balance update. Ignoring.`);
         return;
       }
      console.error('Error updating user silver balance in Firestore:', error);
      throw error;
    }
  },

  async setUserBanStatus(userId: string, isBanned: boolean): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          profile: {
            userId: userId,
            name: `Banned User ${userId}`,
            image: "https://placehold.co/128x128.png",
          },
          balance: 0,
          silverBalance: 0,
          lastClaimTimestamp: null,
          isBanned: isBanned,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
         await updateDoc(userRef, {
          isBanned: isBanned,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
        console.error('Error updating user ban status in Firestore:', error);
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

const INITIAL_MIC_SLOTS: MicSlotData[] = Array(15).fill(null).map(() => ({
    user: null,
    isMuted: false,
    isLocked: false
}));

// Room Services
export const roomServices = {
  async createRoom(roomData: Omit<RoomData, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'micSlots' | 'isRoomMuted'>): Promise<void> {
    try {
      let newRoomId: string;
      let roomRef;
      let roomExists = true;

      do {
        newRoomId = String(Math.floor(100000 + Math.random() * 900000));
        roomRef = doc(db, COLLECTIONS.ROOMS, newRoomId);
        const docSnap = await getDoc(roomRef);
        roomExists = docSnap.exists();
      } while (roomExists);
      
      const newRoom: Omit<RoomData, 'createdAt' | 'updatedAt'> = {
          ...roomData,
          id: newRoomId,
          userCount: 0,
          micSlots: INITIAL_MIC_SLOTS,
          isRoomMuted: false,
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
  
  async deleteRoom(roomId: string): Promise<void> {
    try {
      const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('Error deleting room from Firestore:', error);
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

  async joinRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
        userCount: increment(1),
        updatedAt: serverTimestamp(),
    });
  },

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    const roomSnap = await getDoc(roomRef);
    if(roomSnap.exists()){
       const currentCount = roomSnap.data().userCount || 0;
       if (currentCount > 0) {
         await updateDoc(roomRef, {
             userCount: increment(-1),
             updatedAt: serverTimestamp(),
         });
       }
    }
  },

  async loadRooms(): Promise<RoomData[]> {
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('userCount', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as RoomData);
  },
  
  onRoomsChange(callback: (rooms: RoomData[], error?: Error) => void) {
    try {
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('userCount', 'desc'));
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

  onRoomMessagesChange(roomId: string, callback: (messages: ChatMessageData[]) => void, onError: (error: Error) => void) {
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
    }, (error) => {
      console.error("Message listener error:", error);
      onError(error);
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
    }, { merge: true });
  },

  async getUserBets(userId: string, roundId: number): Promise<UserBetData | null> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${userId}_${roundId}`);
    const betSnap = await getDoc(betRef);
    return betSnap.exists() ? betSnap.data() as UserBetData : null;
  },

  async getAllBetsForRound(roundId: number): Promise<UserBetData[]> {
      const betsRef = collection(db, COLLECTIONS.USER_BETS);
      const q = query(betsRef, where('roundId', '==', roundId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserBetData);
  },

  async setGameDifficulty(difficulty: DifficultyLevel): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.GAME_SETTINGS, 'fruity_fortune');
      await setDoc(settingsRef, {
        difficulty: difficulty,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting game difficulty:', error);
      throw error;
    }
  },

  onDifficultyChange(callback: (difficulty: DifficultyLevel) => void): () => void {
    const settingsRef = doc(db, COLLECTIONS.GAME_SETTINGS, 'fruity_fortune');
    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as GameSettingsData;
            callback(data.difficulty);
        } else {
            // Default to medium if not set
            callback('medium');
        }
    }, (error) => {
        console.error('Error listening to difficulty changes:', error);
        callback('medium'); // Default on error
    });
  }
};

// Room Supporters Services
export const supporterServices = {
  async updateRoomSupporter(supporterData: Omit<RoomSupporterData, 'updatedAt' | 'totalGiftValue'> & { totalGiftValue: number | any }): Promise<void> {
    const supporterRef = doc(db, COLLECTIONS.ROOM_SUPPORTERS, `${supporterData.roomId}_${supporterData.userId}`);
    await setDoc(supporterRef, {
      ...supporterData,
      totalGiftValue: increment(supporterData.totalGiftValue),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  onRoomSupportersChange(roomId: string, callback: (supporters: RoomSupporterData[], error?: Error) => void) {
    const supportersRef = collection(db, COLLECTIONS.ROOM_SUPPORTERS);
    const q = query(
      supportersRef,
      where('roomId', '==', roomId),
      orderBy('totalGiftValue', 'desc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const supporters = querySnapshot.docs.map(doc => doc.data() as RoomSupporterData);
      callback(supporters);
    }, (error) => {
       console.error("Supporters listener error:", error);
       callback([], error);
    });
  }
};

// Gift Services
export const giftServices = {
  async initializeGifts() {
    try {
        const DEFAULT_GIFTS: GiftItem[] = [
            { id: 'rose', name: 'وردة', price: 1000000, image: 'https://placehold.co/150x150/ff4d4d/ffffff.png' },
            { id: 'perfume', name: 'عطر', price: 2000000, image: 'https://placehold.co/150x150/ff8a4d/ffffff.png' },
            { id: 'car', name: 'سيارة', price: 5000000, image: 'https://placehold.co/150x150/ffc14d/ffffff.png' },
            { id: 'plane', name: 'طائرة', price: 10000000, image: 'https://placehold.co/150x150/c1ff4d/000000.png' },
            { id: 'yacht', name: 'يخت', price: 15000000, image: 'https://placehold.co/150x150/4dffc1/000000.png' },
            { id: 'castle', name: 'قلعة', price: 30000000, image: 'https://placehold.co/150x150/4dc1ff/ffffff.png' },
            { id: 'lion', name: 'أسد', price: 50000000, image: 'https://placehold.co/150x150/c14dff/ffffff.png' },
            { id: 'rocket', name: 'صاروخ', price: 100000000, image: 'https://placehold.co/150x150/f0f8ff/000000.png' },
            { id: 'planet', name: 'كوكب', price: 200000000, image: 'https://placehold.co/150x150/deb887/000000.png' },
        ];
        
        const batch = writeBatch(db);
        let itemsAdded = 0;
        
        for (const gift of DEFAULT_GIFTS) {
            const docRef = doc(db, COLLECTIONS.GIFTS, gift.id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                batch.set(docRef, gift);
                itemsAdded++;
            }
        }

        if (itemsAdded > 0) {
            console.log(`Adding ${itemsAdded} new default gifts to Firestore...`);
            await batch.commit();
        }

    } catch (error) {
        console.error("Error initializing gifts:", error);
    }
  },

  onGiftsChange(callback: (gifts: GiftItem[], error?: Error) => void) {
    const giftsRef = collection(db, COLLECTIONS.GIFTS);
    const q = query(giftsRef, orderBy('price', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const gifts = snapshot.docs.map(doc => doc.data() as GiftItem);
        callback(gifts);
    }, (error) => {
        console.error("Gifts listener error:", error);
        callback([], error);
    });
  },

  async updateGiftImage(giftId: string, imageUrl: string): Promise<void> {
    const giftRef = doc(db, COLLECTIONS.GIFTS, giftId);
    await updateDoc(giftRef, { image: imageUrl });
  },
};
