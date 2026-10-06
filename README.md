# Magical Athlete

[Demo: magicalathlete.siyanew.com](https://magicalathlete.siyanew.com)

## Development

Requires Node.js 18 or newer. No package installation is needed.

```sh
npm run dev
```

Open the local URL printed in the terminal. The server defaults to port 5173 and tries the next available port when occupied. Set `PORT` to use a specific port:

```sh
PORT=3000 npm run dev
```

## Validate and build

```sh
npm run check
npm run build
```

The build copies the website and its assets to `dist/`.


## Locales

Translations live in `locales/`: English (`en`), Persian (`fa`), German (`de`), French (`fr`), Spanish (`es`), Swedish (`sv`), and Finnish (`fi`). Keep all 36 card IDs and interface keys consistent across locale files. Card names and power titles remain in English.

English is the default for new visitors. The language selector saves the selected locale in browser `localStorage`.

## Credits

Animated Magical Athlete logo by **Angela Kirkwood**.

## License and contributions

This project is **all rights reserved**, not open source. Independent reuse of Siyanew's original code and documentation requires prior written permission. See [LICENSE](LICENSE).

Card artwork, the animated logo, and other game content remain subject to their respective owners' rights; this repository grants no reuse permission for them. See [ASSET-NOTICE.md](ASSET-NOTICE.md).

Please propose improvements in this repository through issues and pull requests. See [CONTRIBUTING.md](CONTRIBUTING.md). This contribution policy does not remove rights provided by applicable law or GitHub's platform terms.
