
import { useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Using public STUN servers from Google
const stunServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export function useVoiceChat(roomId: string | null, userId: string, isMuted: boolean) {
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStream = useRef<MediaStream | null>(null);
  const cleanupScheduled = useRef<boolean>(false);

  useEffect(() => {
    // If no roomId, or if a cleanup is already scheduled, don't start a new session.
    if (!roomId || cleanupScheduled.current) {
        return;
    }

    let isComponentMounted = true;
    let unsubscribes: (() => void)[] = [];

    const startVoice = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia is not supported in this browser.");
            return;
        }

        localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isComponentMounted) {
            localStream.current.getTracks().forEach(track => track.stop());
            return;
        }

        localStream.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });

        const signalsRef = collection(db, "voiceRooms", roomId, "signals");
        const usersRef = collection(db, "voiceRooms", roomId, "users");

        const signalUnsub = onSnapshot(signalsRef, async snapshot => {
          if (!isComponentMounted) return;
          for (const change of snapshot.docChanges()) {
            if (change.type !== 'added') continue;

            const data = change.doc.data();
            if (data.from === userId) continue;

            const pc = peers.current[data.from] || createPeer(data.from);
            
            if (data.type === "offer") {
              if (pc.signalingState !== 'stable') continue;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await addDoc(signalsRef, { type: "answer", sdp: answer.sdp, from: userId, to: data.from, createdAt: serverTimestamp() });
            } else if (data.type === "answer" && data.to === userId) {
              if (pc.signalingState !== 'have-local-offer') continue;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            } else if (data.type === "ice" && data.to === userId) {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            }
          }
        });
        unsubscribes.push(signalUnsub);

        const usersUnsub = onSnapshot(usersRef, async snapshot => {
             if (!isComponentMounted) return;
             // Handle new users joining
             for(const docSnap of snapshot.docs) {
                const remoteId = docSnap.data().id;
                if (remoteId !== userId && !peers.current[remoteId]) {
                    const pc = createPeer(remoteId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await addDoc(signalsRef, { type: "offer", sdp: offer.sdp, from: userId, to: remoteId, createdAt: serverTimestamp() });
                }
             }

             // Handle users leaving
             const currentRemoteUserIds = snapshot.docs.map(d => d.data().id);
             Object.keys(peers.current).forEach(peerId => {
                 if (!currentRemoteUserIds.includes(peerId)) {
                     peers.current[peerId].close();
                     delete peers.current[peerId];
                 }
             });
        });
        unsubscribes.push(usersUnsub);

        await setDoc(doc(usersRef, userId), { id: userId, joinedAt: serverTimestamp() });

      } catch (error) {
        console.error("Error starting voice chat:", error);
      }
    };
    
    function createPeer(remoteId: string): RTCPeerConnection {
        if (peers.current[remoteId]) {
            peers.current[remoteId].close();
        }

        const pc = new RTCPeerConnection(stunServers);
        peers.current[remoteId] = pc;

        localStream.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current!);
        });

        pc.ontrack = (event) => {
            let audio = document.getElementById(`audio-${remoteId}`) as HTMLAudioElement;
            if (!audio) {
                audio = new Audio();
                audio.id = `audio-${remoteId}`;
                document.body.appendChild(audio);
            }
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
        };
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(collection(db, "voiceRooms", roomId!, "signals"), { type: "ice", candidate: event.candidate.toJSON(), from: userId, to: remoteId, createdAt: serverTimestamp() });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            pc.close();
            delete peers.current[remoteId];
            let audio = document.getElementById(`audio-${remoteId}`);
            if (audio) audio.remove();
          }
        };
        return pc;
    }

    startVoice();

    return () => {
      isComponentMounted = false;
      cleanupScheduled.current = true; // Mark that cleanup has started

      unsubscribes.forEach(unsub => unsub());

      if(localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      
      Object.values(peers.current).forEach(pc => pc.close());
      peers.current = {};
      
      // Clean up audio elements
      document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());

      // Remove user from Firestore user list
      if (roomId) {
        const userDocRef = doc(db, "voiceRooms", roomId, "users", userId);
        deleteDoc(userDocRef).catch(e => console.error("Error removing user from room:", e));
      }
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (localStream.current) {
        localStream.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
    }
  }, [isMuted]);
}
