import { useState, useEffect, useCallback, useRef } from "react";
import { Task } from "./types";
import { loadTasks, saveTasks, generateId } from "./storage";
import { startNotificationLoop } from "./notifications";
import TaskModal from "./TaskModal";

const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function App() {
  const today = todayStr();
  const [tasks, setTasksRaw] = useState<Task[]>(() => loadTasks());
  const [selected, setSelected] = useState(today);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [modal, setModal] = useState<"add" | Task | null>(null);
  const tasksRef = useRef(tasks);

  const setTasks = useCallback((next: Task[] | ((p: Task[]) => Task[])) => {
    setTasksRaw(prev => {
      const r = typeof next === "function" ? next(prev) : next;
      saveTasks(r);
      tasksRef.current = r;
      return r;
    });
  }, []);

  useEffect(() => {
    return startNotificationLoop(
      () => tasksRef.current,
      id => setTasks(p => p.map(t => t.id === id ? { ...t, notified: true } : t))
    );
  }, [setTasks]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => viewMonth === 0 ? (setViewYear(y=>y-1), setViewMonth(11)) : setViewMonth(m=>m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewYear(y=>y+1), setViewMonth(0)) : setViewMonth(m=>m+1);
  const goToday = () => { const n = new Date(); setViewYear(n.getFullYear()); setViewMonth(n.getMonth()); setSelected(today); };

  const dayTasks = tasks.filter(t => t.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  const countFor = (ds: string) => tasks.filter(t => t.date === ds).length;

  const addTask = (title: string, date: string, time: string) => {
    setTasks(p => [...p, { id: generateId(), title, date, time, notified: false }]);
    setModal(null);
  };
  const editTask = (id: string, title: string, date: string, time: string) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, title, date, time, notified: false } : t));
    setModal(null);
  };
  const deleteTask = (id: string) => setTasks(p => p.filter(t => t.id !== id));

  const fmt12 = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "pm" : "am"}`;
  };
  const fmtDate = () => {
    const [y,mo,d] = selected.split("-").map(Number);
    const wd = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(y,mo-1,d).getDay()];
    return `${wd}, ${MONTHS[mo-1]} ${d}`;
  };

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.calNav}>
          <button style={s.navBtn} onClick={prevMonth}>‹</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{MONTHS[viewMonth]}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{viewYear}</div>
          </div>
          <button style={s.navBtn} onClick={nextMonth}>›</button>
        </div>

        <div style={s.calGrid}>
          {DAYS.map(d => <div key={d} style={s.dayHeader}>{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const ds = toDateStr(viewYear, viewMonth, day);
            const isToday = ds === today;
            const isSel = ds === selected;
            const count = countFor(ds);
            return (
              <button
                key={ds}
                onClick={() => setSelected(ds)}
                style={{
                  ...s.calDay,
                  background: isToday && isSel ? "var(--accent)" : isSel ? "var(--accent-light)" : "none",
                }}
              >
                <span style={{
                  fontSize: 12, lineHeight: 1, fontWeight: isToday || isSel ? 600 : 400,
                  color: isToday && isSel ? "#fff" : isToday || isSel ? "var(--accent)" : "var(--text-primary)",
                }}>{day}</span>
                {count > 0 && <span style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: isToday && isSel ? "rgba(255,255,255,0.7)" : "var(--accent)",
                }} />}
              </button>
            );
          })}
        </div>

        <button style={s.todayBtn} onClick={goToday}>Today</button>
      </aside>

      <main style={s.main}>
        <div style={s.mainHeader}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtDate()}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {dayTasks.length === 0 ? "No tasks" : `${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""}`}
            </div>
          </div>
          <button style={s.addBtn} onClick={() => setModal("add")}>+</button>
        </div>

        <div style={s.taskList}>
          {dayTasks.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 22, opacity: 0.3 }}>○</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Nothing scheduled</div>
              <button style={s.emptyAdd} onClick={() => setModal("add")}>Add a task</button>
            </div>
          ) : dayTasks.map(task => (
            <div key={task.id} style={s.taskItem}
              onMouseEnter={e => (e.currentTarget.querySelector(".actions") as HTMLElement).style.opacity = "1"}
              onMouseLeave={e => (e.currentTarget.querySelector(".actions") as HTMLElement).style.opacity = "0"}
            >
              <div style={s.taskTime}>{fmt12(task.time)}</div>
              <div style={s.taskTitle}>{task.title}</div>
              <div className="actions" style={{ ...s.actions, opacity: 0 }}>
                <button style={s.actionBtn} onClick={() => setModal(task)}>✎</button>
                <button style={{ ...s.actionBtn, color: "var(--danger)" }} onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {modal && (
        <TaskModal
          defaultDate={selected}
          task={modal === "add" ? undefined : modal as Task}
          onSave={modal === "add" ? addTask : (title, date, time) => editTask((modal as Task).id, title, date, time)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  app: { display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" },
  sidebar: {
    width: 220, minWidth: 220, background: "var(--surface)",
    borderRight: "1px solid var(--border)", display: "flex",
    flexDirection: "column", padding: "18px 14px 14px", gap: 10,
  },
  calNav: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  navBtn: { background: "none", color: "var(--text-secondary)", fontSize: 18, padding: "2px 6px", borderRadius: 5 },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px 0" },
  dayHeader: { textAlign: "center", fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", padding: "4px 0" },
  calDay: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", aspectRatio: "1", borderRadius: 6,
    cursor: "pointer", gap: 2, transition: "background 0.1s",
  },
  todayBtn: {
    alignSelf: "center", marginTop: "auto", background: "none",
    color: "var(--text-secondary)", fontSize: 11, fontWeight: 500,
    padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" },
  mainHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 22px 14px", borderBottom: "1px solid var(--border-soft)",
  },
  addBtn: {
    width: 30, height: 30, borderRadius: 8, background: "var(--accent)",
    color: "#fff", fontSize: 22, fontWeight: 300,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  taskList: { flex: 1, overflowY: "auto", padding: "10px 16px 16px" },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, height: 200,
  },
  emptyAdd: { background: "none", color: "var(--accent)", fontSize: 12, fontWeight: 500, padding: "4px 10px", borderRadius: 5 },
  taskItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderRadius: 8,
    border: "1px solid var(--border-soft)", background: "var(--surface)", marginBottom: 6,
  },
  taskTime: { fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, minWidth: 52, flexShrink: 0 },
  taskTitle: { flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  actions: { display: "flex", gap: 4, flexShrink: 0, transition: "opacity 0.15s" },
  actionBtn: { background: "none", padding: "3px 6px", borderRadius: 5, fontSize: 12, color: "var(--text-tertiary)" },
};