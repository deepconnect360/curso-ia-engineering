<?php
/**
 * Plugin Name: Curso IA Engineering — Progreso
 * Description: Endpoints REST para guardar y leer el progreso del curso por usuario.
 *              El progreso vive en el servidor (user meta), no en el cliente.
 * Version:     1.0.0
 * Author:      Tu nombre
 *
 * INSTALACIÓN:
 * 1. Sube esta carpeta a /wp-content/plugins/curso-ia-progreso/
 * 2. Activa el plugin desde Plugins → Plugins instalados.
 * No necesita configuración adicional.
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Bloquea el acceso directo al archivo.

// ============================================================================
// CLAVES DE USER META
// ============================================================================
// Todos los datos del curso se guardan como user meta de WordPress, atados al
// usuario logueado. Así el progreso es multi-dispositivo y no se pierde nunca.

define( 'CURSO_IA_META_PROGRESS',  '_curso_ia_progress'  ); // semanas aprobadas
define( 'CURSO_IA_META_NOTES',     '_curso_ia_notes'     ); // expediente/historial
define( 'CURSO_IA_META_CONVOS',    '_curso_ia_convos'    ); // conversaciones por sesión
define( 'CURSO_IA_META_ACCESS',    '_curso_ia_access'    ); // acceso concedido

// ============================================================================
// REGISTRO DE ENDPOINTS REST
// ============================================================================

add_action( 'rest_api_init', function () {

    $ns = 'curso-ia/v1';

    // --- Progreso global (semanas aprobadas, entregable, extra) ---
    register_rest_route( $ns, '/progress', [
        [
            'methods'             => 'GET',
            'callback'            => 'curso_ia_get_progress',
            'permission_callback' => 'curso_ia_auth',
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'curso_ia_set_progress',
            'permission_callback' => 'curso_ia_auth',
            'args'                => [
                'data' => [ 'required' => true, 'type' => 'object' ],
            ],
        ],
        [
            'methods'             => 'DELETE',
            'callback'            => 'curso_ia_delete_progress',
            'permission_callback' => 'curso_ia_auth',
        ],
    ]);

    // --- Notas/expediente por sesión ---
    register_rest_route( $ns, '/notes', [
        [
            'methods'             => 'GET',
            'callback'            => 'curso_ia_get_notes',
            'permission_callback' => 'curso_ia_auth',
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'curso_ia_set_notes',
            'permission_callback' => 'curso_ia_auth',
            'args'                => [
                'data' => [ 'required' => true, 'type' => 'object' ],
            ],
        ],
        [
            'methods'             => 'DELETE',
            'callback'            => 'curso_ia_delete_notes',
            'permission_callback' => 'curso_ia_auth',
        ],
    ]);

    // --- Conversaciones guardadas por sesión (identificadas por session_id) ---
    register_rest_route( $ns, '/convo/(?P<session_id>[a-zA-Z0-9_-]+)', [
        [
            'methods'             => 'GET',
            'callback'            => 'curso_ia_get_convo',
            'permission_callback' => 'curso_ia_auth',
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'curso_ia_set_convo',
            'permission_callback' => 'curso_ia_auth',
            'args'                => [
                'data' => [ 'required' => true, 'type' => 'object' ],
            ],
        ],
        [
            'methods'             => 'DELETE',
            'callback'            => 'curso_ia_delete_convo',
            'permission_callback' => 'curso_ia_auth',
        ],
    ]);

    // --- Acceso (código validado) ---
    register_rest_route( $ns, '/access', [
        [
            'methods'             => 'GET',
            'callback'            => 'curso_ia_get_access',
            'permission_callback' => 'curso_ia_auth',
        ],
        [
            'methods'             => 'POST',
            'callback'            => 'curso_ia_set_access',
            'permission_callback' => 'curso_ia_auth',
            'args'                => [
                'granted' => [ 'required' => true, 'type' => 'boolean' ],
            ],
        ],
    ]);

    // --- Reset completo (borra todo el progreso del alumno) ---
    register_rest_route( $ns, '/reset', [
        'methods'             => 'POST',
        'callback'            => 'curso_ia_reset_all',
        'permission_callback' => 'curso_ia_auth',
    ]);

});

// ============================================================================
// AUTENTICACIÓN: nonce de WordPress (mismo dominio, usuario logueado)
// ============================================================================
// El nonce lo genera WordPress para el usuario de la sesión actual y lo inyecta
// en la página mediante wp_localize_script (ver plantilla). No viaja en la URL
// ni en localStorage — lo genera el servidor para esa sesión.

function curso_ia_auth( WP_REST_Request $request ) {
    // Verifica que hay un usuario logueado Y que el nonce es válido.
    if ( ! is_user_logged_in() ) {
        return new WP_Error(
            'rest_forbidden',
            'Debes estar autenticado para acceder al curso.',
            [ 'status' => 401 ]
        );
    }

    $nonce = $request->get_header( 'X-WP-Nonce' );
    if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
        return new WP_Error(
            'rest_forbidden',
            'Nonce inválido o expirado.',
            [ 'status' => 403 ]
        );
    }

    return true;
}

// ============================================================================
// HELPERS internos
// ============================================================================

function curso_ia_uid() {
    return get_current_user_id();
}

function curso_ia_get_meta( $key, $default = [] ) {
    $uid  = curso_ia_uid();
    $raw  = get_user_meta( $uid, $key, true );
    return ( $raw && is_array( $raw ) ) ? $raw : $default;
}

function curso_ia_set_meta( $key, $value ) {
    update_user_meta( curso_ia_uid(), $key, $value );
}

function curso_ia_delete_meta( $key ) {
    delete_user_meta( curso_ia_uid(), $key );
}

// ============================================================================
// CALLBACKS — Progreso
// ============================================================================

function curso_ia_get_progress() {
    return rest_ensure_response([
        'data' => curso_ia_get_meta( CURSO_IA_META_PROGRESS, (object)[] ),
    ]);
}

function curso_ia_set_progress( WP_REST_Request $req ) {
    $data = $req->get_param( 'data' );
    // Sanea: solo guarda strings como claves y booleans como valores.
    $clean = [];
    foreach ( (array) $data as $k => $v ) {
        if ( is_string( $k ) && strlen( $k ) < 64 ) {
            $clean[ sanitize_key( $k ) ] = (bool) $v;
        }
    }
    curso_ia_set_meta( CURSO_IA_META_PROGRESS, $clean );
    return rest_ensure_response([ 'ok' => true, 'data' => $clean ]);
}

function curso_ia_delete_progress() {
    curso_ia_delete_meta( CURSO_IA_META_PROGRESS );
    return rest_ensure_response([ 'ok' => true ]);
}

// ============================================================================
// CALLBACKS — Notas / Expediente
// ============================================================================

function curso_ia_get_notes() {
    return rest_ensure_response([
        'data' => curso_ia_get_meta( CURSO_IA_META_NOTES, (object)[] ),
    ]);
}

function curso_ia_set_notes( WP_REST_Request $req ) {
    $data = $req->get_param( 'data' );
    $clean = [];
    foreach ( (array) $data as $k => $v ) {
        if ( is_string( $k ) && strlen( $k ) < 64 ) {
            // Las notas son texto; limitamos el tamaño para no inflar la BD.
            $clean[ sanitize_key( $k ) ] = substr( sanitize_textarea_field( $v ), 0, 20000 );
        }
    }
    curso_ia_set_meta( CURSO_IA_META_NOTES, $clean );
    return rest_ensure_response([ 'ok' => true ]);
}

function curso_ia_delete_notes() {
    curso_ia_delete_meta( CURSO_IA_META_NOTES );
    return rest_ensure_response([ 'ok' => true ]);
}

// ============================================================================
// CALLBACKS — Conversaciones
// ============================================================================

function curso_ia_get_convo( WP_REST_Request $req ) {
    $sid   = sanitize_key( $req->get_param( 'session_id' ) );
    $all   = curso_ia_get_meta( CURSO_IA_META_CONVOS, [] );
    $entry = isset( $all[ $sid ] ) ? $all[ $sid ] : null;
    return rest_ensure_response([ 'data' => $entry ]);
}

function curso_ia_set_convo( WP_REST_Request $req ) {
    $sid  = sanitize_key( $req->get_param( 'session_id' ) );
    $data = $req->get_param( 'data' );
    $all  = curso_ia_get_meta( CURSO_IA_META_CONVOS, [] );

    // Serializa y limita el tamaño (conversaciones largas pueden ser pesadas).
    $encoded = wp_json_encode( $data );
    if ( strlen( $encoded ) > 200000 ) { // ~200 KB por sesión máximo
        return new WP_Error(
            'conversation_too_large',
            'La conversación supera el límite de almacenamiento.',
            [ 'status' => 413 ]
        );
    }

    $all[ $sid ] = $data;
    curso_ia_set_meta( CURSO_IA_META_CONVOS, $all );
    return rest_ensure_response([ 'ok' => true ]);
}

function curso_ia_delete_convo( WP_REST_Request $req ) {
    $sid = sanitize_key( $req->get_param( 'session_id' ) );
    $all = curso_ia_get_meta( CURSO_IA_META_CONVOS, [] );
    unset( $all[ $sid ] );
    curso_ia_set_meta( CURSO_IA_META_CONVOS, $all );
    return rest_ensure_response([ 'ok' => true ]);
}

// ============================================================================
// CALLBACKS — Acceso
// ============================================================================

function curso_ia_get_access() {
    $uid     = curso_ia_uid();
    $granted = (bool) get_user_meta( $uid, CURSO_IA_META_ACCESS, true );
    return rest_ensure_response([ 'granted' => $granted ]);
}

function curso_ia_set_access( WP_REST_Request $req ) {
    $granted = (bool) $req->get_param( 'granted' );
    update_user_meta( curso_ia_uid(), CURSO_IA_META_ACCESS, $granted );
    return rest_ensure_response([ 'ok' => true, 'granted' => $granted ]);
}

// ============================================================================
// RESET COMPLETO
// ============================================================================

function curso_ia_reset_all() {
    $uid = curso_ia_uid();
    delete_user_meta( $uid, CURSO_IA_META_PROGRESS );
    delete_user_meta( $uid, CURSO_IA_META_NOTES );
    delete_user_meta( $uid, CURSO_IA_META_CONVOS );
    delete_user_meta( $uid, CURSO_IA_META_ACCESS );
    return rest_ensure_response([ 'ok' => true ]);
}

// ============================================================================
// HEARTBEAT API — Refresco automático del nonce
// ============================================================================
// El nonce de WordPress expira en ~12 h. El Heartbeat API de WP ya envía
// pulsos periódicos (cada 15–60 s) desde el navegador cuando hay una sesión
// activa. Aprovechamos esos pulsos para devolver un nonce fresco sin coste
// adicional — no abrimos ninguna conexión nueva.
//
// Flujo:
//   1. storage.js activa el Heartbeat al arrancar e incluye
//      { curso_ia_refresh_nonce: true } en cada pulso.
//   2. Este hook lo detecta y añade el nonce fresco en la respuesta.
//   3. storage.js recibe la respuesta y actualiza config.nonce en memoria.
//
// Si el Heartbeat está desactivado en el sitio (algunos plugins de caché lo
// hacen), el refresco no ocurre y el nonce puede expirar. En ese caso el
// alumno recibirá un aviso para recargar (ver storage.js).
// ============================================================================

// Servidor → procesa la petición del Heartbeat y devuelve nonce fresco.
add_filter( 'heartbeat_received', function ( $response, $data ) {
    if ( ! empty( $data['curso_ia_refresh_nonce'] ) && is_user_logged_in() ) {
        $response['curso_ia_nonce'] = wp_create_nonce( 'wp_rest' );
    }
    return $response;
}, 10, 2 );

// Asegura que el Heartbeat esté activo en la página del curso.
// Algunos temas o plugins lo desactivan fuera del admin; lo reactivamos
// solo en las páginas que usan nuestra plantilla.
add_action( 'wp_enqueue_scripts', function () {
    if ( ! is_page_template( 'template-curso-ia.php' ) ) return;

    // Garantiza que el script heartbeat de WP esté en cola.
    wp_enqueue_script( 'heartbeat' );

    // Configura el intervalo: 120 s es suficiente para mantener el nonce
    // vivo (expira en ~43 200 s) sin saturar el servidor.
    // El mínimo que permite WP es 15 s; no bajar de 60 s en producción.
    add_filter( 'heartbeat_settings', function ( $settings ) {
        $settings['interval'] = 120; // segundos
        return $settings;
    });
});

