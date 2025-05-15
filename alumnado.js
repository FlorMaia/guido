document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const materiasButtons = document.getElementById('materias-buttons');
    const cursosCard = document.getElementById('cursos-card');
    const cursosButtons = document.getElementById('cursos-buttons');
    const notasCard = document.getElementById('notas-card');
    const notasTable = document.getElementById('notasTable').getElementsByTagName('tbody')[0];
    const guardarNotasBtn = document.getElementById('guardarNotasBtn');
    const nombreAlumnado = document.getElementById('nombreAlumnado');

    let materiaSeleccionada = null;
    let cursoSeleccionado = null;
    let AlumnadoId = localStorage.getItem('userId');
    let AlumnadorNombre = localStorage.getItem('userNombre');
    let tipoUsuario = localStorage.getItem('userTipo');

    if (!profesorId || tipoUsuario !== 'Alumnado') {
        console.error('Error: No se pudo identificar al Alumnado o el tipo de usuario no es correcto');
        alert('Error: No se pudo identificar al Alumnado. Por favor, inicie sesión nuevamente.');
        window.location.href = 'Login.html';
        return;
    }

    if (AlumnadoNombre) {
        nombreAlumnado.textContent = `Bienvenido, ${AlumnadoNombre}`;
    }

    logoutBtn.addEventListener('click', logout);
    guardarNotasBtn.addEventListener('click', guardarNotas);

    // Cargar materias
    cargarMaterias();

    // Cargar cursos
    cargarCursos();

    function cargarMaterias() {
        fetch('/api/materias')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                materiasButtons.innerHTML = ''; // Limpiar botones existentes
                data.materias.forEach(materia => {
                    const button = document.createElement('button');
                    button.textContent = materia.nombre;
                    button.addEventListener('click', () => seleccionarMateria(materia.id, materia.nombre));
                    materiasButtons.appendChild(button);
                });
            })
            .catch(error => {
                console.error('Error al cargar materias:', error);
                alert('Error al cargar las materias. Por favor, intente nuevamente.');
            });
    }

    function cargarCursos() {
        fetch('/api/cursos')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                cursosButtons.innerHTML = ''; // Limpiar botones existentes
                data.cursos.forEach(curso => {
                    const button = document.createElement('button');
                    button.textContent = curso.nombre;
                    button.classList.add('curso-btn');
                    button.dataset.curso = curso.id;
                    button.addEventListener('click', () => seleccionarCurso(curso.id));
                    cursosButtons.appendChild(button);
                });
            })
            .catch(error => {
                console.error('Error al cargar cursos:', error);
                alert('Error al cargar los cursos. Por favor, intente nuevamente.');
            });
    }

    function seleccionarMateria(id, nombre) {
        materiaSeleccionada = { id, nombre };
        cursosCard.style.display = 'block';
        notasCard.style.display = 'none';
    }

    function seleccionarCurso(curso) {
        cursoSeleccionado = curso;
        cargarAlumnos();
    }

    function cargarAlumnos() {
        fetch(`/api/alumnos/${cursoSeleccionado}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                notasTable.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos datos
                if (data.alumnos && data.alumnos.length > 0) {
                    data.alumnos.forEach(alumno => {
                        const row = notasTable.insertRow();
                        row.insertCell().textContent = alumno.nombre_completo;
                        const periodos = ['1er Informe', '2do Informe', '1er Cuatrimestre', '3er Informe', '4to Informe', '2do Cuatrimestre', 'Nota Final'];
                        periodos.forEach(periodo => {
                            const cell = row.insertCell();
                            const input = document.createElement('input');
                            input.type = 'number';
                            input.min = '0';
                            input.max = '10';
                            input.step = '0.01';
                            input.dataset.alumnoId = alumno.id;
                           
                            cell.appendChild(input);
                        });
                    });
                    notasCard.style.display = 'block';
                } else {
                    notasTable.innerHTML = '<tr><td colspan="8">No hay alumnos en este curso</td></tr>';
                }
                notasCard.style.display = 'block';
            })
            .catch(error => {
                console.error('Error al cargar alumnos:', error);
                alert('Error al cargar los alumnos. Por favor, intente nuevamente.');
                notasCard.style.display = 'none';
            });
    }

    function guardarNotas() {
        if (!materiaSeleccionada || !materiaSeleccionada.id) {
            alert('Por favor, seleccione una materia antes de guardar las notas.');
            return;
        }

        if (!AlumnadoId || tipoUsuario !== 'Alumnado') {
            console.error('Error: No se pudo identificar al Alumnado o el tipo de usuario no es correcto');
            alert('Error: No se pudo identificar al Alumnado. Por favor, inicie sesión nuevamente.');
            logout();
            return;
        }

        const notas = [];
        notasTable.querySelectorAll('input').forEach(input => {
            if (input.value) {
                notas.push({
                    id_alumno: input.dataset.alumnoId,
                    id_materia: materiaSeleccionada.id,
                    nota: parseFloat(input.value),
                    
                });
            }
        });

        if (notas.length === 0) {
            alert('No hay notas para guardar.');
            return;
        }

        fetch('/api/notas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notas }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar las notas. Por favor, intente nuevamente.');
        });
    }

    function logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userNombre');
        localStorage.removeItem('userTipo');
        window.location.href = 'login.html';
    }
});

