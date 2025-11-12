import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import "../styles/homescreen.css";

// ============================
// ESTRUCTURA DE COLA (Queue)
// ============================
class NodoCola {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class Cola {
  constructor(maxSize = 10) {
    this.front = null;
    this.rear = null;
    this.size = 0;
    this.maxSize = maxSize;
  }

  encolar(data) {
    const nuevo = new NodoCola(data);
    
    // Si la cola está vacía
    if (this.rear === null) {
      this.front = this.rear = nuevo;
      this.size++;
      return;
    }

    // Si alcanzamos el tamaño máximo, desencolar el primero
    if (this.size >= this.maxSize) {
      this.desencolar();
    }

    // Agregar al final
    this.rear.next = nuevo;
    this.rear = nuevo;
    this.size++;
  }

  desencolar() {
    if (this.front === null) return null;

    const temp = this.front;
    this.front = this.front.next;

    if (this.front === null) {
      this.rear = null;
    }

    this.size--;
    return temp.data;
  }

  recorrer() {
    const array = [];
    let actual = this.front;
    while (actual) {
      array.push(actual.data);
      actual = actual.next;
    }
    return array;
  }

  estaVacia() {
    return this.front === null;
  }

  obtenerTamaño() {
    return this.size;
  }

  limpiar() {
    this.front = null;
    this.rear = null;
    this.size = 0;
  }
}

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
  const [colaBusquedas] = useState(new Cola(10)); // Cola con máximo 10 elementos
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
  // Cargar historial desde Firebase a la Cola
  // ======================
  const cargarHistorial = async () => {
    const usuario = auth.currentUser;
    if (!usuario) {
      console.log("No hay usuario autenticado");
      return;
    }
    
    setCargandoHistorial(true);
    colaBusquedas.limpiar(); // Limpiar la cola antes de cargar

    try {
      // Query simplificada sin orderBy para evitar necesitar índice compuesto
      const q = query(
        collection(db, "busquedas"),
        where("usuario", "==", usuario.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No se encontraron búsquedas");
      } else {
        console.log(`Se encontraron ${querySnapshot.size} búsquedas`);
        
        // Convertir a array y ordenar manualmente por fecha
        const busquedasArray = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          busquedasArray.push({
            texto: data.texto,
            fecha: data.fecha
          });
        });
        
        // Ordenar manualmente por fecha (más recientes primero)
        busquedasArray.sort((a, b) => {
          return new Date(b.fecha) - new Date(a.fecha);
        });
        
        // Tomar solo las 10 más recientes
        const ultimasDiez = busquedasArray.slice(0, 10);
        
        // Encolar en orden inverso (las más antiguas primero)
        ultimasDiez.reverse().forEach(busqueda => {
          colaBusquedas.encolar(busqueda);
        });
        
        console.log("Historial cargado exitosamente:", ultimasDiez.length, "búsquedas");
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
      console.error("Detalles del error:", error.message);
      alert("Error al cargar el historial. Por favor verifica la consola.");
    }

    setCargandoHistorial(false);
  };

  // ======================
  // Guardar búsqueda en Firebase y Cola
  // ======================
  const guardarBusqueda = async () => {
    const texto = busqueda.trim();
    if (!texto) {
      alert("Por favor ingresa un término de búsqueda");
      return;
    }
    
    const usuario = auth.currentUser;
    if (!usuario) {
      console.log("No hay usuario autenticado");
      alert("Debes estar autenticado para guardar búsquedas");
      return;
    }

    try {
      const ahora = new Date();
      const nuevaBusqueda = {
        usuario: usuario.uid,
        texto: texto,
        fecha: ahora.toISOString(),
      };

      // Guardar en Firebase
      const docRef = await addDoc(collection(db, "busquedas"), nuevaBusqueda);
      
      // Encolar en la estructura de datos
      colaBusquedas.encolar({ texto: texto, fecha: nuevaBusqueda.fecha });
      
      console.log("✅ Búsqueda guardada exitosamente:", texto);
      console.log("📍 ID del documento:", docRef.id);
      
      // Aplicar filtro a los resultados
      const filtrados = lista.recorrer().filter((a) => 
        a.ciudad.toLowerCase().includes(texto.toLowerCase())
      );
      setResultados(filtrados);
      
      // Feedback visual
      if (filtrados.length === 0) {
        console.log("⚠️ No se encontraron resultados para:", texto);
      } else {
        console.log(`✅ Se encontraron ${filtrados.length} resultado(s)`);
      }
      
    } catch (error) {
      console.error("❌ Error guardando búsqueda:", error);
      console.error("Detalles:", error.message);
      alert("Error al guardar la búsqueda. Verifica la consola para más detalles.");
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
  // Manejar búsqueda al escribir
  // ======================
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    // Filtrar en tiempo real
    if (valor.trim() === "") {
      setResultados(lista.recorrer());
    } else {
      const filtrados = lista.recorrer().filter((a) =>
        a.ciudad.toLowerCase().includes(valor.toLowerCase())
      );
      setResultados(filtrados);
    }
  };

  // ======================
  // Render
  // ======================
  const busquedasRecientes = colaBusquedas.recorrer();

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
        <button onClick={() => {
          setResultados(arbol.inOrden());
          setSidebarOpen(false);
        }}>
          🔽 Ordenar por precio
        </button>
        <button onClick={() => {
          setResultados(lista.recorrer());
          setSidebarOpen(false);
        }}>
          🔄 Ver todos
        </button>
        <button onClick={verHistorial}>🕓 Ver búsquedas recientes</button>
        <button onClick={handleLogout}>🔒 Cerrar sesión</button>
      </div>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      {mostrarHistorial && (
        <div className="modalHistorial">
          <div className="modalContent">
            <h3>🔍 Búsquedas recientes</h3>
            <p className="infoText">
              Total de búsquedas en cola: {busquedasRecientes.length}
            </p>
            {cargandoHistorial ? (
              <p>Cargando...</p>
            ) : busquedasRecientes.length > 0 ? (
              <ul className="historialList">
                {busquedasRecientes.map((b, i) => (
                  <li key={i} className="historialItem">
                    <span className="busquedaTexto">"{b.texto}"</span>
                    <span className="busquedaFecha">
                      {new Date(b.fecha).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="noData">No hay búsquedas registradas.</p>
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
          onChange={handleBusquedaChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              guardarBusqueda();
            }
          }}
        />
        <button onClick={guardarBusqueda}>Buscar</button>
      </div>

      <div className="resultadosInfo">
        <p>Mostrando {resultados.length} alojamiento(s)</p>
      </div>

      <div className="cardContainer">
        {resultados.length > 0 ? (
          resultados.map((a) => (
            <div key={a.id} className="card">
              <img src={a.img} alt={a.tipo} />
              <h3>{a.tipo}</h3>
              <p>{a.ciudad}</p>
              <span>${a.precio.toLocaleString("es-CO")} / noche</span>
            </div>
          ))
        ) : (
          <p className="noResultados">No se encontraron alojamientos para "{busqueda}"</p>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;