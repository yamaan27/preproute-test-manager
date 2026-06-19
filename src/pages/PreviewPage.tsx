import { ArrowLeft, CheckCircle2, Edit3, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiError, questionsApi, testsApi } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import { FormField } from "../components/FormField";
import type { Question, Test } from "../types";
import { asName, asNames, questionIdsFromTest } from "../utils/display";

const optionLabels: Record<string, string> = {
  option1: "A",
  option2: "B",
  option3: "C",
  option4: "D",
};

export function PreviewPage() {
  const { testId = "" } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  
  // Publish configuration states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"publish" | "schedule">("publish");
  const [liveHours, setLiveHours] = useState("24");
  const [availability, setAvailability] = useState("Always Available");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [liveUntil, setLiveUntil] = useState("Always Available");

  useEffect(() => {
    if (!testId) return;
    const load = async () => {
      setError("");
      try {
        const loaded = await testsApi.get(testId);
        setTest(loaded);
        const inlineQuestions = (loaded.questions ?? []).filter(
          (question): question is Question => typeof question !== "string",
        );
        const ids = questionIdsFromTest(loaded);
        const remoteQuestions = ids.length ? await questionsApi.fetchBulk(ids) : [];
        setQuestions([...remoteQuestions, ...inlineQuestions]);
      } catch (apiError) {
        setError(getApiError(apiError));
      }
    };
    void load();
  }, [testId]);

  const confirmPublish = async () => {
    setPublishing(true);
    setError("");
    try {
      const status = modalMode === "publish" ? "live" : "scheduled";
      await testsApi.update(testId, { status });
      setPublished(true);
      setShowModal(false);
      window.setTimeout(() => navigate("/dashboard"), 1200);
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            <span>Test Creation</span> &gt; <span>Create Test</span> &gt; <span>Chapter Wise</span> &gt; <span style={{ color: "#2563eb" }}>Preview &amp; Publish</span>
          </p>
          <h1>{test?.name ?? "Test preview"}</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to={`/tests/${testId}/edit`}>
            <Edit3 size={18} /> Edit test
          </Link>
          <Link className="secondary-button" to={`/tests/${testId}/questions`}>
            <ArrowLeft size={18} /> Edit questions
          </Link>
          <button className="primary-button" type="button" onClick={() => setShowModal(true)}>
            <Send size={18} /> Publish Test
          </button>
        </div>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      {published ? (
        <div className="alert success">
          <CheckCircle2 size={18} /> Test {modalMode === "publish" ? "published" : "scheduled"} successfully. Redirecting to dashboard...
        </div>
      ) : null}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Publish settings</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="tabs" style={{ marginBottom: "12px" }}>
              <button
                type="button"
                className={modalMode === "publish" ? "tab active" : "tab"}
                onClick={() => setModalMode("publish")}
              >
                Publish Now
              </button>
              <button
                type="button"
                className={modalMode === "schedule" ? "tab active" : "tab"}
                onClick={() => setModalMode("schedule")}
              >
                Schedule Publish
              </button>
            </div>

            <div className="modal-body">
              {modalMode === "publish" ? (
                <>
                  <FormField label="Live (hr)">
                    <input
                      type="number"
                      value={liveHours}
                      onChange={(e) => setLiveHours(e.target.value)}
                      placeholder="e.g. 24"
                    />
                  </FormField>
                  <FormField label="Availability">
                    <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                      <option value="Always Available">Always Available</option>
                      <option value="3 Days">3 Days</option>
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                      <option value="Custom Duration">Custom Duration</option>
                    </select>
                  </FormField>
                </>
              ) : (
                <>
                  <div className="two-grid">
                    <FormField label="Select Date">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </FormField>
                    <FormField label="Select Time">
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <FormField label="Live (until)">
                    <select value={liveUntil} onChange={(e) => setLiveUntil(e.target.value)}>
                      <option value="Always Available">Always Available</option>
                      <option value="3 Days">3 Days</option>
                      <option value="1 Week">1 Week</option>
                      <option value="2 Weeks">2 Weeks</option>
                      <option value="1 Month">1 Month</option>
                    </select>
                  </FormField>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={publishing}
                onClick={confirmPublish}
              >
                {modalMode === "publish"
                  ? (publishing ? "Publishing..." : "Publish")
                  : (publishing ? "Scheduling..." : "Schedule")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="preview-grid">
        <article className="overview-panel">
          <div className="section-title">
            <h2>Overview</h2>
            <StatusPill status={test?.status} />
          </div>
          <dl className="details-list">
            <div><dt>Subject</dt><dd>{asName(test?.subject)}</dd></div>
            <div><dt>Topics</dt><dd>{asNames(test?.topics)}</dd></div>
            <div><dt>Difficulty</dt><dd>{test?.difficulty ?? "Medium"}</dd></div>
            <div><dt>Time</dt><dd>{test?.total_time ?? 0} minutes</dd></div>
            <div><dt>Marks</dt><dd>{test?.total_marks ?? 0}</dd></div>
            <div><dt>Questions</dt><dd>{questions.length || test?.total_questions || 0}</dd></div>
            <div><dt>Marking</dt><dd>+{test?.correct_marks ?? 0} / {test?.wrong_marks ?? 0} / {test?.unattempt_marks ?? 0}</dd></div>
          </dl>
        </article>
        <div className="preview-questions">
          <div className="section-title">
            <h2>Questions</h2>
            <span>{questions.length}</span>
          </div>
          {questions.length ? (
            questions.map((question, index) => (
              <article className="preview-question" key={`${question.id ?? question.question}-${index}`}>
                <h3>{index + 1}. {question.question}</h3>
                <div className="options-grid">
                  {(["option1", "option2", "option3", "option4"] as const).map((option) => (
                    <div
                      className={question.correct_option === option ? "option correct" : "option"}
                      key={option}
                    >
                      <span>{optionLabels[option]}</span>
                      {question[option]}
                    </div>
                  ))}
                </div>
                {question.explanation ? <p>{question.explanation}</p> : null}
              </article>
            ))
          ) : (
            <p className="empty-state">No questions are attached to this test yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
