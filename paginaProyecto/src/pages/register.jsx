import React, { useState } from "react";
import "../styles/register.css";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import imagen1 from "../assets/imagen1.jpg";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/login"); // redirige al login después del registro
    } catch (err) {
      setError("Error al registrarse: " + err.message);
    }
  };

  return (
    <div className="registerContainer">
      <div className="formSection">
        <h1>Crea una cuenta</h1>
        <form className="form" onSubmit={handleRegister}>
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
          <button type="submit">Registrarse</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <p>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
      <div className="imageSection" 
        style={{ backgroundImage: `url(${imagen1})` }}>
      </div>
    </div>
  );
};

export default Register;
