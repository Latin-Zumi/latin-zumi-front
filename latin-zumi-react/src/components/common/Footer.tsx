export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav className="footer-nav" aria-label="Enlaces del sitio">
          <a href="https://github.com/latin-zumi" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/company/latin-zumi" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a
            href="https://github.com/Latin-Zumi/latin-zumi-front/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Soporte
          </a>
        </nav>

        <div className="footer-credits">
          © {new Date().getFullYear()} Latin Zumi · Billetera Digital
        </div>
      </div>
    </footer>
  );
}

export default Footer;