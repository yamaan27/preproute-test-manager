import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Trash2, CheckCircle2, Upload, Plus, Save, Undo2 } from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { getApiError, questionsApi, testsApi, catalogApi } from "../api/client";
import { FormField } from "../components/FormField";
import type { Question, Test, Topic, SubTopic } from "../types";
import { asName, asNames, questionIdsFromTest } from "../utils/display";

const questionSchema = z.object({
  question: z.string().min(5, "Question text is required"),
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  option4: z.string().min(1, "Option 4 is required"),
  correct_option: z.enum(["option1", "option2", "option3", "option4"]),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  sub_topic: z.string().optional(),
  media_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});

type QuestionValues = z.infer<typeof questionSchema>;

const questionDefaults: QuestionValues = {
  question: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correct_option: "option1",
  explanation: "",
  difficulty: "medium",
  topic: "",
  sub_topic: "",
  media_url: "",
};

const draftKey = (testId: string) => `preproute_questions_${testId}`;

export function AddQuestionsPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic dropdown selector lists loaded from API matching Figma question details panel
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [availableSubTopics, setAvailableSubTopics] = useState<SubTopic[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: questionDefaults,
  });

  useEffect(() => {
    if (!testId) return;
    const load = async () => {
      setError("");
      try {
        const loaded = await testsApi.get(testId);
        setTest(loaded);

        // Fetch catalog elements based on subject ID
        const subjectId = typeof loaded.subject === "string" ? loaded.subject : loaded.subject?.id;
        if (subjectId) {
          const topicList = await catalogApi.topics(subjectId);
          setAvailableTopics(topicList);

          const topicIds = loaded.topics?.map((t) => (typeof t === "string" ? t : t.id)) || [];
          if (topicIds.length) {
            try {
              const subTopicList = await catalogApi.subTopicsForTopics(topicIds);
              setAvailableSubTopics(subTopicList);
            } catch {
              const nested = await Promise.all(
                topicIds.map((topicId) => catalogApi.subTopics(topicId).catch(() => [])),
              );
              setAvailableSubTopics(nested.flat());
            }
          }
        }

        const inlineQuestions = (loaded.questions ?? []).filter(
          (question): question is Question => typeof question !== "string",
        );
        const ids = questionIdsFromTest(loaded);
        const remoteQuestions = ids.length ? await questionsApi.fetchBulk(ids) : [];
        const localRaw = localStorage.getItem(draftKey(testId));
        const localQuestions = localRaw ? (JSON.parse(localRaw) as Question[]) : [];
        setQuestions([...remoteQuestions, ...inlineQuestions, ...localQuestions]);
      } catch (apiError) {
        setError(getApiError(apiError));
      }
    };
    void load();
  }, [testId]);

  useEffect(() => {
    if (testId) {
      localStorage.setItem(draftKey(testId), JSON.stringify(questions.filter((item) => !item.id)));
    }
  }, [questions, testId]);

  const addQuestion = (values: QuestionValues) => {
    const next: Question = {
      ...values,
      type: "mcq",
      test_id: testId,
      subject: asName(test?.subject),
      media_url: values.media_url || undefined,
    };
    if (editingIndex === null) {
      setQuestions((current) => [...current, next]);
      setNotice("Question added to draft list.");
    } else {
      setQuestions((current) =>
        current.map((question, index) =>
          index === editingIndex ? { ...question, ...next, id: question.id } : question,
        ),
      );
      setEditingIndex(null);
      setNotice("Question updated successfully.");
    }
    reset(questionDefaults);
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    reset({
      question: question.question,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      correct_option: question.correct_option,
      explanation: question.explanation ?? "",
      difficulty: question.difficulty ?? "medium",
      topic: question.topic ?? "",
      sub_topic: question.sub_topic ?? "",
      media_url: question.media_url ?? "",
    });
    setEditingIndex(index);
  };

  const removeQuestion = (index: number) => {
    const name = questions[index].question.substring(0, 30);
    const confirmed = window.confirm(`Delete question: "${name}..."?`);
    if (!confirmed) return;
    setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      reset(questionDefaults);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const startNewMCQ = () => {
    setEditingIndex(null);
    reset(questionDefaults);
  };

  const handleCSVUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));

      const parsedQuestions: Question[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length < 5) continue;

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = cols[index] || "";
        });

        let correct: Question["correct_option"] = "option1";
        const co = (row.correct_option || "").toLowerCase();
        if (co === "option1" || co === "option2" || co === "option3" || co === "option4") {
          correct = co as Question["correct_option"];
        } else if (co === "a" || co === "1" || co === "option 1") {
          correct = "option1";
        } else if (co === "b" || co === "2" || co === "option 2") {
          correct = "option2";
        } else if (co === "c" || co === "3" || co === "option 3") {
          correct = "option3";
        } else if (co === "d" || co === "4" || co === "option 4") {
          correct = "option4";
        }

        parsedQuestions.push({
          type: "mcq",
          question: row.question || "Imported CSV question",
          option1: row.option1 || "",
          option2: row.option2 || "",
          option3: row.option3 || "",
          option4: row.option4 || "",
          correct_option: correct,
          explanation: row.explanation || "",
          difficulty: row.difficulty || "medium",
          subject: row.subject || asName(test?.subject),
          topic: row.topic || "",
          sub_topic: row.sub_topic || "",
          test_id: testId,
        });
      }

      if (parsedQuestions.length) {
        setQuestions((current) => [...current, ...parsedQuestions]);
        setNotice(`Successfully imported ${parsedQuestions.length} questions from CSV.`);
      } else {
        setError("Could not parse any valid questions from the CSV file.");
      }
    };
    reader.readAsText(file);
    if (event.target) {
      event.target.value = "";
    }
  };

  const saveAndContinue = async () => {
    if (!questions.length) {
      setError("Add at least one question before continuing.");
      return;
    }
    setError("");
    setNotice("");
    try {
      const unsaved = questions.filter((question) => !question.id);
      const normalizedUnsaved = unsaved.map((question) => ({
        ...question,
        subject: question.subject || asName(test?.subject),
        test_id: question.test_id || testId,
      }));
      const saved = normalizedUnsaved.length ? await questionsApi.bulkCreate(normalizedUnsaved) : [];
      const allQuestions = [...questions.filter((question) => question.id), ...saved];
      const questionIds = allQuestions
        .map((question) => question.id)
        .filter((id): id is string => Boolean(id));
      if (questionIds.length) {
        await testsApi.update(testId, {
          questions: questionIds,
          total_questions: allQuestions.length,
          total_marks:
            (test?.correct_marks ?? 0) > 0
              ? allQuestions.length * (test?.correct_marks ?? 0)
              : test?.total_marks,
        });
      }
      localStorage.removeItem(draftKey(testId));
      navigate(`/tests/${testId}/preview`);
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const summary = useMemo(
    () => [
      ["Subject", asName(test?.subject)],
      ["Topics", asNames(test?.topics)],
      ["Difficulty", test?.difficulty ?? "Medium"],
      ["Marks", `${test?.correct_marks ?? 0} / ${test?.wrong_marks ?? 0}`],
    ],
    [test],
  );

  const selectedCorrectOption = watch("correct_option");

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <span>Test Creation</span> &gt; <span>Create Test</span> &gt; <span>Chapter Wise</span> &gt;{" "}
            <span style={{ color: "#2563eb" }}>Question Editor</span>
          </p>
          <h1>{test?.name ?? "Add questions"}</h1>
        </div>
        <button className="primary-button" type="button" onClick={saveAndContinue}>
          Save & Continue <ArrowRight size={18} />
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {notice ? <div className="alert success">{notice}</div> : null}

      <div className="summary-strip">
        {summary.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="question-builder-layout">
        {/* Left Side Question Checklist */}
        <aside className="question-checklist">
          <div
            className="section-title"
            style={{ paddingBottom: "8px", borderBottom: "1px solid #edf0f5", marginBottom: "4px" }}
          >
            <h2>Question Navigation</h2>
            <span
              style={{
                minWidth: "26px",
                height: "24px",
                display: "inline-grid",
                placeItems: "center",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {questions.length}
            </span>
          </div>
          {questions.length ? (
            questions.map((question, index) => {
              const isActive = editingIndex === index;
              return (
                <div
                  key={`${question.id ?? question.question}-${index}`}
                  className={isActive ? "checklist-item active" : "checklist-item"}
                  onClick={() => editQuestion(index)}
                >
                  <div className="checklist-item-title">
                    <strong>Question {index + 1}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <div className="checklist-item-status">
                      <CheckCircle2 size={16} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(index);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        padding: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty-state" style={{ padding: "12px", fontSize: "13px" }}>
              No questions added.
            </p>
          )}

          <button
            type="button"
            className="checklist-item"
            style={{
              justifyContent: "center",
              borderStyle: "dashed",
              borderColor: "#2563eb",
              color: "#2563eb",
              background: "transparent",
              fontWeight: 600,
              marginTop: "8px",
            }}
            onClick={startNewMCQ}
          >
            <Plus size={16} /> Add MCQ
          </button>
        </aside>

        {/* Right Side Question Editor */}
        <div className="question-editor-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #edf0f5",
              paddingBottom: "12px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              {editingIndex === null ? `Question ${questions.length + 1}` : `Question ${editingIndex + 1}`}
            </h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleCSVUpload}
              />
              <button type="button" className="csv-upload-btn" onClick={() => fileInputRef.current?.click()}>
                <Upload size={15} /> Import CSV
              </button>
              {editingIndex !== null && (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ minHeight: "32px", fontSize: "12px" }}
                  onClick={startNewMCQ}
                >
                  <Undo2 size={14} /> Add New
                </button>
              )}
            </div>
          </div>

          <form className="question-form" onSubmit={handleSubmit(addQuestion)} style={{ gap: "20px" }}>
            <FormField label="Type Question Here" error={errors.question?.message}>
              <textarea rows={4} {...register("question")} placeholder="What is the gravitational constant..." />
            </FormField>

            <div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#344054",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                Type the options below and select the correct answer:
              </span>
              <div className="figma-options-list">
                {(["option1", "option2", "option3", "option4"] as const).map((optKey, idx) => (
                  <div key={optKey} className="figma-option-row">
                    <label className="figma-option-radio-label" title="Mark as correct answer">
                      <input
                        type="radio"
                        name="correct_option_radio"
                        checked={selectedCorrectOption === optKey}
                        onChange={() => setValue("correct_option", optKey)}
                      />
                    </label>
                    <div className="figma-option-input-wrap">
                      <FormField label={`Option ${idx + 1}`} error={errors[optKey]?.message}>
                        <input {...register(optKey)} placeholder={`Type option ${idx + 1}`} />
                      </FormField>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue(optKey, "");
                        if (selectedCorrectOption === optKey) {
                          setValue("correct_option", "option1");
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        marginTop: "24px",
                      }}
                      title="Clear Option"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "12px", borderStyle: "dashed", borderColor: "#cbd5e1" }}
                onClick={() => alert("The current test supports up to 4 standard options (MCQ).")}
              >
                + Add Option
              </button>
            </div>

            <div className="two-grid">
              <FormField label="Difficulty" error={errors.difficulty?.message}>
                <select {...register("difficulty")}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </FormField>
              <div style={{ display: "none" }}>
                <input {...register("correct_option")} />
              </div>
            </div>

            <div className="three-grid" style={{ marginTop: "12px" }}>
              <FormField label="Layout">
                <select>
                  <option value="vertical">Vertical</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="grid">Grid (2x2)</option>
                </select>
              </FormField>

              <FormField label="Topic" error={errors.topic?.message}>
                <select {...register("topic")}>
                  <option value="">Select Topic</option>
                  {availableTopics.map((topic) => (
                    <option key={topic.id} value={topic.name}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Sub Topic" error={errors.sub_topic?.message}>
                <select {...register("sub_topic")}>
                  <option value="">Select Sub-topic</option>
                  {availableSubTopics.map((subTopic) => (
                    <option key={subTopic.id} value={subTopic.name}>
                      {subTopic.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Media URL (optional)" error={errors.media_url?.message}>
              <input {...register("media_url")} placeholder="https://..." />
            </FormField>

            <FormField label="Add Solution / Explanation (optional)" error={errors.explanation?.message}>
              <textarea rows={3} {...register("explanation")} placeholder="Provide detailed solution steps..." />
            </FormField>

            <div
              className="form-actions"
              style={{ borderTop: "1px solid #edf0f5", paddingTop: "16px", marginTop: "8px" }}
            >
              <button className="primary-button" type="submit" disabled={isSubmitting} style={{ marginLeft: "auto" }}>
                {editingIndex === null ? <Plus size={18} /> : <Save size={18} />}
                {editingIndex === null ? "Add Next Question" : "Save Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
