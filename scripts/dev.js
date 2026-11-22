#!/usr/bin/env node

/**
 * LaunchByte Unified Dev Server Runner
 * Runs both the FastAPI backend and Next.js frontend concurrently.
 */

const { spawn } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");

const VENV_UVICORN = path.join(BACKEND_DIR, ".venv", "bin", "uvicorn");
const hasVenvUvicorn = fs.existsSync(VENV_UVICORN);

const children = [];

function isPortInUse(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(port, host);
  });
}

function printBanner() {
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
  console.log("\x1b[1m\x1b[36m%s\x1b[0m", "   🚀 LaunchByte Fullstack Development Server");
  console.log("\x1b[35m%s\x1b[0m", "==================================================");
  console.log("  • Frontend: \x1b[32mhttp://localhost:3000\x1b[0m");
  console.log("  • Backend:  \x1b[32mhttp://127.0.0.1:8000\x1b[0m");
  console.log("  • API Docs: \x1b[34mhttp://127.0.0.1:8000/docs\x1b[0m");
  console.log("\x1b[35m%s\x1b[0m\n", "--------------------------------------------------");
}

async function start() {
  printBanner();

  // 1. Check & start Backend
  const backendRunning = await isPortInUse(8000);
  if (backendRunning) {
    console.log("\x1b[32m[backend]\x1b[0m FastAPI backend is already running on http://127.0.0.1:8000");
  } else {
    console.log("\x1b[32m[backend]\x1b[0m Starting FastAPI backend on port 8000...");
    const cmd = hasVenvUvicorn ? VENV_UVICORN : "python3";
    const args = hasVenvUvicorn
      ? ["app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
      : ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"];

    const backendProcess = spawn(cmd, args, {
      cwd: BACKEND_DIR,
      stdio: ["inherit", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONPATH: BACKEND_DIR,
      },
    });

    backendProcess.stdout.on("data", (data) => {
      process.stdout.write(`\x1b[34m[backend]\x1b[0m ${data}`);
    });
    backendProcess.stderr.on("data", (data) => {
      process.stderr.write(`\x1b[34m[backend]\x1b[0m ${data}`);
    });

    children.push(backendProcess);
  }

  // 2. Start Frontend
  console.log("\x1b[36m[frontend]\x1b[0m Starting Next.js frontend on port 3000...");
  const frontendProcess = spawn("npm", ["run", "dev"], {
    cwd: FRONTEND_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "3000",
    },
  });

  children.push(frontendProcess);

  // Handle termination gracefully
  function cleanup() {
    console.log("\n\x1b[33mStopping all LaunchByte development processes...\x1b[0m");
    children.forEach((child) => {
      try {
        child.kill("SIGTERM");
      } catch (err) {
        // process may have already exited
      }
    });
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

start();
