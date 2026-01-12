<?php
/**
 * Plugin Name: WK Chess UI
 * Description: White Knight React UI bundle (Vite) + popup modal.
 * Version: 0.2.0
 */

if (!defined('ABSPATH'))
    exit;

function wk_chess_ui_enqueue_assets()
{
    $dist_dir = plugin_dir_path(__FILE__) . 'dist/';
    $dist_url = plugin_dir_url(__FILE__) . 'dist/';

    $manifest_path = $dist_dir . '.vite/manifest.json';
    if (!file_exists($manifest_path)) {
        return;
    }

    $manifest = json_decode(file_get_contents($manifest_path), true);
    if (!$manifest || !isset($manifest['src/main.jsx'])) {
        return;
    }

    $entry = $manifest['src/main.jsx'];

    // cm-chessboard CSS from CDN
    wp_enqueue_style(
        'cm-chessboard-css',
        'https://cdn.jsdelivr.net/npm/cm-chessboard@8.7.8/assets/chessboard.css',
        [],
        '8.7.8'
    );

    // cm-chessboard markers CSS
    wp_enqueue_style(
        'cm-chessboard-markers-css',
        'https://cdn.jsdelivr.net/npm/cm-chessboard@8.7.8/assets/extensions/markers/markers.css',
        ['cm-chessboard-css'],
        '8.7.8'
    );

    // CSS (Tailwind output)
    if (!empty($entry['css'])) {
        foreach ($entry['css'] as $css_file) {
            wp_enqueue_style(
                'wk-chess-ui-css',
                $dist_url . $css_file,
                ['cm-chessboard-css', 'cm-chessboard-markers-css'],
                filemtime($dist_dir . $css_file)
            );
        }
    }

    // JS - load as module
    if (!empty($entry['file'])) {
        wp_enqueue_script(
            'wk-chess-ui-js',
            $dist_url . $entry['file'],
            [],
            filemtime($dist_dir . $entry['file']),
            true
        );
    }

    // Inline styles for popup isolation
    wp_add_inline_style('wk-chess-ui-css', '
        /* Block body scroll when popup active */
        body.wk-popup-active {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
        }
        
        /* Popup overlay */
        #wk-chess-popup-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            overflow: hidden;
            touch-action: none;
        }
        #wk-chess-popup-overlay.wk-active {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Ізоляція React root від WP/Elementor стилів */
        #wk-react-root {
            all: initial;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            width: 100%;
            max-width: 1400px;
            height: 100vh;
            max-height: 900px;
            margin: 0 auto;
            position: relative;
            box-sizing: border-box;
        }
        #wk-react-root *,
        #wk-react-root *::before,
        #wk-react-root *::after {
            box-sizing: border-box;
        }
        
        /* Trigger button styling */
        .wk-chess-trigger-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
            color: #0B0E14;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
        }
        .wk-chess-trigger-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(212, 175, 55, 0.4);
        }
        .wk-chess-trigger-btn svg {
            width: 20px;
            height: 20px;
        }
    ');

    // Inline JS for popup control
    wp_add_inline_script('wk-chess-ui-js', '
        window.WKChessUI = {
            isGameActive: false,
            scrollPosition: 0,
            
            open: function() {
                var overlay = document.getElementById("wk-chess-popup-overlay");
                if (overlay) {
                    this.scrollPosition = window.pageYOffset;
                    overlay.classList.add("wk-active");
                    document.body.classList.add("wk-popup-active");
                    document.body.style.top = -this.scrollPosition + "px";
                }
            },
            
            close: function(force) {
                if (!force && this.isGameActive) {
                    if (!confirm("Ви впевнені, що хочете закрити? Поточна партія буде втрачена.")) {
                        return;
                    }
                }
                var overlay = document.getElementById("wk-chess-popup-overlay");
                if (overlay) {
                    overlay.classList.remove("wk-active");
                    document.body.classList.remove("wk-popup-active");
                    document.body.style.top = "";
                    window.scrollTo(0, this.scrollPosition);
                }
            },
            
            setGameActive: function(active) {
                this.isGameActive = active;
            }
        };
        
        // Close on ESC key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                window.WKChessUI.close();
            }
        });
    ', 'before');
}

add_action('wp_enqueue_scripts', 'wk_chess_ui_enqueue_assets');

function wk_chess_ui_shortcode($atts)
{
    $atts = shortcode_atts([
        'button_text' => 'Check Your Level',
        'button_class' => '',
    ], $atts);

    $button_text = esc_html($atts['button_text']);
    $extra_class = esc_attr($atts['button_class']);

    ob_start();
    ?>
    <!-- Trigger Button -->
    <button type="button" class="wk-chess-trigger-btn <?php echo $extra_class; ?>" onclick="WKChessUI.open()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15 8H9L12 2Z" />
            <path d="M5 22V12H19V22" />
            <path d="M5 12L12 8L19 12" />
        </svg>
        <?php echo $button_text; ?>
    </button>

    <!-- Popup Overlay (rendered once) -->
    <?php if (!defined('WK_CHESS_POPUP_RENDERED')): ?>
        <?php define('WK_CHESS_POPUP_RENDERED', true); ?>
        <div id="wk-chess-popup-overlay" onclick="if(event.target === this) WKChessUI.close()">
            <div id="wk-react-root"></div>
        </div>
    <?php endif; ?>
    <?php
    return ob_get_clean();
}

add_shortcode('wk_chess_ui', 'wk_chess_ui_shortcode');
