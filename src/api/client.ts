import axios from "axios";
import type {
  ApiResponse,
  Question,
  Subject,
  SubTopic,
  Test,
  TestPayload,
  Topic,
  User,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("preproute_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      "Something went wrong"
    );
  }
  return "Something went wrong";
};

export const authApi = {
  async login(userId: string, password: string) {
    const { data } = await api.post<ApiResponse<{ token: string; user: User }>>(
      "/auth/login",
      { userId, password },
    );
    return data.data;
  },
};

export const catalogApi = {
  async subjects() {
    const { data } = await api.get<ApiResponse<Subject[]>>("/subjects");
    return data.data;
  },
  async topics(subjectId: string) {
    const { data } = await api.get<ApiResponse<Topic[]>>(
      `/topics/subject/${subjectId}`,
    );
    return data.data;
  },
  async subTopics(topicId: string) {
    const { data } = await api.get<ApiResponse<SubTopic[]>>(
      `/sub-topics/topic/${topicId}`,
    );
    return data.data;
  },
  async subTopicsForTopics(topicIds: string[]) {
    const { data } = await api.post<ApiResponse<SubTopic[]>>(
      "/sub-topics/multi-topics",
      { topicIds },
    );
    return data.data;
  },
};

export const testsApi = {
  async list() {
    const { data } = await api.get<ApiResponse<Test[]>>("/tests");
    return data.data;
  },
  async get(id: string) {
    const { data } = await api.get<ApiResponse<Test>>(`/tests/${id}`);
    return data.data;
  },
  async create(payload: TestPayload) {
    const { data } = await api.post<ApiResponse<Test>>("/tests", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<TestPayload> | Record<string, unknown>) {
    const { data } = await api.put<ApiResponse<Test>>(`/tests/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/tests/${id}`);
  },
};

export const questionsApi = {
  async bulkCreate(questions: Question[]) {
    const { data } = await api.post<ApiResponse<Question[]>>("/questions/bulk", {
      questions,
    });
    return data.data;
  },
  async fetchBulk(question_ids: string[]) {
    const { data } = await api.post<ApiResponse<Question[]>>(
      "/questions/fetchBulk",
      { question_ids },
    );
    return data.data;
  },
};
