import { useState } from "react";
import { supabase } from "./supabaseClient";

function AuthPage() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,

          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          throw error;
        }

        setMessage("Din bruger er oprettet ♡");
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      setMessage(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-heart">♡</div>

      <p className="eyebrow">DATE IDEAS</p>

      <h1>{mode === "login" ? "Velkommen tilbage" : "Opret din profil"}</h1>

      <p className="auth-intro">Gem jeres dates og skab minder sammen.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <label>
            Dit navn
            <input
              type="text"
              value={name}
              required
              placeholder="Lærke"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            required
            value={email}
            placeholder="dig@email.dk"
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Adgangskode
          <input
            type="password"
            required
            minLength="6"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {message && <p className="auth-message">{message}</p>}

        <button className="primary" disabled={loading}>
          {loading
            ? "Vent lidt..."
            : mode === "login"
              ? "Log ind"
              : "Opret bruger"}
        </button>
      </form>

      <button
        className="auth-switch"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");

          setMessage("");
        }}
      >
        {mode === "login"
          ? "Har du ikke en bruger? Opret bruger"
          : "Har du allerede en bruger? Log ind"}
      </button>
    </div>
  );
}

export default AuthPage;
