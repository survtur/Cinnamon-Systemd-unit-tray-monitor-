const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Settings = imports.ui.settings;

class UnitMonitorApplet extends Applet.TextApplet {

    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        this.metadata = metadata;

        this.settings = new Settings.AppletSettings(
            this, 
            this.metadata.uuid, 
            instanceId
        );

        this.settings.bind("unit", "unit");
        this.settings.bind("interval", "interval");

        this.set_applet_tooltip("The  Monitor");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.buildMenu();
        this.updateStatus();
        this.startLoop();
    }

    buildMenu() {
        this.menu.removeAll();

        let statusItem = new PopupMenu.PopupMenuItem("Status");
        statusItem.connect("activate", () => {
            this.runCommand(`x-terminal-emulator -e systemctl status ${this.unit}`);
        });
        this.menu.addMenuItem(statusItem);

        let restartItem = new PopupMenu.PopupMenuItem("Restart");
        restartItem.connect("activate", () => {
            this.runCommand(`systemctl restart ${this.unit}`);
        });
        this.menu.addMenuItem(restartItem);

        // let stopItem = new PopupMenu.PopupMenuItem("Stop");
        // stopItem.connect("activate", () => {
        //     this.runCommand(`systemctl stop ${this.unit}`);
        // });
        // this.menu.addMenuItem(stopItem);

        let journalItem = new PopupMenu.PopupMenuItem("Journal");
        journalItem.connect("activate", () => {
            this.runCommand(`x-terminal-emulator -e journalctl -u ${this.unit} -f`);
        });
        this.menu.addMenuItem(journalItem);
    }

    runCommand(cmd) {
        GLib.spawn_command_line_async(cmd);
    }

    updateStatus() {
        try {
            let [res, out] = GLib.spawn_command_line_sync(`systemctl is-active ${this.unit}`);
            let status = out.toString().trim();
	    this.set_applet_tooltip(this.unit + " - " + status);

            if (status === "active") {
                //this.set_applet_icon_name("emblem-default");
                this.set_applet_label("🟢"); // ⚫🔴
            } else {
                //this.set_applet_icon_name("important");
                this.set_applet_label("🔴");
            }
        } catch (e) {
            //this.set_applet_icon_name("important");
                            this.set_applet_label("🔴");
            this.set_applet_tooltip(this.unit + " - проверка не удалась");
        }

        return true;
    }

    startLoop() {
        Mainloop.timeout_add_seconds(this.interval, () => {
            return this.updateStatus();
        });
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    on_applet_removed_from_panel() {
        Mainloop.source_remove(this.loop);
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new UnitMonitorApplet(metadata,orientation, panelHeight, instanceId);
}

