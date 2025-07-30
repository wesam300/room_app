

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
  writeBatch,
  addDoc,
  runTransaction
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, COLLECTIONS } from './firebase';
import { FruityFortuneGameProps } from '@/components/FruityFortuneGame'; // Assuming this is where it's defined

// Helper function for image uploads
export const uploadImageAndGetUrl = async (imageFile: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};


// Types
export interface UserProfile {
    name: string;
    image: string;
    userId: string;
    displayId?: string;
}

export interface UserData {
  profile: UserProfile;
  balance: number;
  silverBalance: number;
  lastClaimTimestamp: number | null;
  level: number;
  totalSupportGiven: number;
  vipLevel?: number;
  vipExpiry?: Timestamp | null;
  isBanned?: boolean;
  isOfficial?: boolean;
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
  status?: 'placed' | 'cashed_out';
  gameId?: string;
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

export interface GameInfo {
    id: string;
    name: string;
    image: string;
    backgroundImage?: string;
}

export interface AppStatusData {
    isMaintenanceMode: boolean;
    profileButtonImages?: {
        level?: string;
        vip?: string;
        store?: string;
        medal?: string;
    };
    updatedAt: Timestamp | Date;
}

export interface InvitationCodeData {
    code: string;
    status: 'available' | 'used';
    usedBy?: string;
    createdAt: Timestamp;
    usedAt?: Timestamp;
}


// --- Leveling System ---
const calculatedThresholds: number[] = [0]; // Level 0 has 0 XP
for (let i = 1; i <= 100; i++) {
    let requiredForThisLevel: number;
    const prevLevelThreshold = calculatedThresholds[i - 1];

    if (i <= 25) {
        // Easier curve for the first 25 levels
        const base_xp_easy = 10_000_000;
        const growth_factor_easy = 1.15;
        requiredForThisLevel = Math.floor(base_xp_easy * Math.pow(i, growth_factor_easy));
    } else {
        // Harder curve after level 25
        const base_xp_hard = 25_000_000; // Start higher
        const growth_factor_hard = 2.2; // Steeper growth
        requiredForThisLevel = Math.floor(base_xp_hard * Math.pow(i - 24, growth_factor_hard));
    }
    
    calculatedThresholds.push(prevLevelThreshold + requiredForThisLevel);
}
export const LEVEL_THRESHOLDS: readonly number[] = calculatedThresholds;


// Calculates level based on total support given
export const calculateLevel = (totalSupport: number): { level: number, progress: number, currentLevelXp: number, nextLevelXp: number } => {
    let level = 0;
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalSupport >= LEVEL_THRESHOLDS[i]) {
            level = i;
        } else {
            break;
        }
    }

    const currentLevelThreshold = LEVEL_THRESHOLDS[level];
    const nextLevelThreshold = LEVEL_THRESHOLDS[level + 1] || Infinity;
    
    const xpIntoCurrentLevel = totalSupport - currentLevelThreshold;
    const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;
    
    const progress = xpForNextLevel > 0 ? (xpIntoCurrentLevel / xpForNextLevel) * 100 : 100;

    return { 
        level, 
        progress: Math.min(100, progress),
        currentLevelXp: xpIntoCurrentLevel,
        nextLevelXp: xpForNextLevel
    };
};

// User Services
export const userServices = {
  async saveUser(userData: UserData): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userData.profile.userId);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
         await setDoc(userRef, {
           ...userData,
           profile: {
               ...userData.profile,
               displayId: userData.profile.displayId || userData.profile.userId,
           },
           level: userData.level || 0,
           totalSupportGiven: userData.totalSupportGiven || 0,
           isOfficial: userData.isOfficial || false,
           vipLevel: userData.vipLevel || 0,
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
        const data = userSnap.data() as UserData;
        // Ensure default values for leveling system if they don't exist
        data.level = data.level ?? 0;
        data.totalSupportGiven = data.totalSupportGiven ?? 0;
        data.isOfficial = data.isOfficial ?? false;
        data.vipLevel = data.vipLevel ?? 0;
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      throw error;
    }
  },
  
  async getUserByDisplayId(displayId: string): Promise<UserData | null> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('profile.displayId', '==', displayId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as UserData;
    }
    return null;
  },

  async getMultipleUsers(userIds: string[]): Promise<UserData[]> {
    if (userIds.length === 0) return [];
    try {
      const usersData: UserData[] = [];
      // Firestore 'in' query supports up to 30 items. We'll chunk it if needed.
      for (let i = 0; i < userIds.length; i += 30) {
        const chunk = userIds.slice(i, i + 30);
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, where('profile.userId', 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            usersData.push(doc.data() as UserData);
        });
      }
      return usersData;
    } catch (error) {
        console.error('Error getting multiple users from Firestore:', error);
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
  
  async isDisplayIdTaken(displayId: string): Promise<boolean> {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('profile.displayId', '==', displayId), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  async changeUserDisplayId(userId: string, newDisplayId: string): Promise<void> {
    const isTaken = await this.isDisplayIdTaken(newDisplayId);
    if (isTaken) {
      throw new Error(`معرف العرض "${newDisplayId}" مستخدم بالفعل.`);
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      'profile.displayId': newDisplayId,
      updatedAt: serverTimestamp(),
    });
  },

  async sendGiftAndUpdateLevels(
    senderId: string, 
    recipientId: string, 
    roomId: string,
    senderProfile: UserProfile,
    gift: GiftItem,
    quantity: number
  ): Promise<void> {
    const totalCost = gift.price * quantity;

    await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, COLLECTIONS.USERS, senderId);
        const senderDoc = await transaction.get(senderRef);

        if (!senderDoc.exists() || senderDoc.data().balance < totalCost) {
            throw new Error("Insufficient balance.");
        }

        // 1. Deduct balance from sender
        transaction.update(senderRef, { balance: increment(-totalCost) });

        // 2. Add silver balance to recipient
        const recipientRef = doc(db, COLLECTIONS.USERS, recipientId);
        transaction.update(recipientRef, { silverBalance: increment(totalCost * 0.20) });

        // 3. Update room supporter data for the sender
        const supporterRef = doc(db, COLLECTIONS.ROOM_SUPPORTERS, `${roomId}_${senderId}`);
        transaction.set(supporterRef, {
            roomId: roomId,
            userId: senderId,
            user: senderProfile,
            totalGiftValue: increment(totalCost),
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 4. Update sender's total support and level
        const currentTotalSupport = senderDoc.data().totalSupportGiven || 0;
        const newTotalSupport = currentTotalSupport + totalCost;
        const { level: newLevel } = calculateLevel(newTotalSupport);

        transaction.update(senderRef, {
            totalSupportGiven: increment(totalCost),
            level: newLevel,
            updatedAt: serverTimestamp(),
        });
    });
  },

  async purchaseVip(userId: string, vipLevel: number, cost: number): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) throw new Error("User not found.");
        
        const userData = userDoc.data() as UserData;
        if (userData.balance < cost) throw new Error("رصيد غير كافٍ.");
        if (userData.vipLevel && userData.vipLevel >= vipLevel) throw new Error("أنت بالفعل تمتلك هذا المستوى أو أعلى.");

        const updates: any = {
            balance: increment(-cost),
            vipLevel: vipLevel,
            updatedAt: serverTimestamp()
        };
        
        transaction.update(userRef, updates);
    });
  },

  async giftVip(senderId: string, recipientDisplayId: string, vipLevel: number, cost: number): Promise<void> {
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, COLLECTIONS.USERS, senderId);
        const senderDoc = await transaction.get(senderRef);

        if (!senderDoc.exists() || senderDoc.data().balance < cost) {
            throw new Error("رصيد غير كافٍ.");
        }

        const recipientData = await this.getUserByDisplayId(recipientDisplayId);
        if (!recipientData) {
            throw new Error("المستخدم المُهدى إليه غير موجود.");
        }
        const recipientRef = doc(db, COLLECTIONS.USERS, recipientData.profile.userId);

        if (recipientData.vipLevel && recipientData.vipLevel >= vipLevel) {
            throw new Error("المستخدم المُهدى إليه يمتلك هذا المستوى أو أعلى بالفعل.");
        }

        // Deduct from sender, give to recipient
        transaction.update(senderRef, { balance: increment(-cost) });
        transaction.update(recipientRef, { vipLevel: vipLevel, updatedAt: serverTimestamp() });
      });
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
            displayId: userId,
            name: `Banned User ${userId}`,
            image: "https://placehold.co/128x128.png",
          },
          balance: 0,
          silverBalance: 0,
          lastClaimTimestamp: null,
          isBanned: isBanned,
          isOfficial: false,
          level: 0,
          totalSupportGiven: 0,
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

  async setUserOfficialStatus(userId: string, isOfficial: boolean): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        isOfficial: isOfficial,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if ((error as any).code === 'not-found') {
         throw new Error(`User with ID ${userId} not found.`);
      }
      console.error('Error updating user official status in Firestore:', error);
      throw error;
    }
  },

  onUserChange(userId: string, callback: (userData: UserData | null) => void) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      return onSnapshot(userRef, (doc) => {
        if(doc.exists()){
            const data = doc.data() as UserData;
            // Ensure default values
            data.level = data.level ?? 0;
            data.totalSupportGiven = data.totalSupportGiven ?? 0;
            data.isOfficial = data.isOfficial ?? false;
            data.vipLevel = data.vipLevel ?? 0;
            callback(data);
        } else {
            callback(null);
        }
      }, (error) => {
        console.error('Firebase user listener error:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up Firebase user listener:', error);
      return () => {};
    }
  },
  
  onMultipleUsersChange(
    userIds: string[], 
    callback: (users: (UserData | null)[], error?: Error) => void
  ): () => void {
    if (userIds.length === 0) {
      callback([]);
      return () => {};
    }
    try {
      const unsubscribes = userIds.map(userId => {
        const userRef = doc(db, COLLECTIONS.USERS, userId);
        return onSnapshot(userRef, (doc) => {
          const user = doc.exists() ? doc.data() as UserData : null;
          if (user) {
            user.level = user.level ?? 0;
            user.totalSupportGiven = user.totalSupportGiven ?? 0;
            user.isOfficial = user.isOfficial ?? false;
            user.vipLevel = user.vipLevel ?? 0;
          }
          callback([user]); // Callback with each user update individually
        }, (error) => {
          console.error(`Error listening to user ${userId}:`, error);
          callback([], error);
        });
      });
      // Return a function that unsubscribes from all listeners
      return () => unsubscribes.forEach(unsub => unsub());
    } catch (error) {
      console.error('Error setting up Firebase multi-user listener:', error);
      callback([], error as Error);
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
      let finalRoomData = { ...roomData };

      do {
        newRoomId = String(Math.floor(100000 + Math.random() * 900000));
        roomRef = doc(db, COLLECTIONS.ROOMS, newRoomId);
        const docSnap = await getDoc(roomRef);
        roomExists = docSnap.exists();
      } while (roomExists);

      // If the image URL is a temporary one from the client, re-upload it with the final room ID
      if (roomData.image.includes('temp_')) {
        const response = await fetch(roomData.image);
        const blob = await response.blob();
        const file = new File([blob], "room_image.png", { type: blob.type });
        finalRoomData.image = await uploadImageAndGetUrl(file, `room_images/${newRoomId}`);
      }
      
      const newRoom: Omit<RoomData, 'createdAt' | 'updatedAt'> = {
          ...finalRoomData,
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
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    try {
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) {
            throw new Error("Room not found.");
        }
        const roomData = roomDoc.data() as RoomData;
        
        const owner = await userServices.getUser(roomData.ownerId);
        if (owner?.vipLevel === 9) {
            throw new Error("لا يمكن حذف غرفة يمتلكها مستخدم VIP 9.");
        }

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

    async updateMicSlot(roomId: string, user: UserProfile, action: 'ascend' | 'descend' | 'toggle_mute' | 'admin_mute' | 'toggle_lock', index: number): Promise<void> {
        const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
        
        await runTransaction(db, async (transaction) => {
            const roomSnap = await transaction.get(roomRef);
            if (!roomSnap.exists()) {
                throw new Error("Room not found.");
            }
            
            const roomData = roomSnap.data() as RoomData;
            const micSlots = roomData.micSlots || INITIAL_MIC_SLOTS.slice();
            const slot = micSlots[index];

            const isOwner = user.userId === roomData.ownerId;
            const isCurrentUserOnMic = slot.user?.userId === user.userId;

            switch (action) {
                case 'ascend':
                    if (slot.user || slot.isLocked) return;

                    // Check if user is already on another mic
                    const userAlreadyOnMic = micSlots.some(s => s.user?.userId === user.userId);
                    if (userAlreadyOnMic) {
                        throw new Error("أنت موجود بالفعل على مايك آخر.");
                    }

                    micSlots[index] = { ...slot, user: user, isMuted: false };
                    break;
                case 'descend':
                    if (isCurrentUserOnMic || isOwner) {
                        micSlots[index] = { ...slot, user: null };
                    }
                    break;
                case 'toggle_mute':
                    if (isCurrentUserOnMic) {
                        micSlots[index] = { ...slot, isMuted: !slot.isMuted };
                    }
                    break;
                case 'admin_mute':
                    if (isOwner && slot.user) {
                        micSlots[index] = { ...slot, isMuted: !slot.isMuted };
                    }
                    break;
                case 'toggle_lock':
                    if (isOwner) {
                        micSlots[index] = { ...slot, isLocked: !slot.isLocked };
                    }
                    break;
            }
            
            transaction.update(roomRef, { micSlots: micSlots, updatedAt: serverTimestamp() });
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
    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
            return;
        }
        const currentCount = roomDoc.data().userCount || 0;
        transaction.update(roomRef, { 
            userCount: increment(-1),
            updatedAt: serverTimestamp(),
        });
    });
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

  onRoomMessagesChange(roomId: string, joinTimestamp: Timestamp, callback: (messages: ChatMessageData[]) => void, onError: (error: Error) => void) {
    if (!joinTimestamp) {
      onError(new Error("Join timestamp is not provided."));
      return;
    }
    const messagesRef = collection(db, COLLECTIONS.CHAT_MESSAGES);
    const q = query(
      messagesRef,
      where('roomId', '==', roomId),
      where('createdAt', '>=', joinTimestamp),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => doc.data() as ChatMessageData);
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
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${betData.gameId}_${betData.userId}_${betData.roundId}`);
    await setDoc(betRef, {
      ...betData,
      createdAt: serverTimestamp()
    }, { merge: true });
  },

  async updateUserBetStatus(gameId: string, userId: string, roundId: number, status: 'cashed_out'): Promise<void> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${gameId}_${userId}_${roundId}`);
    await updateDoc(betRef, { status });
  },

  async getUserBets(gameId: string, userId: string, roundId: number): Promise<UserBetData | null> {
    const betRef = doc(db, COLLECTIONS.USER_BETS, `${gameId}_${userId}_${roundId}`);
    const betSnap = await getDoc(betRef);
    return betSnap.exists() ? betSnap.data() as UserBetData : null;
  },

  async getAllBetsForRound(gameId: string, roundId: number): Promise<UserBetData[]> {
      const betsRef = collection(db, COLLECTIONS.USER_BETS);
      const q = query(betsRef, where('roundId', '==', roundId), where('gameId', '==', gameId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserBetData);
  },

  async setGameDifficulty(gameId: string, difficulty: DifficultyLevel): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.GAME_SETTINGS, gameId);
      await setDoc(settingsRef, {
        difficulty: difficulty,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error setting game difficulty:', error);
      throw error;
    }
  },

  onDifficultyChange(gameId: string, callback: (difficulty: DifficultyLevel) => void): () => void {
    const settingsRef = doc(db, COLLECTIONS.GAME_SETTINGS, gameId);
    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as GameSettingsData;
            callback(data.difficulty);
        } else {
            // Default to hard if not set
            callback('hard');
        }
    }, (error) => {
        console.error('Error listening to difficulty changes:', error);
        callback('hard'); // Default on error
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
            { id: 'fruit_basket', name: 'مرطبات', price: 100000, image: 'https://placehold.co/150x150/4caf50/ffffff.png' },
            { id: 'ice_cream', name: 'آيس كريم', price: 250000, image: 'https://placehold.co/150x150/e91e63/ffffff.png' },
            { id: 'teddy_bear', name: 'دبدوب', price: 500000, image: 'https://placehold.co/150x150/795548/ffffff.png' },
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


// Game Metadata Services
export const gameMetaServices = {
    async initializeGames() {
        try {
            const DEFAULT_GAMES: GameInfo[] = [
                { id: 'fruity_fortune', name: 'فواكه الحظ', image: 'https://placehold.co/150x150/ff9800/ffffff.png', backgroundImage: '' },
                { id: 'crash', name: 'كراش', image: 'https://placehold.co/150x150/f44336/ffffff.png', backgroundImage: '' },
            ];

            const batch = writeBatch(db);
            let itemsAdded = 0;

            for (const game of DEFAULT_GAMES) {
                const docRef = doc(db, COLLECTIONS.GAMES, game.id);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    batch.set(docRef, game);
                    itemsAdded++;
                } else {
                    const existingData = docSnap.data();
                    if (!('backgroundImage' in existingData)) {
                        batch.update(docRef, { backgroundImage: '' });
                        itemsAdded++;
                    }
                }
            }

            if (itemsAdded > 0) {
                console.log(`Adding/updating ${itemsAdded} default games to Firestore...`);
                await batch.commit();
            }
        } catch (error) {
            console.error("Error initializing games:", error);
        }
    },

    onGamesChange(callback: (games: GameInfo[], error?: Error) => void) {
        const gamesRef = collection(db, COLLECTIONS.GAMES);
        const q = query(gamesRef);
        return onSnapshot(q, (snapshot) => {
            const games = snapshot.docs.map(doc => doc.data() as GameInfo);
            callback(games);
        }, (error) => {
            console.error("Games listener error:", error);
            callback([], error);
        });
    },

    async updateGameImage(gameId: string, imageUrl: string): Promise<void> {
        const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
        await updateDoc(gameRef, { image: imageUrl });
    },

    async updateGameBackgroundImage(gameId: string, imageUrl: string): Promise<void> {
        const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
        await updateDoc(gameRef, { backgroundImage: imageUrl });
    },
};

// App Status Services
export const appStatusServices = {
    async setMaintenanceMode(status: boolean): Promise<void> {
        try {
            const statusRef = doc(db, COLLECTIONS.APP_STATUS, 'global');
            await setDoc(statusRef, {
                isMaintenanceMode: status,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error setting maintenance mode:', error);
            throw error;
        }
    },

    async setProfileButtonImage(buttonKey: string, imageUrl: string): Promise<void> {
        try {
            const statusRef = doc(db, COLLECTIONS.APP_STATUS, 'global');
            await setDoc(statusRef, {
                profileButtonImages: {
                    [buttonKey]: imageUrl
                },
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error(`Error setting ${buttonKey} button image:`, error);
            throw error;
        }
    },

    onAppStatusChange(callback: (status: AppStatusData, error?: Error) => void): () => void {
        const statusRef = doc(db, COLLECTIONS.APP_STATUS, 'global');
        return onSnapshot(statusRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as AppStatusData;
                callback(data);
            } else {
                // If the document doesn't exist, assume defaults
                callback({ isMaintenanceMode: false, updatedAt: new Date() });
            }
        }, (error) => {
            console.error('Error listening to app status changes:', error);
            callback({ isMaintenanceMode: false, updatedAt: new Date() }, error); // Default on error
        });
    }
};

// Invitation Code Services
export const invitationCodeServices = {
    async initializeCodes(codes: string[]): Promise<void> {
        const batch = writeBatch(db);
        const codesRef = collection(db, COLLECTIONS.INVITATION_CODES);
        let codesAdded = 0;
        
        for (const code of codes) {
            const docRef = doc(codesRef, code);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                batch.set(docRef, {
                    code,
                    status: 'available',
                    createdAt: serverTimestamp(),
                });
                codesAdded++;
            }
        }
        
        if (codesAdded > 0) {
            console.log(`Initializing ${codesAdded} new invitation codes...`);
            await batch.commit();
        }
    },
    
    async isInvitationCodeValid(code: string): Promise<boolean> {
        try {
            const codeRef = doc(db, COLLECTIONS.INVITATION_CODES, code);
            const docSnap = await getDoc(codeRef);
            if (docSnap.exists() && docSnap.data().status === 'available') {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error validating invitation code:', error);
            return false;
        }
    },

    async markInvitationCodeAsUsed(code: string, userId: string): Promise<void> {
        try {
            const codeRef = doc(db, COLLECTIONS.INVITATION_CODES, code);
            await updateDoc(codeRef, {
                status: 'used',
                usedBy: userId,
                usedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error marking invitation code as used:', error);
            throw error;
        }
    },

    async generateInvitationCodes(count: number): Promise<string[]> {
        const batch = writeBatch(db);
        const newCodes: string[] = [];
        const codesRef = collection(db, COLLECTIONS.INVITATION_CODES);

        for (let i = 0; i < count; i++) {
            let code: string;
            let docSnap;
            do {
                // Generate a random 12-character alphanumeric code
                code = Math.random().toString(36).substring(2, 14).toUpperCase();
                docSnap = await getDoc(doc(codesRef, code));
            } while (docSnap.exists());
            
            newCodes.push(code);
            const newCodeRef = doc(codesRef, code);
            batch.set(newCodeRef, {
                code,
                status: 'available',
                createdAt: serverTimestamp(),
            });
        }
        
        await batch.commit();
        return newCodes;
    },
};
