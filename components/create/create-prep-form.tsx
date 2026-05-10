"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { ResumeUploadSummary, UserPreferences } from "@/types/prep";

const experienceLevels = ["Fresher", "Intern", "1 Year", "2 Years"];
const preparationDays = [7, 15, 30];
const difficulties = ["Beginner", "Intermediate", "Advanced", "Mixed"];
const popularCompanies = ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Zoho"];
const popularRoles = ["Frontend Developer", "SDE", "Data Analyst", "QA Engineer"];
const skillSuggestions = ["React", "JavaScript", "DSA", "SQL", "Node.js", "CSS", "Aptitude"];
const draftStorageKey = "placement-prep-ai:create-draft";

export function CreatePrepForm({ initialPreferences }: { initialPreferences?: UserPreferences | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUpload, setResumeUpload] = useState<ResumeUploadSummary | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    role: "",
    jobDescription: "",
    experienceLevel: "Fresher",
    preparationDays: initialPreferences?.defaultPreparationDays ?? 15,
    knownSkills: "",
    difficulty: initialPreferences?.defaultDifficulty ?? "Mixed"
  });

  const selectedSkills = useMemo(
    () =>
      form.knownSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [form.knownSkills]
  );

  const completionScore = useMemo(() => {
    let score = 0;
    if (form.companyName.trim()) score += 20;
    if (form.role.trim()) score += 20;
    if (form.jobDescription.trim().length >= 60) score += 30;
    if (selectedSkills.length > 0) score += 15;
    if (form.difficulty) score += 15;
    return score;
  }, [form.companyName, form.role, form.jobDescription, form.difficulty, selectedSkills.length]);

  const prepSignal =
    form.preparationDays === 7
      ? "Fast-track pack with high-priority revision."
      : form.preparationDays === 15
        ? "Balanced pack with solid revision and mock practice."
      : "Deeper pack with more room for category expansion.";

  useEffect(() => {
    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { form: typeof form; resumeUpload?: ResumeUploadSummary | null };
      setForm(parsed.form);
      setResumeUpload(parsed.resumeUpload ?? null);
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(draftStorageKey, JSON.stringify({ form, resumeUpload }));
  }, [form, resumeUpload]);

  function appendSkill(skill: string) {
    setForm((current) => {
      const existing = current.knownSkills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (existing.includes(skill)) {
        return current;
      }

      return {
        ...current,
        knownSkills: [...existing, skill].join(", ")
      };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/prep-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          resumeUploadId: resumeUpload?._id,
          resumeFileName: resumeUpload?.fileName,
          projectHighlights: resumeUpload?.projectHighlights ?? [],
          knownSkills: form.knownSkills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create prep pack");
      }

      window.localStorage.removeItem(draftStorageKey);
      showToast({
        title: "Prep pack ready",
        description: "Your pack has been generated. Opening it now.",
        tone: "success"
      });
      router.push(`/prep/${data.prepPackId}`);
      router.refresh();
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Something went wrong";
      setError(message);
      showToast({
        title: "Could not generate prep pack",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeUpload(file: File) {
    setUploadingResume(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/resume", {
        method: "POST",
        body
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to upload resume");
      }

      setResumeUpload(data);
      showToast({
        title: "Resume uploaded",
        description: "Project highlights were extracted and will guide question generation.",
        tone: "success"
      });
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Resume upload failed";
      setError(message);
      showToast({
        title: "Resume upload failed",
        description: message,
        tone: "error"
      });
    } finally {
      setUploadingResume(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-white/90 to-sand p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ocean">Prep Readiness</p>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              The stronger your input, the more focused the question categories and roadmap become.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm">
            {completionScore}% ready
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-ocean transition-all"
            style={{ width: `${completionScore}%` }}
          />
        </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/55">
            <span>Your draft is saved automatically on this device.</span>
            <button
            type="button"
            onClick={() => {
              setForm({
                companyName: "",
                role: "",
                jobDescription: "",
                experienceLevel: "Fresher",
                preparationDays: initialPreferences?.defaultPreparationDays ?? 15,
                knownSkills: "",
                difficulty: initialPreferences?.defaultDifficulty ?? "Mixed"
              });
              setResumeUpload(null);
              window.localStorage.removeItem(draftStorageKey);
            }}
            className="rounded-full bg-white px-3 py-2 font-semibold text-ink/75"
          >
            Clear draft
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Field label="Company Name" htmlFor="company-name">
          <div className="space-y-3">
            <input
              id="company-name"
              aria-label="Company Name"
              required
              value={form.companyName}
              onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean"
              placeholder="TCS"
            />
            <ChipRow
              items={popularCompanies}
              onPick={(value) => setForm((current) => ({ ...current, companyName: value }))}
            />
          </div>
        </Field>
        <Field label="Role" htmlFor="role">
          <div className="space-y-3">
            <input
              id="role"
              aria-label="Role"
              required
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
              placeholder="Frontend Developer"
            />
            <ChipRow
              items={popularRoles}
              onPick={(value) => setForm((current) => ({ ...current, role: value }))}
            />
          </div>
        </Field>
      </div>

      <Field label="Job Description" htmlFor="job-description">
        <div className="rounded-[1.75rem] border border-black/8 bg-white p-3">
          <textarea
            id="job-description"
            aria-label="Job Description"
            required
            rows={8}
            value={form.jobDescription}
            onChange={(event) => setForm((current) => ({ ...current, jobDescription: event.target.value }))}
            className="w-full rounded-[1.2rem] bg-transparent px-2 py-2 outline-none transition"
            placeholder="Paste the role description here..."
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-2 pt-3">
            <p className="text-xs text-ink/55">
              Better results usually come from 4-8 lines that mention responsibilities, skills, and tools.
            </p>
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink/65">
              {form.jobDescription.trim().length} chars
            </span>
          </div>
        </div>
      </Field>

      <div className="grid gap-6 lg:grid-cols-3">
        <Field label="Experience Level">
          <SegmentedControl
            items={experienceLevels}
            selected={form.experienceLevel}
            onChange={(value) => setForm((current) => ({ ...current, experienceLevel: value }))}
          />
        </Field>
        <Field label="Preparation Days">
          <SegmentedControl
            items={preparationDays.map(String)}
            selected={String(form.preparationDays)}
            onChange={(value) =>
              setForm((current) => ({ ...current, preparationDays: Number(value) as 7 | 15 | 30 }))
            }
          />
        </Field>
        <Field label="Target Difficulty">
          <SegmentedControl
            items={difficulties}
            selected={form.difficulty}
            onChange={(value) =>
              setForm((current) => ({ ...current, difficulty: value as UserPreferences["defaultDifficulty"] }))
            }
          />
        </Field>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Field label="Known Skills" htmlFor="known-skills">
          <div className="space-y-3">
            <input
              id="known-skills"
              aria-label="Known Skills"
              value={form.knownSkills}
              onChange={(event) => setForm((current) => ({ ...current, knownSkills: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-ocean"
              placeholder="React, JavaScript, CSS"
            />
            <ChipRow items={skillSuggestions} onPick={appendSkill} />
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-sand px-3 py-2 text-sm font-medium text-ink/75">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Field>
        <Field label="Pack Preview">
          <div className="soft-grid rounded-[1.75rem] border border-black/8 bg-white/80 p-5">
            <p className="text-lg font-bold text-ink">
              {form.companyName || "Your company"} · {form.role || "Your role"}
            </p>
            <p className="mt-3 text-sm leading-7 text-ink/70">{prepSignal}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PreviewStat label="Skills captured" value={String(selectedSkills.length || 0)} />
              <PreviewStat label="Difficulty" value={form.difficulty} />
              <PreviewStat label="Experience" value={form.experienceLevel} />
              <PreviewStat label="Roadmap length" value={`${form.preparationDays} days`} />
            </div>
            <p className="mt-4 text-xs text-ink/55">
              You’ll get categorized questions, likely follow-ups, common mistakes, and a study roadmap.
            </p>
          </div>
        </Field>
      </div>

      <Field label="Resume / Project Upload">
        <div className="rounded-[1.75rem] border border-black/8 bg-white/85 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-ink/70">
              Upload a PDF, DOCX, or TXT resume so the app can generate project-based interview questions too.
            </p>
            <label className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
              {uploadingResume ? "Uploading..." : "Upload Resume"}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                disabled={uploadingResume}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleResumeUpload(file);
                  }
                }}
              />
            </label>
          </div>
          {resumeUpload && (
            <div className="mt-5 rounded-2xl bg-sand p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink">{resumeUpload.fileName}</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ocean">
                  Uploaded
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-ink/70">{resumeUpload.extractedTextPreview}</p>
              {resumeUpload.projectHighlights.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resumeUpload.projectHighlights.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink/70">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Field>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading || completionScore < 50} className="min-w-52">
          {loading ? "Building Your Prep Pack..." : "Generate Prep Pack"}
        </Button>
        <p className="text-sm text-ink/60">
          Built category-wise for speed, better focus, and smoother study sessions.
        </p>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipRow({ items, onPick }: { items: string[]; onPick: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full bg-sand px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-ink hover:text-white"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function SegmentedControl({
  items,
  selected,
  onChange
}: {
  items: string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={
            item === selected
              ? "rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
              : "rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink/70 ring-1 ring-black/10 transition hover:bg-sand"
          }
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
