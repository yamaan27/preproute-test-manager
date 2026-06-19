export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type User = {
  id?: string;
  userId?: string;
  name?: string;
  role?: string;
};

export type Subject = {
  id: string;
  name: string;
};

export type Topic = {
  id: string;
  name: string;
  subject_id?: string;
};

export type SubTopic = {
  id: string;
  name: string;
  topic_id?: string;
};

export type TestStatus = "draft" | "live" | "published" | "scheduled" | "unpublished" | null;

export type Test = {
  id: string;
  name: string;
  type?: string;
  subject?: string | Subject;
  topics?: string[] | Topic[];
  sub_topics?: string[] | SubTopic[];
  status?: TestStatus;
  difficulty?: string;
  correct_marks?: number;
  wrong_marks?: number;
  unattempt_marks?: number;
  total_time?: number;
  total_marks?: number;
  total_questions?: number;
  questions?: string[] | Question[];
  created_at?: string;
  updated_at?: string;
};

export type TestPayload = {
  name: string;
  type: string;
  subject: string;
  topics: string[];
  sub_topics: string[];
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  difficulty: string;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus;
};

export type Question = {
  id?: string;
  type: "mcq";
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: "option1" | "option2" | "option3" | "option4";
  explanation?: string;
  difficulty?: string;
  subject?: string;
  topic?: string;
  sub_topic?: string;
  media_url?: string;
  test_id?: string;
};
