
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
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Using public STUN servers from Google is crucial for NAT traversal.
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

    const signalsRef = collection(db, "voiceRooms", roomId, "signals");
    const usersRef = collection(db, "voiceRooms", roomId, "users");

    const startVoice = async () => {
      try {
        // We already requested permission in the page component, but as a fallback:
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


        // Listen for signals from other users
        const signalUnsub = onSnapshot(signalsRef, async snapshot => {
          if (!isComponentMounted) return;
          for (const change of snapshot.docChanges()) {
            if (change.type !== 'added') continue;

            const data = change.doc.data();
            // Ignore signals from self
            if (data.from === userId) continue; 
            // Ignore signals not intended for self
            if (data.to !== userId) continue;

            const pc = peers.current[data.from];
            if (!pc) continue; // Peer connection might not be ready yet
            
            if (data.type === "offer") {
              if (pc.signalingState !== 'stable') continue;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await addDoc(signalsRef, { type: "answer", sdp: answer.sdp, from: userId, to: data.from, createdAt: serverTimestamp() });
            } else if (data.type === "answer") {
              if (pc.signalingState !== 'have-local-offer') continue;
              await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            } else if (data.type === "ice") {
              // Add ICE candidate if remote description is set
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            }
          }
        });
        unsubscribes.push(signalUnsub);

        // Listen for users joining and leaving
        const usersUnsub = onSnapshot(usersRef, async snapshot => {
             if (!isComponentMounted) return;
             const remoteUserIds = snapshot.docs.map(d => d.data().id).filter(id => id !== userId);

             // Handle new users joining
             for(const remoteId of remoteUserIds) {
                if (!peers.current[remoteId]) {
                    const pc = createPeer(remoteId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await addDoc(signalsRef, { type: "offer", sdp: offer.sdp, from: userId, to: remoteId, createdAt: serverTimestamp() });
                }
             }

             // Handle users leaving
             Object.keys(peers.current).forEach(peerId => {
                 if (!remoteUserIds.includes(peerId)) {
                     peers.current[peerId].close();
                     delete peers.current[peerId];
                     let audio = document.getElementById(`audio-${peerId}`);
                     if (audio) audio.remove();
                 }
             });
        });
        unsubscribes.push(usersUnsub);

        // Announce presence
        await setDoc(doc(usersRef, userId), { id: userId, joinedAt: serverTimestamp() });

      } catch (error) {
        console.error("Error starting voice chat:", error);
      }
    };
    
    function createPeer(remoteId: string): RTCPeerConnection {
        // Clean up any existing peer connection for this ID
        if (peers.current[remoteId]) {
            peers.current[remoteId].close();
        }

        const pc = new RTCPeerConnection(stunServers);
        peers.current[remoteId] = pc;

        // Add local stream tracks to the new peer connection
        localStream.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current!);
        });

        // Handle incoming tracks from the remote peer
        pc.ontrack = (event) => {
            let audio = document.getElementById(`audio-${remoteId}`) as HTMLAudioElement;
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-${remoteId}`;
                document.body.appendChild(audio);
            }
            audio.srcObject = event.streams[0];
            audio.autoplay = true;
            audio.playsInline = true; // Important for mobile browsers
        };
        
        // Send ICE candidates to the remote peer
        pc.onicecandidate = (event) => {
          if (event.candidate && roomId) {
            addDoc(collection(db, "voiceRooms", roomId, "signals"), { type: "ice", candidate: event.candidate.toJSON(), from: userId, to: remoteId, createdAt: serverTimestamp() });
          }
        };

        // Clean up on connection failure
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

    const cleanup = () => {
        isComponentMounted = false;
        cleanupScheduled.current = true; // Mark that cleanup has started

        unsubscribes.forEach(unsub => unsub());

        if(localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
      
        Object.values(peers.current).forEach(pc => pc.close());
        peers.current = {};
      
        // Clean up all audio elements
        document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());

        // Remove user from Firestore user list on cleanup
        if (roomId) {
            const userDocRef = doc(db, "voiceRooms", roomId, "users", userId);
            deleteDoc(userDocRef).catch(e => console.error("Error removing user from room:", e));
        }
    }

    return cleanup;
  }, [roomId, userId]);

  // Effect to handle muting/unmuting the local audio track
  useEffect(() => {
    if (localStream.current) {
        localStream.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
    }
  }, [isMuted]);
}
