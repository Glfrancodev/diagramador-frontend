import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Para la redirección

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleGoToRegister = () => {
    navigate("/register"); // Redirige a la página de registro
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/80 backdrop-blur rounded-xl shadow-lg px-8 py-10 dark:bg-gray-900/70 dark:shadow-gray-800"
      >
        <h1 className="mb-8 text-center text-3xl font-extrabold text-gray-800 dark:text-white">
          Diagramador
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </div>

        {/* Enlace para ir a la página de registro */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ¿No tienes cuenta?{" "}
            <button
              onClick={handleGoToRegister}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Regístrate
            </button>
          </p>
        </div>
      </form>
    </main>
  );
}

export default Login;
