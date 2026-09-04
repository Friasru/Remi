#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};

fn main() {
    let open = CustomMenuItem::new("open".to_string(), "Open Remi");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit Remi");

    let tray_menu = SystemTrayMenu::new()
        .add_item(open)
        .add_item(quit);

    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }

                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "open" => {
                            if let Some(window) = app.get_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }

                        "quit" => {
                            app.exit(0);
                        }

                        _ => {}
                    }
                }

                _ => {}
            }
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                api.prevent_close();
                let _ = event.window().hide();
            }
        })
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.autolaunch().enable();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Remi");
}