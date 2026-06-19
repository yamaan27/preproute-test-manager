import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Save, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { catalogApi, getApiError, testsApi } from "../api/client";
import { FormField } from "../components/FormField";
import type { Subject, SubTopic, TestPayload, Topic } from "../types";

function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  error,
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value: string) => {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(next);
  };

  const selectedLabels = options
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  const displayValue = selectedLabels.length
    ? selectedLabels.join(", ")
    : placeholder;

  return (
    <FormField label={label} error={error}>
      <div className="multiselect-container" ref={containerRef}>
        <button
          type="button"
          className="multiselect-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "90%"
          }}>
            {displayValue}
          </span>
          <ChevronDown size={16} style={{ color: "#64748b" }} />
        </button>
        {isOpen && (
          <div className="multiselect-dropdown">
            {options.length ? (
              options.map((option) => {
                const isChecked = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className="multiselect-option"
                    onClick={() => handleToggle(option.value)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                    />
                    <span>{option.label}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "8px 12px", color: "#64748b", fontSize: "13px" }}>
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    </FormField>
  );
}

const testSchema = z.object({
  name: z.string().min(3, "Test name must be at least 3 characters"),
  subject: z.string().min(1, "Subject is required"),
  type: z.string().min(1, "Test type is required"),
  topics: z.array(z.string()).min(1, "Select at least one topic"),
  sub_topics: z.array(z.string()),
  difficulty: z.string().min(1, "Difficulty is required"),
  correct_marks: z.coerce.number().min(0, "Correct marks must be zero or more"),
  wrong_marks: z.coerce.number().max(0, "Wrong marks must be zero or negative"),
  unattempt_marks: z.coerce.number(),
  total_time: z.coerce.number().min(1, "Total time is required"),
  total_marks: z.coerce.number().min(1, "Total marks is required"),
  total_questions: z.coerce.number().min(1, "Total questions is required"),
});

type TestFormValues = z.infer<typeof testSchema>;

const defaults: TestFormValues = {
  name: "",
  subject: "",
  type: "chapterwise",
  topics: [],
  sub_topics: [],
  difficulty: "medium",
  correct_marks: 4,
  wrong_marks: -1,
  unattempt_marks: 0,
  total_time: 60,
  total_marks: 100,
  total_questions: 25,
};

export function TestFormPage() {
  const { testId } = useParams();
  const isEdit = Boolean(testId);
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedTest, setLoadedTest] = useState<Awaited<ReturnType<typeof testsApi.get>> | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: defaults,
  });

  const selectedSubject = watch("subject");
  const selectedTopics = watch("topics");
  const subjectField = register("subject");

  useEffect(() => {
    const load = async () => {
      try {
        const subjectList = await catalogApi.subjects();
        setSubjects(subjectList);
      } catch (apiError) {
        setError(getApiError(apiError));
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!testId) return;
    const loadTest = async () => {
      try {
        const test = await testsApi.get(testId);
        setLoadedTest(test);
        reset({
          ...defaults,
          name: test.name ?? "",
          type: test.type ?? defaults.type,
          subject: typeof test.subject === "string" ? "" : test.subject?.id ?? "",
          topics: [],
          sub_topics: [],
          difficulty: test.difficulty ?? defaults.difficulty,
          correct_marks: test.correct_marks ?? defaults.correct_marks,
          wrong_marks: test.wrong_marks ?? defaults.wrong_marks,
          unattempt_marks: test.unattempt_marks ?? defaults.unattempt_marks,
          total_time: test.total_time ?? defaults.total_time,
          total_marks: test.total_marks ?? defaults.total_marks,
          total_questions: test.total_questions ?? defaults.total_questions,
        });
      } catch (apiError) {
        setError(getApiError(apiError));
      }
    };
    void loadTest();
  }, [reset, testId]);

  useEffect(() => {
    if (!loadedTest || !subjects.length) return;
    const subjectValue =
      typeof loadedTest.subject === "string"
        ? subjects.find((subject) => subject.name === loadedTest.subject)?.id
        : loadedTest.subject?.id;
    if (subjectValue) {
      setValue("subject", subjectValue);
    }
  }, [loadedTest, setValue, subjects]);

  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      return;
    }
    const loadTopics = async () => {
      try {
        const topicList = await catalogApi.topics(selectedSubject);
        setTopics(topicList);
      } catch (apiError) {
        setError(getApiError(apiError));
      }
    };
    void loadTopics();
  }, [selectedSubject]);

  useEffect(() => {
    if (!loadedTest || !topics.length) return;
    const topicValues =
      loadedTest.topics
        ?.map((topic) =>
          typeof topic === "string"
            ? topics.find((option) => option.name === topic)?.id
            : topic.id,
        )
        .filter((topic): topic is string => Boolean(topic)) ?? [];
    if (topicValues.length) {
      setValue("topics", topicValues);
    }
  }, [loadedTest, setValue, topics]);

  useEffect(() => {
    if (!selectedTopics.length) {
      setSubTopics([]);
      return;
    }
    const loadSubTopics = async () => {
      try {
        const subTopicList = await catalogApi.subTopicsForTopics(selectedTopics);
        setSubTopics(subTopicList);
      } catch {
        const nested = await Promise.all(
          selectedTopics.map((topicId) => catalogApi.subTopics(topicId).catch(() => [])),
        );
        setSubTopics(nested.flat());
      }
    };
    void loadSubTopics();
  }, [selectedTopics]);

  useEffect(() => {
    if (!loadedTest || !subTopics.length) return;
    const subTopicValues =
      loadedTest.sub_topics
        ?.map((subTopic) =>
          typeof subTopic === "string"
            ? subTopics.find((option) => option.name === subTopic)?.id
            : subTopic.id,
        )
        .filter((subTopic): subTopic is string => Boolean(subTopic)) ?? [];
    setValue("sub_topics", subTopicValues);
  }, [loadedTest, setValue, subTopics]);

  const topicOptions = useMemo(
    () => topics.map((topic) => ({ value: topic.id, label: topic.name })),
    [topics],
  );

  const save = async (values: TestFormValues, goNext: boolean) => {
    setError("");
    setNotice("");
    const payload: TestPayload = { ...values, status: "draft" };
    try {
      const saved = testId
        ? await testsApi.update(testId, payload)
        : await testsApi.create(payload);
      setNotice("Draft saved successfully.");
      if (goNext) {
        navigate(`/tests/${saved.id ?? testId}/questions`);
      } else if (!testId && saved.id) {
        navigate(`/tests/${saved.id}/edit`, { replace: true });
      }
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  const currentType = watch("type");
  const selectedDifficulty = watch("difficulty");
  const topicsValue = selectedTopics || [];
  const selectedSubTopics = watch("sub_topics") || [];

  const subTopicOptions = useMemo(
    () => subTopics.map((subTopic) => ({ value: subTopic.id, label: subTopic.name })),
    [subTopics]
  );

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span>Test Creation</span> &gt; <span>Create Test</span> &gt; <span style={{ color: "#2563eb" }}>Chapter Wise</span>
          </p>
          <h1>{isEdit ? "Edit Test details" : "New test"}</h1>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={currentType === "chapterwise" ? "tab active" : "tab"}
          onClick={() => setValue("type", "chapterwise", { shouldValidate: true })}
        >
          Chapterwise
        </button>
        <button
          type="button"
          className={currentType === "pyq" ? "tab active" : "tab"}
          onClick={() => setValue("type", "pyq", { shouldValidate: true })}
        >
          PYQ
        </button>
        <button
          type="button"
          className={currentType === "mock" ? "tab active" : "tab"}
          onClick={() => setValue("type", "mock", { shouldValidate: true })}
        >
          Mock Test
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {notice ? <div className="alert success">{notice}</div> : null}
      <form className="form-grid" onSubmit={handleSubmit((values) => save(values, true))}>
        <FormField label="Name of Test" error={errors.name?.message}>
          <input {...register("name")} placeholder="Physics mock test 01" />
        </FormField>
        <FormField label="Subject" error={errors.subject?.message}>
          <select
            {...subjectField}
            onChange={(event) => {
              void subjectField.onChange(event);
              setValue("topics", []);
              setValue("sub_topics", []);
            }}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </FormField>

        <MultiSelect
          label="Topics"
          options={topicOptions}
          selectedValues={topicsValue}
          onChange={(values) => {
            setValue("topics", values, { shouldValidate: true });
            setValue("sub_topics", []);
          }}
          placeholder="Select topics"
          error={errors.topics?.message}
        />

        <MultiSelect
          label="Sub Topics"
          options={subTopicOptions}
          selectedValues={selectedSubTopics}
          onChange={(values) => setValue("sub_topics", values, { shouldValidate: true })}
          placeholder="Select sub-topics"
          error={errors.sub_topics?.message}
        />

        <FormField label="Test Difficulty Level" error={errors.difficulty?.message}>
          <div className="difficulty-cards">
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                type="button"
                className={selectedDifficulty === level ? "difficulty-card selected" : "difficulty-card"}
                onClick={() => setValue("difficulty", level, { shouldValidate: true })}
              >
                {level}
              </button>
            ))}
          </div>
        </FormField>

        <div style={{ display: "none" }}>
          {/* Keep react-hook-form registered type input so zod validation passes */}
          <input {...register("type")} />
          <input {...register("difficulty")} />
        </div>

        <div className="form-section">
          <h2>Marking scheme</h2>
          <div className="three-grid">
            <FormField label="Correct marks" error={errors.correct_marks?.message}>
              <input type="number" step="0.5" {...register("correct_marks")} />
            </FormField>
            <FormField label="Wrong marks" error={errors.wrong_marks?.message}>
              <input type="number" step="0.5" {...register("wrong_marks")} />
            </FormField>
            <FormField label="Unattempted marks" error={errors.unattempt_marks?.message}>
              <input type="number" step="0.5" {...register("unattempt_marks")} />
            </FormField>
          </div>
        </div>
        <div className="form-section">
          <h2>Test limits</h2>
          <div className="three-grid">
            <FormField label="Duration (Minutes)" error={errors.total_time?.message}>
              <input type="number" {...register("total_time")} />
            </FormField>
            <FormField label="Total marks" error={errors.total_marks?.message}>
              <input type="number" {...register("total_marks")} />
            </FormField>
            <FormField label="No of Questions" error={errors.total_questions?.message}>
              <input type="number" {...register("total_questions")} />
            </FormField>
          </div>
        </div>
        <div className="form-actions" style={{ justifyContent: "flex-end", width: "100%", marginTop: "12px" }}>
          <button
            className="secondary-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate("/dashboard")}
            style={{ marginRight: "auto" }}
          >
            Cancel
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit((values) => save(values, false))}
          >
            <Save size={18} /> Save as Draft
          </button>
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            Next <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}
