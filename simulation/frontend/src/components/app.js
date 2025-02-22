// Complete app.js replacement
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./Pages/HomePage.js";
import NewProject from "./Pages/NewProject.js";
import MyProjects from "./Pages/MyProjects.js";
import NodeConfiguration from "./SimConfig/NodeConfiguration.js";
import Dashboard from "./Dashboard/Dashboard.js";
import Portfolio from "./Pages/about.js";
import TechnicalAbout from "./Pages/TechnicalAbout.js";
import AIAssistantProvider from "./Gemini/AiAssistantProvider.js";
import AppNavbar from './AppNavbar.js';
import AINavbarButton from "./Gemini/AiINavbarButton.js";

function App() {
  // Wrap the entire app with error boundary for better debugging
  try {
    return (
      <Router>
        <ErrorBoundary>
          <AIAssistantProvider>
            <div className="app-container" style={{ overflow: 'auto', height: 'auto' }}>
              <AppNavbar aiButton={<AINavbarButton />} />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<Portfolio />} />
                <Route path="/technical-about" element={<TechnicalAbout />} />
                <Route path="/new-project" element={<NewProject />} />
                <Route path="/projects" element={<MyProjects />} />
                <Route path="/projects/:projectId/nodes" element={<NodeConfiguration />} />
                <Route path="/projects/:projectId/simulate" element={<Dashboard />} />
                <Route path="/projects/:projectId/results" element={<Dashboard mode="results" />} />
              </Routes>
            </div>
          </AIAssistantProvider>
        </ErrorBoundary>
      </Router>
    );
  } catch (error) {
    console.error("Error in App:", error);
    return <div>Something went wrong. Please check the console for details.</div>;
  }
}

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);