import React, { useState } from "react";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import imagen1 from "../assets/imagen1.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/homescreen"); // 👈 redirige a tu pantalla principal
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div className="loginContainer">
      <div className="formSection">
        <h1>Iniciar sesión</h1>
        <form className="form" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Iniciar sesión</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
      <div className="imageSection" 
      style={{ backgroundImage: `url(${imagen1})` }}>
      </div>
    </div>
  );
};

export default Login;
