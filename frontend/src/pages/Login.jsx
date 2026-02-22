import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="page-transition flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-zinc-900">Welcome Back</h2>

        <input
          type="email"
          placeholder="Email"
          className="mb-4 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-6 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full rounded-full bg-zinc-900 p-3 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <span className="cursor-pointer font-semibold text-zinc-900" onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
