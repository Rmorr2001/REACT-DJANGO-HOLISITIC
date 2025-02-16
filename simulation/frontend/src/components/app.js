import React from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./HomePage.js";

function App() {
  return (
    <div className="app-container">
      <HomePage />
    </div>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);