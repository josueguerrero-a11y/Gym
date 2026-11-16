# PULSO — Entrená a tu ritmo

App de gimnasio gratuita para rutinas, ejercicio visual, seguimiento personal, nutrición educativa, IMC orientativo y ranking voluntario de constancia.

## Estado
Versión inicial del proyecto preparada para Cloudflare Pages y Supabase. La app funciona en modo demostración sin cuenta y sincroniza registros al configurar Supabase.

## Configurar Supabase
1. Crear un proyecto nuevo llamado **PULSO** (no reutilizar otra base).
2. Ejecutar `supabase/schema.sql` en SQL Editor.
3. Copiar Project URL y la **publishable key** (nunca la service_role/secret key) a `config.js`.
4. En Authentication, activar Email/Password, confirmar la política de correos y configurar URLs autorizadas.

## Publicar con Cloudflare Pages
Conectar el repositorio, framework preset `None`, sin build command y output directory `/`.

## Privacidad
Los kilos, series, entrenamiento personal y medidas son privados. El ranking solo muestra días entrenados de participantes que optan por compartirlos. Los menores de 20 años no reciben interpretación adulta del IMC. No se ofrecen dietas restrictivas ni competiciones por peso corporal.

## Archivos
- `index.html`: interfaz
- `style.css`: estilos
- `data.js`: ejercicios iniciales
- `app.js`: lógica interactiva, autenticación y progreso
- `config.js`: URL y clave publicable de Supabase
- `assets/logo.svg`: logo
- `supabase/schema.sql`: base de datos y políticas RLS

No expongas contraseñas ni credenciales privadas. Versión MVP: verificar la seguridad antes de abrir el registro a terceros.
