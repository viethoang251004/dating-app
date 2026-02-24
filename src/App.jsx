import { useState, useEffect } from "react";

// ─── HELPERS ────────────────────────────────────────────────────────────────

const LS = {
  get: (k) => JSON.parse(localStorage.getItem(k) || "null"),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// Find first overlapping slot between two availability arrays
// Each slot: { date, startTime, endTime }  (times as "HH:MM")
function findCommonSlot(slotsA, slotsB) {
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.date !== b.date) continue;
      const aStart = a.startTime, aEnd = a.endTime;
      const bStart = b.startTime, bEnd = b.endTime;
      const overlapStart = aStart > bStart ? aStart : bStart;
      const overlapEnd = aEnd < bEnd ? aEnd : bEnd;
      if (overlapStart < overlapEnd) {
        return { date: a.date, startTime: overlapStart, endTime: overlapEnd };
      }
    }
  }
  return null;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

// Next 3 weeks: array of YYYY-MM-DD strings
function getNext3Weeks() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function GenderIcon({ gender }) {
  if (gender === "Nam") return <span>♂</span>;
  if (gender === "Nữ") return <span>♀</span>;
  return <span>⚧</span>;
}

// ── Part A: Create Profile ──
function CreateProfile({ onCreated }) {
  const [form, setForm] = useState({ name: "", age: "", gender: "Nam", bio: "", email: "" });
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.age || !form.email.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Email không hợp lệ.");
      return;
    }
    const age = parseInt(form.age);
    if (isNaN(age) || age < 18 || age > 100) {
      setError("Tuổi phải từ 18 đến 100.");
      return;
    }
    const profiles = LS.get("profiles") || [];
    if (profiles.find((p) => p.email === form.email.toLowerCase())) {
      setError("Email này đã được sử dụng.");
      return;
    }
    const newProfile = { ...form, email: form.email.toLowerCase(), age, id: uid() };
    LS.set("profiles", [...profiles, newProfile]);
    onCreated(newProfile);
  };

  return (
    <div className="card fade-in">
      <h2 className="card-title">✨ Tạo Profile</h2>
      <p className="card-sub">Điền thông tin để bắt đầu hành trình tìm kiếm</p>

      <div className="form-grid">
        <label className="field">
          <span>Tên <em>*</em></span>
          <input placeholder="Nguyễn Văn A" value={form.name} onChange={set("name")} />
        </label>
        <label className="field">
          <span>Tuổi <em>*</em></span>
          <input type="number" min="18" max="100" placeholder="23" value={form.age} onChange={set("age")} />
        </label>
        <label className="field">
          <span>Giới tính</span>
          <select value={form.gender} onChange={set("gender")}>
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </label>
        <label className="field full">
          <span>Email <em>*</em></span>
          <input type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
        </label>
        <label className="field full">
          <span>Bio</span>
          <textarea
            placeholder="Kể ngắn về bản thân bạn..."
            rows={3}
            value={form.bio}
            onChange={set("bio")}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      <button className="btn-primary" onClick={handleSubmit}>
        Tạo Profile 🌸
      </button>
    </div>
  );
}

// ── Part B: Browse & Like ──
function BrowseProfiles({ currentUser, onUpdate }) {
  const [profiles, setProfiles] = useState([]);
  const [likes, setLikes] = useState({});
  const [flash, setFlash] = useState(null); // match flash

  useEffect(() => {
    setProfiles(LS.get("profiles") || []);
    setLikes(LS.get("likes") || {});
  }, []);

  const myLikes = likes[currentUser.email] || {};

  const handleLike = (target) => {
    const newLikes = {
      ...likes,
      [currentUser.email]: { ...myLikes, [target.email]: true },
    };
    LS.set("likes", newLikes);
    setLikes(newLikes);

    // Check mutual match
    if (newLikes[target.email]?.[currentUser.email]) {
      // Save match
      const matches = LS.get("matches") || {};
      const key = [currentUser.email, target.email].sort().join("|");
      if (!matches[key]) {
        matches[key] = true;
        LS.set("matches", matches);
      }
      setFlash(target);
      setTimeout(() => { setFlash(null); onUpdate(); }, 2500);
    }
  };

  const others = profiles.filter((p) => p.email !== currentUser.email);

  return (
    <div className="fade-in">
      {flash && (
        <div className="match-flash">
          <div className="match-flash-inner">
            <div className="hearts">💕</div>
            <h2>It's a Match!</h2>
            <p>Bạn và <strong>{flash.name}</strong> đã thích nhau!</p>
          </div>
        </div>
      )}

      <h2 className="section-title">👥 Khám phá</h2>
      {others.length === 0 ? (
        <p className="empty">Chưa có profile nào khác. Hãy mời bạn bè tham gia!</p>
      ) : (
        <div className="profile-grid">
          {others.map((p) => {
            const liked = !!myLikes[p.email];
            const matched = !!(
              (likes[currentUser.email]?.[p.email]) &&
              (likes[p.email]?.[currentUser.email])
            );
            return (
              <div key={p.id} className={`profile-card ${matched ? "matched" : ""}`}>
                <div className="avatar">{p.name[0].toUpperCase()}</div>
                <div className="profile-info">
                  <h3>{p.name} <span className="age">{p.age}t</span></h3>
                  <span className="gender-tag"><GenderIcon gender={p.gender} /> {p.gender}</span>
                  {p.bio && <p className="bio">{p.bio}</p>}
                  <p className="email-tag">📧 {p.email}</p>
                </div>
                {matched ? (
                  <div className="match-badge">💞 Matched!</div>
                ) : (
                  <button
                    className={`btn-like ${liked ? "liked" : ""}`}
                    onClick={() => !liked && handleLike(p)}
                    disabled={liked}
                  >
                    {liked ? "❤️ Đã thích" : "🤍 Thích"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Part C: Availability ──
function AvailabilityPicker({ currentUser }) {
  const allDays = getNext3Weeks();
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [avails, setAvails] = useState({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [newSlot, setNewSlot] = useState({ date: allDays[0], startTime: "09:00", endTime: "12:00" });
  const [slotError, setSlotError] = useState("");

  useEffect(() => {
    const allProfiles = LS.get("profiles") || [];
    const allMatches = LS.get("matches") || {};
    const allAvails = LS.get("availabilities") || {};
    setProfiles(allProfiles);
    setAvails(allAvails);

    // Find matches for currentUser
    const myMatches = [];
    for (const key of Object.keys(allMatches)) {
      const [a, b] = key.split("|");
      if (a === currentUser.email || b === currentUser.email) {
        const otherEmail = a === currentUser.email ? b : a;
        const otherProfile = allProfiles.find((p) => p.email === otherEmail);
        if (otherProfile) myMatches.push({ key, other: otherProfile });
      }
    }
    setMatches(myMatches);
    if (myMatches.length > 0 && !selectedMatch) setSelectedMatch(myMatches[0]);
  }, [currentUser]);

  const mySlots = selectedMatch ? (avails[currentUser.email] || []).filter(s => s.matchKey === selectedMatch.key) : [];
  const theirSlots = selectedMatch ? (avails[selectedMatch?.other?.email] || []).filter(s => s.matchKey === selectedMatch.key) : [];

  const addSlot = () => {
    setSlotError("");
    if (newSlot.startTime >= newSlot.endTime) {
      setSlotError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    const existing = avails[currentUser.email] || [];
    const updated = { ...avails, [currentUser.email]: [...existing, { ...newSlot, matchKey: selectedMatch.key }] };
    LS.set("availabilities", updated);
    setAvails(updated);
  };

  const removeSlot = (idx) => {
    const myAll = avails[currentUser.email] || [];
    const myMatchSlots = myAll.filter(s => s.matchKey === selectedMatch.key);
    const toRemove = myMatchSlots[idx];
    const updated = { ...avails, [currentUser.email]: myAll.filter(s => s !== toRemove) };
    LS.set("availabilities", updated);
    setAvails(updated);
  };

  const commonSlot = selectedMatch ? findCommonSlot(mySlots, theirSlots) : null;

  if (matches.length === 0) {
    return (
      <div className="card fade-in">
        <h2 className="card-title">📅 Đặt Lịch Hẹn</h2>
        <p className="empty">Bạn chưa có match nào. Hãy like để tạo match trước!</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 className="section-title">📅 Đặt Lịch Hẹn</h2>

      {/* Match selector */}
      {matches.length > 1 && (
        <div className="match-tabs">
          {matches.map((m) => (
            <button
              key={m.key}
              className={`match-tab ${selectedMatch?.key === m.key ? "active" : ""}`}
              onClick={() => setSelectedMatch(m)}
            >
              {m.other.name}
            </button>
          ))}
        </div>
      )}

      {selectedMatch && (
        <div className="avail-layout">
          {/* My slots */}
          <div className="card">
            <h3>🗓 Lịch rảnh của tôi <span className="with-who">với {selectedMatch.other.name}</span></h3>

            <div className="slot-form">
              <label className="field">
                <span>Ngày</span>
                <select value={newSlot.date} onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))}>
                  {allDays.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
                </select>
              </label>
              <div className="time-row">
                <label className="field">
                  <span>Từ</span>
                  <input type="time" value={newSlot.startTime} onChange={e => setNewSlot(s => ({ ...s, startTime: e.target.value }))} />
                </label>
                <label className="field">
                  <span>Đến</span>
                  <input type="time" value={newSlot.endTime} onChange={e => setNewSlot(s => ({ ...s, endTime: e.target.value }))} />
                </label>
              </div>
              {slotError && <p className="error">{slotError}</p>}
              <button className="btn-primary small" onClick={addSlot}>+ Thêm slot</button>
            </div>

            {mySlots.length > 0 ? (
              <ul className="slot-list">
                {mySlots.map((s, i) => (
                  <li key={i} className="slot-item">
                    <span>📆 {formatDate(s.date)}</span>
                    <span className="slot-time">{s.startTime} – {s.endTime}</span>
                    <button className="btn-remove" onClick={() => removeSlot(i)}>✕</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty small">Chưa có slot nào.</p>
            )}
          </div>

          {/* Their slots */}
          <div className="card">
            <h3>🗓 Lịch rảnh của <em>{selectedMatch.other.name}</em></h3>
            {theirSlots.length > 0 ? (
              <ul className="slot-list">
                {theirSlots.map((s, i) => (
                  <li key={i} className="slot-item readonly">
                    <span>📆 {formatDate(s.date)}</span>
                    <span className="slot-time">{s.startTime} – {s.endTime}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty small">{selectedMatch.other.name} chưa chọn lịch rảnh.</p>
            )}

            {/* Result */}
            <div className={`date-result ${commonSlot ? "found" : theirSlots.length > 0 && mySlots.length > 0 ? "not-found" : "waiting"}`}>
              {mySlots.length === 0 || theirSlots.length === 0 ? (
                <p>⏳ Đang chờ cả hai bên chọn lịch rảnh...</p>
              ) : commonSlot ? (
                <>
                  <p className="result-icon">🎉</p>
                  <p><strong>Hai bạn có date hẹn vào:</strong></p>
                  <p className="result-date">{formatDate(commonSlot.date)}</p>
                  <p className="result-time">{commonSlot.startTime} – {commonSlot.endTime}</p>
                </>
              ) : (
                <>
                  <p className="result-icon">😔</p>
                  <p>Chưa tìm được thời gian trùng. Vui lòng chọn lại.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── User Selector / Login ──
function UserSelector({ onSelect, onCreate }) {
  const profiles = LS.get("profiles") || [];

  return (
    <div className="card fade-in selector-card">
      <div className="logo">💕</div>
      <h1>Breeze</h1>
      <p className="tagline">Mini Dating App</p>

      {profiles.length > 0 ? (
        <>
          <p className="card-sub">Chọn profile của bạn:</p>
          <div className="user-list">
            {profiles.map((p) => (
              <button key={p.id} className="user-btn" onClick={() => onSelect(p)}>
                <span className="user-btn-avatar">{p.name[0].toUpperCase()}</span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.email}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="divider">hoặc</div>
        </>
      ) : (
        <p className="card-sub">Chưa có profile nào. Hãy tạo mới!</p>
      )}
      <button className="btn-primary" onClick={onCreate}>
        + Tạo Profile Mới
      </button>
    </div>
  );
}

// ── Matches Overview ──
function MatchesView({ currentUser }) {
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const allProfiles = LS.get("profiles") || [];
    const allMatches = LS.get("matches") || {};
    setProfiles(allProfiles);
    const myMatches = [];
    for (const key of Object.keys(allMatches)) {
      const [a, b] = key.split("|");
      if (a === currentUser.email || b === currentUser.email) {
        const otherEmail = a === currentUser.email ? b : a;
        const other = allProfiles.find((p) => p.email === otherEmail);
        if (other) myMatches.push(other);
      }
    }
    setMatches(myMatches);
  }, [currentUser]);

  return (
    <div className="fade-in">
      <h2 className="section-title">💞 Matches của bạn</h2>
      {matches.length === 0 ? (
        <p className="empty">Chưa có match nào. Tiếp tục like để tìm người phù hợp!</p>
      ) : (
        <div className="profile-grid">
          {matches.map((p) => (
            <div key={p.id} className="profile-card matched">
              <div className="avatar">{p.name[0].toUpperCase()}</div>
              <div className="profile-info">
                <h3>{p.name} <span className="age">{p.age}t</span></h3>
                <span className="gender-tag"><GenderIcon gender={p.gender} /> {p.gender}</span>
                {p.bio && <p className="bio">{p.bio}</p>}
                <p className="email-tag">📧 {p.email}</p>
              </div>
              <div className="match-badge">💞 Matched!</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("selector"); // selector | create | browse | matches | schedule
  const [currentUser, setCurrentUser] = useState(null);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  const logout = () => { setCurrentUser(null); setView("selector"); };

  if (!currentUser) {
    if (view === "create") {
      return (
        <div className="app">
          <div className="container">
            <button className="btn-back" onClick={() => setView("selector")}>← Quay lại</button>
            <CreateProfile onCreated={(p) => { setCurrentUser(p); setView("browse"); }} />
          </div>
        </div>
      );
    }
    return (
      <div className="app">
        <div className="container center">
          <UserSelector onSelect={(p) => { setCurrentUser(p); setView("browse"); }} onCreate={() => setView("create")} />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "browse", label: "🔍 Khám phá" },
    { id: "matches", label: "💞 Matches" },
    { id: "schedule", label: "📅 Lịch hẹn" },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">💕 Breeze</div>
          <div className="header-user" onClick={logout} title="Đổi user">
            <span className="header-avatar">{currentUser.name[0].toUpperCase()}</span>
            <span>{currentUser.name}</span>
            <span className="logout-hint">↩</span>
          </div>
        </div>
        <nav className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${view === t.id ? "active" : ""}`} onClick={() => setView(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container" key={tick}>
        {view === "browse" && <BrowseProfiles currentUser={currentUser} onUpdate={refresh} />}
        {view === "matches" && <MatchesView currentUser={currentUser} />}
        {view === "schedule" && <AvailabilityPicker currentUser={currentUser} />}
      </main>
    </div>
  );
}
