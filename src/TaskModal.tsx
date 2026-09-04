import React, { useState, useEffect, useRef } from "react";
import { Task } from "./types";

interface Props {
  defaultDate: string;
  task?: Task;
  onSave: (title: string, date: string, time: string) => void;
  onClose: () => void;
}

export default function TaskModal({ defaultDate, task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [date, setDate] = useState(task?.date ?? defaultDate);
  const [time, setTime] = useState(task?.time ?? "09:00");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = () => {
    const t = title.trim();
    if (t && date && time) onSave(t, date, time);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <span style={s.modalTitle}>{task ? "Edit task" : "New task"}</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.body}>
          <div style={s.field}>
            <label style={s.label}>Title</label>
            <input
              ref={titleRef}
              style={s.input}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="What needs to be done?"
              maxLength={80}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={s.field}>
              <label style={s.label}>Date</label>
              <input style={s.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Time</label>
              <input style={s.input} type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={s.footer}>
          <button style={s.ghostBtn} onClick={onClose}>Cancel</button>
          <button
            style={{ ...s.primaryBtn, opacity: (!title.trim() || !date || !time) ? 0.4 : 1 }}
            onClick={submit}
            disabled={!title.trim() || !date || !time}
          >
            {task ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, backdropFilter: "blur(2px)",
  },
  modal: {
    background: "var(--surface)", borderRadius: 10, width: 340,
    boxShadow: "var(--shadow-md)", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 18px 14px", borderBottom: "1px solid var(--border-soft)",
  },
  modalTitle: { fontSize: 13, fontWeight: 600 },
  closeBtn: {
    background: "none", color: "var(--text-tertiary)",
    fontSize: 11, padding: "2px 5px", borderRadius: 4,
  },
  body: { padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5, flex: 1 },
  label: { fontSize: 11, fontWeight: 500, color: "var(--text-secondary)" },
  input: {
    border: "1px solid var(--border)", borderRadius: 6,
    padding: "7px 10px", fontSize: 13, color: "var(--text-primary)",
    background: "var(--bg)", width: "100%",
  },
  footer: {
    display: "flex", gap: 8, justifyContent: "flex-end",
    padding: "12px 18px 16px", borderTop: "1px solid var(--border-soft)",
  },
  ghostBtn: {
    background: "none", color: "var(--text-secondary)", padding: "6px 12px",
    borderRadius: 6, fontSize: 12, fontWeight: 500,
  },
  primaryBtn: {
    background: "var(--accent)", color: "#fff", padding: "6px 14px",
    borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
    border: "none",
  },
};