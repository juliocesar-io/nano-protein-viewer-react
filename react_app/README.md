# Local React Test App

This app consumes the library from the parent folder via `file:..` to test locally.

## Steps

1. From the repo root, build the library so `dist/` exists:

```bash
npm run build
```

2. Install and run the test app:

```bash
cd react_app
npm install
npm run dev
```

3. Open http://localhost:5174 and you should see the viewer load 1CRN.

If you change the library code, rebuild the library and restart the dev server.
