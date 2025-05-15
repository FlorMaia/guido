document.addEventListener('DOMContentLoaded', () => {
   const form = document.getElementById('registro'); // Error: debería ser 'registro'
    const rolSelect = document.getElementById('rol');
    const dniInput = document.getElementById('dni');
    const cursoSelect = document.getElementById('curso');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordError = document.getElementById('password-error');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Mostrar/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
            button.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Validación de contraseñas coincidentes
    function validatePassword() {
        if (passwordInput.value !== confirmPasswordInput.value) {
            passwordError.textContent = 'Las contraseñas no coinciden';
            return false;
        }
        passwordError.textContent = '';
        return true;
    }

    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePassword);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validatePassword()) {
            return;
        }

        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Registrando...';

        // Obtener valores del formulario
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const dni = dniInput.value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const rol = rolSelect.value;
        const curso = cursoSelect.value;

        // Mapeo de roles a lo que espera el backend
        const mapRoles = {
            'estudiante': 'alumno',
            'profesor': 'profesor',
            'administrador': 'admin'
        };

        try {
            const response = await fetch('http://localhost:3000/api/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: nombre,
                    apellido: apellido,
                    dni: dni,
                    email: email,
                    password: password,
                    rol: mapRoles[rol],
                    curso: rol === 'estudiante' ? curso : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    // Manejar conflictos (email o dni ya existentes)
                    const conflictMessage = data.conflictos.email_existe ? 
                        'El email ya está registrado' : 
                        'El DNI ya está registrado';
                    throw new Error(conflictMessage);
                }
                throw new Error(data.error || 'Error en el registro');
            }

            alert('¡Registro exitoso!');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'Registrarse';
        }
    });

    // Validación en tiempo real del DNI
    dniInput.addEventListener('input', () => {
        dniInput.value = dniInput.value.replace(/\D/g, '').slice(0, 8);
    });

    // Mostrar/ocultar campo curso según rol
    rolSelect.addEventListener('change', () => {
        cursoSelect.closest('.form-group').style.display = 
            rolSelect.value === 'estudiante' ? 'block' : 'none';
    });
});