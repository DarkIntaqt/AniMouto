const isChrome = typeof InstallTrigger === 'undefined';

document.addEventListener("DOMContentLoaded", e => {
  chrome.storage.local.get({ user_info: { name: "", id: 0, site_url: "" } }, value => {
    let loginText = "Logged in as <a href='" + value.user_info.site_url + "' style='color:rgb(var(--color-accent));font-weight:bold;' target='_blank'>" + value.user_info.name + "</a>";
    document.getElementById("login-name").insertAdjacentHTML("afterbegin", loginText);

    document.getElementById("logout-button").addEventListener("click", () => {
      chrome.storage.local.clear();
      chrome.runtime.sendMessage({ type: "change_page", page: "login" });
      chrome.runtime.sendMessage({ type: "change_avatar", avatar: "https://s3.anilist.co/user/avatar/medium/default.png" });
      chrome.runtime.sendMessage({ type: "display_toast", toast: { type: "butter", text: "Logout successful" } });
    });

    document.getElementById("theme-light").addEventListener("click", () => changeTheme("light"));
    document.getElementById("theme-dark").addEventListener("click", () => changeTheme("dark"));
    document.getElementById("theme-contrast").addEventListener("click", () => changeTheme("contrast"));

    let accentButtons = document.getElementsByClassName("accent-button");
    for (let element in accentButtons) {
      if (accentButtons.hasOwnProperty(element)) {
        element = accentButtons[element];
        element.removeEventListener("click", changeColor);
        element.addEventListener("click", e => changeColor(element));
      }
    }
  });

  if (!isChrome)
    document.getElementById("desktop-notifications").style.display = "none";

  chrome.storage.local.get({ notifications: { interval: 1, enabled: true, desktop: false } }, value => {
    document.getElementById("notification-enabled").checked = value.notifications.enabled;
    document.getElementById("notification-time").value = value.notifications.interval;
    document.getElementById("desktop-enabled").checked = value.notifications.desktop;
  })

  document.getElementById("notification-save").addEventListener("click", () => {
    let notificationInterval = parseInt(document.getElementById("notification-time").value);
    let checkerEnabled = document.getElementById("notification-enabled").checked;
    let desktopEnabled = document.getElementById("desktop-enabled").checked;

    chrome.storage.local.set({ notifications: { interval: notificationInterval, enabled: checkerEnabled } });

    if (isChrome) {
      chrome.permissions.request({
        permissions: ["notifications"]
      }, granted => {
        chrome.storage.local.set({ notifications: { desktop: desktopEnabled && granted } });
        if (desktopEnabled && !granted) {
          chrome.runtime.sendMessage({ type: "display_toast", toast: { type: "burnt", text: "No permission to display desktop notifications" } });
          document.getElementById("desktop-enabled").checked = false;
        }
      });
    }

    chrome.runtime.getBackgroundPage(page => {
      page.modifyAlarmTime("notification_updater", notificationInterval);
    });

    chrome.runtime.sendMessage({ type: "display_toast", toast: { type: "butter", text: "Settings saved" } });
  });
});

function changeColor(element) {
  let newColorProp = element.id.replace("accent", "color");
  chrome.storage.local.set({ accent_color: newColorProp });
  chrome.runtime.sendMessage({ type: "change_accent", accent_color: newColorProp })
}

function changeTheme(theme) {
  chrome.storage.local.set({ theme: theme })
  chrome.runtime.sendMessage({ type: "change_theme", theme: theme });
}
