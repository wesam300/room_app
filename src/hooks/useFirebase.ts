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

    // Try to load from Firebase first
    const loadUser = async () => {
      try {
        const user = await userServices.getUser(userId);
        if (user) {
          setUserData(user);
        } else {
          // If user doesn't exist in Firebase, try localStorage as fallback
          const savedUserData = localStorage.getItem("userData");
          if (savedUserData) {
            const localUser = JSON.parse(savedUserData);
            if (localUser.profile.userId === userId) {
              // Save to Firebase
              await userServices.saveUser(localUser);
              setUserData(localUser);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
        
        // Fallback to localStorage
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
          const localUser = JSON.parse(savedUserData);
          if (localUser.profile.userId === userId) {
            setUserData(localUser);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Set up real-time listener
    const unsubscribe = userServices.onUserChange(userId, (user) => {
      setUserData(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!userData) return;

    const updatedUser = { ...userData, ...updates };
    setUserData(updatedUser);

    try {
      await userServices.saveUser(updatedUser);
      // Also update localStorage as backup
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user data');
    }
  }, [userData]);

  const updateBalance = useCallback(async (balance: number, silverBalance: number) => {
    if (!userData) return;

    const updatedUser = { ...userData, balance, silverBalance };
    setUserData(updatedUser);

    try {
      await userServices.updateUserBalance(userData.profile.userId, balance, silverBalance);
      // Also update localStorage as backup
      localStorage.setItem("userData", JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error updating balance:', err);
      setError('Failed to update balance');
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
        const roomsData = await roomServices.getRooms();
        setRooms(roomsData);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();

    // Set up real-time listener
    const unsubscribe = roomServices.onRoomsChange((roomsData) => {
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createRoom = useCallback(async (roomData: Omit<RoomData, 'createdAt' | 'updatedAt'>) => {
    try {
      await roomServices.createRoom(roomData);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room');
    }
  }, []);

  const updateRoom = useCallback(async (roomId: string, updates: Partial<RoomData>) => {
    try {
      await roomServices.updateRoom(roomId, updates);
    } catch (err) {
      console.error('Error updating room:', err);
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