
import { useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useVoiceChat(roomId: string | null, userId: string, isMuted: boolean) {
  const peers = useRef<Record<string, RTCPeerConnection>>({});
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!roomId) {
        // If no roomId, cleanup any existing connections
        Object.values(peers.current).forEach(pc => pc.close());
        peers.current = {};
        localStream.current?.getTracks().forEach(track => track.stop());
        localStream.current = null;
        return;
    }

    let unsub: (() => void) | null = null;

    const startVoice = async () => {
      try {
        localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });

        const signalsRef = collection(db, "voiceRooms", roomId, "signals");

        unsub = onSnapshot(signalsRef, async snapshot => {
          for (const change of snapshot.docChanges()) {
            if (change.type !== 'added') continue;

            const data = change.doc.data();
            if (data.from === userId) continue;

            if (data.type === "offer") {
              const pc = createPeer(data.from);
              await pc.setRemoteDescription({ type: "offer", sdp: data.sdp });
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await addDoc(signalsRef, {
                type: "answer",
                sdp: answer.sdp,
                from: userId,
                to: data.from,
                createdAt: serverTimestamp(),
              });
            }

            if (data.type === "answer" && data.to === userId) {
              const pc = peers.current[data.from];
              if (pc && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
              }
            }

            if (data.type === "ice" && data.to === userId) {
              const pc = peers.current[data.from];
              if (pc) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                  console.warn("ICE add error:", e);
                }
              }
            }
          }
        });

        function createPeer(remoteId: string) {
          if (peers.current[remoteId]) return peers.current[remoteId];

          const pc = new RTCPeerConnection();
          peers.current[remoteId] = pc;

          localStream.current?.getTracks().forEach(track => {
            pc.addTrack(track, localStream.current!);
          });

          pc.ontrack = (e) => {
            const audio = new Audio();
            audio.srcObject = e.streams[0];
            audio.autoplay = true;
          };

          pc.onicecandidate = (e) => {
            if (e.candidate) {
              addDoc(signalsRef, {
                type: "ice",
                candidate: e.candidate.toJSON(),
                from: userId,
                to: remoteId,
                createdAt: serverTimestamp(),
              });
            }
          };
          
          pc.onconnectionstatechange = () => {
              if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
                  pc.close();
                  delete peers.current[remoteId];
              }
          }

          return pc;
        }

        const usersRef = collection(db, "voiceRooms", roomId, "users");
        const userQuery = query(usersRef, where("id", "!=", userId));

        onSnapshot(userQuery, async snapshot => {
          for (const docSnap of snapshot.docs) {
            const remoteId = docSnap.data().id;
            if (peers.current[remoteId]) continue;

            const pc = createPeer(remoteId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await addDoc(signalsRef, {
              type: "offer",
              sdp: offer.sdp,
              from: userId,
              to: remoteId,
              createdAt: serverTimestamp(),
            });
          }
        });

        await addDoc(collection(db, "voiceRooms", roomId, "users"), {
          id: userId,
          joinedAt: serverTimestamp(),
        });

      } catch (error) {
        console.error("Error starting voice chat:", error);
      }
    };

    startVoice();

    return () => {
      unsub?.();
      Object.values(peers.current).forEach(pc => pc.close());
      peers.current = {};
      localStream.current?.getTracks().forEach(track => track.stop());
      localStream.current = null;
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
