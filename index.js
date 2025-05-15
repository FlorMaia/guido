import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("publico"));



// Habilita recibir JSON
app.use(express.json());


// Levanta el servidor
    console.log('Servidor escuchando en http://127.0.0.1:3000');

// Conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root", 
  password: "", 
  database: "boletin", 
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.stack);
    return;
  }
  console.log("Conectado a la base de datos");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("publico"));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "registro.html"));
});

app.get("/alumno", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "alumno.html"));
});

app.get("/alumnado", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "alumnado.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "publico", "dashboard.html"));
});

// Ruta para el login
app.post("/api/login", (req, res) => {
  const { nombre_usuario, contrasena } = req.body;

  if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ error: "Nombre de usuario y contraseña son requeridos" });
  }

  const query = "SELECT id, nombre_completo, tipo_usuario, contrasena, curso FROM usuarios WHERE nombre_usuario = ?";
  db.query(query, [nombre_usuario], async (err, results) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = results[0];

    if (!user.contrasena) {
      console.error("Error: Hash de contraseña no encontrado para el usuario");
      return res.status(500).json({ error: "Error en el servidor" });
    }

    try {
      const match = await bcrypt.compare(contrasena, user.contrasena);

      if (match) {
        res.json({
          message: "Login exitoso",
          id: user.id,
          nombre_completo: user.nombre_completo,
          tipo_usuario: user.tipo_usuario,
          curso: user.curso
        });
      } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
    } catch (error) {
      console.error("Error al comparar contraseñas:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  });
});

// Ruta para el registro
app.post("/api/registro", async (req, res) => {
  try {
    const { nombre, apellido, email, dni, password, rol, curso } = req.body;
    
    // Validación mejorada
    if (!nombre || !apellido || !email || !dni || !password || !rol) {
      return res.status(400).json({ 
        error: "Todos los campos son requeridos",
        campos_faltantes: {
          nombre: !nombre,
          apellido: !apellido,
          email: !email,
          dni: !dni,
          password: !password,
          rol: !rol
        }
      });
    }

    // Verificar si el email o DNI ya existen
    const checkUserQuery = "SELECT email, dni FROM usuarios WHERE email = ? OR dni = ?";
    db.query(checkUserQuery, [email, dni], async (err, results) => {
      if (err) {
        console.error("Error al verificar usuario:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }

      if (results.length > 0) {
        const conflictos = {
          email_existe: results.some(user => user.email === email),
          dni_existe: results.some(user => user.dni === dni)
        };
        return res.status(409).json({ 
          error: "Conflicto al registrar",
          conflictos 
        });
      }

      // Crear usuario si no hay conflictos
      const nombre_completo = `${nombre} ${apellido}`;
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = `
        INSERT INTO usuarios 
        (nombre_completo, nombre, apellido, email, dni, contrasena, tipo_usuario, curso) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(
        insertQuery, 
        [nombre_completo, nombre, apellido, email, dni, hashedPassword, rol, curso], 
        (err, result) => {
          if (err) {
            console.error("Error al registrar usuario:", err);
            return res.status(500).json({ 
              error: "Error al registrar usuario",
              detalles: err.message 
            });
          }
          res.status(201).json({ 
            success: true,
            message: "Usuario registrado exitosamente",
            userId: result.insertId 
          });
        }
      );
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      detalles: error.message 
    });
  }
});
// Ruta para obtener materias
app.get("/api/materias", (req, res) => {
  const query = "SELECT * FROM materias";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener materias:", err);
      res.status(500).json({ error: "Error al obtener materias" });
      return;
    }
    res.json({ materias: results });
  });
});

// Ruta para obtener cursos
app.get("/api/cursos", (req, res) => {
  const query = "SELECT * FROM cursos";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener cursos:", err);
      res.status(500).json({ error: "Error al obtener cursos" });
      return;
    }
    res.json({ cursos: results });
  });
});

// Ruta para obtener alumnos por curso
app.get("/api/alumnos/:curso", (req, res) => {
  const curso = req.params.curso;
  const query = "SELECT id, nombre_completo FROM usuarios WHERE tipo_usuario = 'alumno' AND curso = ?";
  db.query(query, [curso], (err, results) => {
    if (err) {
      console.error("Error al obtener alumnos:", err);
      res.status(500).json({ error: "Error al obtener alumnos" });
      return;
    }
    res.json({ alumnos: results });
  });
});

// Ruta para guardar notas
app.post("/api/notas", (req, res) => {
  const { notas } = req.body;

  if (!Array.isArray(notas) || notas.length === 0) {
    return res.status(400).json({ error: "Datos de notas inválidos" });
  }

  const query = "INSERT INTO notas (id_alumno, id_materia, id_curso, nota) VALUES ? ON DUPLICATE KEY UPDATE nota = VALUES(nota)";
  const values = notas.map(n => [
    n.id_alumno,
    n.id_materia,
    n.id_curso, // Corregido el error de sintaxis aquí
    n.nota
  ]);

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error al guardar notas:", err);
      res.status(500).json({ error: "Error al guardar notas" });
      return;
    }
    res.status(200).json({ message: "Notas guardadas exitosamente" });
  });
});

// Ruta para obtener notas de un alumno
app.get("/api/notas/:alumnoId", (req, res) => {
  const alumnoId = req.params.alumnoId;
  const query = `
    SELECT m.nombre as materia, n.nota
    FROM notas n
    JOIN materias m ON n.id_materia = m.id
    WHERE n.id_alumno = ?
  `;
  db.query(query, [alumnoId], (err, results) => {
    if (err) {
      console.error("Error al obtener notas:", err);
      res.status(500).json({ error: "Error al obtener notas" });
      return;
    }
    res.json({ notas: results });
  });
});


// Ruta para obtener materias y notas de un alumno
app.get("/api/materias-notas/:alumnoId", (req, res) => {
  const alumnoId = req.params.alumnoId;
  const query = `
    SELECT m.id, m.nombre as materia, n.nota
    FROM materias m
    LEFT JOIN notas n ON m.id = n.id_materia AND n.id_alumno = ?
    ORDER BY m.id
  `;
  db.query(query, [alumnoId], (err, results) => {
    if (err) {
      console.error("Error al obtener materias y notas:", err);
      res.status(500).json({ error: "Error al obtener materias y notas" });
      return;
    }
    res.json({ materiasNotas: results });
  });
});

// Ruta para obtener todos los usuarios (solo para admin)
app.get("/api/usuarios", (req, res) => {
  const query = `
    SELECT id, nombre_completo, email, nombre_usuario, tipo_usuario, curso, dni
    FROM usuarios
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      res.status(500).json({ error: "Error al obtener usuarios" });
      return;
    }
    res.json({ usuarios: results });
  });
});


// Ruta para obtener todas las notas (solo para admin)
app.get("/api/todas-notas", (req, res) => {
  const query = `
    SELECT u.nombre_completo AS alumno, m.nombre AS materia, n.nota
    FROM notas n
    JOIN usuarios u ON n.id_alumno = u.id
    JOIN materias m ON n.id_materia = m.id
    ORDER BY u.nombre_completo, m.nombre
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener todas las notas:", err);
      res.status(500).json({ error: "Error al obtener todas las notas" });
      return;
    }
    res.json({ notas: results });
  });
});

// Ruta para actualizar un usuario (solo para admin)
app.put("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, email, nombre_usuario, contrasena, tipo_usuario, curso, dni } = req.body;

  let updateQuery = `
    UPDATE usuarios 
    SET nombre_completo = ?, email = ?, nombre_usuario = ?, tipo_usuario = ?, curso = ?, dni = ?
  `;
  let queryParams = [nombre_completo, email, nombre_usuario, tipo_usuario, curso, dni];

  if (contrasena) {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    updateQuery += ", contrasena = ?";
    queryParams.push(hashedPassword);
  }

  updateQuery += " WHERE id = ?";
  queryParams.push(id);

  db.query(updateQuery, queryParams, (err, result) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      res.status(500).json({ error: "Error al actualizar usuario" });
      return;
    }
    res.json({ message: "Usuario actualizado exitosamente" });
  });
});

// Ruta para eliminar un usuario (solo para admin)
app.delete("/api/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM usuarios WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      res.status(500).json({ error: "Error al eliminar usuario" });
      return;
    }
    res.json({ message: "Usuario eliminado exitosamente" });
  });
});

// Ruta para actualizar una nota (solo para admin)
app.put("/api/notas/:id", (req, res) => {
  const { id } = req.params;
  const { nota } = req.body;
  const query = "UPDATE notas SET nota = ? WHERE id = ?";
  db.query(query, [nota, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar nota:", err);
      res.status(500).json({ error: "Error al actualizar nota" });
      return;
    }
    res.json({ message: "Nota actualizada exitosamente" });
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
