import { Task } from "./types";

export function playNotificationSound(): void {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    const freqs = [880, 660, 880];
    const times = [0, 0.15, 0.3];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, ctx.currentTime + times[i]);
      o.connect(gain);
      o.start(ctx.currentTime + times[i]);
      o.stop(ctx.currentTime + times[i] + 0.15);
    });
  } catch {
    // no audio available
  }
}

export async function sendDesktopNotification(task: Task): Promise<void> {
  try {
    const { sendNotification, isPermissionGranted, requestPermission } =
      await import("@tauri-apps/api/notification");
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === "granted";
    if (granted) {
      await sendNotification({ title: "Remi", body: `${task.title} — due now` });
    }
  } catch {
    // not in Tauri context
  }
}

export function startNotificationLoop(
  getTasks: () => Task[],
  markNotified: (id: string) => void
): () => void {
  const check = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    for (const task of getTasks()) {
      if (!task.notified && task.date === date && task.time === time) {
        playNotificationSound();
        sendDesktopNotification(task);
        markNotified(task.id);
      }
    }
  };
  check();
  const id = setInterval(check, 30_000);
  return () => clearInterval(id);
}