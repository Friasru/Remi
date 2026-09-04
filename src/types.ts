export interface Task {
  id: string;
  title: string;
  date: string;  // "YYYY-MM-DD"
  time: string;  // "HH:MM"
  notified: boolean;
}