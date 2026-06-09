# Composer



A distraction-free Markdown notes app for the Light Phone III.

Composer is not a rich text editor. It's a minimal writing tool for people who want to capture thoughts, ideas, and notes without friction — using Markdown that renders as you type, so syntax stays out of the way. Built to feel like a natural part of the Light Phone experience.

Built with [vandamd's light-template](https://github.com/vandamd/light-template) – a community-made Expo template for building LightOS-style apps for the Light Phone III.

---

## Features

* WYSIWYG Markdown editing — formatting renders in real time as you type
* Notes sorted by most recently edited, always at the top
* Note titles derived automatically from the first line of content
* Rename notes independently from their body content
* Copy note contents to clipboard
* Delete notes individually or in bulk
* Inverted colors mode (white background)

---

## Installing on Light Phone III

> [!WARNING]
> **This project is in early development and is not ready for production.** Expect rough edges and missing features. That said, feel free to download, use it, and give feedback on its direction!

I highly recommend using Obtainium to ensure you receive future updates and new features automatically. Just add [the repo URL,](https://github.com/zacksimpson/composer-tool/) make sure you're able to install apps from unknown sources, and you're all set.

Alternatively, you can download the latest APK from the Releases tab.

---

## Building

This project uses [Expo](https://expo.dev) and [EAS Build](https://docs.expo.dev/build/introduction/).

### Prerequisites

* [Bun](https://bun.sh)
* [EAS CLI](https://docs.expo.dev/build/setup/)
* An Expo account

### Steps
* bun install
* eas login
* eas build --platform android --profile preview

EAS will build the APK in the cloud and provide a download link.

---

## Credits

* [vandamd](https://github.com/vandamd) – [light-template](https://github.com/vandamd/light-template), the community Expo template this app is built on
* [iamkory](https://www.reddit.com/user/iamkory/) – [LighterOS Figma design toolkit](https://www.figma.com/design/1k2PkAjOSet8f9jjVdhM2L/LighterOS?node-id=65-2018&t=3Qd2sXdySZCzTVtK-1), excellent reference for recreating the LightOS aesthetic
* [Milkdown](https://milkdown.dev) – WYSIWYG Markdown editor powering the writing experience
* [The Light Phone](https://www.thelightphone.com) – for building a phone worth making apps for
