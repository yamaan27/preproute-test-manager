import { Edit3, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiError, testsApi } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import type { Test } from "../types";
import { asName, asNames, formatDate } from "../utils/display";

export function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadTests = async () => {
    setLoading(true);
    setError("");
    try {
      setTests(await testsApi.list());
    } catch (apiError) {
      setError(getApiError(apiError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTests();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tests;
    return tests.filter((test) =>
      [test.name, asName(test.subject), asNames(test.topics), test.status ?? "draft"]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query, tests]);

  const deleteTest = async (test: Test) => {
    const confirmed = window.confirm(`Delete "${test.name}"?`);
    if (!confirmed) return;
    try {
      await testsApi.remove(test.id);
      setTests((current) => current.filter((item) => item.id !== test.id));
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Test management</p>
          <h1>All tests</h1>
        </div>
        <Link className="primary-button" to="/tests/new">
          <Plus size={18} /> Create New Test
        </Link>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tests, subjects, topics"
          />
        </div>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Subject</th>
              <th>Topics</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading tests...</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((test) => (
                <tr key={test.id}>
                  <td>
                    <strong>{test.name}</strong>
                    <small>{test.total_questions ?? 0} questions</small>
                  </td>
                  <td>{asName(test.subject)}</td>
                  <td className="muted-cell">{asNames(test.topics)}</td>
                  <td>
                    <StatusPill status={test.status} />
                  </td>
                  <td>{formatDate(test.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        title="Edit"
                        type="button"
                        onClick={() => navigate(`/tests/${test.id}/edit`)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-button"
                        title="Preview"
                        type="button"
                        onClick={() => navigate(`/tests/${test.id}/preview`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        title="Delete"
                        type="button"
                        onClick={() => void deleteTest(test)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No tests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
