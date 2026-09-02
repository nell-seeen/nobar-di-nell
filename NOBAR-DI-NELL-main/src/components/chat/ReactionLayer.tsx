import React, { useEffect, useState } from 'react';
import { ref, onChildAdded, query, orderByChild, startAt, limitToLast } from 'firebase/database';
import { rtdb } from '../../firebase/config';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export default function ReactionLayer({ roomId }: { roomId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    // Only listen for new reactions from this point forward
    const now = Date.now();
    const reactionsRef = query(
      ref(rtdb, `rooms/${roomId}/reactions`),
      orderByChild('timestamp'),
      startAt(now),
      limitToLast(10)
    );

    const unsubscribe = onChildAdded(reactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const newReaction: Reaction = {
        id: snapshot.key as string,
        emoji: data.emoji,
        // Randomize starting position slightly
        x: Math.random() * 80 + 10, // 10% to 90% of screen width
        y: Math.random() * 20 + 80, // Start near the bottom
      };

      setReactions((prev) => {
        // Prevent duplicate keys if listener fires twice
        if (prev.some(r => r.id === newReaction.id)) return prev;
        return [...prev, newReaction];
      });

      // Remove after animation completes (2s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2000);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute text-4xl animate-float-up"
          style={{
            left: `${reaction.x}%`,
            bottom: '10%',
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}
