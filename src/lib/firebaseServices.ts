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
  Timestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';

// Types
export interface UserData {
  profile: {
    name: string;
    image: string;
    userId: string;
  };
  balance: number;
  silverBalance: number;
  lastClaimTimestamp: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RoomData {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  image: string;
  userCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessageData {
  id: string;
  roomId: string;
  user: {
    name: string;
    image: string;
    userId: string;
  };
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
  user: {
    name: string;
    image: string;
    userId: string;
  };
  totalGiftValue: number;
  updatedAt: Timestamp;
}

// User Services
export const userServices = {
  // Create or update user
  async saveUser(userData: Omit<UserData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      console.log('Saving user to Firestore:', userData);
      const userRef = doc(db, COLLECTIONS.USERS, userData.profile.userId);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('User saved successfully to Firestore');
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      // Don't throw error, let the caller handle it
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId: string): Promise<UserData | null> {
    try {
      console.log('Getting user from Firestore:', userId);
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserData;
        console.log('User found in Firestore:', userData);
        return userData;
      }
      console.log('User not found in Firestore');
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      // Don't throw error, let the caller handle it
      throw error;
    }
  },

  // Update user balance
  async updateUserBalance(userId: string, balance: number, silverBalance: number): Promise<void> {
    try {
      console.log('Updating user balance in Firestore:', userId, { balance, silverBalance });
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        balance,
        silverBalance,
        updatedAt: serverTimestamp()
      });
      console.log('User balance updated successfully in Firestore');
    } catch (error) {
      console.error('Error updating user balance in Firestore:', error);
      throw error;
    }
  },

  // Listen to user changes
  onUserChange(userId: string, callback: (userData: UserData | null) => void) {
    try {
      console.log('Setting up Firebase listener for user:', userId);
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data() as UserData;
          console.log('Firebase listener: user updated:', userData);
          callback(userData);
        } else {
          console.log('Firebase listener: user not found');
          callback(null);
        }
      }, (error) => {
        console.error('Firebase listener error:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }
};

// Room Services
export const roomServices = {
  // Create room
  async createRoom(roomData: Omit<RoomData, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      console.log('Creating room in Firestore:', roomData);
      const roomRef = doc(db, COLLECTIONS.ROOMS, roomData.id);
      await setDoc(roomRef, {
        ...roomData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Room created successfully in Firestore');
    } catch (error) {
      console.error('Error creating room in Firestore:', error);
      throw error;
    }
  },

  // Get all rooms
  async getRooms(): Promise<RoomData[]> {
    try {
      console.log('Getting rooms from Firestore');
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const rooms = querySnapshot.docs.map(doc => doc.data() as RoomData);
      console.log('Rooms loaded from Firestore:', rooms.length);
      return rooms;
    } catch (error) {
      console.error('Error getting rooms from Firestore:', error);
      throw error;
    }
  },

  // Update room
  async updateRoom(roomId: string, updates: Partial<RoomData>): Promise<void> {
    try {
      console.log('Updating room in Firestore:', roomId, updates);
      const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
      await updateDoc(roomRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      console.log('Room updated successfully in Firestore');
    } catch (error) {
      console.error('Error updating room in Firestore:', error);
      throw error;
    }
  },

  // Listen to rooms changes
  onRoomsChange(callback: (rooms: RoomData[]) => void) {
    try {
      console.log('Setting up Firebase listener for rooms');
      const roomsRef = collection(db, COLLECTIONS.ROOMS);
      const q = query(roomsRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (querySnapshot) => {
        const rooms = querySnapshot.docs.map(doc => doc.data() as RoomData);
        console.log('Firebase rooms listener: rooms updated:', rooms.length);
        callback(rooms);
      }, (error) => {
        console.error('Firebase rooms listener error:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up Firebase rooms listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }
};

// Chat Services
export const chatServices = {
  // Send message
  async sendMessage(messageData: Omit<ChatMessageData, 'createdAt'>): Promise<void> {
    const messageRef = doc(collection(db, COLLECTIONS.CHAT_MESSAGES));
    await setDoc(messageRef, {
      ...messageData,
      id: messageRef.id,
      createdAt: serverTimestamp()
    });
  },

  // Get room messages
  async getRoomMessages(roomId: string, limitCount: number = 50): Promise<ChatMessageData[]> {
    const messagesRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as ChatMessageData).reverse();
  },

  // Listen to room messages
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
  // Save game history
  async saveGameHistory(historyData: Omit<GameHistoryData, 'createdAt'>): Promise<void> {
    const historyRef = doc(collection(db, COLLECTIONS.GAME_HISTORY));
    await setDoc(historyRef, {
      ...historyData,
      createdAt: serverTimestamp()
    });
  },

  // Get game history
  async getGameHistory(limitCount: number = 10): Promise<GameHistoryData[]> {
    const historyRef = collection(db, COLLECTIONS.GAME_HISTORY);
    const q = query(historyRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as GameHistoryData);
  },

  // Save user bets
  async saveUserBets(betData: Omit<UserBetData, 'createdAt'>): Promise<void> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${betData.userId}_${betData.roundId}`);
    await setDoc(betRef, {
      ...betData,
      createdAt: serverTimestamp()
    });
  },

  // Get user bets for a round
  async getUserBets(userId: string, roundId: number): Promise<UserBetData | null> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${userId}_${roundId}`);
    const betSnap = await getDoc(betRef);
    
    if (betSnap.exists()) {
      return betSnap.data() as UserBetData;
    }
    return null;
  }
};

// Room Supporters Services
export const supporterServices = {
  // Update room supporter
  async updateRoomSupporter(supporterData: Omit<RoomSupporterData, 'updatedAt'>): Promise<void> {
    const supporterRef = doc(db, COLLECTIONS.ROOM_SUPPORTERS, `${supporterData.roomId}_${supporterData.userId}`);
    await setDoc(supporterRef, {
      ...supporterData,
      updatedAt: serverTimestamp()
    });
  },

  // Get room supporters
  async getRoomSupporters(roomId: string): Promise<RoomSupporterData[]> {
    const supportersRef = collection(db, COLLECTIONS.ROOM_SUPPORTERS);
    const q = query(
      supportersRef,
      where('roomId', '==', roomId),
      orderBy('totalGiftValue', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as RoomSupporterData);
  },

  // Listen to room supporters changes
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