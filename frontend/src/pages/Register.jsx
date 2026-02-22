import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await API.post("/auth/register", { name, email, password });
      alert("Registration successful");
      navigate("/");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="page-transition flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="mb-6 text-center text-3xl font-extrabold text-zinc-900">Create Account</h2>

        <input
          placeholder="Full Name"
          className="mb-4 w-full rounded-xl border border-zinc-300 p-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          onChange={(e) => setName(e.target.value)}
        />

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
          onClick={handleRegister}
          className="w-full rounded-full bg-zinc-900 p-3 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Register
        </button>

        <p className="mt-4 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <span className="cursor-pointer font-semibold text-zinc-900" onClick={() => navigate("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
