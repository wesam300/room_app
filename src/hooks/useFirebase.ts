
import { useState, useEffect, useCallback } from 'react';
import { userServices, roomServices, chatServices, gameServices, supporterServices, giftServices, UserData, RoomData, ChatMessageData, GameHistoryData, UserBetData, RoomSupporterData, GiftItem } from '@/lib/firebaseServices';

// Hook for user data
export const useUser = (userId: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUserData = useCallback(async (data: UserData | null) => {
      if (!data?.profile?.userId) {
          setUserData(null);
          localStorage.removeItem("userData");
          return;
      }
      // Optimistic update
      setUserData(data);
      localStorage.setItem("userData", JSON.stringify(data));
      try {
          // Persist to Firebase
          await userServices.saveUser(data);
      } catch (err) {
          console.error('Error saving user data to Firebase:', err);
          setError('Failed to sync user data with the server.');
          // Optional: implement logic to revert optimistic update on failure
      }
  }, []);

  useEffect(() => {
    if (!userId) {
      setUserData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listener for real-time updates from Firestore
    const unsubscribe = userServices.onUserChange(userId, (userFromFirebase) => {
      if (userFromFirebase) {
        setUserData(userFromFirebase);
        localStorage.setItem("userData", JSON.stringify(userFromFirebase));
      } else {
        // User document was deleted from Firestore
        setUserData(null);
        localStorage.removeItem("userData");
      }
      if (loading) setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { userData, loading, error, setUserData: updateUserData };
};

// Hook for rooms
export const useRooms = () => {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubscribe: () => void = () => {};

    const loadInitialAndListen = async () => {
        try {
            const initialRooms = await roomServices.loadRooms();
            setRooms(initialRooms);
        } catch(err) {
            console.error('Error loading initial rooms:', err);
            setError('Failed to load initial rooms');
        } finally {
            setLoading(false);
        }

        unsubscribe = roomServices.onRoomsChange((roomsData, err) => {
          if (err) {
            console.error('Error from room listener:', err);
            setError('Failed to load rooms in real-time');
            setRooms([]);
          } else {
            setRooms(roomsData);
            setError(null);
          }
          if (loading) setLoading(false);
        });
    }

    loadInitialAndListen();

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
    }, (err) => {
      console.error("Error in chat messages listener:", err);
      setError("Failed to load chat messages.");
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
    const unsubscribe = supporterServices.onRoomSupportersChange(roomId, (supportersData, err) => {
       if (err) {
         console.error("Error in supporters listener:", err);
         setError("Failed to load supporters.");
       } else {
         setSupporters(supportersData);
       }
       setLoading(false);
    });
    return () => unsubscribe();
  }, [roomId]);

  return { supporters, loading, error };
};

// Hook for gifts
export const useGifts = () => {
    const [gifts, setGifts] = useState<GiftItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      setLoading(true);
      setError(null);
      const unsubscribe = giftServices.onGiftsChange((giftsData, err) => {
        if (err) {
          console.error("Error in gifts listener:", err);
          setError("Failed to load gifts.");
        } else {
          setGifts(giftsData);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }, []);
  
    return { gifts, loading, error };
};
