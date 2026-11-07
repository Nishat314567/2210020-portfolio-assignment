// Netlify Function: CRUD API for Skills and Projects
// Database = Netlify Blobs (Netlify er built-in storage)
import { getStore } from "@netlify/blobs";

const TABLES = {
  skills: ["category", "name"],
  projects: ["title", "tech", "description"],
};
const REQUIRED = { skills: "name", projects: "title" };

const SEED = {
  skills: [
    ...["C++", "C", "Java", "JavaFX", "Python", "Dart", "Flutter", "Firebase", "NumPy", "Matplotlib", "Maven", "Makefile"].map(n => ["coding", n]),
    ...["Web Design", "Responsive UI/UX", "Teamwork", "Problem Solving", "Robotics & Electronics", "Adaptability"].map(n => ["professional", n]),
  ],
  projects: [
    ["Design of Operating System", "C++ · C · Java · Makefile", "Multi-module systems project for Linux and Windows (WIN32)\nProcess management, multithreaded MD5 hashing, multilevel queue CPU scheduling\nDining Philosophers with mutexes/semaphores, Java RMI client-server"],
    ["Food Processing Plant Simulation (Pran Foods)", "Java · JavaFX · Maven", "JavaFX desktop app using Maven and MVC for an IUB OOP course\nRole-based dashboards for Marketing Officer and Warehouse Manager\nFXML UI with 7-8 task-specific screens"],
    ["Real-Time Chat Application", "Flutter · Dart · Firebase", "Real-time mobile chat app\nFirebase Authentication and Firestore message sync\nResponsive UI with chat, user and message management"],
    ["Numerical Methods", "Python · NumPy · Matplotlib", "Python project to solve and analyze mathematical problems computationally"],
  ],
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  const store = getStore("portfolio");
  const parts = new URL(req.url).pathname.split("/").filter(Boolean); // ["api", table, id]
  const t = parts[1];
  const id = parts[2] ? Number(parts[2]) : null;

  if (!TABLES[t]) return json({ error: "Unknown section" }, 404);
  const cols = TABLES[t];

  // prothombar seed data boshao
  let rows = await store.get(t, { type: "json" });
  if (!rows) {
    rows = SEED[t].map((r, i) => ({ id: i + 1, ...Object.fromEntries(cols.map((c, j) => [c, r[j]])) }));
    await store.setJSON(t, rows);
  }

  const body = ["POST", "PUT"].includes(req.method) ? await req.json().catch(() => ({})) : {};

  // READ
  if (req.method === "GET") {
    if (id === null) return json(rows);
    const row = rows.find(r => r.id === id);
    return row ? json(row) : json({ error: "Not found" }, 404);
  }

  // CREATE
  if (req.method === "POST") {
    if (!String(body[REQUIRED[t]] || "").trim()) return json({ error: REQUIRED[t] + " is required" }, 400);
    const row = { id: rows.reduce((m, r) => Math.max(m, r.id), 0) + 1 };
    cols.forEach(c => { row[c] = String(body[c] ?? ""); });
    rows.push(row);
    await store.setJSON(t, rows);
    return json(row, 201);
  }

  // UPDATE
  if (req.method === "PUT" && id !== null) {
    const row = rows.find(r => r.id === id);
    if (!row) return json({ error: "Not found" }, 404);
    cols.forEach(c => { if (body[c] !== undefined) row[c] = String(body[c]); });
    if (!String(row[REQUIRED[t]]).trim()) return json({ error: REQUIRED[t] + " is required" }, 400);
    await store.setJSON(t, rows);
    return json(row);
  }

  // DELETE
  if (req.method === "DELETE" && id !== null) {
    if (!rows.some(r => r.id === id)) return json({ error: "Not found" }, 404);
    await store.setJSON(t, rows.filter(r => r.id !== id));
    return json({ message: "Deleted" });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/*" };
