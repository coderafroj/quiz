"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { createQuiz, updateQuiz } from "@/lib/quizzes";
import { useAuth } from "@/context/AuthContext";
import type { Quiz, QuizQuestionItem, QuizVisibility } from "@/lib/types";

const LANGUAGES = ["English", "Hindi", "Hinglish", "Spanish", "French", "Arabic", "Other"];

function newQuestion(): QuizQuestionItem {
  return {
    id: crypto.randomUUID(),
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    timeLimit: 20,
    points: 1000,
  };
}

export default function QuizBuilder({ existingQuiz }: { existingQuiz?: Quiz }) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(existingQuiz?.title || "");
  const [description, setDescription] = useState(existingQuiz?.description || "");
  const [language, setLanguage] = useState(existingQuiz?.language || "English");
  const [category, setCategory] = useState(existingQuiz?.category || "General Knowledge");
  const [visibility, setVisibility] = useState<QuizVisibility>(existingQuiz?.visibility || "unlisted");
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(
    existingQuiz?.questions?.length ? existingQuiz.questions : [newQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(id: string, patch: Partial<QuizQuestionItem>) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function updateOption(id: string, idx: number, value: string) {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options];
        options[idx] = value;
        return { ...q, options };
      })
    );
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, newQuestion()]);
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user || !profile) {
      setError("You must be signed in.");
      return;
    }
    if (questions.some((q) => !q.text.trim() || q.options.some((o) => !o.trim()))) {
      setError("Every question needs text and all 4 options filled in.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ownerId: user.uid,
        ownerName: profile.displayName,
        title,
        description,
        language,
        category,
        questions,
        visibility,
      };
      if (existingQuiz) {
        await updateQuiz(existingQuiz.id, payload);
        router.push("/dashboard");
      } else {
        const id = await createQuiz(payload);
        router.push(`/dashboard/${id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto pb-20">
      <div className="card-frame p-6 mb-6 space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-2">
          Quiz Details
        </h2>
        <div>
          <label className="block font-mono text-xs text-muted uppercase mb-1">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. World Capitals Challenge"
            className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:border-fg outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted uppercase mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What's this quiz about?"
            className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:border-fg outline-none resize-none"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-xs text-muted uppercase mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-surface border border-border px-3 py-2.5 text-sm focus:border-fg outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-xs text-muted uppercase mb-1">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:border-fg outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted uppercase mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as QuizVisibility)}
              className="w-full bg-surface border border-border px-3 py-2.5 text-sm focus:border-fg outline-none"
            >
              <option value="unlisted">Unlisted (link only)</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="card-frame p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 font-mono text-xs uppercase text-muted">
                <GripVertical size={14} /> Question {qIdx + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-muted hover:text-fg transition-colors"
                  aria-label="Remove question"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <textarea
              required
              value={q.text}
              onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              placeholder="Question text"
              rows={2}
              className="w-full bg-transparent border border-border px-3 py-2.5 text-sm mb-3 focus:border-fg outline-none resize-none"
            />

            <div className="space-y-2 mb-3">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === oIdx}
                    onChange={() => updateQuestion(q.id, { correctIndex: oIdx })}
                  />
                  <input
                    required
                    value={opt}
                    onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                    placeholder={`Option ${oIdx + 1}`}
                    className="flex-1 bg-transparent border border-border px-3 py-2 text-sm focus:border-fg outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block font-mono text-[11px] text-muted uppercase mb-1">
                  Time Limit (sec)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={q.timeLimit}
                  onChange={(e) => updateQuestion(q.id, { timeLimit: Number(e.target.value) })}
                  className="w-28 bg-transparent border border-border px-2 py-1.5 text-sm focus:border-fg outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-muted uppercase mb-1">
                  Points
                </label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={q.points}
                  onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                  className="w-28 bg-transparent border border-border px-2 py-1.5 text-sm focus:border-fg outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="w-full mt-4 flex items-center justify-center gap-2 py-4 border border-dashed border-border text-muted hover:border-fg hover:text-fg transition-colors text-sm font-mono uppercase"
      >
        <Plus size={16} /> Add Question
      </button>

      {error && <p className="text-fg-dim text-xs font-mono mt-4">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-fg text-bg font-semibold text-sm uppercase tracking-wide hover:bg-fg-dim transition-colors disabled:opacity-60"
      >
        <Save size={16} />
        {saving ? "Saving…" : existingQuiz ? "Save Changes" : "Create Quiz"}
      </button>
    </form>
  );
}
