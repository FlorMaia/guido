document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const usersTable = document.getElementById('usersTable').getElementsByTagName('tbody')[0];
    const adminId = localStorage.getItem('userId');
    const adminNombre = localStorage.getItem('userNombre');
    const tipoUsuario = localStorage.getItem('userTipo');

   

    document.getElementById('adminName').textContent = `Bienvenido, ${adminNombre}`;

    logoutBtn.addEventListener('click', logout);
    addUserBtn.addEventListener('click', addUser);

    loadUsers();
    loadAllNotes();

    function logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('userNombre');
        localStorage.removeItem('userTipo');
        window.location.href = 'login.html';
    }

    function addUser() {
        const newUser = {
            nombre_completo: prompt('Nombre completo:'),
            email: prompt('Email:'),
            nombre_usuario: prompt('Nombre de usuario:'),
            contrasena: prompt('Contraseña:'),
            tipo_usuario: prompt('Tipo de usuario (alumno/profesor/admin):'),
            curso: prompt('Curso (solo para alumnos):')
        };

        fetch('/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newUser),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadUsers();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al agregar usuario');
        });
    }

    function loadUsers() {
        fetch('/api/usuarios')
            .then(response => response.json())
            .then(data => {
                usersTable.innerHTML = '';
                data.usuarios.forEach(user => {
                    const row = usersTable.insertRow();
                    row.innerHTML = `
                        <td>${user.nombre_completo}</td>
                        <td>${user.tipo_usuario}</td>
                        <td>
                            <button onclick="editUser(${user.id})">Editar</button>
                            <button onclick="deleteUser(${user.id})">Eliminar</button>
                        </td>
                    `;
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar los usuarios');
            });
    }

    function loadAllNotes() {
        fetch('/api/todas-notas')
            .then(response => response.json())
            .then(data => {
                const notesContainer = document.getElementById('notesContainer');
                notesContainer.innerHTML = '<h3>Todas las Notas</h3>';
                const table = document.createElement('table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Materia</th>
                            <th>Nota</th>
                            <th>Periodo</th>
                            <th>Profesor</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                data.notas.forEach(nota => {
                    const row = table.querySelector('tbody').insertRow();
                    row.innerHTML = `
                        <td>${nota.alumno}</td>
                        <td>${nota.materia}</td>
                        <td>${nota.nota}</td>
                        <td>${nota.periodo}</td>
                        <td>${nota.profesor}</td>
                        <td>
                            <button onclick="editNote(${nota.id}, ${nota.nota})">Editar</button>
                        </td>
                    `;
                });
                notesContainer.appendChild(table);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al cargar todas las notas');
            });
    }

    window.editUser = function(id) {
        fetch(`/api/usuarios/${id}`)
            .then(response => response.json())
            .then(user => {
                const updatedUser = {
                    nombre_completo: prompt('Nombre completo:', user.nombre_completo),
                    email: prompt('Email:', user.email),
                    nombre_usuario: prompt('Nombre de usuario:', user.nombre_usuario),
                    tipo_usuario: prompt('Tipo de usuario (alumno/profesor/admin):', user.tipo_usuario),
                    curso: prompt('Curso (solo para alumnos):', user.curso)
                };

                const contrasena = prompt('Nueva contraseña (dejar en blanco para no cambiar):');
                if (contrasena) {
                    updatedUser.contrasena = contrasena;
                }

                fetch(`/api/usuarios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedUser),
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadUsers();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al actualizar usuario');
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al obtener información del usuario');
            });
    }

    window.deleteUser = function(id) {
        if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
            fetch(`/api/usuarios/${id}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadUsers();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al eliminar usuario');
            });
        }
    }

    window.editNote = function(id, currentNote) {
        const newNote = prompt('Nueva nota:', currentNote);
        if (newNote !== null) {
            fetch(`/api/notas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nota: newNote }),
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadAllNotes();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al actualizar nota');
            });
        }
    }
});

