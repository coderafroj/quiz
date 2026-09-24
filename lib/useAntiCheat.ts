"use client";

import { useEffect, useState } from "react";

/**
 * Soft anti-cheat for a question screen. This can never fully stop someone
 * determined to cheat (a second device always works), but it raises the bar
 * against the common case: selecting the question text and pasting it into
 * a search engine or an AI chat mid-quiz.
 *
 * - Disables copy / right-click / a few devtools shortcuts while `active`.
 * - Flags (but does not block) tab switches and window blurs, so the quiz
 *   owner can see a "possible cheating" signal against a result.
 *
 * `active` should only be true while a question is actually being shown —
 * keeping it off during name-entry/results avoids false positives from
 * normal input-field focus changes.
 */
export function useAntiCheat(active: boolean) {
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    function flag(msg: string) {
      setViolations((v) => v + 1);
      setWarning(msg);
    }

    function onVisibility() {
      if (document.hidden) flag("Tab switch detected — please stay on this page while playing.");
    }
    function onBlur() {
      flag("You left the quiz window — this has been noted.");
    }
    function onCopy(e: ClipboardEvent) {
      e.preventDefault();
      flag("Copying questions during the quiz isn't allowed.");
    }
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    function onSelectStart(e: Event) {
      e.preventDefault();
    }
    function onDragStart(e: DragEvent) {
      e.preventDefault();
    }
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const blocked =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && ["c", "u", "s", "p"].includes(key));
      if (blocked) {
        e.preventDefault();
        flag("That shortcut is disabled during the quiz.");
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  useEffect(() => {
    if (!warning) return;
    const t = setTimeout(() => setWarning(null), 3000);
    return () => clearTimeout(t);
  }, [warning]);

  return { violations, warning };
}

/** Shuffles a question's options for display, remapping correctIndex to match. Pure — returns a new object, never mutates the original. */
export function shuffleQuestionOptions<
  T extends { options: string[]; correctIndex: number },
>(question: T): T {
  const order = question.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...question,
    options: order.map((i) => question.options[i]),
    correctIndex: order.indexOf(question.correctIndex),
  };
}
