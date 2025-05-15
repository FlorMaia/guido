document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('user-type').value;

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre_usuario: username, contrasena: password, tipo_usuario: userType }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userNombre', data.nombre_completo);
                localStorage.setItem('userTipo', data.tipo_usuario);
                
                switch (data.tipo_usuario) {
                    case 'alumno':
                        window.location.href = 'alumno.html';
                        break;
                    case 'alumnado':
                        window.location.href = 'vista del alumnado.html';
                        break;
                    case 'admin':
                        window.location.href = 'dashboard.html';
                        break;
                    default:
                        alert('Tipo de usuario no reconocido');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al iniciar sesión');
        });
    });
});

