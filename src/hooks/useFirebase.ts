import { useState, useEffect, useCallback } from 'react';
import { userServices, roomServices, chatServices, gameServices, supporterServices, UserData, RoomData, ChatMessageData, GameHistoryData, UserBetData, RoomSupporterData } from '@/lib/firebaseServices';

// Hook for user data
export const useUser = (userId: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Try to load from localStorage first (faster)
    const loadUser = async () => {
      try {
        // Check localStorage first
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
          try {
            const localUser = JSON.parse(savedUserData);
            if (localUser.profile.userId === userId) {
              console.log('User found in localStorage:', localUser);
              setUserData(localUser);
              setLoading(false);
              
              // Try to sync with Firebase in background
              try {
                const firebaseUser = await userServices.getUser(userId);
                if (firebaseUser) {
                  console.log('User found in Firebase, syncing...');
                  setUserData(firebaseUser);
                  localStorage.setItem("userData", JSON.stringify(firebaseUser));
                } else {
                  console.log('User not in Firebase, saving from localStorage...');
                  await userServices.saveUser(localUser);
                }
              } catch (firebaseError) {
                console.error('Firebase sync failed:', firebaseError);
                // Continue with localStorage data
              }
              return;
            }
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }

        // If not in localStorage, try Firebase
        console.log('User not in localStorage, checking Firebase...');
        const user = await userServices.getUser(userId);
        if (user) {
          console.log('User found in Firebase:', user);
          setUserData(user);
          localStorage.setItem("userData", JSON.stringify(user));
        } else {
          console.log('User not found anywhere');
          setUserData(null);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
        
        // Final fallback: check localStorage again
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
          try {
            const localUser = JSON.parse(savedUserData);
            if (localUser.profile.userId === userId) {
              setUserData(localUser);
            }
          } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Set up real-time listener for Firebase changes
    const unsubscribe = userServices.onUserChange(userId, (user) => {
      if (user) {
        console.log('Firebase user updated:', user);
        setUserData(user);
        localStorage.setItem("userData", JSON.stringify(user));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!userData) return;

    const updatedUser = { ...userData, ...updates };
    
    // Update local state immediately
    setUserData(updatedUser);
    
    // Update localStorage immediately
    localStorage.setItem("userData", JSON.stringify(updatedUser));

    try {
      console.log('Updating user in Firebase:', updatedUser);
      await userServices.saveUser(updatedUser);
      console.log('User updated in Firebase successfully');
    } catch (err) {
      console.error('Error updating user in Firebase:', err);
      setError('Failed to update user data in Firebase');
      // Keep local changes, don't revert
    }
  }, [userData]);

  const updateBalance = useCallback(async (balance: number, silverBalance: number) => {
    if (!userData) return;

    const updatedUser = { ...userData, balance, silverBalance };
    
    // Update local state immediately
    setUserData(updatedUser);
    
    // Update localStorage immediately
    localStorage.setItem("userData", JSON.stringify(updatedUser));

    try {
      await userServices.updateUserBalance(userData.profile.userId, balance, silverBalance);
    } catch (err) {
      console.error('Error updating balance in Firebase:', err);
      setError('Failed to update balance in Firebase');
      // Keep local changes, don't revert
    }
  }, [userData]);

  return { userData, loading, error, updateUser, updateBalance };
};

// Hook for rooms
export const useRooms = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadRooms = async () => {
      try {
        console.log('Loading rooms from Firebase...');
        const roomsData = await roomServices.getRooms();
        setRooms(roomsData);
        console.log('Rooms loaded successfully:', roomsData.length);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError('Failed to load rooms');
        // Fallback: use empty array
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();

    // Set up real-time listener
    const unsubscribe = roomServices.onRoomsChange((roomsData) => {
      console.log('Rooms updated from Firebase:', roomsData.length);
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createRoom = useCallback(async (roomData: Omit<RoomData, 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Creating room in useRooms:', roomData);
      await roomServices.createRoom(roomData);
      console.log('Room created successfully in useRooms');
    } catch (err) {
      console.error('Error creating room in useRooms:', err);
      setError('Failed to create room');
      throw err; // Re-throw to let the component handle it
    }
  }, []);

  const updateRoom = useCallback(async (roomId: string, updates: Partial<RoomData>) => {
    try {
      console.log('Updating room in useRooms:', roomId, updates);
      await roomServices.updateRoom(roomId, updates);
      console.log('Room updated successfully in useRooms');
    } catch (err) {
      console.error('Error updating room in useRooms:', err);
      setError('Failed to update room');
    }
  }, []);

  return { rooms, loading, error, createRoom, updateRoom };
};

// Hook for chat messages
export const useChatMessages = (roomId: string | null) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadMessages = async () => {
      try {
        const messagesData = await chatServices.getRoomMessages(roomId);
        setMessages(messagesData);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Set up real-time listener
    const unsubscribe = chatServices.onRoomMessagesChange(roomId, (messagesData) => {
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = useCallback(async (messageData: Omit<ChatMessageData, 'createdAt'>) => {
    try {
      await chatServices.sendMessage(messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }, []);

  return { messages, loading, error, sendMessage };
};

// Hook for game history
export const useGameHistory = () => {
  const [history, setHistory] = useState<GameHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadHistory = async () => {
      try {
        const historyData = await gameServices.getGameHistory();
        setHistory(historyData);
      } catch (err) {
        console.error('Error loading game history:', err);
        setError('Failed to load game history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const saveGameHistory = useCallback(async (historyData: Omit<GameHistoryData, 'createdAt'>) => {
    try {
      await gameServices.saveGameHistory(historyData);
    } catch (err) {
      console.error('Error saving game history:', err);
      setError('Failed to save game history');
    }
  }, []);

  const saveUserBets = useCallback(async (betData: Omit<UserBetData, 'createdAt'>) => {
    try {
      await gameServices.saveUserBets(betData);
    } catch (err) {
      console.error('Error saving user bets:', err);
      setError('Failed to save user bets');
    }
  }, []);

  const getUserBets = useCallback(async (userId: string, roundId: number) => {
    try {
      return await gameServices.getUserBets(userId, roundId);
    } catch (err) {
      console.error('Error getting user bets:', err);
      setError('Failed to get user bets');
      return null;
    }
  }, []);

  return { history, loading, error, saveGameHistory, saveUserBets, getUserBets };
};

// Hook for room supporters
export const useRoomSupporters = (roomId: string | null) => {
  const [supporters, setSupporters] = useState<RoomSupporterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setSupporters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadSupporters = async () => {
      try {
        const supportersData = await supporterServices.getRoomSupporters(roomId);
        setSupporters(supportersData);
      } catch (err) {
        console.error('Error loading supporters:', err);
        setError('Failed to load supporters');
      } finally {
        setLoading(false);
      }
    };

    loadSupporters();

    // Set up real-time listener
    const unsubscribe = supporterServices.onRoomSupportersChange(roomId, (supportersData) => {
      setSupporters(supportersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const updateSupporter = useCallback(async (supporterData: Omit<RoomSupporterData, 'updatedAt'>) => {
    try {
      await supporterServices.updateRoomSupporter(supporterData);
    } catch (err) {
      console.error('Error updating supporter:', err);
      setError('Failed to update supporter');
    }
  }, []);

  return { supporters, loading, error, updateSupporter };
}; 