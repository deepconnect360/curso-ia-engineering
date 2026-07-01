<?php
/**
 * Template Name: Curso IA Engineering
 *
 * Plantilla de página de WordPress que embebe el curso React y le pasa:
 *   - El nonce de sesión (autenticación con la REST API, mismo dominio)
 *   - La URL base de la REST API
 *   - El ID del usuario logueado
 *
 * INSTALACIÓN:
 * 1. Sube este archivo a la carpeta de tu tema activo:
 *    /wp-content/themes/TU-TEMA/template-curso-ia.php
 * 2. En WordPress: crea una Página nueva → en "Atributos de página → Plantilla"
 *    selecciona "Curso IA Engineering".
 * 3. Protege esa página con tu plugin de membresía (MemberPress / PMPro).
 * 4. Sube el build de Vite (carpeta dist/) a:
 *    /wp-content/uploads/curso-ia/
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Si el usuario no está logueado, redirige al login de WordPress.
if ( ! is_user_logged_in() ) {
    wp_redirect( wp_login_url( get_permalink() ) );
    exit;
}

get_header();

// URL donde subiste el build de Vite.
// Ajústala si usas otra ruta de uploads.
$curso_base_url = content_url( 'uploads/curso-ia' );
?>

<div id="curso-ia-root" style="min-height:100vh;"></div>

<?php
// ============================================================================
// Configuración que el curso React necesita para hablar con la REST API.
// wp_localize_script es la forma oficial y segura de pasar datos PHP → JS.
// El nonce permite autenticar las peticiones REST sin cookies adicionales.
// ============================================================================
$config = [
    'restUrl'  => esc_url_raw( rest_url( 'curso-ia/v1' ) ),
    'nonce'    => wp_create_nonce( 'wp_rest' ),
    'userId'   => get_current_user_id(),
    'userName' => wp_get_current_user()->display_name,
    // El nonce expira en ~12h. Si el alumno deja el curso abierto mucho tiempo,
    // al volver a llamar a la API recibirá un 403 y deberá recargar la página.
    // Para sesiones largas considera refrescar el nonce vía heartbeat de WP.
];
?>

<script>
// Disponible en window.CursoIAConfig antes de que cargue React.
window.CursoIAConfig = <?php echo wp_json_encode( $config ); ?>;
</script>

<?php
// ============================================================================
// Assets del build de Vite
// Los archivos tienen hashes en el nombre (p. ej. index-BL6aOox1.js).
// Lo más robusto es leer el index.html del build y extraer las refs.
// ============================================================================
$dist_path = WP_CONTENT_DIR . '/uploads/curso-ia';
$dist_html = $dist_path . '/index.html';

if ( file_exists( $dist_html ) ) {
    $html_raw = file_get_contents( $dist_html );

    // Reescribe las rutas relativas del build para que funcionen desde aquí.
    $html_raw = str_replace(
        [ 'src="/assets/', 'href="/assets/', 'src="./assets/', 'href="./assets/' ],
        [
            'src="' . $curso_base_url . '/assets/',
            'href="' . $curso_base_url . '/assets/',
            'src="' . $curso_base_url . '/assets/',
            'href="' . $curso_base_url . '/assets/',
        ],
        $html_raw
    );

    // Extrae solo las líneas de <link> y <script> del <head>/<body> del build,
    // sin volcar el <!doctype> completo dentro de la página de WordPress.
    preg_match_all( '/<link[^>]+rel=["\']stylesheet["\'][^>]*>/i', $html_raw, $links );
    preg_match_all( '/<script[^>]+src=[^>]+><\/script>/i', $html_raw, $scripts );

    foreach ( $links[0]  as $tag ) echo $tag . "\n";
    foreach ( $scripts[0] as $tag ) echo $tag . "\n";
} else {
    // Aviso solo para admins si el build no está subido todavía.
    if ( current_user_can( 'manage_options' ) ) {
        echo '<div style="padding:32px;color:#E85D75;font-family:monospace;">';
        echo '⚠ Build del curso no encontrado en <code>' . esc_html( $dist_path ) . '</code>.<br>';
        echo 'Ejecuta <code>npm run build</code> y sube la carpeta <code>dist/</code> a esa ruta.';
        echo '</div>';
    }
}

get_footer();
