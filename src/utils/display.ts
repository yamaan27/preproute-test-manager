import type { Subject, SubTopic, Test, Topic } from "../types";

export const asName = (value: string | Subject | Topic | SubTopic | undefined) => {
  if (!value) return "Unassigned";
  return typeof value === "string" ? value : value.name;
};

export const asNames = (
  values: string[] | Topic[] | SubTopic[] | undefined,
) => {
  if (!values?.length) return "None";
  return values.map((item) => (typeof item === "string" ? item : item.name)).join(", ");
};

export const formatDate = (date?: string) => {
  if (!date) return "Not available";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const questionIdsFromTest = (test: Test) =>
  (test.questions ?? []).filter((question): question is string => typeof question === "string");
