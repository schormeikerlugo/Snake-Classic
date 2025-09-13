
export function renderAuthForm(container) {
  container.innerHTML = `
    <div id="auth-container">
      <div id="auth-form-container">
        <h3 id="auth-title">Iniciar Sesión</h3>
        <form id="auth-form">
          <div class="form-group" id="username-group" style="display: none;">
            <label for="username">Nombre de Usuario</label>
            <input type="text" id="username" name="username" autocomplete="username" />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" />
          </div>
          <button type="submit" id="auth-button">Iniciar Sesión</button>
        </form>
        <p id="auth-error" class="error-message"></p>
        <p>
          <a href="#" id="toggle-auth-mode">¿No tienes cuenta? Regístrate</a>
        </p>
      </div>
      <div id="user-profile-container" style="display: none;">
        <h3 id="profile-title"></h3>
        <div id="avatar-container">
          <img id="profile-avatar" src="" alt="Avatar" class="profile-avatar" />
          <input type="file" id="avatar-upload" accept="image/*" style="display: none;" />
          <button id="upload-avatar-btn">Cambiar Avatar</button>
        </div>
        <button id="logout-btn">Cerrar Sesión</button>
      </div>
    </div>
  `;
}

export function toggleAuthMode(isLogin) {
  const title = document.getElementById('auth-title');
  const button = document.getElementById('auth-button');
  const toggleLink = document.getElementById('toggle-auth-mode');
  const usernameGroup = document.getElementById('username-group');

  if (isLogin) {
    title.textContent = 'Iniciar Sesión';
    button.textContent = 'Iniciar Sesión';
    toggleLink.innerHTML = '¿No tienes cuenta? Regístrate';
    usernameGroup.style.display = 'none';
  } else {
    title.textContent = 'Crear Cuenta';
    button.textContent = 'Crear Cuenta';
    toggleLink.innerHTML = '¿Ya tienes cuenta? Inicia Sesión';
    usernameGroup.style.display = 'block';
  }
  document.getElementById('auth-error').textContent = '';
}
