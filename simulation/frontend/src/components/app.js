import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./Pages/HomePage.js";
import NewProject from "./Pages/NewProject.js";
import MyProjects from "./Pages/MyProjects.js";
import NodeConfiguration from "./SimConfig/NodeConfiguration.js";
import Dashboard from "./Pages/Dashboard.js";
import Portfolio from "./Pages/about.js";
import { AIAssistantProvider } from "./Gemini/AppGeminiAssistant.js";
import AppNavbar from './AppNavbar.js';
import AINavbarButton from "./Gemini/AINavbarButton.js";

function App() {
  return (
    <Router>
      <AIAssistantProvider>
        <div className="app-container" style={{ overflow: 'auto', height: 'auto' }}>
          <AppNavbar aiButton={<AINavbarButton />} />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<Portfolio />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/projects" element={<MyProjects />} />
            <Route path="/projects/:projectId/nodes" element={<NodeConfiguration />} />
            <Route path="/projects/:projectId/simulate" element={<Dashboard />} />
            <Route path="/projects/:projectId/results" element={<Dashboard mode="results" />} />
          </Routes>
        </div>
      </AIAssistantProvider>
    </Router>
  );
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);