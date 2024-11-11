# bwinf43
## Challenge 4 - Krocket

To run the code, follow the instructions

<hr>

## 1. Install the Bun JavaScript Runtime

### Windows
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Linux & macOS
```bash
curl -fsSL https://bun.sh/install | bash
```

## 2. Install dependencies

```bash
bun install
```

## 3. Build the executable file

```bash
bun build ./index.ts --compile
```

## 4. Run it

```
.\index.exe <base input path> <scaling>
```

Example:
```bash
.\index.exe .\krocket0 1
```