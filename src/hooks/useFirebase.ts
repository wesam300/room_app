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
    let unsubscribe: () => void = () => {};

    const loadUser = async () => {
      try {
        const localData = localStorage.getItem("userData");
        if (localData) {
            const localUser = JSON.parse(localData);
            if(localUser.profile.userId === userId) {
                setUserData(localUser);
                setLoading(false);
            }
        }

        const firebaseUser = await userServices.getUser(userId);
        if (firebaseUser) {
            setUserData(firebaseUser);
            localStorage.setItem("userData", JSON.stringify(firebaseUser));
        }
        
        unsubscribe = userServices.onUserChange(userId, (user) => {
            if (user) {
                setUserData(user);
                localStorage.setItem("userData", JSON.stringify(user));
            }
        });

      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    return () => unsubscribe();
  }, [userId]);

  const updateUser = useCallback(async (updates: Partial<UserData>) => {
    if (!userId) return;
    try {
        const userToUpdate = { ...(userData || {}), ...updates, profile: { ...userData?.profile, ...updates.profile, userId } };
        await userServices.saveUser(userToUpdate as any);
    } catch (err) {
        console.error('Error updating user:', err);
        setError('Failed to update user data');
    }
  }, [userId, userData]);


  return { userData, loading, error, updateUser };
};

// Hook for rooms
export const useRooms = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = roomServices.onRoomsChange((roomsData, err) => {
      if (err) {
        console.error('Error from room listener:', err);
        setError('Failed to load rooms in real-time');
        setRooms([]);
      } else {
        setRooms(roomsData);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createRoom = useCallback(async (roomData: Omit<RoomData, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'micSlots' | 'isRoomMuted' | 'attendees' >) => {
    try {
      await roomServices.createRoom(roomData);
    } catch (err) {
      console.error('Error creating room in useRooms:', err);
      setError('Failed to create room');
      throw err;
    }
  }, []);
  
  return { rooms, loading, error, createRoom };
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
    const unsubscribe = chatServices.onRoomMessagesChange(roomId, (messagesData) => {
      setMessages(messagesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = useCallback(async (messageData: Omit<ChatMessageData, 'id' |'createdAt'>) => {
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
