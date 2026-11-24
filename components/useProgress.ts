"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLocalProgress, subscribeToProgress, type QuizProgress } from "@/lib/progress";

/** Progress map keyed by quizId — instant from localStorage, then synced from Firestore when signed in. */
export function useProgress(): Record<string, QuizProgress> {
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, QuizProgress>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (SSR has no storage)
    setMap(getLocalProgress());
    if (!user) return;
    return subscribeToProgress(user.uid, setMap);
  }, [user]);

  return map;
}
