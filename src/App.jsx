import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* =========================================================
   STEMNINGER
========================================================= */

const moodOptions = [
  { label: "Hyggeligt", icon: "♡" },
  { label: "Sjovt", icon: "☺" },
  { label: "Hjemme", icon: "⌂" },
  { label: "Romantisk", icon: "♥" },
  { label: "Udendørs", icon: "♧" },
  { label: "Billigt", icon: "◉" },
  { label: "Kreativt", icon: "☆" },
];

const wheelCategories = [
  { label: "Romantisk", icon: "♡" },
  { label: "Sjovt", icon: "☺" },
  { label: "Hjemme", icon: "⌂" },
  { label: "Udendørs", icon: "♧" },
  { label: "Billigt", icon: "◉" },
  { label: "Kreativt", icon: "☆" },
  { label: "Hyggeligt", icon: "☕" },
];

/* Tilfældig værdi uden modulo-bias */
function randomIndex(max) {
  if (max <= 0) return 0;

  const maxUint = 4294967296;
  const limit = maxUint - (maxUint % max);

  const array = new Uint32Array(1);

  let value;

  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}
/* =========================================================
   FALLBACK DATES
========================================================= */

const demoDates = [
  {
    id: "demo-1",
    title: "Picnic i solnedgangen",
    description:
      "Pak en kurv med jeres yndlingssnacks og find et hyggeligt sted, hvor I kan se solnedgangen sammen.",
    tags: ["Hyggeligt", "Romantisk", "Udendørs", "Billigt"],
    duration: "2-3 timer",
    location: "Udendørs",
    image_url:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "demo-2",
    title: "Cocktailaften hjemme",
    description:
      "Find opskrifter på forskellige cocktails og lav jeres egen lille cocktailbar derhjemme.",
    tags: ["Sjovt", "Hjemme", "Kreativt"],
    duration: "1-2 timer",
    location: "Hjemme",
    image_url:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "demo-3",
    title: "Minigolf",
    description:
      "Tag ud og spil minigolf sammen. Taberen kan give en is eller kaffe bagefter.",
    tags: ["Sjovt", "Udendørs"],
    duration: "1-2 timer",
    location: "Udendørs",
    image_url:
      "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1000&q=80",
  },
];

/* =========================================================
   APP
========================================================= */

function App() {
  /* AUTH */

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* NAVIGATION */

  const [page, setPage] = useState("frontpage");

  /* DATE IDEAS */

  const [selectedTags, setSelectedTags] = useState([]);
  const [dateIdeas, setDateIdeas] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailsBackPage, setDetailsBackPage] = useState("results");
  const [savedDates, setSavedDates] = useState([]);

  /* PARTNER */

  const [coupleId, setCoupleId] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [partnerConnected, setPartnerConnected] = useState(false);

  /* MINDER */

  const [memories, setMemories] = useState([]);
  const [memoryLoading, setMemoryLoading] = useState(false);

  /* =======================================================
     LOGIN
  ======================================================= */

  useEffect(() => {
    async function getInitialSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setAuthLoading(false);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* =======================================================
     DATA EFTER LOGIN
  ======================================================= */

  useEffect(() => {
    if (!session) {
      setCoupleId(null);
      setInviteCode("");
      setPartnerConnected(false);
      setMemories([]);
      return;
    }

    loadDateIdeas();
    loadSavedDates();
    loadCouple();
  }, [session]);

  /* =======================================================
     HENT MINDER NÅR COUPLE-ID KENDES
  ======================================================= */

  useEffect(() => {
    if (coupleId) {
      loadMemories();
    } else {
      setMemories([]);
    }
  }, [coupleId]);

  /* =======================================================
     DATE IDEAS
  ======================================================= */

  async function loadDateIdeas() {
    try {
      const { data, error } = await supabase
        .from("date_ideas")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Date ideas fejl:", error);
        setDateIdeas(demoDates);
        return;
      }

      if (!data || data.length === 0) {
        setDateIdeas(demoDates);
        return;
      }

      setDateIdeas(data);
    } catch (error) {
      console.error(error);
      setDateIdeas(demoDates);
    }
  }

  /* =======================================================
     GEMTE IDEER
  ======================================================= */

  function loadSavedDates() {
    try {
      const saved = localStorage.getItem("savedDates");

      if (saved) {
        setSavedDates(JSON.parse(saved));
      }
    } catch (error) {
      console.error(error);
    }
  }

  function toggleSaved(date) {
    const exists = savedDates.some((item) => item.id === date.id);

    let updated;

    if (exists) {
      updated = savedDates.filter((item) => item.id !== date.id);
    } else {
      updated = [...savedDates, date];
    }

    setSavedDates(updated);

    localStorage.setItem("savedDates", JSON.stringify(updated));
  }

  /* =======================================================
     STEMNINGER
  ======================================================= */

  function toggleTag(tag) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));

      return;
    }

    if (selectedTags.length >= 3) {
      return;
    }

    setSelectedTags([...selectedTags, tag]);
  }

  /* =======================================================
     FIND DATES
  ======================================================= */

  function findDates() {
    if (selectedTags.length === 0) return;

    setPage("loading");

    setTimeout(() => {
      let matches = dateIdeas.filter((date) =>
        selectedTags.every((tag) => date.tags?.includes(tag)),
      );

      if (matches.length === 0) {
        matches = dateIdeas.filter((date) =>
          selectedTags.some((tag) => date.tags?.includes(tag)),
        );
      }

      matches = [...matches].sort(() => Math.random() - 0.5);

      setResults(matches);
      setPage("results");
    }, 1200);
  }

  function openDate(date, backPage = "results") {
    setSelectedDate(date);
    setDetailsBackPage(backPage);
    setPage("details");
  }

  /* =======================================================
     HENT COUPLE
  ======================================================= */

  async function loadCouple() {
    if (!session?.user) return;

    try {
      /* Find brugerens eget membership */

      const { data: membership, error: membershipError } = await supabase
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membershipError) {
        console.error("Membership fejl:", membershipError);
        return;
      }

      /* Brugeren har ikke et couple */

      if (!membership) {
        setCoupleId(null);
        setInviteCode("");
        setPartnerConnected(false);
        return;
      }

      const currentCoupleId = membership.couple_id;

      setCoupleId(currentCoupleId);

      /* Hent invitationskode */

      const { data: couple, error: coupleError } = await supabase
        .from("couples")
        .select("invite_code")
        .eq("id", currentCoupleId)
        .maybeSingle();

      if (coupleError) {
        console.error("Couple fejl:", coupleError);
      }

      if (couple) {
        setInviteCode(couple.invite_code);
      }

      /*
        Tjek via RPC hvor mange medlemmer
        der er i brugerens couple.

        1 = kun dig
        2 = partner er forbundet
      */

      const { data: memberCount, error: countError } = await supabase.rpc(
        "get_my_couple_member_count",
      );

      if (countError) {
        console.error("Kunne ikke kontrollere partnerstatus:", countError);

        setPartnerConnected(false);
        return;
      }

      setPartnerConnected(Number(memberCount || 0) >= 2);
    } catch (error) {
      console.error(error);
    }
  }

  /* =======================================================
     OPRET PARTNERKODE
  ======================================================= */

  async function createPartnerCode() {
    try {
      const { data, error } = await supabase.rpc("create_couple");

      if (error) {
        throw error;
      }

      setInviteCode(data);

      await loadCouple();

      return {
        success: true,
        message: "Partnerkoden er oprettet ♡",
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /* =======================================================
     JOIN PARTNER
  ======================================================= */

  async function joinPartner(code) {
    try {
      if (!code.trim()) {
        return {
          success: false,
          message: "Indtast en partnerkode.",
        };
      }

      const { error } = await supabase.rpc("join_couple", {
        code: code.trim().toUpperCase(),
      });

      if (error) {
        throw error;
      }

      await loadCouple();

      return {
        success: true,
        message: "I er nu forbundet ♡",
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /* =======================================================
     SLET / FORLAD PARTNER
  ======================================================= */

  async function disconnectPartner() {
    try {
      const { error } = await supabase.rpc("leave_couple");

      if (error) {
        throw error;
      }

      setCoupleId(null);
      setInviteCode("");
      setPartnerConnected(false);
      setMemories([]);

      return {
        success: true,
        message: "Partnerforbindelsen er slettet.",
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /* =======================================================
     HENT MINDER
  ======================================================= */

  async function loadMemories() {
    if (!coupleId) return;

    setMemoryLoading(true);

    try {
      const { data, error } = await supabase
        .from("date_memories")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setMemories(data || []);
    } catch (error) {
      console.error("Kunne ikke hente minder:", error);
    }

    setMemoryLoading(false);
  }

  /* =======================================================
     MANUELT TILFØJ MINDE
  ======================================================= */

  async function addMemory(memory) {
    if (!session?.user) {
      return {
        success: false,
        message: "Du skal være logget ind.",
      };
    }

    if (!coupleId) {
      return {
        success: false,
        message: "Du skal først forbinde dig med en partner.",
      };
    }

    try {
      const { error } = await supabase.from("date_memories").insert({
        couple_id: coupleId,
        created_by: session.user.id,
        title: memory.title,
        date: memory.date || null,
        image_url: memory.image_url || null,
      });

      if (error) {
        throw error;
      }

      await loadMemories();

      return {
        success: true,
        message: "Minde gemt ♡",
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /* =======================================================
   SLET MINDE
======================================================= */

  async function deleteMemory(memoryId) {
    if (!session?.user) {
      return {
        success: false,
        message: "Du skal være logget ind.",
      };
    }

    try {
      const { error } = await supabase
        .from("date_memories")
        .delete()
        .eq("id", memoryId);

      if (error) {
        throw error;
      }

      await loadMemories();

      return {
        success: true,
        message: "Mindet er slettet.",
      };
    } catch (error) {
      console.error("Kunne ikke slette minde:", error);

      return {
        success: false,
        message: error.message,
      };
    }
  }
  /* =======================================================
     VI HAR PRØVET DEN
  ======================================================= */

  async function saveTriedDate(dateIdea, options = {}) {
    if (!session?.user) {
      return {
        success: false,
        message: "Du skal være logget ind.",
      };
    }

    if (!coupleId) {
      return {
        success: false,
        message: "Du skal først forbinde dig med din partner.",
      };
    }

    try {
      const { error } = await supabase.from("date_memories").insert({
        couple_id: coupleId,
        created_by: session.user.id,
        title: dateIdea.title,
        date: Object.prototype.hasOwnProperty.call(options, "date")
          ? options.date
          : null,
        image_url: options.image_url || null,
      });

      if (error) {
        throw error;
      }

      await loadMemories();

      return {
        success: true,
        message: "Daten er gemt under Tidligere dates ♡",
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /* =======================================================
     LOG UD
  ======================================================= */

  async function logout() {
    await supabase.auth.signOut();

    setPage("frontpage");

    setCoupleId(null);
    setInviteCode("");
    setPartnerConnected(false);

    setMemories([]);
    setSelectedTags([]);
  }

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {
    return (
      <main className="app">
        <div className="phone auth-loading-page">
          <span>♡</span>
          <p>Åbner Date Ideas...</p>
        </div>
      </main>
    );
  }

  /* =======================================================
     IKKE LOGGET IND
  ======================================================= */

  if (!session) {
    return (
      <main className="app">
        <div className="phone">
          <AuthPage />
        </div>
      </main>
    );
  }

  /* =======================================================
     APP
  ======================================================= */

  return (
    <main className="app">
      <div className="phone">
        {page === "frontpage" && (
          <FrontPage
            setPage={setPage}
            savedDates={savedDates}
            memories={memories}
            hasPartner={partnerConnected}
          />
        )}

        {page === "suggestions" && (
          <SuggestionsPage
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            findDates={findDates}
            setPage={setPage}
          />
        )}

        {page === "loading" && <LoadingPage />}

        {page === "results" && (
          <ResultsPage
            results={results}
            selectedTags={selectedTags}
            openDate={(date) => openDate(date, "results")}
            savedDates={savedDates}
            toggleSaved={toggleSaved}
            setPage={setPage}
          />
        )}

        {page === "details" && selectedDate && (
          <DetailsPage
            date={selectedDate}
            savedDates={savedDates}
            toggleSaved={toggleSaved}
            setPage={setPage}
            backPage={detailsBackPage}
            saveTriedDate={saveTriedDate}
          />
        )}

        {page === "saved" && (
          <SavedPage
            dates={savedDates}
            openDate={openDate}
            toggleSaved={toggleSaved}
          />
        )}

        {page === "spin" && (
          <SpinPage
            dateIdeas={dateIdeas}
            openDate={(date) => openDate(date, "spin")}
            savedDates={savedDates}
            toggleSaved={toggleSaved}
          />
        )}

        {page === "history" && (
          <HistoryPage
            memories={memories}
            addMemory={addMemory}
            deleteMemory={deleteMemory}
            memoryLoading={memoryLoading}
            hasCouple={Boolean(coupleId)}
            goToSettings={() => setPage("settings")}
          />
        )}

        {page === "settings" && (
          <SettingsPage
            session={session}
            coupleId={coupleId}
            inviteCode={inviteCode}
            partnerConnected={partnerConnected}
            createPartnerCode={createPartnerCode}
            joinPartner={joinPartner}
            disconnectPartner={disconnectPartner}
            refreshCouple={loadCouple}
            memories={memories}
            logout={logout}
          />
        )}

        {["frontpage", "saved", "spin", "history", "settings"].includes(
          page,
        ) && <BottomNav page={page} setPage={setPage} />}
      </div>
    </main>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          setSuccess(true);

          setMessage(
            "Din bruger er oprettet. Tjek din email for at bekræfte kontoen ♡",
          );

          setLoading(false);
          return;
        }
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(translateAuthError(error.message));
    }

    setLoading(false);
  }

  return (
    <section className="auth-page">
      <div className="auth-logo">♡</div>

      <span className="eyebrow">DATE IDEAS</span>

      <h1>{mode === "login" ? "Velkommen tilbage" : "Opret din profil"}</h1>

      <p className="auth-description">
        Find dates, gem jeres minder og skab en fælles side med din partner.
      </p>

      <div className="auth-tabs">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
        >
          Log ind
        </button>

        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => {
            setMode("signup");
            setMessage("");
          }}
        >
          Opret bruger
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label>
            Dit navn
            <input
              type="text"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Adgangskode
          <input
            type="password"
            value={password}
            required
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {message && (
          <div className={`auth-message ${success ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <button className="primary" type="submit" disabled={loading}>
          {loading
            ? "Vent lidt..."
            : mode === "login"
              ? "Log ind"
              : "Opret bruger"}
        </button>
      </form>
    </section>
  );
}

/* =========================================================
   FORSIDE
========================================================= */

function FrontPage({ setPage, savedDates, memories, hasPartner }) {
  return (
    <section className="screen front-page">
      <div className="front-top">
        <span className="eyebrow">DATE IDEAS</span>

        <h1>
          Hvad skal
          <br />
          vi lave i dag?
        </h1>

        <p>
          Find inspiration til jeres næste date og gem jeres bedste minder
          sammen.
        </p>
      </div>

      <div className="front-heart">♡</div>

      <button
        className="front-main-button"
        onClick={() => setPage("suggestions")}
      >
        <div>
          <span>FIND EN DATE</span>

          <strong>Hvad er I i humør til?</strong>
        </div>

        <span className="front-arrow">→</span>
      </button>

      <div className="front-section-heading">
        <span className="eyebrow">JERES DATE LIFE</span>

        <h2>Jeres samling</h2>
      </div>

      <div className="front-small-cards">
        <button className="front-small-card" onClick={() => setPage("saved")}>
          <span className="front-card-icon">♡</span>

          <div>
            <strong>{savedDates.length}</strong>
            <p>Gemte idéer</p>
          </div>

          <span>→</span>
        </button>

        <button className="front-small-card" onClick={() => setPage("history")}>
          <span className="front-card-icon">♥</span>

          <div>
            <strong>{memories.length}</strong>
            <p>Tidligere dates</p>
          </div>

          <span>→</span>
        </button>
      </div>

      {!hasPartner && (
        <button
          className="front-partner-card"
          onClick={() => setPage("settings")}
        >
          <div className="front-partner-icon">♡</div>

          <div>
            <strong>Forbind din partner</strong>

            <p>Del jeres dates, billeder og minder</p>
          </div>

          <span>→</span>
        </button>
      )}

      <div className="front-quote">
        <span>♡</span>

        <p>
          De små øjeblikke bliver
          <br />
          til de største minder
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   VÆLG STEMNING
========================================================= */

function SuggestionsPage({ selectedTags, toggleTag, findDates, setPage }) {
  return (
    <section className="screen home-page">
      <button
        type="button"
        className="suggestions-back"
        onClick={() => setPage("frontpage")}
      >
        ←
      </button>

      <header className="home-header">
        <span className="eyebrow">DATE NIGHT</span>

        <h1>Date ideas for today</h1>

        <p>Find den perfekte date ud fra jeres humør.</p>
      </header>

      <div className="mood-card">
        <div className="mood-header">
          <div>
            <h2>Hvad er I i humør til?</h2>

            <p>Vælg 1-3 stemninger</p>
          </div>

          <span>{selectedTags.length}/3</span>
        </div>

        <div className="mood-grid">
          {moodOptions.map((option) => (
            <button
              type="button"
              key={option.label}
              className={`mood ${
                selectedTags.includes(option.label) ? "selected" : ""
              }`}
              onClick={() => toggleTag(option.label)}
            >
              <span className="mood-icon">{option.icon}</span>

              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <button
          className="primary"
          disabled={selectedTags.length === 0}
          onClick={findDates}
        >
          Find vores date →
        </button>
      </div>
    </section>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingPage() {
  return (
    <section className="screen loading-page">
      <span className="eyebrow">ET ØJEBLIK</span>

      <h1>Finding your date idea...</h1>

      <p>Vi finder de bedste idéer til jer lige nu</p>

      <div className="loading-heart">♡</div>

      <div className="spinner">
        <div />
      </div>
    </section>
  );
}

/* =========================================================
   RESULTS
========================================================= */

function ResultsPage({
  results,
  selectedTags,
  openDate,
  savedDates,
  toggleSaved,
  setPage,
}) {
  return (
    <section className="screen page-with-nav">
      <PageHeader
        eyebrow="MATCHET TIL JER"
        title="Jeres date idéer"
        description={`Baseret på ${selectedTags.join(", ")}`}
      />

      {results.length === 0 ? (
        <div className="empty">
          <div className="empty-heart">♡</div>

          <h2>Vi kunne ikke finde noget</h2>

          <button className="outline" onClick={() => setPage("suggestions")}>
            Prøv igen
          </button>
        </div>
      ) : (
        <>
          <div className="date-list">
            {results.map((date) => (
              <DateCard
                key={date.id}
                date={date}
                saved={savedDates.some((item) => item.id === date.id)}
                openDate={openDate}
                toggleSaved={toggleSaved}
              />
            ))}
          </div>

          <button
            className="outline bottom-button"
            onClick={() => setPage("suggestions")}
          >
            Vælg nye stemninger
          </button>
        </>
      )}
    </section>
  );
}

/* =========================================================
   DATE CARD
========================================================= */

function DateCard({ date, saved, openDate, toggleSaved }) {
  return (
    <article className="date-card">
      {date.image_url ? (
        <img
          src={date.image_url}
          alt={date.title}
          onClick={() => openDate(date)}
        />
      ) : (
        <div className="memory-image" onClick={() => openDate(date)}>
          ♡
        </div>
      )}

      <div className="date-card-content" onClick={() => openDate(date)}>
        <h3>{date.title}</h3>

        <div className="tags">
          {date.tags?.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`heart-button ${saved ? "saved" : ""}`}
        onClick={() => toggleSaved(date)}
      >
        {saved ? "♥" : "♡"}
      </button>
    </article>
  );
}

/* =========================================================
   DETAILS
========================================================= */

function DetailsPage({
  date,
  savedDates,
  toggleSaved,
  setPage,
  backPage,
  saveTriedDate,
}) {
  const saved = savedDates.some((item) => item.id === date.id);

  const [showTriedModal, setShowTriedModal] = useState(false);

  const [showExtraFields, setShowExtraFields] = useState(false);

  const [triedDate, setTriedDate] = useState("");

  const [triedImage, setTriedImage] = useState("");

  const [triedSaving, setTriedSaving] = useState(false);

  const [triedMessage, setTriedMessage] = useState("");

  function closeTriedModal() {
    setShowTriedModal(false);
    setShowExtraFields(false);
    setTriedDate("");
    setTriedImage("");
    setTriedMessage("");
  }

  function handleTriedImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setTriedMessage("Vælg et billede under 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setTriedImage(reader.result);
      setTriedMessage("");
    };

    reader.readAsDataURL(file);
  }

  /* GEM UDEN DATO/BILLEDE */

  async function handleQuickSave() {
    setTriedSaving(true);
    setTriedMessage("");

    const result = await saveTriedDate(date, {
      date: null,
      image_url: null,
    });

    setTriedSaving(false);

    if (!result.success) {
      setTriedMessage(result.message);
      return;
    }

    closeTriedModal();
    setPage("history");
  }

  /* GEM MED DATO/BILLEDE */

  async function handleDetailedSave(event) {
    event.preventDefault();

    if (!triedDate) {
      setTriedMessage("Vælg datoen for jeres date.");
      return;
    }

    setTriedSaving(true);
    setTriedMessage("");

    const result = await saveTriedDate(date, {
      date: triedDate,
      image_url: triedImage || null,
    });

    setTriedSaving(false);

    if (!result.success) {
      setTriedMessage(result.message);
      return;
    }

    closeTriedModal();
    setPage("history");
  }

  return (
    <section className="screen details">
      <div className="details-image">
        {date.image_url ? (
          <img src={date.image_url} alt={date.title} />
        ) : (
          <div className="memory-image">♡</div>
        )}

        <button
          type="button"
          className="circle-button back"
          onClick={() => setPage(backPage)}
        >
          ←
        </button>

        <button
          type="button"
          className={`circle-button save ${saved ? "saved" : ""}`}
          onClick={() => toggleSaved(date)}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <div className="details-content">
        <div className="tags">
          {date.tags?.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <h1>{date.title}</h1>

        <p className="description">{date.description}</p>

        <div className="detail-info">
          <div>
            <span>◷</span>

            <strong>{date.duration || "Et par timer"}</strong>

            <small>Tid</small>
          </div>

          <div>
            <span>⌖</span>

            <strong>{date.location || "Valgfrit"}</strong>

            <small>Sted</small>
          </div>

          <div>
            <span>♡</span>

            <strong>{date.tags?.[0] || "Hyggeligt"}</strong>

            <small>Stemning</small>
          </div>
        </div>

        <button className="primary" onClick={() => setShowTriedModal(true)}>
          Vi har prøvet den ♡
        </button>

        <button className="outline" onClick={() => toggleSaved(date)}>
          {saved ? "Fjern fra gemte ♥" : "Gem idé ♡"}
        </button>
      </div>

      {showTriedModal && (
        <div className="modal-background" onClick={closeTriedModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={closeTriedModal}
            >
              ×
            </button>

            <span className="eyebrow">TIDLIGERE DATE</span>

            <h2>Har I prøvet denne date?</h2>

            {!showExtraFields ? (
              <>
                <p className="modal-intro-text">
                  Vil du bare gemme daten, eller vil du også tilføje dato og et
                  billede?
                </p>

                <div className="tried-choice-grid">
                  <button
                    type="button"
                    className="choice-card"
                    onClick={handleQuickSave}
                    disabled={triedSaving}
                  >
                    <strong>Gem bare daten</strong>

                    <p>Tilføj den til tidligere dates uden billede og dato.</p>
                  </button>

                  <button
                    type="button"
                    className="choice-card"
                    onClick={() => setShowExtraFields(true)}
                  >
                    <strong>Tilføj dato og billede</strong>

                    <p>Gem jeres eget minde fra daten.</p>
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleDetailedSave}>
                <label className="upload">
                  {triedImage ? (
                    <img src={triedImage} alt="Preview" />
                  ) : (
                    <>
                      <span>＋</span>
                      <p>Tilføj billede</p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTriedImage}
                  />
                </label>

                <label className="input-label">
                  Dato
                  <input
                    type="date"
                    value={triedDate}
                    onChange={(event) => setTriedDate(event.target.value)}
                  />
                </label>

                <button
                  className="primary"
                  type="submit"
                  disabled={triedSaving}
                >
                  {triedSaving ? "Gemmer..." : "Gem under tidligere dates ♡"}
                </button>

                <button
                  type="button"
                  className="outline"
                  onClick={() => setShowExtraFields(false)}
                >
                  Tilbage
                </button>
              </form>
            )}

            {triedMessage && <p className="form-message">{triedMessage}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   SPIN EN DATE
========================================================= */

function SpinPage({
  dateIdeas,
  openDate,
  savedDates,
  toggleSaved,
}) {
  const [rotation, setRotation] =
    useState(0);

  const [isSpinning, setIsSpinning] =
    useState(false);

  const [spinResult, setSpinResult] =
    useState(null);

  const [winnerCategory, setWinnerCategory] =
    useState("");

  const segmentAngle =
    360 / wheelCategories.length;

  /* =======================================================
     SPIN
  ======================================================= */

  function spinWheel() {
    if (isSpinning) return;

    /*
      Vi tager kun dates, der har mindst
      én af kategorierne fra hjulet.
    */

    const possibleDates = dateIdeas.filter((date) => {
      const hasImage = date.image_url && date.image_url.trim() !== "";

      const hasWheelCategory = date.tags?.some((tag) =>
        wheelCategories.some((category) => category.label === tag),
      );

      return hasImage && hasWheelCategory;
    });

    if (possibleDates.length === 0) {
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);
    setWinnerCategory("");

    /*
      1. Vælg daten HELT tilfældigt.

      Det betyder, at hver date har
      samme chance for at blive valgt.
    */

    const selectedDate =
      possibleDates[
        randomIndex(
          possibleDates.length
        )
      ];

    /*
      2. Find alle kategorier på hjulet,
      som den valgte date tilhører.
    */

    const matchingCategories =
      selectedDate.tags.filter((tag) =>
        wheelCategories.some(
          (category) =>
            category.label === tag
        )
      );

    /*
      3. Hvis daten har flere kategorier,
      vælger vi også én af dem tilfældigt.
    */

    const selectedCategory =
      matchingCategories[
        randomIndex(
          matchingCategories.length
        )
      ];

    const categoryIndex =
      wheelCategories.findIndex(
        (category) =>
          category.label ===
          selectedCategory
      );

    /*
      Beregn hvor hjulet skal stoppe.

      Segment 0 har sit centrum ved 0°.
      Pilen står fast øverst.
    */

    const categoryAngle =
      categoryIndex *
      segmentAngle;

    const currentAngle =
      ((rotation % 360) + 360) %
      360;

    const neededRotation =
      (360 -
        ((categoryAngle +
          currentAngle) %
          360)) %
      360;

    /*
      Minimum 5 hele omgange,
      så animationen føles som et spin.
    */

    const newRotation =
      rotation +
      360 * 5 +
      neededRotation;

    setRotation(newRotation);

    /*
      Vent til hjulet er færdigt,
      og vis så daten.
    */

    window.setTimeout(() => {
      setWinnerCategory(
        selectedCategory
      );

      setSpinResult(
        selectedDate
      );

      setIsSpinning(false);
    }, 3200);
  }

  const saved =
    spinResult &&
    savedDates.some(
      (item) =>
        item.id ===
        spinResult.id
    );

  return (
    <section className="screen page-with-nav spin-page">
      {/* =====================================
          OVERSKRIFT
      ===================================== */}

      <header className="spin-header">
        <span className="eyebrow">SPIN EN DATE</span>

        {!spinResult ? (
          <>
            <h1>Lad skæbnen bestemme ♡</h1>

            <p>Spin hjulet og få en tilfældig dateidé.</p>
          </>
        ) : (
          <>
            <h1>Hjulet har valgt {winnerCategory.toLowerCase()} ♡</h1>

            <p>Appen har fundet en date til jer i den valgte kategori.</p>
          </>
        )}
      </header>

      {/* =====================================
          HJUL
      ===================================== */}

      <div className="date-wheel-wrapper">
        <div className="wheel-pointer">▼</div>

        <div
          className={`date-wheel ${isSpinning ? "spinning" : ""}`}
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <div className="wheel-colours" />

          {wheelCategories.map((category, index) => {
            const angle = index * segmentAngle;

            return (
              <div
                key={category.label}
                className="wheel-label-position"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div
                  className="wheel-label"
                  style={{
                    transform: `translateY(-123px) rotate(${-angle}deg)`,
                  }}
                >
                  <span>{category.icon}</span>

                  <small>{category.label}</small>
                </div>
              </div>
            );
          })}

          <div className="wheel-center">♡</div>
        </div>
      </div>

      {/* =====================================
          FØR SPIN
      ===================================== */}

      {!spinResult && (
        <>
          <button
            type="button"
            className="primary spin-main-button"
            onClick={spinWheel}
            disabled={isSpinning || dateIdeas.length === 0}
          >
            {isSpinning ? "Hjulet spinner..." : "Spin hjulet"}
          </button>

          <p className="spin-quote">
            De bedste dates sker nogle gange ved et tilfælde ♡
          </p>
        </>
      )}

      {/* =====================================
          RESULTAT
      ===================================== */}

      {spinResult && (
        <div className="spin-result">
          <article className="spin-result-card">
            <div className="spin-result-image">
              <img src={spinResult.image_url} alt={spinResult.title} />
            </div>

            <div className="spin-result-content">
              <div className="spin-result-title-row">
                <h2>{spinResult.title}</h2>

                <button
                  type="button"
                  className={`spin-save-button ${saved ? "saved" : ""}`}
                  onClick={() => toggleSaved(spinResult)}
                >
                  {saved ? "♥" : "♡"}
                </button>
              </div>

              <p>{spinResult.description}</p>

              <div className="tags">
                {spinResult.tags?.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </article>

          <button
            type="button"
            className="primary spin-result-primary"
            onClick={() => openDate(spinResult)}
          >
            Prøv denne date
          </button>

          <button
            type="button"
            className="outline spin-again-button"
            onClick={spinWheel}
            disabled={isSpinning}
          >
            {isSpinning ? "Spinner..." : "Spin igen"}
          </button>

          <p className="spin-again-text">
            ♡ Vil I hellere have noget andet? Spin igen og få en ny idé.
          </p>
        </div>
      )}
    </section>
  );
}
/* =========================================================
   GEMTE DATES
========================================================= */

function SavedPage({ dates, openDate, toggleSaved }) {
  return (
    <section className="screen page-with-nav">
      <PageHeader
        eyebrow="FAVORITTER"
        title="Gemte idéer"
        description="Dates I gerne vil prøve sammen"
      />

      {dates.length === 0 ? (
        <div className="empty">
          <div className="empty-heart">♡</div>

          <h2>Ingen gemte idéer endnu</h2>
        </div>
      ) : (
        <div className="date-list">
          {dates.map((date) => (
            <DateCard
              key={date.id}
              date={date}
              saved
              openDate={openDate}
              toggleSaved={toggleSaved}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   TIDLIGERE DATES
========================================================= */

function HistoryPage({
  memories,
  addMemory,
  deleteMemory,
  memoryLoading,
  hasCouple,
  goToSettings,
}) {
  const [showModal, setShowModal] = useState(false);

  const [selectedMemory, setSelectedMemory] = useState(null);

  const [title, setTitle] = useState("");

  const [date, setDate] = useState("");

  const [image, setImage] = useState("");

  const [message, setMessage] = useState("");

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [deleteMessage, setDeleteMessage] = useState("");

  /* =========================================
     BILLEDE UPLOAD
  ========================================= */

  function handleImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Vælg et billede under 2 MB.");

      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
      setMessage("");
    };

    reader.readAsDataURL(file);
  }

  /* =========================================
     GEM NYT MINDE
  ========================================= */

  async function submit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Skriv navnet på daten.");
      return;
    }

    if (!date) {
      setMessage("Vælg en dato.");
      return;
    }

    setSaving(true);

    const result = await addMemory({
      title,
      date,
      image_url: image,
    });

    setSaving(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setTitle("");
    setDate("");
    setImage("");
    setMessage("");
    setShowModal(false);
  }

  /* =========================================
     ÅBN TIDLIGERE DATE
  ========================================= */

  function openMemory(memory) {
    setSelectedMemory(memory);
  }

  function closeMemory() {
    setSelectedMemory(null);
  }

  async function handleDeleteMemory() {
    if (!selectedMemory) return;

    const confirmed = window.confirm(
      `Er du sikker på, at du vil slette "${selectedMemory.title}"?`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteMessage("");

    const result = await deleteMemory(selectedMemory.id);

    setDeleting(false);

    if (!result.success) {
      setDeleteMessage(result.message);
      return;
    }

    setSelectedMemory(null);
  }

  return (
    <section className="screen page-with-nav">
      <PageHeader
        eyebrow="JERES HISTORIE"
        title="Tidligere dates"
        description="Gem jeres minder sammen"
      />

      {/* =====================================
          IKKE FORBUNDET
      ===================================== */}

      {!hasCouple && (
        <div className="connect-first-card">
          <span>♡</span>

          <h2>Forbind din partner</h2>

          <p>Opret eller indtast en partnerkode for at få en fælles side.</p>

          <button className="primary" onClick={goToSettings}>
            Gå til indstillinger
          </button>
        </div>
      )}

      {/* =====================================
          TILFØJ NY DATE
      ===================================== */}

      {hasCouple && (
        <button
          type="button"
          className="add-memory"
          onClick={() => setShowModal(true)}
        >
          <span className="plus">+</span>

          <div>
            <strong>Tilføj nyt minde</strong>

            <p>Tilføj billede og dato</p>
          </div>

          <span>→</span>
        </button>
      )}

      <div className="section-heading">
        <h2>Jeres tidligere minder</h2>

        <span>{memories.length}</span>
      </div>

      {/* =====================================
          MINDER
      ===================================== */}

      {memoryLoading ? (
        <div className="empty-small">
          <span>♡</span>

          <p>Henter jeres minder...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="empty-small">
          <span>♡</span>

          <p>Jeres første minde venter på jer.</p>
        </div>
      ) : (
        <div className="memory-grid">
          {memories.map((memory) => (
            <button
              type="button"
              className="memory-card memory-button"
              key={memory.id}
              onClick={() => openMemory(memory)}
            >
              <div className="memory-image">
                {memory.image_url ? (
                  <img src={memory.image_url} alt={memory.title} />
                ) : (
                  <span>♡</span>
                )}
              </div>

              <div className="memory-content">
                <h3>{memory.title}</h3>

                <p>
                  {memory.date ? formatDate(memory.date) : "Dato ikke angivet"}
                </p>

                <span className="memory-open-text">Se minde →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* =====================================
          OVERLAY – SE TIDLIGERE DATE
      ===================================== */}

      {selectedMemory && (
        <div
          className="modal-background memory-detail-background"
          onClick={closeMemory}
        >
          <article
            className="memory-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={closeMemory}>
              ×
            </button>

            {/* BILLEDE */}

            <div className="memory-detail-image">
              {selectedMemory.image_url ? (
                <img
                  src={selectedMemory.image_url}
                  alt={selectedMemory.title}
                />
              ) : (
                <div className="memory-detail-no-image">
                  <span>♡</span>

                  <p>Intet billede tilføjet</p>
                </div>
              )}
            </div>

            {/* TEKST */}

            <div className="memory-detail-content">
              <span className="eyebrow">JERES MINDE</span>

              <h2>{selectedMemory.title}</h2>

              <div className="memory-detail-date">
                <span>♡</span>

                <div>
                  <small>Dato</small>

                  <strong>
                    {selectedMemory.date
                      ? formatDate(selectedMemory.date)
                      : "Ikke angivet"}
                  </strong>
                </div>
              </div>

              <p className="memory-detail-quote">
                Et lille øjeblik fra jeres historie sammen ♡
              </p>

              {deleteMessage && <p className="form-message">{deleteMessage}</p>}

              <button
                type="button"
                className="delete-memory-button"
                onClick={handleDeleteMemory}
                disabled={deleting}
              >
                {deleting ? "Sletter..." : "Slet minde"}
              </button>
            </div>
          </article>
        </div>
      )}

      {/* =====================================
          MODAL – TILFØJ NYT MINDE
      ===================================== */}

      {showModal && (
        <div className="modal-background" onClick={() => setShowModal(false)}>
          <form
            className="modal"
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <span className="eyebrow">NYT MINDE</span>

            <h2>Gem jeres date</h2>

            <label className="upload">
              {image ? (
                <img src={image} alt="Preview" />
              ) : (
                <>
                  <span>＋</span>

                  <p>Tilføj billede</p>
                </>
              )}

              <input type="file" accept="image/*" onChange={handleImage} />
            </label>

            <label className="input-label">
              Navn på daten
              <input
                type="text"
                value={title}
                placeholder="Fx Picnic i solnedgangen"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="input-label">
              Dato
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            {message && <p className="form-message">{message}</p>}

            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Gemmer..." : "Gem minde ♡"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   INDSTILLINGER
========================================================= */

function SettingsPage({
  session,
  coupleId,
  inviteCode,
  partnerConnected,
  createPartnerCode,
  joinPartner,
  disconnectPartner,
  refreshCouple,
  memories,
  logout,
}) {
  const [partnerCode, setPartnerCode] = useState("");

  const [message, setMessage] = useState("");

  const [success, setSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  /* =======================================================
     OPRET KODE
  ======================================================= */

  async function handleCreateCode() {
    setLoading(true);
    setMessage("");

    const result = await createPartnerCode();

    setLoading(false);

    setSuccess(result.success);
    setMessage(result.message);
  }

  /* =======================================================
     JOIN KODE
  ======================================================= */

  async function handleJoinPartner() {
    if (!partnerCode.trim()) {
      setSuccess(false);
      setMessage("Indtast en partnerkode.");
      return;
    }

    setLoading(true);
    setMessage("");

    const result = await joinPartner(partnerCode);

    setLoading(false);

    setSuccess(result.success);
    setMessage(result.message);

    if (result.success) {
      setPartnerCode("");
    }
  }

  /* =======================================================
     COPY
  ======================================================= */

  async function copyCode() {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);

      setSuccess(true);

      setMessage("Partnerkoden er kopieret ♡");
    } catch {
      setSuccess(false);

      setMessage("Kunne ikke kopiere koden.");
    }
  }

  /* =======================================================
     REFRESH PARTNER
  ======================================================= */

  async function handleRefreshPartner() {
    setLoading(true);
    setMessage("");

    await refreshCouple();

    setLoading(false);

    setSuccess(true);

    setMessage("Partnerstatus er opdateret.");
  }

  /* =======================================================
     DISCONNECT
  ======================================================= */

  async function handleDisconnect() {
    const confirmed = window.confirm(
      partnerConnected
        ? "Er du sikker på, at du vil slette partnerforbindelsen?"
        : "Er du sikker på, at du vil annullere invitationen?",
    );

    if (!confirmed) return;

    setLoading(true);

    const result = await disconnectPartner();

    setLoading(false);

    setSuccess(result.success);
    setMessage(result.message);
  }

  const newestMemories = memories.slice(0, 3);

  const memoryImages = memories
    .filter((memory) => Boolean(memory.image_url))
    .slice(0, 3);

  return (
    <section className="screen page-with-nav">
      <header className="settings-header">
        <span className="eyebrow">JERES APP</span>

        <h1>Indstillinger</h1>

        <p>Gør appen personlig for jer begge</p>
      </header>

      {/* PROFIL */}

      <section className="profile-card">
        <div className="profile-avatar">{getInitial(session?.user)}</div>

        <div>
          <span>Logget ind som</span>

          <strong>
            {session?.user?.user_metadata?.name || session?.user?.email}
          </strong>

          <small>{session?.user?.email}</small>
        </div>
      </section>

      {/* ===================================================
          1. INGEN COUPLE ENDNU
      =================================================== */}

      {!coupleId ? (
        <section className="partner-card">
          <div className="partner-top">
            <div className="partner-icon">♡</div>

            <div>
              <h2>Tilføj partner</h2>

              <p>
                Opret en kode til din partner, eller indtast den kode din
                partner har sendt til dig.
              </p>
            </div>
          </div>

          <div className="partner-options">
            <div className="partner-option">
              <span className="option-number">1</span>

              <h3>Invitér din partner</h3>

              <p>Opret en personlig kode og send den til din partner.</p>

              <button
                type="button"
                className="primary"
                onClick={handleCreateCode}
                disabled={loading}
              >
                {loading ? "Vent lidt..." : "Opret partnerkode"}
              </button>
            </div>

            <div className="partner-divider">
              <span>eller</span>
            </div>

            <div className="partner-option">
              <span className="option-number">2</span>

              <h3>Har du fået en kode?</h3>

              <p>Indtast partnerens kode herunder.</p>

              <input
                className="partner-code-input"
                type="text"
                value={partnerCode}
                maxLength={10}
                placeholder="FX A7K3PL"
                onChange={(event) =>
                  setPartnerCode(event.target.value.toUpperCase())
                }
              />

              <button
                type="button"
                className="outline"
                onClick={handleJoinPartner}
                disabled={loading || !partnerCode.trim()}
              >
                {loading ? "Forbinder..." : "Forbind med partner"}
              </button>
            </div>
          </div>

          {message && (
            <p className={`partner-message ${success ? "success" : "error"}`}>
              {message}
            </p>
          )}
        </section>
      ) : !partnerConnected ? (
        /* =================================================
           2. KODE OPRETTET - VENTER PÅ PARTNER
        ================================================= */

        <section className="partner-card waiting-partner-card">
          <div className="waiting-heart">♡</div>

          <span className="eyebrow">INVITÉR DIN PARTNER</span>

          <h2>Venter på din partner</h2>

          <p>
            Send koden herunder til din partner. Når din partner indtaster den,
            bliver jeres fælles side aktiveret.
          </p>

          <div className="your-code">
            <span>Din partnerkode</span>

            <strong>{inviteCode}</strong>

            <button type="button" onClick={copyCode}>
              Kopiér kode
            </button>
          </div>

          <button
            type="button"
            className="primary"
            onClick={handleRefreshPartner}
            disabled={loading}
          >
            {loading ? "Tjekker..." : "Tjek om partner er forbundet"}
          </button>

          <button
            type="button"
            className="cancel-invite-button"
            onClick={handleDisconnect}
          >
            Annuller invitation
          </button>

          {message && (
            <p className={`partner-message ${success ? "success" : "error"}`}>
              {message}
            </p>
          )}
        </section>
      ) : (
        /* =================================================
           3. RIGTIG PARTNER FORBUNDET
        ================================================= */

        <section className="couple-page-card">
          <div className="couple-page-top">
            <div>
              <h2>Fælles side</h2>

              <p>Se et preview af jeres fælles side</p>
            </div>

            <div className="couple-avatars">
              <div className="couple-avatar">{getInitial(session?.user)}</div>

              <span className="couple-heart">♥</span>

              <div className="couple-avatar partner"></div>
            </div>
          </div>

          <div className="couple-page-content">
            {/* VENSTRE */}

            <div className="couple-preview-left">
              <div className="couple-photo-grid">
                {memoryImages.length > 0 ? (
                  memoryImages.map((memory) => (
                    <img
                      key={memory.id}
                      src={memory.image_url}
                      alt={memory.title}
                    />
                  ))
                ) : (
                  <>
                    <div className="empty-preview-image">♡</div>

                    <div className="empty-preview-image">♡</div>

                    <div className="empty-preview-image">♡</div>
                  </>
                )}
              </div>

              <div className="couple-feature-list">
                <div>
                  <span>♡</span>

                  <div>
                    <strong>Delt</strong>

                    <p>Alle dates samlet ét sted</p>
                  </div>
                </div>

                <div>
                  <span>▧</span>

                  <div>
                    <strong>Billeder</strong>

                    <p>Del jeres bedste øjeblikke</p>
                  </div>
                </div>

                <div>
                  <span>✦</span>

                  <div>
                    <strong>Minder</strong>

                    <p>Skab minder sammen</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HØJRE */}

            <div className="couple-date-preview">
              {newestMemories.length > 0 ? (
                newestMemories.map((memory) => (
                  <div className="couple-date-row" key={memory.id}>
                    <span className="couple-calendar-icon">▣</span>

                    <div>
                      <strong>{memory.title}</strong>

                      <p>
                        {memory.date
                          ? formatDate(memory.date)
                          : "Dato ikke angivet"}
                      </p>
                    </div>

                    <span className="shared-label">Delt</span>
                  </div>
                ))
              ) : (
                <div className="couple-empty-dates">
                  <span>♡</span>

                  <p>Jeres tidligere dates vil blive vist her.</p>
                </div>
              )}
            </div>
          </div>

          {inviteCode && (
            <div className="couple-code-row">
              <div>
                <span>Jeres partnerkode</span>

                <strong>{inviteCode}</strong>
              </div>

              <button type="button" onClick={copyCode}>
                Kopiér
              </button>
            </div>
          )}
        </section>
      )}

      {/* BESKED EFTER FORBINDELSE */}

      {partnerConnected && message && (
        <p className={`partner-message ${success ? "success" : "error"}`}>
          {message}
        </p>
      )}

      {/* INDSTILLINGER */}

      <section className="settings-list settings-list-large">
        <button type="button">
          <span>♧</span>
          <p>Notifikationer</p>
          <strong>›</strong>
        </button>

        <button type="button">
          <span>▣</span>
          <p>Privatliv</p>
          <strong>›</strong>
        </button>

        {partnerConnected && (
          <button
            type="button"
            className="disconnect-setting"
            onClick={handleDisconnect}
          >
            <span>♡</span>

            <p>Slet partnerforbindelse</p>

            <strong>›</strong>
          </button>
        )}

        <button type="button" className="logout-setting" onClick={logout}>
          <span>↪</span>
          <p>Log ud</p>
          <strong>›</strong>
        </button>
      </section>
    </section>
  );
}

/* =========================================================
   HEADER
========================================================= */

function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      <span className="header-heart">♡</span>
    </header>
  );
}

/* =========================================================
   BOTTOM NAV
========================================================= */

function BottomNav({ page, setPage }) {
  const navigation = [
  {
    id: "frontpage",
    label: "Forside",
    icon: "⌂",
  },
  {
    id: "saved",
    label: "Gemte",
    icon: "♡",
  },
  {
    id: "spin",
    label: "Spin",
    icon: "◉",
  },
  {
    id: "history",
    label: "Tidligere",
    icon: "♥",
  },
  {
    id: "settings",
    label: "Indstillinger",
    icon: "⚙",
  },
];
  

  return (
    <nav className="bottom-nav">
      {navigation.map((item) => (
        <button
          type="button"
          key={item.id}
          className={page === item.id ? "active" : ""}
          onClick={() => setPage(item.id)}
        >
          <span>{item.icon}</span>

          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) {
    return "Dato ikke angivet";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitial(user) {
  const name = user?.user_metadata?.name;

  if (name) {
    return name.charAt(0).toUpperCase();
  }

  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "♡";
}

function translateAuthError(message) {
  if (!message) {
    return "Der skete en fejl.";
  }

  if (message.includes("Invalid login credentials")) {
    return "Email eller adgangskode er forkert.";
  }

  if (message.includes("User already registered")) {
    return "Der findes allerede en bruger med denne email.";
  }

  if (message.includes("Email not confirmed")) {
    return "Du skal bekræfte din email.";
  }

  return message;
}

export default App;
