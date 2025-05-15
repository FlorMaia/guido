document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const notasTable = document.getElementById('notasTable').getElementsByTagName('tbody')[0];
    const nombreAlumno = document.getElementById('nombreAlumno');

    const alumnoId = localStorage.getItem('userId');
    const alumnoNombre = localStorage.getItem('userNombre');
    const tipoUsuario = localStorage.getItem('userTipo');

    if (!alumnoId || tipoUsuario !== 'alumno') {
        console.error('Error: No se pudo identificar al alumno o el tipo de usuario no es correcto');
        alert('Error: No se pudo identificar al alumno. Por favor, inicie sesión nuevamente.');
        window.location.href = 'login.html';
        return;
    }

    if (alumnoNombre) {
        nombreAlumno.textContent = `Bienvenido, ${alumnoNombre}`;
    }

    logoutBtn.addEventListener('click', logout);

    cargarMateriasYNotas();

    function cargarMateriasYNotas() {
        fetch(`/api/materias-notas/${alumnoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                notasTable.innerHTML = ''; // Limpiar tabla existente
                const notasPorMateria = {};
                data.materiasNotas.forEach(item => {
                    if (!notasPorMateria[item.materia]) {
                        notasPorMateria[item.materia] = {
                            '1er Informe': 'N/A',
                            '2do Informe': 'N/A',
                            '1er Cuatrimestre': 'N/A',
                            '3er Informe': 'N/A',
                            '4to Informe': 'N/A',
                            '2do Cuatrimestre': 'N/A',
                            'Nota Final': 'N/A'
                        };
                    }
                    if (item.nota !== null && item.periodo !== null) {
                        notasPorMateria[item.materia] = item.nota;
                    }
                });

                Object.entries(notasPorMateria).forEach(([materia, notas]) => {
                    const row = notasTable.insertRow();
                    row.insertCell().textContent = materia;
                    ['1er Informe', '2do Informe', '1er Cuatrimestre', '3er Informe', '4to Informe', '2do Cuatrimestre', 'Nota Final'].forEach(periodo => {
                        row.insertCell().textContent = notas[periodo];
                    });
                });

                if (Object.keys(notasPorMateria).length === 0) {
                    const row = notasTable.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 8;
                    cell.textContent = 'No hay materias o notas disponibles';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar las materias y notas. Por favor, intente nuevamente.');
            });
    }

    function logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userNombre');
        localStorage.removeItem('userTipo');
        window.location.href = 'login.html';
    }
});

