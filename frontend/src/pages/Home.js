import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
    return (
        <div className="home-container">
            <nav className="navbar">
                <div className="nav-inner">
                    <div className="brand">
                        <div className="brand-logo">
                            <img src="https://collegewollege.com/_next/image?url=https%3A%2F%2Fcdn.collegewollege.com%2Fstorage%2Fcolleges%2Fthumbnails%2FV0gdLvo0HmvUNFJRmUhQCkJT87GzficSVlxoF7DI.webp&w=640&q=75" alt="JIMS Rohini Logo" />
                        </div>
                        <div className="brand-text">
                            <span>JIMS Sector 5 Rohini</span>
                            <strong>Result Analysis</strong>
                        </div>
                    </div>
                    <div className="nav-links">
                        <a href="#about">About</a>
                        <a href="#features">Features</a>
                        <a href="#location">Location</a>
                        <a href="#contact">Contact</a>
                        <Link to="/login" className="nav-btn login-btn">Login</Link>
                    </div>
                </div>
            </nav>

            <header className="hero-section">
                <div className="hero-copy">
                    <p className="hero-eyebrow">Official college results platform</p>
                    <h1>JIMS Sector 5 Rohini<br />Result Analysis Portal</h1>
                    <p className="hero-text">
                        A clean, secure and modern dashboard for administering student results,
                        faculty records and performance insights at JIMS Rohini Sector 5.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn btn-primary">Login to Portal</Link>
                    </div>
                </div>
                <div className="hero-panel">
                    <div className="hero-panel-card">
                        <span>Established</span>
                        <strong>1991</strong>
                    </div>
                    <div className="hero-panel-card">
                        <span>Campus</span>
                        <strong>Sector 5 Rohini</strong>
                    </div>
                    <div className="hero-panel-card">
                        <span>Affiliation</span>
                        <strong>GGSIPU, Delhi</strong>
                    </div>
                </div>
            </header>

            <section className="about-section" id="about">
                <div className="section-header">
                    <p className="section-overline">About JIMS Rohini</p>
                    <h2>Built for academic clarity and campus excellence</h2>
                </div>
                <div className="about-content">
                    <div>
                        <p>
                            Jagan Institute of Management Studies, Sector 5 Rohini, is a leading professional college with a strong focus on academic performance,
                            assessment transparency and student success. This portal delivers a modern experience for administrators, faculty and students.
                        </p>
                    </div>
                    <div className="about-stats">
                        <div>
                            <strong>5000+</strong>
                            <span>Students enrolled</span>
                        </div>
                        <div>
                            <strong>300+</strong>
                            <span>Faculty members</span>
                        </div>
                        <div>
                            <strong>25+</strong>
                            <span>Programs supported</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features-section" id="features">
                <div className="section-header">
                    <p className="section-overline">Platform features</p>
                    <h2>Everything your college needs in one dashboard</h2>
                </div>
                <div className="feature-grid">
                    <article className="feature-card">
                        <h3>Result management</h3>
                        <p>Upload marks, review grade analysis and publish results securely.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Faculty access</h3>
                        <p>Give professors easy access to student records, attendance and performance data.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Student insights</h3>
                        <p>Enable data-driven decisions with clear charts and real-time percentage summaries.</p>
                    </article>
                    <article className="feature-card">
                        <h3>Secure admin control</h3>
                        <p>Role-based access gives administrators full control over campus result operations.</p>
                    </article>
                </div>
            </section>

            <section className="location-section" id="location">
                <div className="location-copy">
                    <p className="section-overline">Campus location</p>
                    <h2>Visit us in Rohini Sector 5</h2>
                    <p>
                        JIMS Sector 5 Rohini is located in the heart of North Delhi with easy access to public transport,
                        library facilities and academic blocks.
                    </p>
                    <div className="location-details">
                        <div>
                            <strong>Address</strong>
                            <p>Plot No. 4, Sector 5, Rohini, Delhi 110085</p>
                        </div>
                        <div>
                            <strong>Contact</strong>
                            <p>+91 11 2707 6365</p>
                        </div>
                    </div>
                </div>
                <div className="map-card">
                    <iframe
                        title="JIMS Sector 5 Rohini Map"
                        src="https://maps.google.com/maps?q=JIMS%20Sector%205%20Rohini&t=&z=13&ie=UTF8&iwloc=&output=embed"
                        loading="lazy"
                    />
                </div>
            </section>

            {/* <section className="cta-section">
                <div className="cta-copy">
                    <p className="section-overline">Get started</p>
                    <h2>Take the next step for academic reporting</h2>
                    <p>Secure access and simplified results management for the entire JIMS Rohini community.</p>
                </div>
                <div className="cta-actions">
                    <Link to="/login" className="btn btn-primary">Access Your Account</Link>
                </div>
            </section> */}

            <footer className="footer" id="contact">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>JIMS Sector 5 Rohini</h3>
                        <p>Result Analysis System for campus administrators, faculty and students.</p>
                        <div className="social-links">
                            <a href="https://www.linkedin.com/school/jims-rohini/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link linkedin"
                                aria-label="LinkedIn">
                                <i className="fab fa-linkedin-in"></i>
                                LinkedIn
                            </a>
                            <a href="https://www.instagram.com/jimsrohini_official/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link instagram"
                                aria-label="Instagram">
                                <i className="fab fa-instagram"></i>
                                Instagram
                            </a>
                            <a href="https://www.jimsrohini.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-link website"
                                aria-label="Official Website">
                                <i className="fas fa-globe"></i>
                                Official Website
                            </a>
                        </div>
                    </div>

                    {/* <div className="footer-section">
                        <h4>Quick Links</h4>
                        <div className="footer-links">
                            <a href="#about">About Us</a>
                            <a href="#features">Features</a>
                            <a href="#location">Location</a>
                            <a href="/login">Login</a>
                        </div>
                    </div> */}

                    <div className="footer-section">
                        <h4>Contact Info</h4>
                        <div className="contact-info">
                            <p>
                                <i className="fas fa-map-marker-alt"></i>
                                Plot No. 4, Sector 5, Rohini, Delhi 110085
                            </p>
                            <p>
                                <i className="fas fa-phone"></i>
                                +91 11 2707 6365
                            </p>
                            <p>
                                <i className="fas fa-envelope"></i>
                                info@jimsrohini.org
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} JIMS Sector 5 Rohini. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Home;