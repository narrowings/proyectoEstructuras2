import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import "../styles/homescreen.css";

// ============================
// ESTRUCTURAS EXISTENTES
// ============================
class Nodo {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class ListaEnlazada {
  constructor() {
    this.head = null;
  }

  insertar(data) {
    const nuevo = new Nodo(data);
    if (!this.head) {
      this.head = nuevo;
    } else {
      let actual = this.head;
      while (actual.next) actual = actual.next;
      actual.next = nuevo;
    }
  }

  recorrer() {
    const array = [];
    let actual = this.head;
    while (actual) {
      array.push(actual.data);
      actual = actual.next;
    }
    return array;
  }
}

// ============================
// ÁRBOL BINARIO (ORDENAR PRECIOS)
// ============================
class NodoArbol {
  constructor(data) {
    this.data = data;
    this.izq = null;
    this.der = null;
  }
}

class ArbolPrecios {
  constructor() {
    this.raiz = null;
  }

  insertar(data) {
    const nuevo = new NodoArbol(data);
    if (!this.raiz) {
      this.raiz = nuevo;
    } else {
      this._insertarNodo(this.raiz, nuevo);
    }
  }

  _insertarNodo(raiz, nuevo) {
    if (nuevo.data.precio < raiz.data.precio) {
      if (!raiz.izq) raiz.izq = nuevo;
      else this._insertarNodo(raiz.izq, nuevo);
    } else {
      if (!raiz.der) raiz.der = nuevo;
      else this._insertarNodo(raiz.der, nuevo);
    }
  }

  inOrden(nodo = this.raiz, result = []) {
    if (nodo) {
      this.inOrden(nodo.izq, result);
      result.push(nodo.data);
      this.inOrden(nodo.der, result);
    }
    return result;
  }
}

// ============================
// COMPONENTE PRINCIPAL
// ============================
const alojamientosBase = [
  { id: 1, ciudad: "Bogotá", tipo: "Loft céntrico", precio: 180000 },
  { id: 2, ciudad: "Medellín", tipo: "Casa en el campo", precio: 160000 },
  { id: 3, ciudad: "Cartagena", tipo: "Depto con vista", precio: 200000 },
  { id: 4, ciudad: "Cali", tipo: "Apartamento moderno", precio: 175000 },
  { id: 5, ciudad: "Santa Marta", tipo: "Cabaña frente al mar", precio: 210000 },
];

const HomeScreen = () => {
  const [busqueda, setBusqueda] = useState("");
  const [lista, setLista] = useState(new ListaEnlazada());
  const [arbol, setArbol] = useState(new ArbolPrecios());
  const [resultados, setResultados] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // ======================
  // Cargar alojamientos (una sola vez)
  // ======================
  useEffect(() => {
    const nuevaLista = new ListaEnlazada();
    const nuevoArbol = new ArbolPrecios();

    const alojamientosConImagenes = alojamientosBase.map((a, index) => ({
      ...a,
      img: `https://picsum.photos/seed/house${index}/400/300`,
    }));

    alojamientosConImagenes.forEach((a) => {
      nuevaLista.insertar(a);
      nuevoArbol.insertar(a);
    });

    setLista(nuevaLista);
    setArbol(nuevoArbol);
    setResultados(nuevaLista.recorrer());
  }, []);

  // ======================
  // Cargar historial desde Firebase
  // ======================
  const cargarHistorial = async () => {
    const usuario = auth.currentUser;
    if (!usuario) return;
    setCargandoHistorial(true);

    try {
      const q = query(
        collection(db, "busquedas"),
        where("usuario", "==", usuario.uid),
        orderBy("fecha", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => doc.data().texto);
      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }

    setCargandoHistorial(false);
  };

  // ======================
  // Guardar búsqueda (evita duplicados)
  // ======================
  const guardarBusqueda = async () => {
    const texto = busqueda.trim();
    if (!texto) return;
    const usuario = auth.currentUser;
    if (!usuario) return;

    try {
      // Evitar duplicados
      const q = query(
        collection(db, "busquedas"),
        where("usuario", "==", usuario.uid),
        where("texto", "==", texto)
      );
      const existe = await getDocs(q);
      if (!existe.empty) return; // si ya está guardada, no agrega otra

      await addDoc(collection(db, "busquedas"), {
        usuario: usuario.uid,
        texto,
        fecha: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error guardando búsqueda:", error);
    }
  };

  // ======================
  // Mostrar historial
  // ======================
  const verHistorial = async () => {
    await cargarHistorial();
    setMostrarHistorial(true);
    setSidebarOpen(false);
  };

  // ======================
  // Logout
  // ======================
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // ======================
  // Render
  // ======================
  return (
    <div className="homeContainer">
      <div className="topBar">
        <button className="menuButton" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>
        <h1>Encuentra tu lugar ideal</h1>
      </div>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="closeButton" onClick={() => setSidebarOpen(false)}>✖</button>
        <h2>Opciones</h2>
        <button onClick={() => setResultados(arbol.inOrden())}>🔽 Ordenar por precio</button>
        <button onClick={verHistorial}>🕓 Ver búsquedas recientes</button>
        <button onClick={handleLogout}>🔒 Cerrar sesión</button>
      </div>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      {mostrarHistorial && (
        <div className="modalHistorial">
          <div className="modalContent">
            <h3>🔍 Búsquedas recientes</h3>
            {cargandoHistorial ? (
              <p>Cargando...</p>
            ) : historial.length > 0 ? (
              <ul>
                {historial.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : (
              <p>No hay búsquedas registradas.</p>
            )}
            <button onClick={() => setMostrarHistorial(false)}>Cerrar</button>
          </div>
        </div>
      )}

      <div className="searchBar">
        <input
          type="text"
          placeholder="Búsqueda por ciudad"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guardarBusqueda()}
        />
        <button onClick={guardarBusqueda}>Buscar</button>
      </div>

      <div className="cardContainer">
        {resultados
          .filter((a) => a.ciudad.toLowerCase().includes(busqueda.toLowerCase()))
          .map((a) => (
            <div key={a.id} className="card">
              <img src={a.img} alt={a.tipo} />
              <h3>{a.tipo}</h3>
              <p>{a.ciudad}</p>
              <span>${a.precio.toLocaleString("es-CO")} / noche</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default HomeScreen;
