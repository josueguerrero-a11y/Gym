# PULSO — Entrená a tu ritmo

App web gratuita de entrenamiento con catálogo de ejercicios, rutinas de 2 a 4 días, registro rápido de series (kg y repeticiones), seguimiento, educación nutricional, IMC informativo y comunidad de constancia optativa.

## Estado del proyecto (16 de noviembre de 2026)

- **GitHub:** código frontend en este repositorio.
- **Supabase:** proyecto `PULSO` creado y activo en São Paulo: [abrir Dashboard](https://supabase.com/dashboard/project/flwjgmijgnqacvvlxuxy).
- **Base de datos:** siete tablas con RLS, 19 políticas y 12 ejercicios iniciales. Se aplicaron las migraciones `pulso_initial_schema` y `restrict_anonymous_table_privileges`.
- **Frontend:** `config.js` ya contiene solo la URL de API y la clave **publicable**; no hay claves secretas.
- **Cloudflare Pages:** pendiente de conectar (cuando decidas publicarlo).

## Uso y autenticación

Al abrir la web se muestra el catálogo de ejercicios. Para crear rutinas, registrar entrenamiento, sincronizar y participar del ranking es necesario iniciar sesión con correo electrónico y contraseña. Las rutinas, las series y los kilos son privados: RLS no permite que otros usuarios los consulten.

Para crear cuentas desde la web, comprobar en **Supabase → Authentication → Providers** que el proveedor Email esté activo. Para correos de confirmación y recuperación, configurar las **URL Configuration** de la web cuando exista la URL definitiva de Cloudflare Pages.

## Publicación en Cloudflare Pages

En el momento de publicar: seleccioná este repositorio, framework `None`, sin comando de compilación y salida raíz `/`. El HTML es estático; el navegador se comunica directamente con Supabase por HTTPS, protegido por RLS. **No hace falta un Cloudflare Worker para guardar series.**

## Archivos principales

- `index.html` — estructura de las siete secciones.
- `style.css` — diseño responsive.
- `app.js` — rutinas, ejercicios, seguimiento, cuentas y ranking.
- `data.js` — catálogo local para vista de referencia.
- `config.js` — configuración pública de Supabase.
- `assets/logo.svg` — logotipo vectorial PULSO.
- `supabase/schema.sql` — esquema de referencia para **un proyecto nuevo**; **no volver a ejecutarlo** en el proyecto PULSO actual.

## Seguridad y bienestar

Las medidas corporales no se comparten. El ranking es voluntario y se basa exclusivamente en días con entrenamiento registrado; no compara el peso corporal ni los kilos levantados. La calculadora de IMC no interpreta resultados de menores de 20 años mediante categorías adultas. La sección de nutrición enseña hábitos generales y no prescribe dietas restrictivas. Las animaciones originales de ejercicios son ilustrativas; se proporcionan enlaces a búsqueda de videos para revisar técnica.

**Estado de pruebas:** archivos existentes y sintaxis de JavaScript verificadas; base de datos, permisos y análisis de seguridad confirmados. Falta prueba de extremo a extremo con usuarios reales y revisión de la web tras la publicación.
