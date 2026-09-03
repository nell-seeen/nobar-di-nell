import { useEffect, useRef, useState } from 'react';
import { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

export function useVoiceChat(roomId: string, isVoiceConnected: boolean, stream: MediaStream | null) {
  const { user } = useAuth();
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  useEffect(() => {
    if (!roomId || !user || !isVoiceConnected || !stream) {
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
      setRemoteStreams({});
      return;
    }

    const signalingRef = collection(db, `rooms/${roomId}/signaling`);
    const mySignalingRef = doc(signalingRef, user.uid);

    // Announce online
    setDoc(mySignalingRef, { online: true, timestamp: Date.now() });

    const createPeer = (peerUid: string, initiator: boolean) => {
      if (peersRef.current[peerUid]) return peersRef.current[peerUid];

      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peersRef.current[peerUid] = peer;

      // Add local tracks
      stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
      });

      // Handle remote tracks
      peer.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [peerUid]: event.streams[0]
        }));
      };

      // Send ICE candidates to the remote peer's candidates collection
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(collection(signalingRef, peerUid, 'candidates'), {
            from: user.uid,
            candidate: event.candidate.toJSON(),
            timestamp: Date.now()
          });
        }
      };

      if (initiator) {
        peer.createOffer()
          .then(offer => peer.setLocalDescription(offer))
          .then(() => {
            setDoc(doc(signalingRef, peerUid, 'offers', user.uid), {
              offer: {
                type: peer.localDescription?.type,
                sdp: peer.localDescription?.sdp
              },
              timestamp: Date.now()
            });
          });
      }

      return peer;
    };

    // 1. Listen for new users joining
    const unsubscribeUsers = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const peerUid = change.doc.id;
          if (peerUid !== user.uid && change.doc.data().online) {
            // Tie-breaker: smaller UID creates the offer
            const initiator = user.uid < peerUid;
            if (initiator) {
              createPeer(peerUid, true);
            }
          }
        }
        if (change.type === 'modified' && !change.doc.data().online) {
          const peerUid = change.doc.id;
          if (peersRef.current[peerUid]) {
            peersRef.current[peerUid].close();
            delete peersRef.current[peerUid];
            setRemoteStreams(prev => {
              const newStreams = { ...prev };
              delete newStreams[peerUid];
              return newStreams;
            });
          }
        }
      });
    });

    // 2. Listen for offers
    const unsubscribeOffers = onSnapshot(collection(mySignalingRef, 'offers'), (snapshot) => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const peerUid = change.doc.id;
          const peer = createPeer(peerUid, false);
          
          try {
            await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            
            await setDoc(doc(signalingRef, peerUid, 'answers', user.uid), {
              answer: {
                type: peer.localDescription?.type,
                sdp: peer.localDescription?.sdp
              },
              timestamp: Date.now()
            });
          } catch (e) {
            console.error('Error handling offer:', e);
          }
          
          deleteDoc(change.doc.ref);
        }
      });
    });

    // 3. Listen for answers
    const unsubscribeAnswers = onSnapshot(collection(mySignalingRef, 'answers'), (snapshot) => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const peerUid = change.doc.id;
          const peer = peersRef.current[peerUid];
          
          if (peer && peer.signalingState !== 'stable') {
            try {
              await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (e) {
              console.error('Error handling answer:', e);
            }
          }
          deleteDoc(change.doc.ref);
        }
      });
    });

    // 4. Listen for ICE candidates
    const unsubscribeCandidates = onSnapshot(collection(mySignalingRef, 'candidates'), (snapshot) => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const peerUid = data.from;
          const peer = peersRef.current[peerUid];
          
          if (peer) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.error('Error adding ICE candidate:', e);
            }
          }
          deleteDoc(change.doc.ref);
        }
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOffers();
      unsubscribeAnswers();
      unsubscribeCandidates();
      setDoc(mySignalingRef, { online: false, timestamp: Date.now() }, { merge: true });
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
      setRemoteStreams({});
    };
  }, [roomId, user, isVoiceConnected, stream]);

  return { remoteStreams };
}
