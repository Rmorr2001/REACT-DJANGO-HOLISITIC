import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Portfolio = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.section');
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <>
      <style>{`
        .portfolio-wrapper {
          --gold: #D4AF37;
          --gold-light: #F4C460;
          --black: #111111;
          --dark-grey: #222222;
          --medium-grey: #444444;
          --light-grey: #888888;
          --white: #ffffff;
          
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--black);
          color: var(--light-grey);
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          overflow-y: auto;
        }

        .header {
          background: linear-gradient(135deg, var(--black), var(--dark-grey));
          color: var(--white);
          padding: 8rem 2rem 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 2px solid var(--gold);
          width: 100%;
        }

        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(212, 175, 55, 0.1) 50%, transparent 70%);
          animation: shimmer 10s infinite linear;
          background-size: 200% 200%;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .profile-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 2rem auto;
          border-radius: 50%;
          padding: 4px;
          background: linear-gradient(45deg, var(--gold), var(--gold-light));
          z-index: 1;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--black);
        }

        .header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: var(--gold);
          font-weight: 300;
          letter-spacing: 2px;
          position: relative;
          z-index: 1;
        }

        .header p {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 800px;
          margin: 0 auto;
          color: var(--light-grey);
          position: relative;
          z-index: 1;
        }

        .main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
          background: var(--black);
        }

        .section {
          margin-bottom: 6rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 1s ease;
          text-align: center;
        }

        .section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .section h2 {
          font-size: 2rem;
          margin-bottom: 2rem;
          color: var(--gold);
          font-weight: 300;
          letter-spacing: 2px;
        }

        .back-button {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1001;
          background: var(--dark-grey);
          color: var(--gold);
          border: 1px solid var(--gold);
          padding: 0.5rem 1rem;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: var(--gold);
          color: var(--black);
        }

        .cta-button {
          display: inline-block;
          background: var(--dark-grey);
          color: var(--gold);
          padding: 1rem 2.5rem;
          border-radius: 2px;
          text-decoration: none;
          font-weight: 400;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          border: 1px solid var(--gold);
          letter-spacing: 1px;
          margin: 1rem;
          cursor: pointer;
        }

        .cta-button:hover {
          background: var(--gold);
          color: var(--black);
        }

        /* Card styles now apply to all screen sizes */
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
          width: 100%;
        }

        .skill-card {
          background: var(--dark-grey);
          padding: 2.5rem;
          border-radius: 4px;
          transition: all 0.3s ease;
          border: 1px solid rgba(212, 175, 55, 0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .skill-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(212, 175, 55, 0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }

        .skill-card:hover {
          transform: translateY(-5px);
          border-color: var(--gold);
        }

        .skill-card:hover::before {
          transform: translateX(100%);
        }

        .skill-card h3 {
          color: var(--gold-light);
          margin-bottom: 1rem;
          font-size: 1.25rem;
          font-weight: 400;
          letter-spacing: 1px;
          position: relative;
          z-index: 1;
        }

        .skill-card p {
          color: var(--light-grey);
          position: relative;
          z-index: 1;
          transition: color 0.3s ease;
        }

        .skill-card:hover p {
          color: var(--white);
        }

        /* Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
          .header h1 {
            font-size: 2.5rem;
          }
          
          .header p {
            font-size: 1.1rem;
          }

          .profile-container {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>

      <div className="portfolio-wrapper">
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Home
        </button>

        <header className="header">
          <h1>Richard "RJ" Morrison</h1>
          <div className="profile-container">
            <img
              src="/static/images/Headshot.jpeg"
              alt="Your Profile"
              className="profile-image"
            />
          </div>
          <h1>An Engineer with Vision</h1>
          <p>
            Strategic Development | Innovation Leadership | Results-Driven Solutions
          </p>
        </header>

        <main className="main">
          <section id="MastersProject" className="section">
            <h2>Masters Project</h2>
            <p>
              In order to demonstrate the full stack of knowledge I bring to the business
              world, I developed this web app to handle some Stochastic modelling.
            </p>
            <button className="cta-button" onClick={() => navigate('/')}>
              Go to Masters Project
            </button>
          </section>

          <section id="skills" className="section">
            <h2>EXPERTISE</h2>
            <div className="skills-grid">
              <div className="skill-card">
                <h3>Strategic Leadership</h3>
                <p>
                  Proven ability to lead complex initiatives and drive organizational
                  transformation through innovative strategies and solutions.
                </p>
              </div>
              <div className="skill-card">
                <h3>Technical Excellence</h3>
                <p>
                  Deep expertise in architectural design and implementation of
                  enterprise-scale solutions that deliver measurable business value.
                </p>
              </div>
              <div className="skill-card">
                <h3>Innovation Management</h3>
                <p>
                  Track record of identifying and implementing cutting-edge technologies
                  to solve complex business challenges.
                </p>
              </div>
            </div>
          </section>

          <section id="contact" className="section">
            <h2>CONNECT</h2>
            <p>Interested in discussing potential opportunities? Let's connect.</p>
            <div className="button-container">
              <a href="mailto:rmorr2001@gmail.com" className="cta-button">
                EMAIL ME
              </a>
              <a
                href="https://www.linkedin.com/in/richard-rj-morrison"
                className="cta-button"
              >
                CONNECT ON LINKEDIN
              </a>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>&copy; 2025 RJ Morrison - All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default Portfolio;
